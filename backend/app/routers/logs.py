from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_admin_user
from ..database import get_db
from ..models import AuditLog, User
from ..schemas import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Returns full system audit logs. Restricted to administrator accounts.
    """
    # Outer join with User to query log entries alongside resolving the operator username
    logs = (
        db.query(AuditLog, User.username)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(AuditLog.created_at.desc())
        .all()
    )
    
    result = []
    for log, username in logs:
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "username": username or "System",
            "action": log.action,
            "ip_address": log.ip_address,
            "details": log.details,
            "created_at": log.created_at
        })
    return result
