from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, users
import uvicorn

# Create FastAPI instance
app = FastAPI(
    title="Senior Project API",
    description="FastAPI backend for senior project",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # Alternative port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(users.router, prefix="/api", tags=["users"])

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
