from typing import Any, Dict, List, Optional, Tuple
from datetime import date, datetime
import logging
import uuid

from app.database import get_supabase_client, get_authenticated_client

logger = logging.getLogger(__name__)

TABLE_NAME = "group_information"


def _table():
    return get_supabase_client().table(TABLE_NAME)


def _authenticated_table(access_token: str):
    return get_authenticated_client(access_token).table(TABLE_NAME)


def _map_group_info_fields(group_data: Dict[str, Any]) -> Dict[str, Any]:
    """Map database fields to schema fields"""
    return {
        "group_id": str(group_data.get("group_id", "")),
        "group_name": group_data.get("group_name"),
        "group_code": group_data.get("group_code"),
        "group_description": group_data.get("group_description"),
        "created_by": group_data.get("created_by"),
        "created_at": group_data.get("created_at"),
    }


def create_group_information(
    group_name: str,
    group_code: str,
    created_by: str,
    group_description: Optional[str] = None,
    access_token: Optional[str] = None,
    created_at: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Create a new group information entry"""
    # Generate a unique group_id
    group_id = str(uuid.uuid4())
    
    payload: Dict[str, Any] = {
        "group_id": group_id,
        "group_name": group_name,
        "group_code": group_code,
        "group_description": group_description,
        "created_by": created_by,
    }
    
    if created_at is not None:
        payload["created_at"] = created_at.isoformat()
    else:
        payload["created_at"] = datetime.utcnow().isoformat()

    logger.debug("Inserting group information payload=%s", payload)
    
    # Use authenticated client if token is provided
    if access_token:
        resp = _authenticated_table(access_token).insert(payload).execute()
    else:
        resp = _table().insert(payload).execute()
        
    if resp.data:
        group_data = resp.data[0]
        logger.debug("Database returned: %s", group_data)
        return _map_group_info_fields(group_data)
    raise RuntimeError(f"Failed to insert group information: {resp}")


def get_group_by_id(group_id: str, access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Get group information by group_id"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("*").eq("group_id", group_id)
    resp = query.single().execute()
    if resp.data:
        return _map_group_info_fields(resp.data)
    return None


def get_group_by_code(group_code: str, access_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Get group information by group_code"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("*").eq("group_code", group_code)
    resp = query.execute()
    
    if resp.data and len(resp.data) > 0:
        return _map_group_info_fields(resp.data[0])
    return None


def get_groups_by_creator(created_by: str, access_token: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all groups created by a specific user"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("*").eq("created_by", created_by)
    resp = query.execute()
    if resp.data:
        return [_map_group_info_fields(group) for group in resp.data]
    return []


def list_all_groups(
    limit: int = 100,
    offset: int = 0,
    order_desc: bool = True,
    access_token: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List all groups with pagination"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("*")
    
    order_col = "created_at"
    query = query.order(order_col, desc=order_desc)
    
    if offset:
        query = query.range(offset, offset + max(0, limit - 1))
    else:
        query = query.limit(limit)
        
    resp = query.execute()
    if resp.data:
        return [_map_group_info_fields(group) for group in resp.data]
    return []


def update_group_information(
    group_id: str,
    updates: Dict[str, Any],
    access_token: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Update group information"""
    clean_updates: Dict[str, Any] = {}
    for key, value in updates.items():
        if key in {"group_name", "group_code", "group_description"}:
            clean_updates[key] = value
        elif key == "created_at":
            if isinstance(value, datetime):
                clean_updates[key] = value.isoformat()
            elif isinstance(value, str):
                clean_updates[key] = value

    if not clean_updates:
        return get_group_by_id(group_id)

    table = _authenticated_table(access_token) if access_token else _table()
    try:
        resp = table.update(clean_updates).eq("group_id", group_id).execute()
        if resp.data:
            return _map_group_info_fields(resp.data[0])
        return None
    except Exception as exc:
        logger.error("Update group information failed: %s", exc)
        return None


def delete_group_information(
    group_id: str,
    access_token: Optional[str] = None,
) -> bool:
    """Delete group information"""
    table = _authenticated_table(access_token) if access_token else _table()
    resp = table.delete().eq("group_id", group_id).execute()
    # If RLS disallows returning rows on delete, data may be None even when successful
    if isinstance(resp.data, list):
        return len(resp.data) > 0
    return True


def check_group_code_exists(group_code: str, access_token: Optional[str] = None) -> bool:
    """Check if a group code already exists"""
    table = _authenticated_table(access_token) if access_token else _table()
    query = table.select("group_code").eq("group_code", group_code)
    resp = query.execute()
    return len(resp.data or []) > 0
