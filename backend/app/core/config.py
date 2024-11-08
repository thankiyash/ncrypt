from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Password Manager API"
    ENVIRONMENT: str = "development"
    
    # Database Settings
    POSTGRES_USER: str = "user"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_HOST: str = "localhost"  # Use "db" for docker-compose, "localhost" for local dev
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "password_manager"
    DATABASE_URL: str | None = None

    # JWT Settings (for future use)
    JWT_SECRET_KEY: str = "your-secret-key"  # Change this!
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Encryption Settings
    ENCRYPTION_KEY: str = "XVmODHt8s3Ah5dsfiNcQl9xwe1Oc17VPOgihyqkQvNc="  # Change this!
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """
        Assembles database URL from components or returns override URL
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Create a cached instance of settings
@lru_cache
def get_settings() -> Settings:
    return Settings()

# Export settings instance
settings = get_settings()