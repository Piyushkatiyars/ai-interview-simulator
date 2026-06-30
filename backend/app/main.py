"""
AI Interview Simulator - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.connection import engine, Base
from app.api import auth, interviews, feedback, analytics
from app.utils.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
    yield
    # Shutdown
    print("🛑 Application shutting down")


app = FastAPI(
    title="AI Interview Simulator",
    description="A comprehensive AI-powered interview preparation platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["Interviews"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["Feedback"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - Health check"""
    return {
        "message": "AI Interview Simulator API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
