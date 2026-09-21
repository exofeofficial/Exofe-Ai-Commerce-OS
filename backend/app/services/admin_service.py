# app/services/admin_service.py
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.repositories import business_repository, subscription_repository


# ── Clients ──────────────────────────────────────────────────────────────────

def list_clients(db: Session) -> list[dict]:
    return business_repository.list_businesses(db)


def get_client(db: Session, business_id: str) -> dict:
    client = business_repository.get_business_by_id(db, business_id)
    if not client:
        raise AppError(404, "Business not found")
    return client


def update_client_status(db: Session, *, admin_id: str, business_id: str, status: str) -> dict:
    updated = business_repository.update_business_status(db, business_id, status)
    if not updated:
        raise AppError(404, "Business not found")

    action = "suspended business" if status == "suspended" else "reactivated business"
    business_repository.log_admin_action(
        db, admin_id=admin_id, action=action, target_business_id=business_id
    )
    return updated


# ── Subscriptions / Revenue ──────────────────────────────────────────────────

def list_subscriptions(db: Session) -> list[dict]:
    return business_repository.list_subscriptions(db)


def activate_subscription(db: Session, *, admin_id: str, business_id: str, plan: str, amount: float) -> dict:
    """Manually put a business on a paid plan — no payment gateway exists
    yet, so this is how a bank-transfer/JazzCash-style manual payment
    gets reflected until a real one is wired up."""
    row = subscription_repository.activate_subscription(db, business_id=business_id, plan=plan, amount=amount)
    business_repository.log_admin_action(
        db, admin_id=admin_id, action=f"manually activated the '{plan}' plan", target_business_id=business_id
    )
    return row


def get_revenue_summary(db: Session) -> dict:
    return business_repository.get_revenue_summary(db)


# ── Audit log ────────────────────────────────────────────────────────────────

def list_admin_logs(db: Session, limit: int = 100) -> list[dict]:
    return business_repository.list_admin_logs(db, limit)


# ── Feature flags ────────────────────────────────────────────────────────────

def list_feature_flags(db: Session) -> list[dict]:
    return business_repository.list_feature_flags(db)


def set_feature_flag(
    db: Session, *, admin_id: str, key: str, enabled: bool, business_id: str | None
) -> dict:
    row = business_repository.set_feature_flag(db, key=key, enabled=enabled, business_id=business_id)

    scope = f"for business {business_id}" if business_id else "globally"
    business_repository.log_admin_action(
        db,
        admin_id=admin_id,
        action=f"{'enabled' if enabled else 'disabled'} feature flag '{key}' {scope}",
        target_business_id=business_id,
    )

    business_name = business_repository.get_business_name(db, row["business_id"]) if row["business_id"] else None
    return {**row, "business_name": business_name}


# ── Developer submissions (app/theme approvals) ─────────────────────────────
# No dedicated repository module for this table — same as
# api/v1/developer_submissions.py, queries live right here.

def list_submissions(db: Session, *, status: str | None = None) -> list[dict]:
    # Drafts are private WIP the developer never submitted — never listed
    # here, filter or not.
    where = "s.status = :status" if status else "s.status != 'draft'"
    rows = db.execute(
        text(
            "SELECT s.*, u.first_name, u.last_name, u.email AS developer_email "
            "FROM developer_submissions s JOIN users u ON u.id = s.user_id "
            f"WHERE {where} "
            "ORDER BY s.submitted_at DESC NULLS LAST, s.created_at DESC"
        ),
        {"status": status} if status else {},
    ).fetchall()
    return [dict(row._mapping) for row in rows]


def get_submission(db: Session, submission_id: str) -> dict:
    row = db.execute(
        text(
            "SELECT s.*, u.first_name, u.last_name, u.email AS developer_email "
            "FROM developer_submissions s JOIN users u ON u.id = s.user_id WHERE s.id = :id"
        ),
        {"id": submission_id},
    ).fetchone()
    if not row:
        raise AppError(404, "Submission not found")
    return dict(row._mapping)


def update_submission_status(db: Session, *, admin_id: str, submission_id: str, status: str) -> dict:
    row = db.execute(
        text(
            "UPDATE developer_submissions SET status = :status, updated_at = now() "
            "WHERE id = :id AND status = 'submitted' RETURNING *"
        ),
        {"id": submission_id, "status": status},
    ).fetchone()
    if not row:
        raise AppError(404, "Submission not found or not awaiting review")
    db.commit()

    business_repository.log_admin_action(
        db, admin_id=admin_id, action=f"{status} the '{row.name}' {row.kind} submission", target_business_id=None
    )
    return dict(row._mapping)


MAX_FEATURED_SUBMISSIONS = 3


def set_submission_featured(db: Session, *, admin_id: str, submission_id: str, featured: bool) -> dict:
    if featured:
        count = db.execute(
            text("SELECT COUNT(*) FROM developer_submissions WHERE is_featured AND id != :id"),
            {"id": submission_id},
        ).scalar()
        if count >= MAX_FEATURED_SUBMISSIONS:
            raise AppError(400, f"Only {MAX_FEATURED_SUBMISSIONS} can be featured at once — unfeature one first")

    row = db.execute(
        text(
            "UPDATE developer_submissions SET is_featured = :featured, updated_at = now() "
            "WHERE id = :id AND status = 'approved' RETURNING *"
        ),
        {"id": submission_id, "featured": featured},
    ).fetchone()
    if not row:
        raise AppError(404, "Submission not found or not approved")
    db.commit()

    business_repository.log_admin_action(
        db,
        admin_id=admin_id,
        action=f"{'featured' if featured else 'unfeatured'} the '{row.name}' {row.kind} submission",
        target_business_id=None,
    )
    return dict(row._mapping)