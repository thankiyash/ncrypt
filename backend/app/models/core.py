# backend/app/models/core.py
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.core.roles import RoleLevel

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    role_level = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    invitation_token = Column(String, unique=True, nullable=True)
    invitation_expires_at = Column(DateTime(timezone=True), nullable=True)
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    secrets = relationship("Secret", back_populates="creator")
    invited_by = relationship("User", remote_side=[id], backref="invites_sent")

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    level = Column(Integer, nullable=False, unique=True)
    description = Column(String)

class Secret(Base):
    __tablename__ = "secrets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    encrypted_data = Column(Text, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_password = Column(Boolean, default=True)
    is_shared = Column(Boolean, default=False)
    share_with_all = Column(Boolean, default=False)
    min_role_level = Column(Integer, nullable=True)

    # Relationships
    creator = relationship("User", back_populates="secrets")
    role_shares = relationship("SecretRoleShare", back_populates="secret", cascade="all, delete-orphan")

    def can_access(self, user: User) -> bool:
        """Check if a user can access this secret"""
        # Owner and creator always have access
        if user.role_level == RoleLevel.OWNER or user.id == self.created_by_user_id:
            return True
            
        # If shared with all, check role hierarchy
        if self.share_with_all and self.min_role_level:
            return user.role_level >= self.min_role_level
            
        # Check role-based shares
        return any(share.role_level <= user.role_level for share in self.role_shares)

class SecretRoleShare(Base):
    __tablename__ = "secret_role_shares"

    id = Column(Integer, primary_key=True, index=True)
    secret_id = Column(Integer, ForeignKey("secrets.id", ondelete="CASCADE"))
    role_level = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_user_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    secret = relationship("Secret", back_populates="role_shares")
    created_by = relationship("User", foreign_keys=[created_by_user_id])