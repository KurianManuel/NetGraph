import os
import secrets
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./netgraph.db"
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", secrets.token_hex(32))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    # Standard AES-256 base64-encoded default key for local encryption
    # In production, users should override this env variable.
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "bXlfdGVzdF9lbmNyeXB0aW9uX2tleV9mb3JfZGV2XzMyX2J5dGVzIQ==")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
