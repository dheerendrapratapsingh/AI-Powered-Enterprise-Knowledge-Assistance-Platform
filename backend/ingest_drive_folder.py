import os
import sys
import uuid
import shutil
from typing import Tuple

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import SessionLocal
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.models.user import User
from app.models.organization import Organization
from app.services.ingestion.pipeline import IngestionService
from app.rag.retriever import index_manager

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOADS_DIR = os.path.join(BASE_DIR, "data", "drive_downloads")
DOCS_DIR = os.path.join(BASE_DIR, "data", "documents")
os.makedirs(DOCS_DIR, exist_ok=True)

def categorize_and_name_document(filename: str) -> Tuple[str, str, str]:
    """
    Returns (clean_title, category, department) based on university document taxonomy.
    """
    f_lower = filename.lower()
    base_name = os.path.splitext(filename)[0]

    # Clean plus signs and extra formatting
    clean_base = base_name.replace("+", " ").replace("-", " ").strip()

    # 1. Academic Syllabi & Curriculum
    if any(k in f_lower for k in [
        "b.tech", "b.sc", "b.com", "bba", "m.tech", "dual degree", "curriculum",
        "ecm", "eee", "ece", "mechanical", "biotechnology", "csbs", "aiml",
        "blockchain", "cyber security", "data analytics", "software engineering",
        "applied statistics", "psychology"
    ]):
        category = "Academic Syllabi"
        if any(k in f_lower for k in ["cse", "csbs", "aiml", "blockchain", "cyber", "data analytics", "software engineering", "m.tech-cse", "m.tech-se"]):
            dept = "School of Computer Science and Engineering (SCOPE)"
        elif any(k in f_lower for k in ["ece", "vlsi", "embedded", "eee", "ecm"]):
            dept = "School of Electronics Engineering (SENSE)"
        elif "mechanical" in f_lower:
            dept = "School of Mechanical Engineering (SMEC)"
        elif "biotechnology" in f_lower:
            dept = "Department of Biotechnology"
        elif any(k in f_lower for k in ["b.com", "bba"]):
            dept = "VIT-AP School of Business (VSB)"
        elif any(k in f_lower for k in ["b.sc", "psychology", "statistics", "data science"]):
            dept = "School of Advanced Sciences (SAS)"
        elif "dual degree" in f_lower or "b.a" in f_lower:
            dept = "School of Social Sciences and Humanities (VISH)"
        else:
            dept = "Office of Academic Affairs"

        title = clean_base.title()
        if "Vitap" in title:
            title = title.replace("Vitap", "VIT-AP")
        if "B.Tech" not in title and "B. Tech" in title:
            title = title.replace("B. Tech", "B.Tech")
        return title, category, dept

    # 2. Hostel & Residential Life
    if any(k in f_lower for k in ["hostel", "hostellers", "affidavit", "day-scholars", "day scholars", "curfew", "mhcode"]):
        category = "Hostel & Residential Life"
        dept = "Office of the Chief Warden & Hostel Administration"
        title = clean_base.title()
        if "Vit Ap" in title or "Vitap" in title:
            title = title.replace("Vit Ap", "VIT-AP").replace("Vitap", "VIT-AP")
        if "Mhcodeofconduct" in title:
            title = "Men's Hostel Code of Conduct (VIT-AP)"
        elif "Ladies Hostel" in title:
            title = "Ladies Hostel Rules and Regulations Handbook"
        elif "Final Hostellers Affidavit" in title:
            title = "Hosteller Rules Affidavit & Undertaking 2026-27"
        elif "Day Scholars Affidavit" in title:
            title = "Day Scholars Transport & Conduct Affidavit"
        return title, category, dept

    # 3. Placements & Career
    if "placement" in f_lower:
        category = "Placements & Career"
        dept = "Career Development Centre (CDC)"
        title = clean_base.title()
        return title, category, dept

    # 4. Campus Transport
    if "bus" in f_lower:
        category = "Campus Transport & Routes"
        dept = "University Transport Department"
        title = f"{clean_base.title()} Route Schedule & Stops"
        return title, category, dept

    # 5. Faculty & Staff Directory
    if "faculty" in f_lower or "contact" in f_lower:
        category = "Faculty & Administration"
        dept = "Deanery of Academics & SCOPE"
        title = "VIT-AP Faculty Directory & Contact Information"
        return title, category, dept

    # 6. Student Regulations & Campus Policies
    if any(k in f_lower for k in [
        "academic regulations", "regulations", "ethics", "anti-ragging", "ragging",
        "welfare", "attendance relaxation", "admission", "startup", "incubation"
    ]):
        category = "Student Regulations"
        if "attendance relaxation" in f_lower:
            dept = "Office of Academic Affairs (Attendance & Condonation)"
            title = clean_base.title()
        elif "anti-ragging" in f_lower:
            dept = "Anti-Ragging & Disciplinary Committee"
            title = "VIT-AP Anti-Ragging Policy & Directives"
        elif "ethics" in f_lower:
            dept = "University Disciplinary Committee"
            title = "VIT-AP Code of Ethics & Professional Conduct"
        elif "welfare" in f_lower:
            dept = "Department of Student Welfare (DSW)"
            title = "VIT-AP Student Welfare Policy"
        elif "admission" in f_lower:
            dept = "Office of Admissions"
            title = "VIT-AP University Admission Policy & Guidelines"
        elif "startup" in f_lower or "incubation" in f_lower:
            dept = "VIT-AP Innovation & Incubation Centre (VINC)"
            title = "VIT-AP Startup & Incubation Policy"
        elif "academic" in f_lower:
            dept = "Office of Academic Affairs"
            title = "VIT-AP Academic Regulations & FFCS Credit Guidelines"
        else:
            dept = "University Administration"
            title = clean_base.title()
        return title, category, dept

    # Fallback
    return clean_base.title(), "General Institutional", "University Administration"

def run_ingestion():
    db = SessionLocal()
    try:
        # Find an admin user to attribute upload
        admin_user = db.query(User).filter(User.role.in_(["ADMIN", "ORG_ADMIN"])).first()
        admin_id = admin_user.id if admin_user else None

        # Find organization
        org = db.query(Organization).filter(Organization.slug == "vitap").first()
        org_id = org.id if org else None

        all_files = sorted(os.listdir(DOWNLOADS_DIR))
        print(f"==================================================")
        print(f"Starting Manual Ingestion for {len(all_files)} Drive Documents")
        print(f"Source Folder: {DOWNLOADS_DIR}")
        print(f"Target Directory: {DOCS_DIR}")
        print(f"==================================================")

        success_count = 0
        duplicate_count = 0
        fail_count = 0

        for idx, filename in enumerate(all_files, 1):
            src_path = os.path.join(DOWNLOADS_DIR, filename)
            if not os.path.isfile(src_path):
                continue

            file_ext = os.path.splitext(filename)[1].lower()
            title, category, dept = categorize_and_name_document(filename)

            # Generate target path
            safe_filename = f"{uuid.uuid4()}{file_ext}"
            dest_path = os.path.join(DOCS_DIR, safe_filename)
            shutil.copy2(src_path, dest_path)

            print(f"\n[{idx}/{len(all_files)}] Ingesting: {filename}")
            print(f"   Title:    {title}")
            print(f"   Category: {category}")
            print(f"   Dept:     {dept}")

            doc = Document(
                id=str(uuid.uuid4()),
                name=title,
                filename=filename,
                category=category,
                department=dept,
                source_type="manual",
                version="2025.1",
                access_level="STUDENT",
                file_path=dest_path,
                uploaded_by=admin_id,
                organization_id=org_id,
                status="PENDING",
                is_active=True
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            try:
                res = IngestionService.ingest_file(doc_id=doc.id, file_path=dest_path, db=db)
                if res.success:
                    if res.is_duplicate:
                        print(f"   => DEDUPLICATED ({res.chunk_count} existing chunks reused)")
                        duplicate_count += 1
                    else:
                        print(f"   => SUCCESS: {res.chunk_count} chunks embedded & indexed")
                        success_count += 1
                else:
                    print(f"   => FAILED: {res.message}")
                    fail_count += 1
            except Exception as e:
                print(f"   => ERROR during ingestion: {e}")
                doc.status = "FAILED"
                doc.error_message = str(e)
                db.commit()
                fail_count += 1

        print("\n==================================================")
        print("INGESTION COMPLETE SUMMARY:")
        print(f"  Successfully Indexed: {success_count}")
        print(f"  Deduplicated:         {duplicate_count}")
        print(f"  Failed:               {fail_count}")
        print(f"  Total Chunks in DB:   {db.query(DocumentChunk).count()}")
        print(f"  Total FAISS Vectors:  {index_manager.index.ntotal}")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_ingestion()
