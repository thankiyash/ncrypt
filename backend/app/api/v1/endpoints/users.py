# backend/app/api/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, create_invitation_token, get_current_user, get_current_active_user
from app.database import get_db
from app.models.core import User
from app.schemas.core import (
    UserCreate, 
    UserInvite, 
    UserRegisterResponse, 
    AcceptInvite,
    UserInDB,
    UserUpdate,

)
from app.core.roles import (
    RoleLevel,
    get_role_name,
    can_manage_role
)
from datetime import datetime, timedelta
from typing import Dict, Any, List
from datetime import datetime, timezone


router = APIRouter()

@router.post("/register-first-user", response_model=UserRegisterResponse)
def register_first_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register the first user (Owner) in the system.
    This endpoint only works if no users exist in the database.
    """
    # Check if any users exist
    if db.query(User).first():
        raise HTTPException(
            status_code=400,
            detail="System already initialized with an owner"
        )
    
    # Force role level to Owner (7)
    user.role_level = RoleLevel.OWNER
    
    db_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        role_level=user.role_level,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserRegisterResponse(
        id=db_user.id,
        email=db_user.email,
        role_level=db_user.role_level,
        message="Owner account created successfully"
    )

@router.post("/invite")
def invite_user(
    invite: UserInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """
    Invite a new user to the system.
    Returns the invitation token directly (for testing purposes).
    """
    # Check if inviter can invite users at this role level
    if not can_manage_role(current_user.role_level, invite.role_level):
        raise HTTPException(
            status_code=403,
            detail="You can only invite users with lower role levels than yours"
        )
    
    # Check if user already exists
    if db.query(User).filter(User.email == invite.email).first():
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # Create invitation token and expiry (48 hours)
    token = create_invitation_token()
    expires_at = datetime.utcnow() + timedelta(hours=48)
    
    # Create inactive user with invitation token
    # Set a temporary password hash that will be updated when the user accepts the invite
    temp_password_hash = get_password_hash(token)  # Use the token itself as a temporary password
    
    new_user = User(
        email=invite.email,
        first_name=invite.first_name,
        last_name=invite.last_name,
        role_level=invite.role_level,
        is_active=False,
        hashed_password=temp_password_hash,  # Set temporary password hash
        invitation_token=token,
        invitation_expires_at=expires_at,
        invited_by_id=current_user.id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Invitation created successfully",
        "role": get_role_name(invite.role_level),
        "invitation_token": token,
        "expires_at": expires_at.isoformat(),
        "invited_user": {
            "email": invite.email,
            "first_name": invite.first_name,
            "last_name": invite.last_name,
            "role_level": invite.role_level
        }
    }

@router.post("/accept-invite", response_model=UserRegisterResponse)
def accept_invitation(
    accept_data: AcceptInvite,
    db: Session = Depends(get_db)
):
    """
    Accept an invitation and set up the user account
    """
    user = db.query(User).filter(
        User.invitation_token == accept_data.token,
        User.is_active == False
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Invalid invitation token"
        )
    
    # Use timezone-aware UTC datetime for comparison
    current_time = datetime.now(timezone.utc)
    if user.invitation_expires_at < current_time:
        raise HTTPException(
            status_code=400,
            detail="Invitation has expired"
        )
    
    # Update user with new password and activate account
    user.is_active = True
    user.hashed_password = get_password_hash(accept_data.password)
    user.invitation_token = None
    user.invitation_expires_at = None
    
    db.commit()
    db.refresh(user)
    
    return UserRegisterResponse(
        id=user.id,
        email=user.email,
        role_level=user.role_level,
        message="Account activated successfully"
    )
# Utility endpoint for testing - list all pending invitations
@router.get("/pending-invites")
def list_pending_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, list]:
    """
    List all pending invitations (for testing purposes)
    Only shows invitations created by the current user
    """
    pending = db.query(User).filter(
        User.is_active == False,
        User.invitation_token.isnot(None)
    ).all()
    
    return {
        "pending_invites": [
            {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role_level": user.role_level,
                "role_name": get_role_name(user.role_level),
                "invitation_token": user.invitation_token,
                "expires_at": user.invitation_expires_at.isoformat(),
            }
            for user in pending
        ]
    }

@router.get("/check-owner", response_model=dict)
def check_owner_exists(db: Session = Depends(get_db)):
    """
    Check if an owner account has been set up in the system.
    This endpoint is public and does not require authentication.
    """
    owner = db.query(User).filter(User.role_level == RoleLevel.OWNER).first()
    return {
        "owner_exists": owner is not None,
        "setup_required": owner is None
    }

@router.get("/team-members", response_model=List[UserInDB])
def get_team_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[User]:
    """
    Get all team members that the current user has permission to view.
    Higher role levels can see users with lower role levels.
    """
    try:
        # Get all users with lower or equal role level
        users = db.query(User).filter(
            User.role_level <= current_user.role_level,
            User.is_active == True  # Only get active users
        ).all()
        
        return users
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch team members: {str(e)}"
        )

@router.get("/team-members/{user_id}", response_model=UserInDB)
def get_team_member(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific team member
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
            
        # Check if current user has permission to view this user
        if user.role_level > current_user.role_level:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to view this user"
            )
            
        return user
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch team member: {str(e)}"
        )

@router.put("/team-members/{user_id}", response_model=UserInDB)
def update_team_member(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a team member's information.
    Only users with higher role levels can update lower role level users.
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
            
        # Check if current user has permission to update this user
        if user.role_level >= current_user.role_level:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to update this user"
            )
            
        # Update allowed fields
        if user_update.first_name is not None:
            user.first_name = user_update.first_name
        if user_update.last_name is not None:
            user.last_name = user_update.last_name
            
        db.commit()
        db.refresh(user)
        return user
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update team member: {str(e)}"
        )

@router.delete("/team-members/{user_id}", status_code=204)
def delete_team_member(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate a team member.
    Only users with higher role levels can deactivate lower role level users.
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
            
        # Check if current user has permission to delete this user
        if user.role_level >= current_user.role_level:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to deactivate this user"
            )
            
        # Soft delete by setting is_active to False
        user.is_active = False
        db.commit()
        
        return None
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to deactivate team member: {str(e)}"
        )
