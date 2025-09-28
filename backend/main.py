from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, users, auth, expenses, groups, transactions, shared_wishlist
from app.config import settings
from app.database import test_connection
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI instance
app = FastAPI(
    title="CampusFin API",
    description="FastAPI backend for CampusFin - Financial Education Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(shared_wishlist.router, prefix="/api/shared-wishlist", tags=["shared-wishlist"])

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    logger.info("Starting CampusFin API...")
    if test_connection():
        logger.info("Database connection established")
    else:
        logger.warning("Database connection failed - check your Supabase configuration")

@app.get("/")
async def root():
    return {
        "message": "Welcome to Senior Project API",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
