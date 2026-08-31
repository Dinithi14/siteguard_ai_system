import sys
import os
import datetime
sys.path.append(os.getcwd())
from sqlalchemy import text
from app.core.database import SessionLocal

db = SessionLocal()
db.execute(text("UPDATE projects SET start_date = '2026-09-01', expected_end_date = '2026-09-30' WHERE name = 'Kandy Small Residence'"))
db.commit()

result = db.execute(text("SELECT name, start_date, expected_end_date FROM projects WHERE name = 'Kandy Small Residence'")).fetchone()
print(f"Updated DB Result: {result}")
