"""
Authentication API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, UserUpdate, PasswordChange
)
from app.services.user_service import UserService
from app.auth.jwt_handler import get_current_user, create_access_token, verify_token
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    - **email**: Valid email address (required)
    - **username**: Unique username, 3-50 characters (required)
    - **password**: Strong password with uppercase, lowercase, digit, and special char (required)
    - **confirm_password**: Must match password (required)
    - **full_name**: Optional full name
    """
    service = UserService(db)
    user = service.create_user(user_data)
    return user


@router.post("/login")
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens.
    
    - **email**: Registered email address
    - **password**: Account password
    
    Returns access token, refresh token, and user information.
    """
    service = UserService(db)
    result = service.authenticate_user(login_data)
    return result


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get the current authenticated user's profile.
    
    Requires valid JWT access token in Authorization header.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    
    - **full_name**: Updated full name
    - **bio**: User bio (max 1000 chars)
    - **phone**: Phone number
    - **avatar_url**: URL to avatar image
    """
    service = UserService(db)
    updated_user = service.update_user(current_user.id, user_data)
    return updated_user


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the current user's password.
    
    - **current_password**: Current password for verification
    - **new_password**: New password (min 8 chars)
    - **confirm_new_password**: Must match new password
    """
    service = UserService(db)
    service.change_password(
        current_user.id,
        password_data.current_password,
        password_data.new_password
    )
    return {"message": "Password changed successfully"}


@router.post("/refresh-token")
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token from login
    """
    payload = verify_token(refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    new_access_token = create_access_token({"sub": user.id, "email": user.email})
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


@router.delete("/me")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete the current user's account.
    
    Warning: This action is irreversible and will delete all associated data.
    """
    service = UserService(db)
    service.delete_user(current_user.id)
    return {"message": "Account deleted successfully"}
