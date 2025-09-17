from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter()

# In-memory storage for demo purposes
users_db = []
user_id_counter = 1

@router.get("/users", response_model=List[UserResponse])
async def get_users():
    """Get all users"""
    return users_db

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    """Get user by ID"""
    user = next((user for user in users_db if user["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    """Create a new user"""
    global user_id_counter
    
    # Check if email already exists
    if any(u["email"] == user.email for u in users_db):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = {
        "id": user_id_counter,
        "email": user.email,
        "name": user.name,
        "is_active": user.is_active,
        "created_at": "2024-01-01T00:00:00Z",  # In real app, use datetime.utcnow()
        "updated_at": "2024-01-01T00:00:00Z"
    }
    
    users_db.append(new_user)
    user_id_counter += 1
    
    return new_user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate):
    """Update user by ID"""
    user_index = next((i for i, user in enumerate(users_db) if user["id"] == user_id), None)
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        users_db[user_index][field] = value
    
    users_db[user_index]["updated_at"] = "2024-01-01T00:00:00Z"  # In real app, use datetime.utcnow()
    
    return users_db[user_index]

@router.delete("/users/{user_id}")
async def delete_user(user_id: int):
    """Delete user by ID"""
    global users_db
    user_index = next((i for i, user in enumerate(users_db) if user["id"] == user_id), None)
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    users_db.pop(user_index)
    return {"message": "User deleted successfully"}
