from typing import Any, Dict, List, Optional, Tuple
import logging

from app.database import get_supabase_client

logger = logging.getLogger(__name__)


TABLE_NAME = "groups"

def _table():
    return get_supabase_client().table(TABLE_NAME)

def create_group(name: str, user_id: str) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "group_name": name,
        "user_id": user_id,
    }
    resp = _table().insert(payload).select("*").execute()
    if resp.data:
        return resp.data[0]
    raise RuntimeError(f"Failed to insert group: {resp}")

def get_group_by_id(group_id: str) -> Optional[Dict[str, Any]]:
    query = _table().select("*").eq("group_id", group_id)
    resp = query.single().execute()
    return resp.data

def get_groups_by_user_id(user_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("user_id", user_id)
    resp = query.execute()
    return resp.data

def delete_group(group_id: str) -> bool:
    resp = _table().delete().eq("group_id", group_id).execute()
    return resp.data

def update_group(group_id: str, group_name: str) -> bool:
    resp = _table().update({"group_name": group_name}).eq("group_id", group_id).execute()
    return resp.data


def add_user_to_group(group_id: str, user_id: str) -> bool:
    resp = _table().insert({"group_id": group_id, "user_id": user_id}).execute()
    return resp.data

def remove_user_from_group(group_id: str, user_id: str) -> bool:
    resp = _table().delete("group_id", group_id).eq("user_id", user_id).execute()
    return resp.data
