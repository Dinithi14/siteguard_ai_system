from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "SiteGuard AI"

    DATABASE_URL: str

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]

    # JWT Configuration
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True
    EMAIL_OTP_EXPIRE_MINUTES: int = 2

    # ML Configuration
    MODEL_DIR: str = "app/ml/model"
    DATASET_PATH: str = "app/data/dataset.csv"

    CATEGORICAL_COLS: list[str] = [
        "project_type",
        "project_size",
        "material_availability",
        "weather_condition",
    ]

    NUMERIC_COLS: list[str] = [
        "planned_duration",
        "contract_value_lkr",
        "labourers_count",
    ]

    FEATURE_COLS: list[str] = [
        "project_type",
        "project_size",
        "material_availability",
        "weather_condition",
        "planned_duration",
        "contract_value_lkr",
        "labourers_count",
    ]

    class Config:
        env_file = ".env"


settings = Settings()