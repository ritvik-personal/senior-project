from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GroupInformationBase(BaseModel):
    group_name: str
    group_description: Optional[str] = None


class GroupInformationCreate(GroupInformationBase):
    # created_by will be extracted from JWT token
    pass


class GroupInformationUpdate(BaseModel):
    group_name: Optional[str] = None
    group_code: Optional[str] = None
    group_description: Optional[str] = None


class GroupInformationResponse(GroupInformationBase):
    group_id: str
    group_code: str
    created_by: str
    created_at: str

    class Config:
        from_attributes = True


class GroupInformationListResponse(BaseModel):
    groups: list[GroupInformationResponse]
    total: int
    limit: int
    offset: int


class GroupCodeLookupRequest(BaseModel):
    group_code: str


class GroupCodeLookupResponse(BaseModel):
    group_id: str
    group_name: str
    group_code: str
    group_description: Optional[str] = None
    created_by: str
    created_at: str
