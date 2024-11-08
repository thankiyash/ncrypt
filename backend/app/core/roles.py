# backend/app/core/roles.py
from enum import IntEnum
from typing import Dict, List

class RoleLevel(IntEnum):
    INTERN = 1
    JUNIOR = 2
    SENIOR = 3
    MANAGER = 4
    DIRECTOR = 5
    EXEC = 6
    OWNER = 7

ROLE_HIERARCHY: Dict[str, int] = {
    "Owner": RoleLevel.OWNER,
    "Exec": RoleLevel.EXEC,
    "Director": RoleLevel.DIRECTOR,
    "Manager": RoleLevel.MANAGER,
    "Senior": RoleLevel.SENIOR,
    "Junior": RoleLevel.JUNIOR,
    "Intern": RoleLevel.INTERN
}

ROLE_DESCRIPTIONS: Dict[str, str] = {
    "Owner": "Full system access and user management",
    "Exec": "Executive level access",
    "Director": "Director level access",
    "Manager": "Team management and oversight",
    "Senior": "Senior team member",
    "Junior": "Junior team member",
    "Intern": "Limited access"
}

def get_role_name(level: int) -> str:
    """Get role name from level."""
    return {v: k for k, v in ROLE_HIERARCHY.items()}.get(level, "Unknown")

def get_role_level(name: str) -> int:
    """Get role level from name."""
    return ROLE_HIERARCHY.get(name, 0)

def get_subordinate_roles(role_level: int) -> List[int]:
    """Get list of role levels that are subordinate to the given role level."""
    return [level for level in RoleLevel if level < role_level]

def can_manage_role(manager_role: int, target_role: int) -> bool:
    """Check if a role can manage another role."""
    return manager_role > target_role