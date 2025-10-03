from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

from db.groups import (
    create_group_membership,
    get_user_groups,
    get_group_members,
    get_membership_by_user_and_group,
    remove_group_membership,
    check_user_in_group,
    get_user_group_count,
    get_group_member_count,
    update_membership_admin_status
)
from db.group_information import get_group_by_code, get_group_by_id
from app.schemas.group_membership import (
    GroupMembershipCreate,
    GroupMembershipResponse,
    UserGroupResponse,
    GroupMemberResponse,
    GroupMembershipListResponse,
    JoinGroupRequest,
    JoinGroupResponse
)
from app.utils.auth import get_current_user_id, get_access_token

router = APIRouter()


@router.post("/join", response_model=JoinGroupResponse)
async def join_group_endpoint(
    join_request: JoinGroupRequest,
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Join a group using group code"""
    try:
        # First, find the group by code
        group_info = get_group_by_code(join_request.group_code, access_token)
        if not group_info:
            return JoinGroupResponse(
                success=False,
                message="Group not found with the provided code"
            )
        
        group_id = group_info["group_id"]
        
        # Check if user is already a member
        if check_user_in_group(current_user_id, group_id, access_token):
            return JoinGroupResponse(
                success=False,
                message="You are already a member of this group"
            )
        
        # Create membership
        membership = create_group_membership(
            group_id=group_id,
            user_id=current_user_id,
            is_admin=False,
            access_token=access_token
        )
        
        return JoinGroupResponse(
            success=True,
            message=f"Successfully joined group '{group_info['group_name']}'",
            group_id=group_id,
            group_name=group_info['group_name']
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/my-groups", response_model=GroupMembershipListResponse)
async def get_my_groups_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get all groups that the current user is a member of"""
    try:
        user_groups_data = get_user_groups(current_user_id, access_token)
        
        groups = []
        for membership in user_groups_data:
            group_info = membership.get("group_information")
            if group_info:
                groups.append(UserGroupResponse(
                    group_id=group_info["group_id"],
                    group_name=group_info["group_name"],
                    group_code=group_info["group_code"],
                    created_by=group_info["created_by"],
                    created_at=group_info["created_at"],
                    is_admin=membership["is_admin"],
                    joined_at=membership["joined_at"]
                ))
        
        return GroupMembershipListResponse(
            groups=groups,
            total=len(groups)
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{group_id}/members", response_model=List[GroupMemberResponse])
async def get_group_members_endpoint(
    group_id: str = Path(..., description="Group ID"),
    access_token: str = Depends(get_access_token)
):
    """Get all members of a specific group"""
    try:
        members_data = get_group_members(group_id, access_token)
        
        members = []
        for member in members_data:
            members.append(GroupMemberResponse(
                user_id=member["user_id"],
                is_admin=member.get("is_admin", False),
                joined_at=member.get("joined_at", "")
            ))
        
        return members
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{group_id}/leave")
async def leave_group_endpoint(
    group_id: str = Path(..., description="Group ID"),
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Leave a group"""
    try:
        # Check if user is a member
        if not check_user_in_group(current_user_id, group_id, access_token):
            raise HTTPException(status_code=404, detail="You are not a member of this group")
        
        # Remove membership
        success = remove_group_membership(group_id, current_user_id, access_token)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to leave group")
        
        return {"message": "Successfully left the group"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{group_id}/check-membership")
async def check_membership_endpoint(
    group_id: str = Path(..., description="Group ID"),
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Check if the current user is a member of a specific group"""
    try:
        is_member = check_user_in_group(current_user_id, group_id, access_token)
        membership = None
        
        if is_member:
            membership = get_membership_by_user_and_group(current_user_id, group_id, access_token)
        
        return {
            "is_member": is_member,
            "membership": membership
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stats/my-groups")
async def get_my_groups_stats_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Get statistics about the current user's groups"""
    try:
        group_count = get_user_group_count(current_user_id, access_token)
        return {
            "total_groups": group_count,
            "user_id": current_user_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stats/{group_id}")
async def get_group_stats_endpoint(
    group_id: str = Path(..., description="Group ID"),
    access_token: str = Depends(get_access_token)
):
    """Get statistics about a specific group"""
    try:
        member_count = get_group_member_count(group_id, access_token)
        return {
            "group_id": group_id,
            "member_count": member_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{group_id}/admin/{user_id}")
async def update_admin_status_endpoint(
    group_id: str = Path(..., description="Group ID"),
    user_id: str = Path(..., description="User ID"),
    is_admin: bool = Query(..., description="Admin status"),
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token)
):
    """Update admin status of a group member (only group admins can do this)"""
    try:
        # Check if current user is admin of the group
        current_membership = get_membership_by_user_and_group(current_user_id, group_id, access_token)
        if not current_membership or not current_membership["is_admin"]:
            raise HTTPException(status_code=403, detail="Only group admins can update member status")
        
        # Update the target user's admin status
        success = update_membership_admin_status(group_id, user_id, is_admin, access_token)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update admin status")
        
        return {"message": f"Admin status updated for user {user_id}"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
