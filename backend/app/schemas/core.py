# backend/app/schemas/core.py
from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from datetime import datetime

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None

# Schema for creating a new user
class UserCreate(UserBase):
    password: constr(min_length=8)  # Ensure password is at least 8 chars
    role_level: Optional[int] = None  # Optional because Owner role is auto-assigned for first user

# Schema for updating user information
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[constr(min_length=8)] = None

# Schema for user invitation
class UserInvite(BaseModel):
    email: EmailStr
    role_level: int
    first_name: str
    last_name: str

# Schema for accepting an invitation
class AcceptInvite(BaseModel):
    token: str
    password: constr(min_length=8)

# Schema for user in database
class UserInDB(UserBase):
    id: int
    role_level: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Response schema for user registration
class UserRegisterResponse(BaseModel):
    id: int
    email: EmailStr
    role_level: int
    message: str

# Schema for token response
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema for token data
class TokenData(BaseModel):
    email: Optional[str] = None

# Schema for role information
class RoleInfo(BaseModel):
    id: int
    name: str
    level: int
    description: Optional[str] = None