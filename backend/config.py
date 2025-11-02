"""
Configuration for TestFlow AI backend
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Configuration class"""
    
    # Cerebras API
    CEREBRAS_API_KEY: Optional[str] = os.environ.get(
        "CEREBRAS_API_KEY"
    )
    
    # Model
    CEREBRAS_MODEL: str = "qwen-3-coder-480b"
    
    # API Server
    API_HOST: str = os.environ.get("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.environ.get("API_PORT", "8000"))
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # Database (for future use)
    DATABASE_URL: Optional[str] = os.environ.get("DATABASE_URL")
    SUPABASE_URL: Optional[str] = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.environ.get("SUPABASE_KEY")
    
    # Security
    UPLOAD_TOKEN: Optional[str] = os.environ.get("UPLOAD_TOKEN")
    
    # File upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: list = [".xml", ".json", ".txt", ".log"]

