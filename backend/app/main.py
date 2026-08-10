from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine
from .models import Base
from .routers import auth, devices, scans, logs

# Auto-create SQLite database tables on startup (MVP simplification)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NetGraph API",
    description="Intelligent Network Discovery & Topology Mapping platform API",
    version="1.0"
)

# Configure CORS Middleware
# Sets credentials=True so cookies can be passed from the React client.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(devices.router, prefix="/api")
app.include_router(scans.router, prefix="/api")
app.include_router(logs.router, prefix="/api")

@app.get("/api/health")
def health_check():
    """
    Generic API health check endpoint.
    """
    return {"status": "healthy", "service": "NetGraph API"}
