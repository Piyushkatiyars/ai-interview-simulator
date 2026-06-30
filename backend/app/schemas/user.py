"""
User Schemas - Pydantic Models for Request/Response Validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import re


class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=255)


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        """Validate that passwords match"""
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username format"""
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = Field(None, max_length=1000)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    """Schema for user in database (includes hashed password)"""
    hashed_password: str


class PasswordChange(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str
    
    @validator('confirm_new_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('New passwords do not match')
        return v
