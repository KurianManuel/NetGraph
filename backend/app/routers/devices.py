from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Device, DeviceScan, Scan, User
from ..schemas import DeviceDetailResponse, DeviceResponse

router = APIRouter(prefix="/devices", tags=["devices"])

@router.get("", response_model=List[DeviceResponse])
def list_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all discovered network devices.
    """
    devices = db.query(Device).order_by(Device.ip_address).all()
    return devices

@router.get("/{device_id}", response_model=DeviceDetailResponse)
def get_device_details(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve single device details alongside historical scan connections.
    """
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    # Query device scan history by joining DeviceScan and Scan
    history_records = (
        db.query(DeviceScan, Scan)
        .join(Scan, DeviceScan.scan_id == Scan.id)
        .filter(DeviceScan.device_id == device_id)
        .order_by(Scan.scan_time.desc())
        .all()
    )

    history = []
    for ds, scan in history_records:
        history.append({
            "scan_id": scan.id,
            "scan_time": scan.scan_time,
            "state": ds.state
        })

    return {
        "id": device.id,
        "hostname": device.hostname,
        "ip_address": device.ip_address,
        "mac_address": device.mac_address,
        "vendor": device.vendor,
        "first_seen": device.first_seen,
        "last_seen": device.last_seen,
        "history": history
    }
