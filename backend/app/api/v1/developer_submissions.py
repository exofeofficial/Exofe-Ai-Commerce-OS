import base64
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser, get_current_user
from app.core.exceptions import AppError
from app.core.rate_limit import limiter
from app.database.session import get_db
from app.models.developer_submission import (
    SubmissionInput,
    SubmissionResponse,
    SubmissionList,
    PublicThemeSummary,
    PublicThemeList,
    PublicThemeDetail,
    PublicThemeDetailResponse,
)

router = APIRouter(prefix="/developers/submissions", tags=["developer submissions"])
Db = Annotated[Session, Depends(get_db)]
User = Annotated[CurrentUser, Depends(get_current_user)]

# No object storage configured yet (see R2_BUCKET_NAME in DEPLOYMENT.md —
# still a placeholder), so the uploaded zip is stored the same way product
# images are elsewhere in this codebase: as a base64 data URI directly in
# the row. The 6MB raw-bytes cap leaves headroom under the app-wide 8MB
# request body limit (MaxBodySizeMiddleware in main.py) once base64
# inflates it by ~33%.
MAX_PACKAGE_BYTES = 6 * 1024 * 1024
MAX_IMAGE_BYTES = 3 * 1024 * 1024


def response(row) -> SubmissionResponse:
    values = dict(row._mapping)
    values["id"] = str(values["id"])
    values.pop("user_id", None)
    return SubmissionResponse(**values)


@router.post("/upload")
@limiter.limit("20/hour")
async def upload_package(request: Request, current: User, file: UploadFile = File(...)):
    name = file.filename or ""
    if not name.lower().endswith(".zip"):
        raise AppError(400, "Upload a .zip file")

    data = await file.read()
    if not data:
        raise AppError(400, "That file is empty")
    if len(data) > MAX_PACKAGE_BYTES:
        raise AppError(400, f"File must be under {MAX_PACKAGE_BYTES // (1024 * 1024)}MB")

    encoded = base64.b64encode(data).decode()
    return {"url": f"data:application/zip;base64,{encoded}", "name": name, "size": len(data)}


@router.post("/upload-image")
@limiter.limit("20/hour")
async def upload_screenshot(request: Request, current: User, file: UploadFile = File(...)):
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise AppError(400, "Upload an image file")

    data = await file.read()
    if not data:
        raise AppError(400, "That file is empty")
    if len(data) > MAX_IMAGE_BYTES:
        raise AppError(400, f"Image must be under {MAX_IMAGE_BYTES // (1024 * 1024)}MB")

    encoded = base64.b64encode(data).decode()
    return {"url": f"data:{content_type};base64,{encoded}", "name": file.filename or "", "size": len(data)}


@router.get("", response_model=SubmissionList)
def list_submissions(db: Db, current: User):
    rows = db.execute(text("SELECT * FROM developer_submissions WHERE user_id = :user_id ORDER BY created_at DESC"), {"user_id": current.user_id}).fetchall()
    return SubmissionList(submissions=[response(row) for row in rows])


# Deliberately no `current: User` here — this is what themes.exofe.com
# (any visitor, logged in or not) fetches to render the public theme store.
@router.get("/public/themes", response_model=PublicThemeList)
def list_public_themes(db: Db):
    rows = db.execute(
        text(
            "SELECT id, name, summary, category, demo_url, screenshot_url, pricing_model, price, version, is_featured "
            "FROM developer_submissions WHERE kind = 'theme' AND status = 'approved' "
            "ORDER BY created_at DESC"
        )
    ).fetchall()
    return PublicThemeList(
        themes=[
            PublicThemeSummary(
                id=str(row.id),
                name=row.name,
                summary=row.summary,
                category=row.category,
                demo_url=row.demo_url,
                screenshot_url=row.screenshot_url,
                pricing_model=row.pricing_model,
                price=float(row.price),
                version=row.version,
                is_featured=row.is_featured,
            )
            for row in rows
        ]
    )


# Deliberately no `current: User` here either — the single-theme detail
# page on themes.exofe.com fetches this to render /themes/{id}.
@router.get("/public/themes/{submission_id}", response_model=PublicThemeDetailResponse)
def get_public_theme(submission_id: UUID, db: Db):
    row = db.execute(
        text(
            "SELECT id, name, summary, description, category, demo_url, screenshot_url, "
            "pricing_model, price, version, is_featured, support_email "
            "FROM developer_submissions WHERE id = :id AND kind = 'theme' AND status = 'approved'"
        ),
        {"id": str(submission_id)},
    ).fetchone()
    if row is None:
        raise AppError(404, "Theme not found")
    return PublicThemeDetailResponse(
        theme=PublicThemeDetail(
            id=str(row.id),
            name=row.name,
            summary=row.summary,
            description=row.description,
            category=row.category,
            demo_url=row.demo_url,
            screenshot_url=row.screenshot_url,
            pricing_model=row.pricing_model,
            price=float(row.price),
            version=row.version,
            is_featured=row.is_featured,
            support_email=row.support_email,
        )
    )


@router.post("", response_model=SubmissionResponse, status_code=201)
@limiter.limit("30/hour")
def create_submission(request: Request, body: SubmissionInput, db: Db, current: User):
    values = body.model_dump()
    values.update(id=str(uuid4()), user_id=current.user_id, status="draft", created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
    columns = ", ".join(values)
    params = ", ".join(":" + key for key in values)
    row = db.execute(text(f"INSERT INTO developer_submissions ({columns}) VALUES ({params}) RETURNING *"), values).fetchone()
    result = response(row)
    db.commit()
    return result


@router.put("/{submission_id}", response_model=SubmissionResponse)
def update_submission(submission_id: UUID, body: SubmissionInput, db: Db, current: User):
    values = body.model_dump()
    assignments = ", ".join(key + " = :" + key for key in values)
    values.update(id=str(submission_id), user_id=current.user_id, updated_at=datetime.now(timezone.utc))
    row = db.execute(text(f"UPDATE developer_submissions SET {assignments}, updated_at = :updated_at WHERE id = :id AND user_id = :user_id AND status = 'draft' RETURNING *"), values).fetchone()
    if row is None:
        raise AppError(404, "Draft not found or already submitted")
    result = response(row)
    db.commit()
    return result


@router.post("/{submission_id}/submit", response_model=SubmissionResponse)
def submit_submission(submission_id: UUID, db: Db, current: User):
    row = db.execute(text("UPDATE developer_submissions SET status = 'submitted', submitted_at = :now, updated_at = :now WHERE id = :id AND user_id = :user_id AND status = 'draft' RETURNING *"), {"id": str(submission_id), "user_id": current.user_id, "now": datetime.now(timezone.utc)}).fetchone()
    if row is None:
        raise AppError(404, "Draft not found or already submitted")
    result = response(row)
    db.commit()
    return result
