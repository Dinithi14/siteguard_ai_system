import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy import text
from app.core.database import SessionLocal

db = SessionLocal()
results = db.execute(text("SELECT name, start_date, expected_end_date FROM projects WHERE name LIKE '%Kandy%'")).fetchall()
for result in results:
    print(f"DB Result: {result}")
