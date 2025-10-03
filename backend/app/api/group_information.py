from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

from db.group_information import (
    create_group_information,
    get_group_by_id,
    get_group_by_code,
    get_groups_by_creator,
    list_all_groups,
    update_group_information,
    delete_group_information,
    check_group_code_exists
)
from app.schemas.group_information import (
    GroupInformationCreate,
    GroupInformationUpdate,
    GroupInformationResponse,
    GroupInformationListResponse,
    GroupCodeLookupRequest,
    GroupCodeLookupResponse
)
from app.utils.auth import get_current_user_id, get_access_token
from db.groups import create_group_membership

router = APIRouter()


@router.post("/", response_model=GroupInformationResponse)
async def create_group_information_endpoint(
    group: GroupInformationCreate,
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Create a new group information entry"""
    try:
        # Generate a unique group code
        import uuid
        group_code = str(uuid.uuid4())[:8].upper()
        
        # Ensure the code is unique
        while check_group_code_exists(group_code, access_token):
            group_code = str(uuid.uuid4())[:8].upper()
        
        result = create_group_information(
            group_name=group.group_name,
            group_code=group_code,
            created_by=current_user_id,
            group_description=group.group_description,
            access_token=access_token
        )
        
        # Automatically add the creator as a group member with admin privileges
        try:
            membership_result = create_group_membership(
                group_id=result["group_id"],
                user_id=current_user_id,
                access_token=access_token
            )
        except Exception as e:
            logger.error(f"Failed to create membership for group creator: {e}")
            # Don't fail the group creation if membership creation fails
        
        return GroupInformationResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{group_id}", response_model=GroupInformationResponse)
async def get_group_information_endpoint(
    group_id: str = Path(..., description="Group ID"),
    access_token: str = Depends(get_access_token)
):
    """Get group information by ID"""
    result = get_group_by_id(group_id, access_token)
    if not result:
        raise HTTPException(status_code=404, detail="Group not found")
    return GroupInformationResponse(**result)


@router.get("/code/{group_code}", response_model=GroupCodeLookupResponse)
async def get_group_by_code_endpoint(
    group_code: str = Path(..., description="Group Code"),
    access_token: str = Depends(get_access_token)
):
    """Get group information by group code"""
    result = get_group_by_code(group_code, access_token)
    if not result:
        raise HTTPException(status_code=404, detail="Group not found")
    return GroupCodeLookupResponse(**result)


@router.get("/creator/{user_id}", response_model=List[GroupInformationResponse])
async def get_groups_by_creator_endpoint(
    user_id: str = Path(..., description="User ID"),
    access_token: str = Depends(get_access_token)
):
    """Get all groups created by a specific user"""
    groups = get_groups_by_creator(user_id, access_token)
    return [GroupInformationResponse(**group) for group in groups]


@router.get("/my-groups/", response_model=List[GroupInformationResponse])
async def get_my_groups_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get all groups created by the current user"""
    groups = get_groups_by_creator(current_user_id, access_token)
    return [GroupInformationResponse(**group) for group in groups]


@router.get("/", response_model=GroupInformationListResponse)
async def list_groups_endpoint(
    limit: int = Query(100, ge=1, le=1000, description="Number of groups to return"),
    offset: int = Query(0, ge=0, description="Number of groups to skip"),
    order_desc: bool = Query(True, description="Order by created_at descending"),
    access_token: str = Depends(get_access_token)
):
    """List all groups with pagination"""
    groups = list_all_groups(
        limit=limit,
        offset=offset,
        order_desc=order_desc,
        access_token=access_token
    )
    
    group_responses = [GroupInformationResponse(**group) for group in groups]
    
    return GroupInformationListResponse(
        groups=group_responses,
        total=len(group_responses),
        limit=limit,
        offset=offset
    )


@router.put("/{group_id}", response_model=GroupInformationResponse)
async def update_group_information_endpoint(
    group_id: str = Path(..., description="Group ID"),
    group_update: GroupInformationUpdate = None,
    access_token: str = Depends(get_access_token)
):
    """Update group information"""
    if not group_update:
        raise HTTPException(status_code=400, detail="No update data provided")
    
        # Check if group exists
        existing_group = get_group_by_id(group_id, access_token)
        if not existing_group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # If updating group_code, check if new code already exists
        if group_update.group_code and group_update.group_code != existing_group["group_code"]:
            if check_group_code_exists(group_update.group_code, access_token):
                raise HTTPException(
                    status_code=400, 
                    detail="Group code already exists. Please choose a different code."
                )
    
    # Convert Pydantic model to dict, excluding None values
    updates = {k: v for k, v in group_update.dict().items() if v is not None}
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = update_group_information(group_id, updates, access_token=access_token)
    if not result:
        raise HTTPException(status_code=404, detail="Group not found or update failed")
    return GroupInformationResponse(**result)


@router.delete("/{group_id}")
async def delete_group_information_endpoint(
    group_id: str = Path(..., description="Group ID"),
    access_token: str = Depends(get_access_token)
):
    """Delete group information"""
    # Check if group exists
    existing_group = get_group_by_id(group_id, access_token)
    if not existing_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    success = delete_group_information(group_id, access_token=access_token)
    if not success:
        raise HTTPException(status_code=404, detail="Group not found or deletion failed")
    
    return {"message": "Group deleted successfully"}


@router.post("/lookup", response_model=GroupCodeLookupResponse)
async def lookup_group_by_code_endpoint(
    lookup_request: GroupCodeLookupRequest,
    access_token: str = Depends(get_access_token)
):
    """Lookup group information by group code (alternative endpoint)"""
    result = get_group_by_code(lookup_request.group_code, access_token)
    if not result:
        raise HTTPException(status_code=404, detail="Group not found")
    return GroupCodeLookupResponse(**result)
