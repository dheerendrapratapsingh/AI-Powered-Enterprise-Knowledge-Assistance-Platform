import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "copilot.db")
print(f"Connecting to {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cols = [r[1] for r in cursor.execute("PRAGMA table_info(documents)").fetchall()]
print("Current columns in documents:", cols)

needed_cols = [
    ("source_url", "TEXT"),
    ("content_hash", "TEXT"),
    ("is_active", "INTEGER DEFAULT 1"),
    ("error_message", "TEXT"),
    ("organization_id", "TEXT"),
    ("access_level", "TEXT DEFAULT 'STUDENT'")
]

for col_name, col_type in needed_cols:
    if col_name not in cols:
        print(f"Adding column {col_name} ({col_type})...")
        cursor.execute(f"ALTER TABLE documents ADD COLUMN {col_name} {col_type}")

conn.commit()

cols_after = [r[1] for r in cursor.execute("PRAGMA table_info(documents)").fetchall()]
print("Columns in documents after migration:", cols_after)
conn.close()
