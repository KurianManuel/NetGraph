import json
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from ..auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from ..config import settings
from ..database import get_db
from ..models import User, AuditLog
from ..schemas import LoginRequest, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["authentication"])

def log_audit_event(db: Session, action: str, ip: str, user_id: int = None, details: dict = None):
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        ip_address=ip,
        details=json.dumps(details) if details else None
    )
    db.add(log_entry)
    db.commit()

@router.post("/setup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def initial_admin_setup(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    """
    Setup the initial administrator account. Only works if no users exist in the DB.
    """
    existing_user_count = db.query(User).count()
    if existing_user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Setup already completed. Please log in."
        )

    hashed_password = get_password_hash(user_in.password)
    admin_user = User(
        username=user_in.username,
        password_hash=hashed_password,
        role="admin"
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    client_ip = request.client.host if request.client else "127.0.0.1"
    log_audit_event(
        db, 
        action="setup", 
        ip=client_ip, 
        user_id=admin_user.id, 
        details={"username": admin_user.username}
    )

    return admin_user

@router.post("/login")
def login(
    response: Response,
    request: Request,
    login_in: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Log in a user. Validates credentials and sets an HTTP-Only secure cookie.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    user = db.query(User).filter(User.username == login_in.username).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        log_audit_event(
            db, 
            action="login_failed", 
            ip=client_ip, 
            details={"attempted_username": login_in.username}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # Issue access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Set secure HTTP-Only cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",      # lax is best for local dev proxying
        secure=False,        # set to true in production over HTTPS
    )

    log_audit_event(
        db, 
        action="login", 
        ip=client_ip, 
        user_id=user.id
    )

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }

@router.post("/logout")
def logout(response: Response, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Log out a user. Clears the auth cookie.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    response.delete_cookie(key="access_token")
    
    log_audit_event(
        db, 
        action="logout", 
        ip=client_ip, 
        user_id=current_user.id
    )
    
    return {"status": "success", "message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return logged-in user profile.
    """
    return current_user
