from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://finance_user:dev_password@localhost:5432/finance_tracker"
    ENV: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    model_config = {"env_file": ".env"}


settings = Settings()
