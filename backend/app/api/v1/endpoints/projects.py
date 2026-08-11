from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_active_user
from app.db.database import get_db
from app.models.project import Project
from app.models.scan import Scan
from fastapi import BackgroundTasks, UploadFile, File
import urllib.request
import urllib.error
import json
import subprocess
import tempfile
import os
from loguru import logger
from app.services.scanners.code_scanner import CodeSecurityScanner
from app.services.notification_service import create_alerts_from_scan
from app.core.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    source_type: Optional[str] = Field(default="blank")
    github_url: Optional[str] = Field(default=None)
    local_path: Optional[str] = Field(default=None)


class UpdateProjectRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)


class ProjectOut(BaseModel):
    project_id: str
    name: str
    description: Optional[str]
    risk_level: str
    scan_count: int
    open_finding_count: int
    is_archived: bool
    created_at: str


class ProjectDetailOut(ProjectOut):
    recent_scans: List[dict]


def _to_out(p: Project) -> ProjectOut:
    return ProjectOut(
        project_id=p.id,
        name=p.name,
        description=p.description,
        risk_level=p.risk_level,
        scan_count=p.scan_count or 0,
        open_finding_count=p.open_finding_count or 0,
        is_archived=p.is_archived,
        created_at=p.created_at.isoformat() if p.created_at else "",
    )


# ── POST /projects ────────────────────────────────────────────────────────────
@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    body: CreateProjectRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    from app.core.subscription import get_user_limits
    limits = get_user_limits(user.subscription_tier)
    
    current_projects = db.query(Project).filter(Project.owner_id == user.id, Project.is_archived == False).count()
    if current_projects >= limits["projects"]:
        raise HTTPException(status_code=403, detail="Project limit reached. Please upgrade your plan to create more projects.")

    proj = Project(
        name=body.name,
        description=body.description,
        owner_id=user.id,
        risk_level="low",
        scan_count=0,
        open_finding_count=0,
        meta={
            "source_type": body.source_type,
            "github_url": body.github_url,
            "local_path": body.local_path,
        }
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return _to_out(proj)


# ── GET /projects/github/repos ────────────────────────────────────────────────
@router.get("/github/repos")
def list_github_repos(user=Depends(get_current_active_user)):
    if user.oauth_provider != "clerk" or not user.oauth_provider_id:
        raise HTTPException(status_code=400, detail="User is not authenticated via Clerk")
    
    if not settings.CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="CLERK_SECRET_KEY not configured")

    # Fetch OAuth token from Clerk
    clerk_id = user.oauth_provider_id
    url = f"https://api.clerk.com/v1/users/{clerk_id}/oauth_access_tokens/oauth_github"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {settings.CLERK_SECRET_KEY}")
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            clerk_data = json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise HTTPException(status_code=400, detail="GitHub account not connected")
        raise HTTPException(status_code=500, detail=f"Clerk API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clerk API error: {e}")

    if not clerk_data or len(clerk_data) == 0:
        raise HTTPException(status_code=400, detail="GitHub account not connected")
    
    github_token = clerk_data[0].get("token")
    if not github_token:
        raise HTTPException(status_code=400, detail="No GitHub access token found")

    # Fetch repos from GitHub
    gh_url = "https://api.github.com/user/repos?sort=updated&per_page=100"
    gh_req = urllib.request.Request(gh_url)
    gh_req.add_header("Authorization", f"Bearer {github_token}")
    gh_req.add_header("Accept", "application/vnd.github.v3+json")
    gh_req.add_header("User-Agent", "SentinelNexus")

    try:
        with urllib.request.urlopen(gh_req, timeout=10) as response:
            gh_data = json.loads(response.read().decode())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {e}")

    repos = []
    for r in gh_data:
        repos.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "description": r.get("description"),
            "html_url": r.get("html_url"),
            "private": r.get("private"),
            "language": r.get("language")
        })
    
    return {"items": repos}


# ── POST /projects/{id}/webhook ───────────────────────────────────────────────
def process_github_webhook(db_session_factory, project_id: str, github_url: str):
    db = db_session_factory()
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            logger.info(f"Cloning {github_url} for webhook scan...")
            subprocess.run(["git", "clone", "--depth", "1", github_url, tmpdir], check=True, capture_output=True)
            
            all_findings = []
            max_score = 0
            
            for root, dirs, files in os.walk(tmpdir):
                if '.git' in dirs: dirs.remove('.git')
                if 'node_modules' in dirs: dirs.remove('node_modules')
                if 'venv' in dirs: dirs.remove('venv')
                
                for file in files:
                    if file.endswith(('.png', '.jpg', '.jpeg', '.pdf', '.zip', '.tar', '.gz', '.pyc', '.exe')):
                        continue
                        
                    filepath = os.path.join(root, file)
                    relpath = os.path.relpath(filepath, tmpdir)
                    
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                        
                        findings, score = CodeSecurityScanner.scan_code(content, target=relpath)
                        all_findings.extend(findings)
                        max_score = max(max_score, score)
                    except Exception:
                        pass
            
            risk_level = CodeSecurityScanner.get_risk_level(max_score)
            cvss_scores = [f.cvss_score for f in all_findings if hasattr(f, 'cvss_score') and f.cvss_score is not None]
            cvss_max = max(cvss_scores) if cvss_scores else None

            findings_dicts = [f.to_dict() for f in all_findings]
            
            proj = db.query(Project).filter(Project.id == project_id).first()
            if not proj:
                return

            scan = Scan(
                user_id=proj.owner_id,
                project_id=project_id,
                target=github_url,
                scan_type="code",
                status="completed",
                pii_risk_score=max_score,
                risk_level=risk_level,
                cvss_max_score=cvss_max,
                finding_count=len(all_findings),
                duration_ms=0,
                result=json.dumps({"findings": findings_dicts, "score": max_score}),
                meta={"engine": "code_scanner_webhook", "trigger": "github_push"}
            )
            db.add(scan)
            
            proj.scan_count = (proj.scan_count or 0) + 1
            high_crit = sum(1 for f in findings_dicts if f.get("severity") in ("high", "critical"))
            proj.open_finding_count = (proj.open_finding_count or 0) + high_crit
            _risk_ord = {"critical": 4, "high": 3, "medium": 2, "low": 1}
            if _risk_ord.get(risk_level, 0) > _risk_ord.get(proj.risk_level, 0):
                proj.risk_level = risk_level

            db.commit()
            db.refresh(scan)

            if findings_dicts:
                create_alerts_from_scan(
                    db,
                    scan_id=scan.id,
                    user_id=proj.owner_id,
                    target=github_url,
                    findings=findings_dicts,
                    threshold_severity="high",
                )
    except Exception as e:
        logger.error(f"Webhook processing failed for {project_id}: {e}")
    finally:
        db.close()


@router.post("/{project_id}/webhook")
def github_webhook(
    project_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    github_url = proj.meta.get("github_url") if proj.meta else None
    if not github_url:
        raise HTTPException(status_code=400, detail="Project does not have a GitHub URL configured")
        
    from app.db.database import SessionLocal
    background_tasks.add_task(process_github_webhook, SessionLocal, project_id, github_url)
    
    return {"status": "accepted", "message": "Scan queued"}


# ── POST /projects/{id}/upload ────────────────────────────────────────────────
def process_local_upload(db_session_factory, project_id: str, tmpdir: str, file_paths: List[str]):
    db = db_session_factory()
    try:
        all_findings = []
        max_score = 0
        
        for filepath in file_paths:
            relpath = os.path.relpath(filepath, tmpdir)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                findings, score = CodeSecurityScanner.scan_code(content, target=relpath)
                all_findings.extend(findings)
                max_score = max(max_score, score)
            except Exception:
                pass
        
        risk_level = CodeSecurityScanner.get_risk_level(max_score)
        cvss_scores = [f.cvss_score for f in all_findings if hasattr(f, 'cvss_score') and f.cvss_score is not None]
        cvss_max = max(cvss_scores) if cvss_scores else None

        findings_dicts = [f.to_dict() for f in all_findings]
        
        proj = db.query(Project).filter(Project.id == project_id).first()
        if not proj:
            return

        scan = Scan(
            user_id=proj.owner_id,
            project_id=project_id,
            target="Local Upload",
            scan_type="code",
            status="completed",
            pii_risk_score=max_score,
            risk_level=risk_level,
            cvss_max_score=cvss_max,
            finding_count=len(all_findings),
            duration_ms=0,
            result=json.dumps({"findings": findings_dicts, "score": max_score}),
            meta={"engine": "code_scanner_upload", "trigger": "manual_upload"}
        )
        db.add(scan)
        
        proj.scan_count = (proj.scan_count or 0) + 1
        high_crit = sum(1 for f in findings_dicts if f.get("severity") in ("high", "critical"))
        proj.open_finding_count = (proj.open_finding_count or 0) + high_crit
        _risk_ord = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        if _risk_ord.get(risk_level, 0) > _risk_ord.get(proj.risk_level, 0):
            proj.risk_level = risk_level

        db.commit()
        db.refresh(scan)

        if findings_dicts:
            create_alerts_from_scan(
                db,
                scan_id=scan.id,
                user_id=proj.owner_id,
                target="Local Upload",
                findings=findings_dicts,
                threshold_severity="high",
            )
    except Exception as e:
        logger.error(f"Local upload processing failed for {project_id}: {e}")
    finally:
        # Cleanup temp directory
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)
        db.close()


@router.post("/{project_id}/upload")
async def upload_local_files(
    project_id: str,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    tmpdir = tempfile.mkdtemp()
    saved_paths = []
    
    # Save uploaded files to the temporary directory
    for file in files:
        if not file.filename:
            continue
            
        file_path = os.path.join(tmpdir, file.filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        saved_paths.append(file_path)
        
    from app.db.database import SessionLocal
    background_tasks.add_task(process_local_upload, SessionLocal, project_id, tmpdir, saved_paths)
    
    return {"status": "accepted", "message": f"{len(saved_paths)} files queued for scanning"}


# ── GET /projects ─────────────────────────────────────────────────────────────
@router.get("")
def list_projects(
    include_archived: bool = Query(default=False),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    q = db.query(Project).filter(Project.owner_id == user.id)
    if not include_archived:
        q = q.filter(Project.is_archived == False)  # noqa: E712
    total = q.count()
    projects = q.order_by(Project.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "items": [_to_out(p) for p in projects]}


# ── GET /projects/{id} ────────────────────────────────────────────────────────
@router.get("/{project_id}")
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    proj = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == user.id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    recent_scans = (
        db.query(Scan)
        .filter(Scan.project_id == project_id, Scan.is_archived == False)  # noqa: E712
        .order_by(Scan.created_at.desc())
        .limit(10)
        .all()
    )
    scans_data = [
        {
            "scan_id": s.id,
            "target": s.target,
            "scan_type": s.scan_type,
            "risk_level": s.risk_level,
            "score": s.pii_risk_score,
            "cvss_max_score": s.cvss_max_score,
            "finding_count": s.finding_count,
            "created_at": s.created_at.isoformat() if s.created_at else "",
        }
        for s in recent_scans
    ]

    base = _to_out(proj)
    return {
        **base.model_dump(),
        "recent_scans": scans_data,
    }


# ── PATCH /projects/{id} ──────────────────────────────────────────────────────
@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    body: UpdateProjectRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    proj = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == user.id, Project.is_archived == False  # noqa: E712
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if body.name is not None:
        proj.name = body.name
    if body.description is not None:
        proj.description = body.description
    db.commit()
    db.refresh(proj)
    return _to_out(proj)


# ── DELETE /projects/{id} ─────────────────────────────────────────────────────
@router.delete("/{project_id}", status_code=204)
def archive_project(
    project_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    proj = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == user.id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    proj.is_archived = True
    db.commit()
    return None


# ── GET /projects/{id}/scans ──────────────────────────────────────────────────
@router.get("/{project_id}/scans")
def list_project_scans(
    project_id: str,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    proj = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == user.id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    q = db.query(Scan).filter(
        Scan.project_id == project_id,
        Scan.is_archived == False,  # noqa: E712
    )
    total = q.count()
    scans = q.order_by(Scan.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "scan_id": s.id,
                "target": s.target,
                "scan_type": s.scan_type,
                "risk_level": s.risk_level,
                "score": s.pii_risk_score,
                "cvss_max_score": s.cvss_max_score,
                "finding_count": s.finding_count,
                "duration_ms": s.duration_ms,
                "created_at": s.created_at.isoformat() if s.created_at else "",
            }
            for s in scans
        ],
    }
