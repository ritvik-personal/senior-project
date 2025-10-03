from typing import Any, Dict, List, Optional, Tuple
from datetime import date, datetime
import logging

from app.database import get_supabase_client, get_authenticated_client

logger = logging.getLogger(__name__)

TABLE_NAME = "groups"


def _table():
    return get_supabase_client().table(TABLE_NAME)


def _authenticated_table(access_token: str):
    return get_authenticated_client(access_token).table(TABLE_NAME)


def _map_membership_fields(membership_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map database fields to schema fields"""
    return {
        "group_id": str(membership_data.get("group_id", "")),
        "user_id": str(membership_data.get("user_id", "")),
        # Note: is_admin and joined_at don't exist in the groups table
        # These will be set to default values for compatibility
        "joined_at": datetime.utcnow().isoformat(),
        "is_admin": False,  # Default to False since we can't store this in the groups table
    }


def create_group_membership(
    group_id: str,
    user_id: str,
    is_admin: bool = False,
    access_token: Optional[str] = None,
    joined_at: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Create a new group membership entry"""
    payload: Dict[str, Any] = {
        "group_id": group_id,
        "user_id": user_id,
    }
    
    # Note: is_admin and joined_at columns don't exist in the groups table
    # Only group_id and user_id are available

    # Use authenticated client if token is provided
    if access_token:
        resp = _authenticated_table(access_token).insert(payload).execute()
    else:
        resp = _table().insert(payload).execute()
        
    if resp.data:
        membership_data = resp.data[0]
        return _map_membership_fields(membership_data)
    raise RuntimeError(f"Failed to insert group membership: {resp}")


def get_user_groups(user_id: str, access_token: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all groups that a user is a member of"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("*").eq("user_id", user_id)
    resp = query.execute()
    
    if resp.data:
        # For each membership, fetch the group information
        from db.group_information import get_group_by_id
        result = []
        for membership in resp.data:
            group_info = get_group_by_id(membership["group_id"], access_token)
            if group_info:
                # Add group information and set admin status
                membership["group_information"] = group_info
                # Check if user is the creator to determine admin status
                membership["is_admin"] = (group_info.get("created_by") == user_id)
                membership["joined_at"] = datetime.utcnow().isoformat()  # Default timestamp
                result.append(membership)
        return result
    return []


def get_group_members(group_id: str, access_token: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all members of a specific group"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("*, users(*)").eq("group_id", group_id)
    resp = query.execute()
    if resp.data:
        return resp.data
    return []


def get_membership_by_user_and_group(
    user_id: str, 
    group_id: str,
    access_token: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Check if a user is a member of a specific group"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("*").eq("user_id", user_id).eq("group_id", group_id)
    resp = query.single().execute()
    if resp.data:
        return _map_membership_fields(resp.data)
    return None


def remove_group_membership(
    group_id: str,
    user_id: str,
    access_token: Optional[str] = None,
) -> bool:
    """Remove a user from a group"""
    table = _authenticated_table(access_token) if access_token else _table()
    resp = table.delete().eq("group_id", group_id).eq("user_id", user_id).execute()
    # If RLS disallows returning rows on delete, data may be None even when successful
    if isinstance(resp.data, list):
        return len(resp.data) > 0
    return True


def check_user_in_group(user_id: str, group_id: str, access_token: Optional[str] = None) -> bool:
    """Check if a user is a member of a specific group"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("group_id, user_id").eq("user_id", user_id).eq("group_id", group_id)
    resp = query.execute()
    return len(resp.data or []) > 0


def get_user_group_count(user_id: str, access_token: Optional[str] = None) -> int:
    """Get the number of groups a user is a member of"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("group_id, user_id", count="exact").eq("user_id", user_id)
    resp = query.execute()
    return resp.count or 0


def get_group_member_count(group_id: str, access_token: Optional[str] = None) -> int:
    """Get the number of members in a group"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("group_id, user_id", count="exact").eq("group_id", group_id)
    resp = query.execute()
    return resp.count or 0


def update_membership_admin_status(
    group_id: str,
    user_id: str,
    is_admin: bool,
    access_token: Optional[str] = None,
) -> bool:
    """Update admin status of a group member"""
    table = _authenticated_table(access_token) if access_token else _table()
    try:
        resp = table.update({"is_admin": is_admin}).eq("group_id", group_id).eq("user_id", user_id).execute()
        return resp.data is not None
    except Exception as exc:
        logger.error("Update membership admin status failed: %s", exc)
        return False
