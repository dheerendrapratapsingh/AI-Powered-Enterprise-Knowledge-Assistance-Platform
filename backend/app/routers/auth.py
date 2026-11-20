from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.database.connection import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import UserCreate, UserLogin, Token, UserOut
from app.utils.security import verify_password, get_password_hash, create_access_token, ALGORITHM
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "ORG_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

def require_student(current_user: User = Depends(get_current_user)):
    if current_user.role != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    return current_user

from typing import Optional

def find_matching_org(email: str, db: Session) -> Optional[Organization]:
    if "@" not in email:
        return None
    domain = email.split("@")[1].strip().lower()
    
    # 1. Exact match on domain
    matched = db.query(Organization).filter(Organization.domain.isnot(None)).filter(
        Organization.domain.ilike(domain)
    ).first()
    if matched:
        return matched

    # 2. Suffix or Subdomain match (e.g., student.vitap.ac.in -> vitap.ac.in)
    all_orgs = db.query(Organization).filter(Organization.domain.isnot(None)).all()
    for org in all_orgs:
        org_d = (org.domain or "").strip().lower()
        if not org_d:
            continue
        if domain == org_d or domain.endswith("." + org_d) or org_d.endswith("." + domain):
            return org
        # Institutional common domain stems (vit, srm)
        if "srm" in domain and "srm" in org_d:
            return org
        if "vit" in domain and "vit" in org_d:
            return org

    return None

@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    target_role = (user_in.role or "STUDENT").upper()
    org_id = user_in.organization_id
    matched_org = find_matching_org(email_clean, db)

    if target_role != "ADMIN":
        if not matched_org:
            domain_part = email_clean.split("@")[1] if "@" in email_clean else email_clean
            raise HTTPException(
                status_code=400,
                detail=f"Registration restricted: Email domain '@{domain_part}' does not match any provisioned organization. Please use your official university email."
            )
        org_id = matched_org.id

    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        name=user_in.name,
        email=email_clean,
        password_hash=hashed_password,
        role=target_role,
        student_id=user_in.student_id,
        organization_id=org_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    email_clean = user_in.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Sync / Validate Organization Domain Mapping for Students & Org Admins
    if user.role != "ADMIN":
        matched_org = find_matching_org(email_clean, db)
        if matched_org and user.organization_id != matched_org.id:
            user.organization_id = matched_org.id
            db.commit()

        if user.organization and user.organization.status == "Inactive":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access suspended: {user.organization.name} platform is currently inactive."
            )

    access_token = create_access_token(data={
        "sub": user.email, 
        "role": user.role, 
        "org_id": user.organization_id
    })
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
