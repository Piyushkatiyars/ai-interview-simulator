"""
User Service - Business Logic for User Operations
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from datetime import datetime
from typing import Optional

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserLogin
from app.auth.password import hash_password, verify_password
from app.auth.jwt_handler import create_access_token, create_refresh_token


class UserService:
    """Service class for user-related operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, user_data: UserCreate) -> User:
        """
        Create a new user account.
        
        Args:
            user_data: User registration data
            
        Returns:
            Created User object
            
        Raises:
            HTTPException: If email or username already exists
        """
        # Check if email already exists
        existing_email = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        existing_username = self.db.query(User).filter(User.username == user_data.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create new user
        hashed_pw = hash_password(user_data.password)
        
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_pw,
            is_active=True,
            is_verified=False
        )
        
        try:
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)
            return new_user
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not create user"
            )
    
    def authenticate_user(self, login_data: UserLogin) -> dict:
        """
        Authenticate user and return tokens.
        
        Args:
            login_data: User login credentials
            
        Returns:
            Dictionary containing access token, refresh token, and user info
            
        Raises:
            HTTPException: If credentials are invalid
        """
        user = self.db.query(User).filter(User.email == login_data.email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )
        
        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        # Create tokens
        access_token = create_access_token({"sub": user.id, "email": user.email})
        refresh_token = create_refresh_token({"sub": user.id})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user.to_dict()
        }
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        """
        Update user profile.
        
        Args:
            user_id: ID of user to update
            user_data: Updated user data
            
        Returns:
            Updated User object
        """
        user = self.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        update_data = user_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def change_password(self, user_id: int, current_password: str, new_password: str) -> bool:
        """
        Change user password.
        
        Args:
            user_id: ID of user
            current_password: Current password for verification
            new_password: New password to set
            
        Returns:
            True if successful
            
        Raises:
            HTTPException: If current password is incorrect
        """
        user = self.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        user.hashed_password = hash_password(new_password)
        user.updated_at = datetime.utcnow()
        self.db.commit()
        
        return True
    
    def delete_user(self, user_id: int) -> bool:
        """
        Delete user account.
        
        Args:
            user_id: ID of user to delete
            
        Returns:
            True if successful
        """
        user = self.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        self.db.delete(user)
        self.db.commit()
        
        return True
