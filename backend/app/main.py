# backend/app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db, Base, engine
from app.core.config import settings
from app.api.v1.endpoints import users, auth, secrets
from sqlalchemy.sql import text 

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - update this for production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    users.router,
    prefix=f"{settings.API_V1_STR}/users",
    tags=["users"]
)

app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["auth"]
)

app.include_router(
    secrets.router,
    prefix=f"{settings.API_V1_STR}/secrets",
    tags=["secrets"]
)



@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }

@app.get("/db-health")
def database_health_check(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))
        result.scalar()  # Actually fetch the result
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": str(e)
        }

# Optional: Add example data for testing
@app.post("/test/init-db", tags=["testing"])
def initialize_test_data(db: Session = Depends(get_db)):
    """
    Initialize database with test data.
    Only available in development environment.
    """
    if settings.ENVIRONMENT != "development":
        return {"message": "This endpoint is only available in development mode"}

    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        return {"message": "Database initialized successfully"}
    except Exception as e:
        return {"message": f"Error initializing database: {str(e)}"}