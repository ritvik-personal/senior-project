from pydantic import BaseModel
from typing import List, Optional

class SharedWishlistItemBase(BaseModel):
    group_id: str
    desirer_id: str
    purchaser_id: str
    item: str

class SharedWishlistItemCreate(SharedWishlistItemBase):
    item_id: str

class SharedWishlistItemUpdate(BaseModel):
    item: Optional[str] = None

class SharedWishlistItemResponse(SharedWishlistItemBase):
    shared_wishlist_item_id: str
    item_id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class SharedWishlistItemListResponse(BaseModel):
    items: List[SharedWishlistItemResponse]

