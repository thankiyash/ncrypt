from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.core import Secret, User
from app.core.security import get_current_user
from app.core.encryption import encrypt_data, decrypt_data
from pydantic import BaseModel

router = APIRouter()

# Request/Response Models
class SecretCreate(BaseModel):
    title: str
    description: Optional[str] = None
    client_encrypted_data: str  # First layer: encrypted by client
    is_password: bool = True

class SecretUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    client_encrypted_data: Optional[str] = None
    is_password: Optional[bool] = None

class SecretResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    client_encrypted_data: str  # Will be decrypted on client side
    created_by_user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_password: bool

    class Config:
        from_attributes = True

# Create a new secret
@router.post("/", response_model=SecretResponse)
def create_secret(
    secret: SecretCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new secret with double encryption"""
    # Second layer: server-side encryption
    server_encrypted_data = encrypt_data(secret.client_encrypted_data)
    
    db_secret = Secret(
        title=secret.title,
        description=secret.description,
        encrypted_data=server_encrypted_data,  # Store with both layers
        created_by_user_id=current_user.id,
        is_password=secret.is_password
    )
    
    db.add(db_secret)
    db.commit()
    db.refresh(db_secret)
    
    # Remove server encryption for response
    return SecretResponse(
        id=db_secret.id,
        title=db_secret.title,
        description=db_secret.description,
        client_encrypted_data=decrypt_data(db_secret.encrypted_data),
        created_by_user_id=db_secret.created_by_user_id,
        created_at=db_secret.created_at,
        updated_at=db_secret.updated_at,
        is_password=db_secret.is_password
    )

# Get all secrets for current user
@router.get("/", response_model=List[SecretResponse])
def get_secrets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all secrets created by the current user"""
    secrets = db.query(Secret).filter(
        Secret.created_by_user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    # Remove server encryption for each secret
    return [
        SecretResponse(
            id=secret.id,
            title=secret.title,
            description=secret.description,
            client_encrypted_data=decrypt_data(secret.encrypted_data),
            created_by_user_id=secret.created_by_user_id,
            created_at=secret.created_at,
            updated_at=secret.updated_at,
            is_password=secret.is_password
        )
        for secret in secrets
    ]

# Get a specific secret
@router.get("/{secret_id}", response_model=SecretResponse)
def get_secret(
    secret_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific secret by ID"""
    secret = db.query(Secret).filter(
        Secret.id == secret_id,
        Secret.created_by_user_id == current_user.id
    ).first()
    
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    
    # Remove server encryption for response
    return SecretResponse(
        id=secret.id,
        title=secret.title,
        description=secret.description,
        client_encrypted_data=decrypt_data(secret.encrypted_data),
        created_by_user_id=secret.created_by_user_id,
        created_at=secret.created_at,
        updated_at=secret.updated_at,
        is_password=secret.is_password
    )

# Update a secret
@router.put("/{secret_id}", response_model=SecretResponse)
def update_secret(
    secret_id: int,
    secret_update: SecretUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a secret"""
    db_secret = db.query(Secret).filter(
        Secret.id == secret_id,
        Secret.created_by_user_id == current_user.id
    ).first()
    
    if not db_secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    
    # Update fields if provided
    if secret_update.title is not None:
        db_secret.title = secret_update.title
    if secret_update.description is not None:
        db_secret.description = secret_update.description
    if secret_update.client_encrypted_data is not None:
        # Add server encryption layer
        db_secret.encrypted_data = encrypt_data(secret_update.client_encrypted_data)
    if secret_update.is_password is not None:
        db_secret.is_password = secret_update.is_password
    
    db.commit()
    db.refresh(db_secret)
    
    # Remove server encryption for response
    return SecretResponse(
        id=db_secret.id,
        title=db_secret.title,
        description=db_secret.description,
        client_encrypted_data=decrypt_data(db_secret.encrypted_data),
        created_by_user_id=db_secret.created_by_user_id,
        created_at=db_secret.created_at,
        updated_at=db_secret.updated_at,
        is_password=db_secret.is_password
    )

@router.delete("/{secret_id}", status_code=204)
def delete_secret(
    secret_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a secret"""
    # Query the secret ensuring it belongs to the current user
    secret = db.query(Secret).filter(
        Secret.id == secret_id,
        Secret.created_by_user_id == current_user.id
    ).first()
    
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    
    # Delete the secret
    db.delete(secret)
    db.commit()
    
    # Return 204 No Content (success, but no response body)
    return None