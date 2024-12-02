from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.core import Secret, User, SecretRoleShare
from app.schemas.core import SecretCreate, SecretUpdate, SecretResponse, SecretShareCreate, SecretRoleShareResponse
from app.core.security import get_current_user
from app.core.encryption import encrypt_data, decrypt_data
from app.core.roles import RoleLevel

router = APIRouter()

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
        encrypted_data=server_encrypted_data,
        created_by_user_id=current_user.id,
        is_password=secret.is_password
    )
    
    db.add(db_secret)
    db.commit()
    db.refresh(db_secret)
    
    return SecretResponse(
        id=db_secret.id,
        title=db_secret.title,
        description=db_secret.description,
        client_encrypted_data=decrypt_data(db_secret.encrypted_data),
        created_by_user_id=db_secret.created_by_user_id,
        created_at=db_secret.created_at,
        updated_at=db_secret.updated_at,
        is_password=db_secret.is_password,
        is_shared=False,
        share_with_all=False,
        min_role_level=None,
        role_shares=[]
    )

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
        # Get secrets shared with all where user meets minimum role level
        all_shared_query = db.query(Secret).filter(
            Secret.share_with_all == True,
            Secret.created_by_user_id != current_user.id
        )
        
        # Get secrets shared with specific roles
        role_shared_query = db.query(Secret).join(
            SecretRoleShare
        ).filter(
            SecretRoleShare.role_level <= current_user.role_level,
            Secret.created_by_user_id != current_user.id
        )
        
        # Combine queries
        query = query.union(all_shared_query).union(role_shared_query)
    
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
            min_role_level=secret.min_role_level,
            role_shares=[
                SecretRoleShareResponse(
                    id=share.id,
                    secret_id=share.secret_id,
                    role_level=share.role_level,
                    created_at=share.created_at,
                    created_by_user_id=share.created_by_user_id
                )
                for share in secret.role_shares
            ]
        )
        for secret in secrets
    ]

@router.get("/shared-with-me", response_model=List[SecretResponse])
def get_shared_secrets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all secrets shared with the current user's role level"""
    # Get secrets shared with all where user meets minimum role level
    all_shared_secrets = db.query(Secret).filter(
        Secret.share_with_all == True,
        Secret.min_role_level <= current_user.role_level,
        Secret.created_by_user_id != current_user.id
    ).all()
    
    # Get secrets shared with specific roles
    role_shared_secrets = db.query(Secret).join(
        SecretRoleShare
    ).filter(
        SecretRoleShare.role_level == current_user.role_level,
        Secret.created_by_user_id != current_user.id
    ).all()
    
    # Combine and deduplicate secrets
    all_secrets = list(set(all_shared_secrets + role_shared_secrets))
    
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
            min_role_level=secret.min_role_level,
            role_shares=[
                SecretRoleShareResponse(
                    id=share.id,
                    secret_id=share.secret_id,
                    role_level=share.role_level,
                    created_at=share.created_at,
                    created_by_user_id=share.created_by_user_id
                )
                for share in secret.role_shares
            ]
        )
        for secret in all_secrets
    ]

@router.get("/{secret_id}", response_model=SecretResponse)
def get_secret(
    secret_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific secret by ID"""
    secret = db.query(Secret).filter(Secret.id == secret_id).first()
    
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
        
    # Check access
    if not secret.can_access(current_user):
        raise HTTPException(status_code=403, detail="You don't have permission to access this secret")
    
    return SecretResponse(
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
        min_role_level=secret.min_role_level,
        role_shares=[
            SecretRoleShareResponse(
                id=share.id,
                secret_id=share.secret_id,
                role_level=share.role_level,
                created_at=share.created_at,
                created_by_user_id=share.created_by_user_id
            )
            for share in secret.role_shares
        ]
    )

@router.put("/{secret_id}", response_model=SecretResponse)
def update_secret(
    secret_id: int,
    secret_update: SecretUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a secret"""
    secret = db.query(Secret).filter(Secret.id == secret_id).first()
    
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
        
    if secret.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to modify this secret")
    
    # Update fields if provided
    if secret_update.title is not None:
        secret.title = secret_update.title
    if secret_update.description is not None:
        secret.description = secret_update.description
    if secret_update.client_encrypted_data is not None:
        secret.encrypted_data = encrypt_data(secret_update.client_encrypted_data)
    if secret_update.is_password is not None:
        secret.is_password = secret_update.is_password
    
    db.commit()
    db.refresh(secret)
    
    return SecretResponse(
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
        min_role_level=secret.min_role_level,
        role_shares=[
            SecretRoleShareResponse(
                id=share.id,
                secret_id=share.secret_id,
                role_level=share.role_level,
                created_at=share.created_at,
                created_by_user_id=share.created_by_user_id
            )
            for share in secret.role_shares
        ]
    )

@router.delete("/{secret_id}", status_code=204)
def delete_secret(
    secret_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a secret"""
    secret = db.query(Secret).filter(Secret.id == secret_id).first()
    
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
        
    if secret.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this secret")
    
    db.delete(secret)
    db.commit()
    
    return None

@router.post("/{secret_id}/share", response_model=SecretResponse)
def share_secret(
    secret_id: int,
    share_data: SecretShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Share a secret with roles"""
    secret = db.query(Secret).filter(Secret.id == secret_id).first()
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
        
    # Check if user has permission to share
    if secret.created_by_user_id != current_user.id and current_user.role_level != RoleLevel.OWNER:
        raise HTTPException(status_code=403, detail="You don't have permission to share this secret")

    # Update share_with_all and min_role_level
    secret.share_with_all = share_data.share_with_all
    secret.min_role_level = share_data.min_role_level if share_data.share_with_all else None
    secret.is_shared = True

    # If not sharing with all, handle role-based shares
    if not share_data.share_with_all and share_data.role_levels:
        # Remove existing role shares
        db.query(SecretRoleShare).filter(SecretRoleShare.secret_id == secret.id).delete()
        
        # Add new role shares
        for role_level in share_data.role_levels:
            # Validate role level
            if role_level not in [role.value for role in RoleLevel]:
                raise HTTPException(status_code=400, detail=f"Invalid role level: {role_level}")
            
            # Ensure users can only share with roles at or below their level
            # if role_level > current_user.role_level:
            #     raise HTTPException(
            #         status_code=400, 
            #         detail=f"Cannot share with role level {role_level} as it's higher than your role level"
            #     )
                
            share = SecretRoleShare(
                secret_id=secret.id,
                role_level=role_level,
                created_by_user_id=current_user.id
            )
            db.add(share)

    db.commit()
    db.refresh(secret)
    
    return SecretResponse(
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
        min_role_level=secret.min_role_level,
        role_shares=[
            SecretRoleShareResponse(
                id=share.id,
                secret_id=share.secret_id,
                role_level=share.role_level,
                created_at=share.created_at,
                created_by_user_id=share.created_by_user_id
            )
            for share in secret.role_shares
        ]
    )