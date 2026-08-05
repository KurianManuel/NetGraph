from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="viewer", nullable=False)  # admin, viewer
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DeviceScan(Base):
    __tablename__ = "device_scans"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    state = Column(String, default="online")  # online, offline

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, default="Unknown")
    ip_address = Column(String, unique=True, index=True, nullable=False)
    mac_address = Column(String, nullable=True)
    vendor = Column(String, default="Unknown")
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    
    scans = relationship("Scan", secondary="device_scans", back_populates="devices")

class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_time = Column(DateTime(timezone=True), server_default=func.now())
    duration = Column(Float, nullable=False)  # in seconds
    subnet = Column(String, nullable=False)
    scan_type = Column(String, default="ping")  # ping, full
    
    devices = relationship("Device", secondary="device_scans", back_populates="scans")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)  # e.g., setup, login, logout, scan_triggered, setting_changed
    ip_address = Column(String, nullable=False)
    details = Column(String, nullable=True)  # JSON-formatted metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
