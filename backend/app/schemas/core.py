# backend/app/schemas/core.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Annotated
from datetime import datetime
from pydantic.types import StringConstraints

# Define password type with constraints
PasswordStr = Annotated[str, StringConstraints(min_length=8)]

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None

# Schema for user creation
class UserCreate(UserBase):
    password: PasswordStr
    role_level: Optional[int] = None  # Optional because Owner role is auto-assigned for first user

# Schema for user information updates
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[PasswordStr] = None
    role_level: Optional[int] = None

    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "password": "newpassword123",
                "role_level": 2
            }
        }

# Schema for user invitation
class UserInvite(BaseModel):
    email: EmailStr
    role_level: int
    first_name: str
    last_name: Optional[str] = None

# Schema for accepting an invitation
class AcceptInvite(BaseModel):
    token: str
    password: PasswordStr

# Schema for user in database
class UserInDB(UserBase):
    id: int
    role_level: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    hashed_password: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema for public user information (without sensitive data)
class UserResponse(UserBase):
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

# Schema for team member list response
class TeamMemberResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str]
    last_name: Optional[str]
    role_level: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True