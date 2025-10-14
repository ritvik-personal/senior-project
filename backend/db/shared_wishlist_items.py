from typing import Any, Dict, List, Optional, Tuple
import logging

from app.database import get_supabase_client, get_authenticated_client

logger = logging.getLogger(__name__)


TABLE_NAME = "shared_wishlist_items"

def _table():
    return get_supabase_client().table(TABLE_NAME)

def _authed_table(access_token: str):
    return get_authenticated_client(access_token).table(TABLE_NAME)

def create_shared_wishlist_item(item_id: str, group_id: Optional[str], desirer_id: str, purchaser_id: str, item: str, notes: Optional[str] = None, purchased: Optional[bool] = None, access_token: Optional[str] = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "item_id": item_id,
        "group_id": group_id,
        "desirer": desirer_id,
        "purchaser": purchaser_id,
        "item": item,
    }
    if notes is not None:
        payload["notes"] = notes
    if purchased is not None:
        payload["purchased"] = purchased
    
    table = _authed_table(access_token) if access_token else _table()
    resp = table.insert(payload).execute()
    
    if resp.data:
        return resp.data[0]
    raise RuntimeError(f"Failed to insert shared wishlist item: {resp}")

def get_shared_wishlist_item_by_id(shared_wishlist_item_id: str) -> Optional[Dict[str, Any]]:
    query = _table().select("*").eq("item_id", shared_wishlist_item_id)
    resp = query.single().execute()
    return resp.data

def get_shared_wishlist_items_by_group_id(group_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("group_id", group_id)
    resp = query.execute()
    return resp.data

def get_shared_wishlist_items_by_desirer_id(desirer_id: str, access_token: Optional[str] = None) -> List[Dict[str, Any]]:
    table = _authed_table(access_token) if access_token else _table()
    query = table.select("*").eq("desirer", desirer_id)
    resp = query.execute()
    return resp.data

def get_shared_wishlist_items_by_purchaser_id(purchaser_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("purchaser", purchaser_id)
    resp = query.execute()
    return resp.data

def get_shared_wishlist_items_by_group_id_and_desirer_id(group_id: str, desirer_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("group_id", group_id).eq("desirer", desirer_id)
    resp = query.execute()
    return resp.data

def get_shared_wishlist_items_by_group_id_and_purchaser_id(group_id: str, purchaser_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("group_id", group_id).eq("purchaser", purchaser_id)
    resp = query.execute()
    return resp.data

def delete_shared_wishlist_item(shared_wishlist_item_id: str, access_token: Optional[str] = None) -> bool:
    table = _authed_table(access_token) if access_token else _table()
    resp = table.delete().eq("item_id", shared_wishlist_item_id).execute()
    return resp.data is not None and len(resp.data) > 0

def update_shared_wishlist_item(shared_wishlist_item_id: str, item: str) -> bool:
    resp = _table().update({"item": item}).eq("item_id", shared_wishlist_item_id).execute()
    return resp.data

def mark_wishlist_item_as_purchased(item_id: str, access_token: Optional[str] = None) -> bool:
    """Mark a wishlist item as purchased by updating the purchased flag to True"""
    table = _authed_table(access_token) if access_token else _table()
    resp = table.update({"purchased": True}).eq("item_id", item_id).execute()
    return resp.data is not None and len(resp.data) > 0




