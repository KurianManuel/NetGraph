from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# --- User Schemas ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

# --- Device Schemas ---
class DeviceResponse(BaseModel):
    id: int
    hostname: str
    ip_address: str
    mac_address: Optional[str] = None
    vendor: str
    first_seen: datetime
    last_seen: datetime

    class Config:
        from_attributes = True

class DeviceHistoryEntry(BaseModel):
    scan_id: int
    scan_time: datetime
    state: str

class DeviceDetailResponse(DeviceResponse):
    history: List[DeviceHistoryEntry] = []

    class Config:
        from_attributes = True

# --- Scan Schemas ---
class ScanResponse(BaseModel):
    id: int
    scan_time: datetime
    duration: float
    subnet: str
    scan_type: str

    class Config:
        from_attributes = True

class ScanTriggerRequest(BaseModel):
    subnet: Optional[str] = None  # Optional. If empty, auto-detect active subnet.

# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    ip_address: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
