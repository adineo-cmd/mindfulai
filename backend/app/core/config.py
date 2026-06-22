from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Modern Pydantic V2 syntax
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore" # Ignore extra env vars that aren't defined here
    )

    # Database
    DATABASE_URL: str = "sqlite:///./mindfulai.db"
    
    # Security
    SECRET_KEY: str = "super-secret-key-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    FRONTEND_URL: str = "http://localhost:4321"
    
    # Open Source LLM Configuration (Ollama)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "tinyllama"  # Matches what you have installed

    # REMOVED: OPENAI_API_KEY (since we are 100% open source now)

settings = Settings()