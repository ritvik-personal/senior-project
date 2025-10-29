from typing import Any, Dict, List, Optional, Tuple
from datetime import date, datetime, timedelta
import logging
from collections import defaultdict

from app.database import get_supabase_client, get_authenticated_client

logger = logging.getLogger(__name__)


TABLE_NAME = "transactions"

def _table():
    return get_supabase_client().table(TABLE_NAME)

def create_transaction(group_id: str, user_owed: str, user_owing: str, amount: float, notes: Optional[str] = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "group_id": group_id,
        "user_owed": user_owed,
        "user_owing": user_owing,
        "amount": amount,
    }
    if notes is not None:
        payload["notes"] = notes

    logger.debug("Inserting transaction payload=%s", payload)
    resp = _table().insert(payload).execute()
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

def update_transaction(transaction_id: str, user_owed: str, user_owing: str, amount: float, notes: Optional[str] = None) -> bool:
    update_data = {"user_owed": user_owed, "user_owing": user_owing, "amount": amount}
    if notes is not None:
        update_data["notes"] = notes
    resp = _table().update(update_data).eq("transaction_id", transaction_id).execute()
    return resp.data

def get_transactions_by_group_id_and_user_id(group_id: str, user_id: str) -> List[Dict[str, Any]]: 
    query = _table().select("*").eq("group_id", group_id).eq("user_id", user_id)
    resp = query.execute()
    return resp.data

def get_transactions_by_user_owed_and_user_owing(user_owed: str, user_owing: str) -> List[Dict[str, Any]]:
    query = _table().select("*").eq("user_owed", user_owed).eq("user_owing", user_owing)
    resp = query.execute()
    return resp.data

def get_grouped_transactions_for_user(user_id: str, group_ids: List[str]) -> Dict[str, Any]:
    """
    Get grouped transactions for a user across their groups.
    Groups transactions by created_at (within 1 second) and user_owed.
    Calculates totals and user balance.
    """
    if not group_ids:
        return {
            "transactions": [],
            "user_balance": 0.0,
            "groups": {}
        }
    
    # Get all transactions for the user's groups
    query = _table().select("*").in_("group_id", group_ids).order("created_at", desc=True)
    resp = query.execute()
    all_transactions = resp.data or []
    
    # Group transactions by created_at (within 1 second) and user_owed
    grouped_transactions = []
    processed_ids = set()
    
    for transaction in all_transactions:
        if transaction.get("transaction_id") in processed_ids:
            continue
            
        # Parse created_at timestamp
        created_at_str = transaction.get("created_at")
        if not created_at_str:
            continue
            
        try:
            if isinstance(created_at_str, str):
                created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            else:
                created_at = created_at_str
        except Exception as e:
            logger.error(f"Error parsing created_at: {e}")
            continue
        
        # Find all transactions within 1 second with same user_owed
        group_key = (
            transaction.get("group_id"),
            transaction.get("user_owed"),
            created_at.timestamp()
        )
        
        # Get all transactions in this group
        transaction_group = []
        user_owing_set = set()
        
        for t in all_transactions:
            if t.get("transaction_id") in processed_ids:
                continue
            if t.get("group_id") != transaction.get("group_id"):
                continue
            if t.get("user_owed") != transaction.get("user_owed"):
                continue
            
            t_created_at_str = t.get("created_at")
            if not t_created_at_str:
                continue
                
            try:
                if isinstance(t_created_at_str, str):
                    t_created_at = datetime.fromisoformat(t_created_at_str.replace('Z', '+00:00'))
                else:
                    t_created_at = t_created_at_str
            except Exception:
                continue
            
            # Check if within 1 second
            time_diff = abs((t_created_at - created_at).total_seconds())
            if time_diff <= 1.0:
                transaction_group.append(t)
                processed_ids.add(t.get("transaction_id"))
                if t.get("user_owing"):
                    user_owing_set.add(t.get("user_owing"))
        
        if not transaction_group:
            continue
        
        # Calculate total amount (amount * number of participants including user_owed)
        # Each transaction has amount per person, so total = amount * (count + 1)
        participant_count = len(user_owing_set)
        sample_transaction = transaction_group[0]
        amount_per_person = float(sample_transaction.get("amount", 0))
        total_amount = round(amount_per_person * (participant_count + 1), 2)
        
        # Get group info
        group_id = transaction.get("group_id")
        user_owed = transaction.get("user_owed")
        notes = sample_transaction.get("notes")  # Get notes from the sample transaction
        
        grouped_transaction = {
            "group_id": group_id,
            "user_owed": user_owed,
            "user_owing_list": list(user_owing_set),
            "amount_per_person": amount_per_person,
            "total_amount": total_amount,
            "participant_count": participant_count + 1,  # +1 for user_owed
            "created_at": created_at_str,
            "transaction_ids": [t.get("transaction_id") for t in transaction_group],
            "notes": notes  # Include notes in the grouped transaction
        }
        
        grouped_transactions.append(grouped_transaction)
    
    # Calculate user balance
    # Balance = (sum when user_owed = user_id) - (sum when user_owing = user_id)
    balance_owed = 0.0
    balance_owing = 0.0
    
    for transaction in all_transactions:
        amount = float(transaction.get("amount", 0))
        if transaction.get("user_owed") == user_id:
            balance_owed += amount
        if transaction.get("user_owing") == user_id:
            balance_owing += amount
    
    user_balance = round(balance_owed - balance_owing, 2)
    
    # Group transactions by group_id for easier frontend use
    transactions_by_group = defaultdict(list)
    for trans in grouped_transactions:
        transactions_by_group[trans["group_id"]].append(trans)
    
    return {
        "transactions": grouped_transactions,
        "transactions_by_group": dict(transactions_by_group),
        "user_balance": user_balance,
        "total_owed": round(balance_owed, 2),
        "total_owing": round(balance_owing, 2)
    }
