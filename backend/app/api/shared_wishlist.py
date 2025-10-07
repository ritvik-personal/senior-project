from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import List

from db.shared_wishlist_items import (
    create_shared_wishlist_item,
    get_shared_wishlist_item_by_id,
    get_shared_wishlist_items_by_group_id,
    get_shared_wishlist_items_by_desirer_id,
    get_shared_wishlist_items_by_purchaser_id,
    get_shared_wishlist_items_by_group_id_and_desirer_id,
    get_shared_wishlist_items_by_group_id_and_purchaser_id,
    delete_shared_wishlist_item,
    update_shared_wishlist_item
)
from app.schemas.shared_wishlist import (
    SharedWishlistItemCreate,
    SharedWishlistItemUpdate,
    SharedWishlistItemResponse,
    SharedWishlistItemListResponse
)
from app.utils.auth import get_current_user_id, get_access_token

router = APIRouter()

@router.post("/", response_model=SharedWishlistItemResponse)
async def create_shared_wishlist_item_endpoint(item: SharedWishlistItemCreate):
    """Create a new shared wishlist item (legacy explicit fields)"""
    try:
        result = create_shared_wishlist_item(
            item_id=item.item_id,
            group_id=item.group_id,
            desirer_id=item.desirer_id,
            purchaser_id=item.purchaser_id,
            item=item.item
        )
        return SharedWishlistItemResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/personal", response_model=SharedWishlistItemResponse)
async def create_personal_wishlist_item_endpoint(
    payload: dict,
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token),
):
    """Create a personal wishlist item using bearer token for user id.

    Expects JSON with: { item_id, item, notes? }
    - group_id is set to NULL
    - desirer_id and purchaser_id set to current user id
    - purchased set to false
    """
    try:
        item_id = (payload or {}).get("item_id")
        item_name = (payload or {}).get("item")
        notes = (payload or {}).get("notes")
        if not item_id or not item_name:
            raise HTTPException(status_code=400, detail="item_id and item are required")

        result = create_shared_wishlist_item(
            item_id=item_id,
            group_id=None,
            desirer_id=current_user_id,
            purchaser_id=current_user_id,
            item=item_name,
            notes=notes,
            purchased=False,
            access_token=access_token,
        )
        return SharedWishlistItemResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{shared_wishlist_item_id}", response_model=SharedWishlistItemResponse)
async def get_shared_wishlist_item_endpoint(
    shared_wishlist_item_id: str = Path(..., description="Shared wishlist item ID")
):
    """Get a shared wishlist item by ID"""
    result = get_shared_wishlist_item_by_id(shared_wishlist_item_id)
    if not result:
        raise HTTPException(status_code=404, detail="Shared wishlist item not found")
    return SharedWishlistItemResponse(**result)

@router.get("/group/{group_id}", response_model=SharedWishlistItemListResponse)
async def get_shared_wishlist_items_by_group_endpoint(
    group_id: str = Path(..., description="Group ID")
):
    """Get all shared wishlist items for a group"""
    items = get_shared_wishlist_items_by_group_id(group_id)
    item_responses = [SharedWishlistItemResponse(**item) for item in items]
    
    return SharedWishlistItemListResponse(items=item_responses)

@router.get("/desirer/{desirer_id}", response_model=SharedWishlistItemListResponse)
async def get_shared_wishlist_items_by_desirer_endpoint(
    desirer_id: str = Path(..., description="Desirer ID"),
    access_token: str = Depends(get_access_token),
):
    """Get all shared wishlist items desired by a user"""
    items = get_shared_wishlist_items_by_desirer_id(desirer_id, access_token)
    item_responses = [SharedWishlistItemResponse(**item) for item in items]
    
    return SharedWishlistItemListResponse(items=item_responses)

@router.get("/personal", response_model=SharedWishlistItemListResponse)
async def get_my_personal_wishlist_items_endpoint(
    current_user_id: str = Depends(get_current_user_id),
    access_token: str = Depends(get_access_token),
):
    """Get all personal wishlist items for the current user (desirer == user, group_id is null)"""
    try:
        items = get_shared_wishlist_items_by_desirer_id(current_user_id, access_token)
        # Filter to personal only (group_id is null)
        items = [i for i in (items or []) if i.get("group_id") is None]
        return SharedWishlistItemListResponse(items=[SharedWishlistItemResponse(**i) for i in items])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/purchaser/{purchaser_id}", response_model=SharedWishlistItemListResponse)
async def get_shared_wishlist_items_by_purchaser_endpoint(
    purchaser_id: str = Path(..., description="Purchaser ID")
):
    """Get all shared wishlist items purchased by a user"""
    items = get_shared_wishlist_items_by_purchaser_id(purchaser_id)
    item_responses = [SharedWishlistItemResponse(**item) for item in items]
    
    return SharedWishlistItemListResponse(items=item_responses)

@router.get("/group/{group_id}/desirer/{desirer_id}", response_model=SharedWishlistItemListResponse)
async def get_shared_wishlist_items_by_group_and_desirer_endpoint(
    group_id: str = Path(..., description="Group ID"),
    desirer_id: str = Path(..., description="Desirer ID")
):
    """Get all shared wishlist items for a specific group and desirer"""
    items = get_shared_wishlist_items_by_group_id_and_desirer_id(group_id, desirer_id)
    item_responses = [SharedWishlistItemResponse(**item) for item in items]
    
    return SharedWishlistItemListResponse(items=item_responses)

@router.get("/group/{group_id}/purchaser/{purchaser_id}", response_model=SharedWishlistItemListResponse)
async def get_shared_wishlist_items_by_group_and_purchaser_endpoint(
    group_id: str = Path(..., description="Group ID"),
    purchaser_id: str = Path(..., description="Purchaser ID")
):
    """Get all shared wishlist items for a specific group and purchaser"""
    items = get_shared_wishlist_items_by_group_id_and_purchaser_id(group_id, purchaser_id)
    item_responses = [SharedWishlistItemResponse(**item) for item in items]
    
    return SharedWishlistItemListResponse(items=item_responses)

@router.put("/{shared_wishlist_item_id}", response_model=SharedWishlistItemResponse)
async def update_shared_wishlist_item_endpoint(
    shared_wishlist_item_id: str = Path(..., description="Shared wishlist item ID"),
    item_update: SharedWishlistItemUpdate = None
):
    """Update a shared wishlist item"""
    if not item_update or not item_update.item:
        raise HTTPException(status_code=400, detail="Item description is required for update")
    
    success = update_shared_wishlist_item(shared_wishlist_item_id, item_update.item)
    if not success:
        raise HTTPException(status_code=404, detail="Shared wishlist item not found or update failed")
    
    # Return updated item
    result = get_shared_wishlist_item_by_id(shared_wishlist_item_id)
    if not result:
        raise HTTPException(status_code=404, detail="Shared wishlist item not found after update")
    
    return SharedWishlistItemResponse(**result)

@router.delete("/{shared_wishlist_item_id}")
async def delete_shared_wishlist_item_endpoint(
    shared_wishlist_item_id: str = Path(..., description="Shared wishlist item ID")
):
    """Delete a shared wishlist item"""
    success = delete_shared_wishlist_item(shared_wishlist_item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Shared wishlist item not found or deletion failed")
    
    return {"message": "Shared wishlist item deleted successfully"}

