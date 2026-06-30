"""
Application Configuration Settings
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Any
import os
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "AI Interview Simulator"
    DEBUG: bool = False
    
    # Database - AWS RDS MySQL
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "password"
    DB_NAME: str = "interview_simulator"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OpenAI API
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v
    
    # Bcrypt
    BCRYPT_ROUNDS: int = 12
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()