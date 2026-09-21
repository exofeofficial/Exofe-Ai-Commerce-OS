CREATE TABLE IF NOT EXISTS developer_submissions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('app', 'theme')),
    name VARCHAR(100) NOT NULL,
    summary VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    version VARCHAR(40) NOT NULL,
    category TEXT NOT NULL,
    demo_url TEXT NOT NULL,
    package_url TEXT NOT NULL,
    support_email VARCHAR(254) NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS developer_submissions_user_created_idx ON developer_submissions(user_id, created_at DESC);

-- Added after the table already existed in some environments — ALTER
-- rather than folding into the CREATE above, since CREATE TABLE IF NOT
-- EXISTS is a no-op (and adds no columns) once the table is already there.
ALTER TABLE developer_submissions ADD COLUMN IF NOT EXISTS pricing_model TEXT NOT NULL DEFAULT 'free' CHECK (pricing_model IN ('free', 'paid'));
ALTER TABLE developer_submissions ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE developer_submissions ADD COLUMN IF NOT EXISTS screenshot_url TEXT NOT NULL DEFAULT '';
-- Manually curated by an admin (see /admin/submissions/{id}/featured) — up
-- to 3 at once, shown as "Today's top picks" on themes.exofe.com. Not a
-- date-based rotation: it just stays whatever an admin last set it to.
ALTER TABLE developer_submissions ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
-- Only set for kind='theme': an ordered list of section instances (each a
-- known type from app/services/section_registry.py, with its settings) —
-- the theme's *default* layout, copied into a merchant's own editable row
-- (store_theme_installs) on install. NULL for apps.
ALTER TABLE developer_submissions ADD COLUMN IF NOT EXISTS theme_definition JSONB;
