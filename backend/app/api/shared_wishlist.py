from fastapi import APIRouter, HTTPException, Query, Path
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

router = APIRouter()

@router.post("/", response_model=SharedWishlistItemResponse)
async def create_shared_wishlist_item_endpoint(item: SharedWishlistItemCreate):
    """Create a new shared wishlist item"""
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
    desirer_id: str = Path(..., description="Desirer ID")
):
    """Get all shared wishlist items desired by a user"""
    items = get_shared_wishlist_items_by_desirer_id(desirer_id)
    item_responses = [SharedWishlistItemResponse(**item) for item in items]
    
    return SharedWishlistItemListResponse(items=item_responses)

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

