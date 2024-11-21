from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.core import Secret, User, SecretShare
from app.schemas.core import SecretShareCreate, SecretShareResponse
from app.core.security import get_current_user
from app.core.encryption import encrypt_data, decrypt_data
from pydantic import BaseModel
from app.core.roles import RoleLevel  # Add this import

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


@router.get("/shared-with-me", response_model=List[SecretResponse])
def get_shared_secrets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all secrets shared with the current user"""
    # Get secrets shared explicitly with the user
    shared_secrets = db.query(Secret).join(SecretShare).filter(
        SecretShare.shared_with_user_id == current_user.id
    ).all()
    
    # Get secrets shared with all (respecting role hierarchy)
    # Changed the role level comparison
    all_shared_secrets = db.query(Secret).join(
        User, Secret.created_by_user_id == User.id
    ).filter(
        Secret.share_with_all == True,
        User.role_level <= current_user.role_level,  # Changed from >= to <=
        Secret.created_by_user_id != current_user.id  # Don't include own secrets
    ).all()
    
    # Combine and deduplicate
    all_secrets = list(set(shared_secrets + all_shared_secrets))
    
    return [
        SecretResponse(
            id=secret.id,
            title=secret.title,
            description=secret.description,
            client_encrypted_data=decrypt_data(secret.encrypted_data),
            created_by_user_id=secret.created_by_user_id,
            created_at=secret.created_at,
            updated_at=secret.updated_at,
            is_password=secret.is_password,
            is_shared=True,
            share_with_all=secret.share_with_all,
            shares=[
                SecretShareResponse(
                    id=share.id,
                    secret_id=share.secret_id,
                    shared_with_user_id=share.shared_with_user_id,
                    shared_with_user_email=share.shared_with_user.email,
                    created_at=share.created_at,
                    created_by_user_id=share.created_by_user_id
                )
                for share in secret.shares
            ]
        )
        for secret in all_secrets
    ]

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
 

@router.post("/{secret_id}/share", response_model=SecretResponse)
def share_secret(
    secret_id: int,
    share_data: SecretShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Share a secret with other users"""
    secret = db.query(Secret).filter(Secret.id == secret_id).first()
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
        
    # Check if user has permission to share
    if secret.created_by_user_id != current_user.id and current_user.role_level != RoleLevel.OWNER:
        raise HTTPException(status_code=403, detail="You don't have permission to share this secret")

    # Update share_with_all status
    secret.share_with_all = share_data.share_with_all
    secret.is_shared = True

    # If not sharing with all, handle individual shares
    if not share_data.share_with_all:
        # Remove existing shares
        db.query(SecretShare).filter(SecretShare.secret_id == secret.id).delete()
        
        # Add new shares
        for user_id in share_data.shared_with_user_ids:
            share = SecretShare(
                secret_id=secret.id,
                shared_with_user_id=user_id,
                created_by_user_id=current_user.id
            )
            db.add(share)

    db.commit()
    db.refresh(secret)
    
    # Format response according to SecretResponse schema
    return SecretResponse(
        id=secret.id,
        title=secret.title,
        description=secret.description,
        client_encrypted_data=decrypt_data(secret.encrypted_data),  # Decrypt server-side encryption
        created_by_user_id=secret.created_by_user_id,
        created_at=secret.created_at,
        updated_at=secret.updated_at,
        is_password=secret.is_password,
        is_shared=secret.is_shared,
        share_with_all=secret.share_with_all,
        shares=[
            SecretShareResponse(
                id=share.id,
                secret_id=share.secret_id,
                shared_with_user_id=share.shared_with_user_id,
                shared_with_user_email=share.shared_with_user.email,
                created_at=share.created_at,
                created_by_user_id=share.created_by_user_id
            )
            for share in secret.shares
        ]
    )

@router.get("/shared", response_model=List[SecretResponse])
def get_shared_secrets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all secrets shared with the current user"""
    # Get secrets shared explicitly with the user
    shared_secrets = db.query(Secret).join(SecretShare).filter(
        SecretShare.shared_with_user_id == current_user.id
    ).all()
    
    # Get secrets shared with all (respecting role hierarchy)
    all_shared_secrets = db.query(Secret).join(User, Secret.created_by_user_id == User.id).filter(
        Secret.share_with_all == True,
        User.role_level >= current_user.role_level
    ).all()
    
    # Combine and deduplicate
    all_secrets = list(set(shared_secrets + all_shared_secrets))
    
    return all_secrets

# Update the existing get_secrets endpoint to include owned and shared secrets
@router.get("/", response_model=List[SecretResponse])
def get_secrets(
    skip: int = 0,
    limit: int = 100,
    include_shared: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all secrets the user has access to"""
    # Start with user's own secrets
    query = db.query(Secret).filter(Secret.created_by_user_id == current_user.id)
    
    if include_shared:
        # Add explicitly shared secrets
        shared_query = db.query(Secret).join(SecretShare).filter(
            SecretShare.shared_with_user_id == current_user.id
        )
        
        # Add secrets shared with all (respecting role hierarchy)
        all_shared_query = db.query(Secret).join(
            User, Secret.created_by_user_id == User.id
        ).filter(
            Secret.share_with_all == True,
            User.role_level >= current_user.role_level
        )
        
        # Combine queries
        query = query.union(shared_query).union(all_shared_query)
    
    secrets = query.offset(skip).limit(limit).all()
    
    return [
        SecretResponse(
            id=secret.id,
            title=secret.title,
            description=secret.description,
            client_encrypted_data=decrypt_data(secret.encrypted_data),
            created_by_user_id=secret.created_by_user_id,
            created_at=secret.created_at,
            updated_at=secret.updated_at,
            is_password=secret.is_password,
            is_shared=secret.is_shared,
            share_with_all=secret.share_with_all,
            shares=[
                SecretShareResponse(
                    id=share.id,
                    secret_id=share.secret_id,
                    shared_with_user_id=share.shared_with_user_id,
                    shared_with_user_email=share.shared_with_user.email,
                    created_at=share.created_at,
                    created_by_user_id=share.created_by_user_id
                )
                for share in secret.shares
            ]
        )
        for secret in secrets
    ]
