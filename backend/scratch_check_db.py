import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy import text
from app.core.database import SessionLocal

db = SessionLocal()
results = db.execute(text("SELECT name, labourers_count FROM projects")).fetchall()
for result in results:
    print(f"DB Result: {result}")
