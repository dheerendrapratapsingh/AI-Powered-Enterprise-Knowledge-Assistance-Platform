import sqlite3
import json
import os
from app.utils.security import get_password_hash

VIT_ORG_ID = "cfb91311-2e8c-40bb-a1a0-c3e751c3bd96"
SRM_ORG_ID = "1fbb9089-d711-40ed-83a2-809037d0ee92"

for db_path in ["backend/copilot.db", "copilot.db"]:
    if not os.path.exists(db_path):
        continue
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # 1. Update all documents with NULL organization_id to VIT-AP
    c.execute("UPDATE documents SET organization_id = ? WHERE organization_id IS NULL", (VIT_ORG_ID,))
    print(f"Updated {c.rowcount} documents to VIT-AP in {db_path}")

    # 2. Ensure SRM organization domain is 'srm.ac.in'
    c.execute("UPDATE organizations SET domain = 'srm.ac.in' WHERE id = ?", (SRM_ORG_ID,))

    # 3. Create demo SRM student and demo SRM org admin if they don't exist
    c.execute("SELECT id FROM users WHERE email = 'student@srm.ac.in'")
    if not c.fetchone():
        srm_student_pwd = get_password_hash("student123")
        c.execute("""
            INSERT INTO users (id, name, email, password_hash, role, student_id, organization_id)
            VALUES ('srm-demo-student-id', 'SRM Student', 'student@srm.ac.in', ?, 'STUDENT', 'AP22110010123', ?)
        """, (srm_student_pwd, SRM_ORG_ID))
        print(f"Created student@srm.ac.in in {db_path}")

    c.execute("SELECT id FROM users WHERE email = 'org@srm.ac.in'")
    if not c.fetchone():
        srm_admin_pwd = get_password_hash("org123")
        c.execute("""
            INSERT INTO users (id, name, email, password_hash, role, organization_id)
            VALUES ('srm-demo-admin-id', 'SRM Administrator', 'org@srm.ac.in', ?, 'ORG_ADMIN', ?)
        """, (srm_admin_pwd, SRM_ORG_ID))
        print(f"Created org@srm.ac.in in {db_path}")

    conn.commit()
    conn.close()

print("Migration completed successfully.")
