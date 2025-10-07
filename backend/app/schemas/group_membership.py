from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class GroupMembershipBase(BaseModel):
    group_id: str
    user_id: str
    is_admin: bool = False


class GroupMembershipCreate(GroupMembershipBase):
    pass


class GroupMembershipResponse(GroupMembershipBase):
    membership_id: Optional[str] = None  # Optional since we don't have this column
    joined_at: str

    class Config:
        from_attributes = True


class UserGroupResponse(BaseModel):
    group_id: str
    group_name: str
    group_code: str
    created_by: str
    created_at: str
    is_admin: bool
    joined_at: str


class GroupMemberResponse(BaseModel):
    membership_id: Optional[str] = None  # Optional since we don't have this column
    user_id: str
    is_admin: bool
    joined_at: str
    email: Optional[str] = None


class GroupMembershipListResponse(BaseModel):
    groups: List[UserGroupResponse]
    total: int


class JoinGroupRequest(BaseModel):
    group_code: str


class JoinGroupResponse(BaseModel):
    success: bool
    message: str
    group_id: Optional[str] = None
    group_name: Optional[str] = None
