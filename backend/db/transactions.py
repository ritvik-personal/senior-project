from typing import Any, Dict, List, Optional, Tuple
from datetime import date
import logging

from app.database import get_supabase_client

logger = logging.getLogger(__name__)


TABLE_NAME = "transactions"

def _table():
    return get_supabase_client().table(TABLE_NAME)

def create_transaction(group_id: str, user_owed: str, user_owing: str, amount: float) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "group_id": group_id,
        "user_owed": user_owed,
        "user_owing": user_owing,
        "amount": amount,
    }

    logger.debug("Inserting transaction payload=%s", payload)
    resp = _table().insert(payload).select("*").execute()
    if resp.data:
        return resp.data[0]
    raise RuntimeError(f"Failed to insert transaction: {resp}")

def get_transaction_by_id(transaction_id: int) -> Optional[Dict[str, Any]]:
    query = _table().select("*").eq("transaction_id", transaction_id)
    resp = query.single().execute()
    return resp.data

def get_transactions_by_group_id(group_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("group_id", group_id)
    resp = query.execute()
    return resp.data

def get_transactions_by_user_id(user_id: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("user_id", user_id)
    resp = query.execute()
    return resp.data

def get_transactions_by_user_owed(user_owed: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("user_owed", user_owed)
    resp = query.execute()
    return resp.data

def get_transactions_by_user_owing(user_owing: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("user_owing", user_owing)
    resp = query.execute()
    return resp.data

def delete_transaction(transaction_id: str) -> bool:
    resp = _table().delete().eq("transaction_id", transaction_id).execute()
    return resp.data

def update_transaction(transaction_id: str, user_owed: str, user_owing: str, amount: float) -> bool:
    resp = _table().update({"user_owed": user_owed, "user_owing": user_owing, "amount": amount}).eq("transaction_id", transaction_id).execute()
    return resp.data

def get_transactions_by_group_id_and_user_id(group_id: str, user_id: str) -> List[Dict[str, Any]]: 
    query = _table().select("*").eq("group_id", group_id).eq("user_id", user_id)
    resp = query.execute()
    return resp.data

def get_transactions_by_user_owed_and_user_owing(user_owed: str, user_owing: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("user_owed", user_owed).eq("user_owing", user_owing)
    resp = query.execute()
    return resp.data
