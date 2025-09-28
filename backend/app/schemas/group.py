from pydantic import BaseModel
from typing import List, Optional

class GroupBase(BaseModel):
    group_name: str

class GroupCreate(GroupBase):
    user_id: str

class GroupUpdate(BaseModel):
    group_name: Optional[str] = None

class GroupResponse(GroupBase):
    group_id: str
    user_id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class GroupListResponse(BaseModel):
    groups: List[GroupResponse]

class AddUserToGroupRequest(BaseModel):
    user_id: str

class RemoveUserFromGroupRequest(BaseModel):
    user_id: str

