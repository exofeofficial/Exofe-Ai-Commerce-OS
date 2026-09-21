-- A merchant's installed/active theme — one row per business, replaced
-- wholesale on a new install (see POST /store-theme/install/{submission_id}).
-- `sections` starts as a copy of the theme submission's theme_definition
-- and is then the merchant's OWN editable copy: customizing it (PUT
-- /store-theme) never touches the original developer_submissions row, so
-- the same theme can be installed by many merchants independently and a
-- developer publishing a new version doesn't silently change what's live
-- on an existing merchant's storefront.
CREATE TABLE IF NOT EXISTS store_theme_installs (
    business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES developer_submissions(id),
    sections JSONB NOT NULL,
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- The theme's own custom section templates (HTML + settings schema, see
-- app/services/section_sanitizer.py), frozen at install time for the same
-- reason `sections` is: a developer updating their theme later shouldn't
-- silently change what's already live on an existing merchant's storefront.
ALTER TABLE store_theme_installs ADD COLUMN IF NOT EXISTS section_templates JSONB NOT NULL DEFAULT '[]';
