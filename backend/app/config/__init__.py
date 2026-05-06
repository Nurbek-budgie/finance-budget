from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://finance_user:dev_password@localhost:5432/finance_tracker"
    ENV: str = "development"

    model_config = {"env_file": ".env"}


settings = Settings()
