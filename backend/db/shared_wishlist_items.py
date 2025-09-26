from typing import Any, Dict, List, Optional, Tuple
import logging

from app.database import get_supabase_client

logger = logging.getLogger(__name__)


TABLE_NAME = "shared_wishlist_items"

def _table():
    return get_supabase_client().table(TABLE_NAME)

def create_shared_wishlist_item(item_id: str, group_id: str, desirer_id: str, purchaser_id: str, item:str) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "item_id": item_id,
        "group_id": group_id,
        "desirer_id": desirer_id,
        "purchaser_id": purchaser_id,
        "item": item,
    }
    resp = _table().insert(payload).select("*").execute()
    if resp.data:
        return resp.data[0]
    raise RuntimeError(f"Failed to insert shared wishlist item: {resp}")

def get_shared_wishlist_item_by_id(shared_wishlist_item_id: str) -> Optional[Dict[str, Any]]:
    query = _table().select("*").eq("shared_wishlist_item_id", shared_wishlist_item_id)
    resp = query.single().execute()
    return resp.data

def get_shared_wishlist_items_by_group_id(group_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("group_id", group_id)
    resp = query.execute()
    return resp.data

def get_shared_wishlist_items_by_desirer_id(desirer_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("desirer_id", desirer_id)
    resp = query.execute()
    return resp.data

def get_shared_wishlist_items_by_purchaser_id(purchaser_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("purchaser_id", purchaser_id)
    resp = query.execute()
    return resp.data

def get_shared_wishlist_items_by_group_id_and_desirer_id(group_id: str, desirer_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("group_id", group_id).eq("desirer_id", desirer_id)
    resp = query.execute()
    return resp.data

def get_shared_wishlist_items_by_group_id_and_purchaser_id(group_id: str, purchaser_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("group_id", group_id).eq("purchaser_id", purchaser_id)
    resp = query.execute()
    return resp.data

def delete_shared_wishlist_item(shared_wishlist_item_id: str) -> bool:
    resp = _table().delete().eq("shared_wishlist_item_id", shared_wishlist_item_id).execute()
    return resp.data

def update_shared_wishlist_item(shared_wishlist_item_id: str, item: str) -> bool:
    resp = _table().update({"item": item}).eq("shared_wishlist_item_id", shared_wishlist_item_id).execute()
    return resp.data




