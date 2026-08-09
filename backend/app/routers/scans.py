import ipaddress
import time
from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import SessionLocal, get_db
from ..models import AuditLog, Device, DeviceScan, Scan, User
from ..scanner import run_ping_sweep
from ..schemas import ScanResponse, ScanTriggerRequest
from .auth import log_audit_event

router = APIRouter(prefix="/scans", tags=["scans"])

def execute_background_scan(subnet_request: str, initiator_username: str, client_ip: str):
    """
    Background worker that runs the ping sweep, updates database devices,
    identifies newly offline devices, and records scan mapping.
    """
    db = SessionLocal()
    start_time = time.time()
    
    try:
        # Run sweep
        results, resolved_subnet = run_ping_sweep(subnet_request)
        duration = round(time.time() - start_time, 2)

        # Create Scan record
        scan_record = Scan(
            duration=duration,
            subnet=resolved_subnet,
            scan_type="ping"
        )
        db.add(scan_record)
        db.commit()
        db.refresh(scan_record)

        active_ips = {device_data["ip_address"] for device_data in results}
        
        # 1. Update/Create online devices
        for dev_data in results:
            ip = dev_data["ip_address"]
            mac = dev_data["mac_address"]
            hostname = dev_data["hostname"]
            vendor = dev_data["vendor"]

            # Query existing device
            device = db.query(Device).filter(Device.ip_address == ip).first()
            if device:
                # Update details if changed
                if mac and mac != "Unknown":
                    device.mac_address = mac
                if hostname and hostname != "Unknown":
                    device.hostname = hostname
                if vendor and vendor != "Unknown":
                    device.vendor = vendor
                # Update last seen timestamp
                device.last_seen = db.query(Scan.scan_time).filter(Scan.id == scan_record.id).scalar()
            else:
                # Create new device
                device = Device(
                    ip_address=ip,
                    mac_address=mac if mac != "Unknown" else None,
                    hostname=hostname,
                    vendor=vendor
                )
                db.add(device)
                db.commit()
                db.refresh(device)

            # Map to this scan as 'online'
            ds_mapping = DeviceScan(
                device_id=device.id,
                scan_id=scan_record.id,
                state="online"
            )
            db.add(ds_mapping)

        # 2. Check for offline devices on the scanned subnet
        # Find all devices currently in our DB that belong to this subnet
        subnet_network = ipaddress.IPv4Network(resolved_subnet, strict=False)
        all_devices = db.query(Device).all()
        
        for device in all_devices:
            try:
                device_ip = ipaddress.IPv4Address(device.ip_address)
                # If device belongs to subnet but wasn't active in this scan, mark as 'offline'
                if device_ip in subnet_network and device.ip_address not in active_ips:
                    ds_mapping = DeviceScan(
                        device_id=device.id,
                        scan_id=scan_record.id,
                        state="offline"
                    )
                    db.add(ds_mapping)
            except ValueError:
                continue

        db.commit()

        # Log completion
        user = db.query(User).filter(User.username == initiator_username).first()
        log_audit_event(
            db,
            action="scan_completed",
            ip=client_ip,
            user_id=user.id if user else None,
            details={
                "scan_id": scan_record.id,
                "subnet": resolved_subnet,
                "duration_seconds": duration,
                "devices_online_count": len(results)
            }
        )

    except Exception as e:
        db.rollback()
        # Log failure
        user = db.query(User).filter(User.username == initiator_username).first()
        log_audit_event(
            db,
            action="scan_failed",
            ip=client_ip,
            user_id=user.id if user else None,
            details={"subnet": subnet_request, "error": str(e)}
        )
    finally:
        db.close()

@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
def trigger_scan(
    background_tasks: BackgroundTasks,
    request: Request,
    scan_in: ScanTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger a subnet network sweep. Scans run asynchronously in the background.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Simple validation of input subnet if supplied
    if scan_in.subnet:
        try:
            ipaddress.IPv4Network(scan_in.subnet, strict=False)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid CIDR subnet range. Example: 192.168.1.0/24"
            )

    # Log trigger intent
    log_audit_event(
        db,
        action="scan_triggered",
        ip=client_ip,
        user_id=current_user.id,
        details={"subnet": scan_in.subnet or "auto-detected"}
    )

    # Spawn background scan execution
    background_tasks.add_task(
        execute_background_scan,
        scan_in.subnet,
        current_user.username,
        client_ip
    )

    return {"status": "accepted", "message": "Network scan triggered in background."}

@router.get("", response_model=List[ScanResponse])
def list_scans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List history of all triggered scans.
    """
    scans = db.query(Scan).order_by(Scan.scan_time.desc()).all()
    return scans
