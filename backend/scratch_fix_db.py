import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy import text
from app.core.database import SessionLocal

db = SessionLocal()
db.execute(text("UPDATE projects SET labourers_count = 10 WHERE name = 'Colombo Infrastructure Complex'"))
db.commit()

result = db.execute(text("SELECT name, labourers_count FROM projects WHERE name = 'Colombo Infrastructure Complex'")).fetchone()
print(f"DB Result: {result}")
