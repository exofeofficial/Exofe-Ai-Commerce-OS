# app/api/v1/store_theme.py
#
# The merchant-facing half of the theme mechanism: installing an approved
# theme copies its section templates + default layout into this business's
# own row, the customizer reads/writes that row's layout, and the public
# storefront route renders it — merged with the business's real product
# catalog — into safe, pre-rendered HTML. See
# app/services/section_sanitizer.py for how a developer's own HTML section
# templates are kept safe without ever executing arbitrary code.
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
import json

from app.core.dependencies import CurrentUser, get_current_user
from app.core.exceptions import AppError
from app.database.session import get_db
from app.models.store_theme import (
    SectionInstance,
    SectionTemplate,
    StoreThemeResponse,
    UpdateStoreThemeRequest,
    InstallThemeResponse,
    PublicStorefrontResponse,
    PublicSectionInstance,
    PublicStorefrontProduct,
)
from app.services import catalog_service
from app.services.section_registry import validate_theme_definition, fill_layout_defaults
from app.services.section_sanitizer import render_template

router = APIRouter(prefix="/store-theme", tags=["store theme"])
Db = Annotated[Session, Depends(get_db)]
User = Annotated[CurrentUser, Depends(get_current_user)]


def _require_business(current: CurrentUser) -> str:
    if not current.business_id:
        raise AppError(403, "This action requires a business account")
    return current.business_id


@router.post("/install/{submission_id}", response_model=InstallThemeResponse)
def install_theme(submission_id: UUID, db: Db, current: User):
    business_id = _require_business(current)
    row = db.execute(
        text("SELECT id, name, theme_definition FROM developer_submissions WHERE id = :id AND kind = 'theme' AND status = 'approved'"),
        {"id": str(submission_id)},
    ).fetchone()
    if row is None:
        raise AppError(404, "Theme not found or not approved")

    now = datetime.now(timezone.utc)
    db.execute(
        text(
            "INSERT INTO store_theme_installs (business_id, submission_id, sections, section_templates, installed_at, updated_at) "
            "VALUES (:business_id, :submission_id, CAST(:sections AS jsonb), CAST(:templates AS jsonb), :now, :now) "
            "ON CONFLICT (business_id) DO UPDATE SET submission_id = :submission_id, sections = CAST(:sections AS jsonb), "
            "section_templates = CAST(:templates AS jsonb), updated_at = :now"
        ),
        {
            "business_id": business_id,
            "submission_id": str(row.id),
            "sections": json.dumps(row.theme_definition["layout"]),
            "templates": json.dumps(row.theme_definition["section_templates"]),
            "now": now,
        },
    )
    db.commit()
    return InstallThemeResponse(submissionId=str(row.id), themeName=row.name)


@router.get("", response_model=StoreThemeResponse)
def get_store_theme(db: Db, current: User):
    business_id = _require_business(current)
    row = db.execute(
        text(
            "SELECT i.submission_id, i.sections, i.section_templates, i.updated_at, s.name AS theme_name "
            "FROM store_theme_installs i JOIN developer_submissions s ON s.id = i.submission_id "
            "WHERE i.business_id = :business_id"
        ),
        {"business_id": business_id},
    ).fetchone()
    if row is None:
        raise AppError(404, "No theme installed yet — pick one from the Theme Store")
    return StoreThemeResponse(
        business_id=business_id,
        submission_id=str(row.submission_id),
        theme_name=row.theme_name,
        section_templates=[SectionTemplate(**t) for t in row.section_templates],
        sections=[SectionInstance(**s) for s in row.sections],
        updated_at=row.updated_at,
    )


@router.put("", response_model=StoreThemeResponse)
def update_store_theme(body: UpdateStoreThemeRequest, db: Db, current: User):
    business_id = _require_business(current)
    current_row = db.execute(
        text("SELECT section_templates FROM store_theme_installs WHERE business_id = :id"), {"id": business_id}
    ).fetchone()
    if current_row is None:
        raise AppError(404, "No theme installed yet — pick one from the Theme Store")

    layout = [s.model_dump() for s in body.sections]
    theme_definition = {"section_templates": current_row.section_templates, "layout": layout}
    errors = validate_theme_definition(theme_definition)
    if errors:
        raise AppError(400, "; ".join(errors))
    layout = fill_layout_defaults(theme_definition, layout)

    now = datetime.now(timezone.utc)
    row = db.execute(
        text(
            "UPDATE store_theme_installs SET sections = CAST(:sections AS jsonb), updated_at = :now "
            "WHERE business_id = :business_id "
            "RETURNING submission_id, sections, section_templates, updated_at"
        ),
        {"sections": json.dumps(layout), "now": now, "business_id": business_id},
    ).fetchone()
    db.commit()

    theme_name = db.execute(text("SELECT name FROM developer_submissions WHERE id = :id"), {"id": str(row.submission_id)}).scalar()
    return StoreThemeResponse(
        business_id=business_id,
        submission_id=str(row.submission_id),
        theme_name=theme_name,
        section_templates=[SectionTemplate(**t) for t in row.section_templates],
        sections=[SectionInstance(**s) for s in row.sections],
        updated_at=row.updated_at,
    )


# Deliberately no `current: User` — this is what a merchant's live
# storefront page (any visitor) fetches to render.
@router.get("/public/{business_id}", response_model=PublicStorefrontResponse)
def get_public_storefront(business_id: UUID, db: Db):
    business = db.execute(text("SELECT name, logo_url FROM businesses WHERE id = :id"), {"id": str(business_id)}).fetchone()
    if business is None:
        raise AppError(404, "Store not found")

    install = db.execute(
        text("SELECT sections, section_templates FROM store_theme_installs WHERE business_id = :id"), {"id": str(business_id)}
    ).fetchone()

    products = catalog_service.get_products(db, str(business_id), status="active")
    public_products = [
        PublicStorefrontProduct(id=p["id"], name=p["name"], price=float(p["price"]), image=(p["images"][0] if p["images"] else None))
        for p in products
    ]

    sections: list[PublicSectionInstance] = []
    if install:
        templates_by_type = {t["type"]: t for t in install.section_templates}
        for instance in install.sections:
            if instance["type"] == "product-grid":
                sections.append(PublicSectionInstance(id=instance["id"], type=instance["type"], settings=instance["settings"], html=None))
                continue
            template = templates_by_type.get(instance["type"])
            if not template:
                continue
            rendered = render_template(template["html"], instance["settings"])
            sections.append(PublicSectionInstance(id=instance["id"], type=instance["type"], settings=instance["settings"], html=rendered))

    return PublicStorefrontResponse(
        business_name=business.name,
        logo_url=business.logo_url,
        sections=sections,
        products=public_products,
    )
