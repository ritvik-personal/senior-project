from fastapi import APIRouter, HTTPException, Query, Path
from typing import List

from db.groups import (
    create_group,
    get_group_by_id,
    get_groups_by_user_id,
    delete_group,
    update_group,
    add_user_to_group,
    remove_user_from_group
)
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupResponse,
    GroupListResponse,
    AddUserToGroupRequest,
    RemoveUserFromGroupRequest
)

router = APIRouter()

@router.post("/", response_model=GroupResponse)
async def create_group_endpoint(group: GroupCreate):
    """Create a new group"""
    try:
        result = create_group(
            name=group.group_name,
            user_id=group.user_id
        )
        return GroupResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{group_id}", response_model=GroupResponse)
async def get_group_endpoint(group_id: str = Path(..., description="Group ID")):
    """Get a group by ID"""
    result = get_group_by_id(group_id)
    if not result:
        raise HTTPException(status_code=404, detail="Group not found")
    return GroupResponse(**result)

@router.get("/user/{user_id}", response_model=GroupListResponse)
async def get_groups_by_user_endpoint(user_id: str = Path(..., description="User ID")):
    """Get all groups for a user"""
    groups = get_groups_by_user_id(user_id)
    group_responses = [GroupResponse(**group) for group in groups]
    
    return GroupListResponse(groups=group_responses)

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group_endpoint(
    group_id: str = Path(..., description="Group ID"),
    group_update: GroupUpdate = None
):
    """Update a group"""
    if not group_update or not group_update.group_name:
        raise HTTPException(status_code=400, detail="Group name is required for update")
    
    success = update_group(group_id, group_update.group_name)
    if not success:
        raise HTTPException(status_code=404, detail="Group not found or update failed")
    
    # Return updated group
    result = get_group_by_id(group_id)
    if not result:
        raise HTTPException(status_code=404, detail="Group not found after update")
    
    return GroupResponse(**result)

@router.delete("/{group_id}")
async def delete_group_endpoint(group_id: str = Path(..., description="Group ID")):
    """Delete a group"""
    success = delete_group(group_id)
    if not success:
        raise HTTPException(status_code=404, detail="Group not found or deletion failed")
    
    return {"message": "Group deleted successfully"}

@router.post("/{group_id}/users", response_model=dict)
async def add_user_to_group_endpoint(
    group_id: str = Path(..., description="Group ID"),
    request: AddUserToGroupRequest = None
):
    """Add a user to a group"""
    if not request:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    success = add_user_to_group(group_id, request.user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add user to group")
    
    return {"message": f"User {request.user_id} added to group {group_id}"}

@router.delete("/{group_id}/users", response_model=dict)
async def remove_user_from_group_endpoint(
    group_id: str = Path(..., description="Group ID"),
    request: RemoveUserFromGroupRequest = None
):
    """Remove a user from a group"""
    if not request:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    success = remove_user_from_group(group_id, request.user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to remove user from group")
    
    return {"message": f"User {request.user_id} removed from group {group_id}"}

