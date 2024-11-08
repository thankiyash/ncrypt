# backend/app/models/core.py
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

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

    # Relationships
    creator = relationship("User", back_populates="secrets")