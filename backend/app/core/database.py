from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine, text
from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

# Test database connection
try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        print("✅ Database connected successfully")
except Exception as e:
    print("❌ Database connection failed:", e)



