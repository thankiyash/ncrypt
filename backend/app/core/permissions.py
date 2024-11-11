# backend/app/core/permissions.py
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.core import User, Secret
from typing import List

def can_manage_secret(db: Session, user_id: int, secret_id: int) -> bool:
    """
    Check if a user can manage (update/delete) a secret.
    Rules:
    1. User can manage their own secrets
    2. User can manage secrets created by users with lower role levels
    """
    current_user = db.query(User).filter(User.id == user_id).first()
    secret = db.query(Secret).filter(Secret.id == secret_id).first()
    
    if not current_user or not secret:
        return False
        
    secret_creator = db.query(User).filter(User.id == secret.created_by_user_id).first()
    
    # User can manage their own secrets
    if secret.created_by_user_id == user_id:
        return True
        
    # User can manage secrets created by users with lower role levels
    if current_user.role_level > secret_creator.role_level:
        return True
        
    return False

def get_manageable_secrets(db: Session, user_id: int):
    """
    Get all secrets that a user can manage based on their role level
    """
    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get all secrets created by the user or users with lower role levels
    return db.query(Secret).join(User).filter(
        (Secret.created_by_user_id == user_id) |
        (User.role_level < current_user.role_level)
    ).all()

# backend/app/core/permissions.py

def can_manage_user(manager: User, target_user: User) -> bool:
    """
    Check if a user can manage another user.
    Rules:
    1. User cannot manage themselves
    2. User can only manage users with lower role levels
    """
    if manager.id == target_user.id:
        return False
        
    return manager.role_level > target_user.role_level

def get_manageable_users(db: Session, current_user: User) -> List[User]:
    """
    Get all users that the current user can manage
    """
    return db.query(User).filter(
        User.role_level < current_user.role_level,
        User.id != current_user.id
    ).all()