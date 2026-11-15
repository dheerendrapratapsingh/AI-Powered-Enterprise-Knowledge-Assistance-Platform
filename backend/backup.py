"""
Database and FAISS Index Backup & Restore Utility for VIT-AP AI Copilot.

Usage:
  # Create a timestamped backup snapshot:
  python backup.py --create

  # List existing backup snapshots:
  python backup.py --list

  # Restore from a snapshot:
  python backup.py --restore backups/snapshot_20261115_232000.zip
"""

import os
import sys
import shutil
import zipfile
import sqlite3
import argparse
from datetime import datetime

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(BACKEND_DIR, "backups")
DB_PATH = os.path.join(BACKEND_DIR, "copilot.db")
INDEX_PATH = os.path.join(BACKEND_DIR, "data", "indexes", "vitap.index")
META_PATH = os.path.join(BACKEND_DIR, "data", "indexes", "vitap_metadata.json")


def ensure_backup_dir():
    os.makedirs(BACKUP_DIR, exist_ok=True)


def create_backup():
    ensure_backup_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"snapshot_{timestamp}.zip"
    archive_path = os.path.join(BACKUP_DIR, archive_name)

    print(f"[*] Starting backup snapshot: {archive_name}")

    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        # 1. Backup SQLite database safely using SQLite backup API
        if os.path.exists(DB_PATH):
            temp_db = os.path.join(BACKUP_DIR, f"temp_{timestamp}.db")
            try:
                src_conn = sqlite3.connect(DB_PATH)
                dest_conn = sqlite3.connect(temp_db)
                with dest_conn:
                    src_conn.backup(dest_conn)
                src_conn.close()
                dest_conn.close()
                zipf.write(temp_db, arcname="copilot.db")
                os.remove(temp_db)
                print(f"  [+] Included copilot.db")
            except Exception as e:
                print(f"  [!] Direct copy fallback for database: {e}")
                zipf.write(DB_PATH, arcname="copilot.db")

        # 2. Backup FAISS Index
        if os.path.exists(INDEX_PATH):
            zipf.write(INDEX_PATH, arcname="data/indexes/vitap.index")
            print(f"  [+] Included FAISS vector index (vitap.index)")

        # 3. Backup FAISS Metadata
        if os.path.exists(META_PATH):
            zipf.write(META_PATH, arcname="data/indexes/vitap_metadata.json")
            print(f"  [+] Included vector metadata (vitap_metadata.json)")

    size_mb = os.path.getsize(archive_path) / (1024 * 1024)
    print(f"[SUCCESS] Backup snapshot created: {archive_path} ({size_mb:.2f} MB)")
    return archive_path


def list_backups():
    ensure_backup_dir()
    backups = [f for f in os.listdir(BACKUP_DIR) if f.endswith(".zip")]
    backups.sort(reverse=True)
    if not backups:
        print("[i] No backups found in backups/ directory.")
        return

    print(f"\n--- Available Backups ({len(backups)}) ---")
    for b in backups:
        path = os.path.join(BACKUP_DIR, b)
        size_mb = os.path.getsize(path) / (1024 * 1024)
        mtime = datetime.fromtimestamp(os.path.getmtime(path)).strftime("%Y-%m-%d %H:%M:%S")
        print(f"  * {b}  [{size_mb:.2f} MB]  (Created: {mtime})")


def restore_backup(archive_path: str):
    if not os.path.exists(archive_path):
        # Check in default backup directory
        candidate = os.path.join(BACKUP_DIR, archive_path)
        if os.path.exists(candidate):
            archive_path = candidate
        else:
            print(f"[ERROR] Backup archive not found: {archive_path}")
            return False

    print(f"[*] Restoring from snapshot: {archive_path}")
    with zipfile.ZipFile(archive_path, "r") as zipf:
        zipf.extractall(BACKEND_DIR)
    print(f"[SUCCESS] Successfully restored database and vector indices from snapshot.")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backup and Restore utility for VIT-AP AI Copilot")
    parser.add_argument("--create", action="store_true", help="Create a timestamped backup snapshot")
    parser.add_argument("--list", action="store_true", help="List all available backups")
    parser.add_argument("--restore", type=str, help="Restore from a specified backup archive")

    args = parser.parse_args()

    if args.create:
        create_backup()
    elif args.list:
        list_backups()
    elif args.restore:
        restore_backup(args.restore)
    else:
        create_backup()
