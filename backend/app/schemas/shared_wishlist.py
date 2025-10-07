from pydantic import BaseModel
from typing import List, Optional

class SharedWishlistItemBase(BaseModel):
    group_id: Optional[str] = None
    desirer: str
    purchaser: str
    item: str
    notes: Optional[str] = None
    purchased: Optional[bool] = None

class SharedWishlistItemCreate(SharedWishlistItemBase):
    item_id: str

class SharedWishlistItemUpdate(BaseModel):
    item: Optional[str] = None

class SharedWishlistItemResponse(SharedWishlistItemBase):
    item_id: str
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class SharedWishlistItemListResponse(BaseModel):
    items: List[SharedWishlistItemResponse]

