# app/services/section_registry.py
#
# Two kinds of section "type" a theme's layout can reference:
#  1. "product-grid" — the one true built-in. It has to loop over the
#     merchant's REAL product catalog, which a static HTML+settings
#     template (see section_sanitizer.py) can't express safely without a
#     templating language with loops — not worth building for a single
#     section. Rendered by a hardcoded React component instead
#     (frontend/src/components/storefront/sections/ProductGrid.tsx).
#  2. Anything else — a *custom section template* the developer defines as
#     part of their own theme submission: real HTML with {{ placeholder }}
#     settings (Exofe's equivalent of a Liquid section's markup +
#     {% schema %}), sanitized and rendered generically. Not global — each
#     theme ships its own, so two themes can both have a "hero" type with
#     completely different markup and settings.
import re

from app.services.section_sanitizer import extract_placeholders, sanitize_template

PRODUCT_GRID_SETTINGS = [
    {"id": "heading", "type": "text", "label": "Heading", "default": "Our products", "options": None},
    {"id": "productsToShow", "type": "select", "label": "Products to show", "default": "8", "options": ["4", "8", "12"]},
]

BUILTIN_TYPES = {"product-grid"}
TYPE_SLUG_RE = re.compile(r"[a-z0-9-]{2,40}")
VALID_SETTING_TYPES = {"text", "richtext", "image", "url", "color", "select"}


def sanitize_theme_definition(theme_definition: dict) -> dict:
    """Called once at submission time: sanitizes every custom template's
    raw HTML so what's stored is already safe, before it's ever combined
    with a merchant's setting values at render time."""
    theme_definition = dict(theme_definition)
    theme_definition["section_templates"] = [
        {**t, "html": sanitize_template(t["html"])} for t in theme_definition.get("section_templates", [])
    ]
    return theme_definition


def validate_theme_definition(theme_definition: dict) -> list[str]:
    """Returns human-readable errors; empty means valid."""
    errors: list[str] = []
    templates = theme_definition.get("section_templates", [])
    layout = theme_definition.get("layout", [])

    known_settings_by_type: dict[str, set[str]] = {"product-grid": {s["id"] for s in PRODUCT_GRID_SETTINGS}}
    seen_types: set[str] = set()

    for i, tpl in enumerate(templates):
        t = tpl.get("type", "")
        label = f"Section template {i + 1}"
        if not TYPE_SLUG_RE.fullmatch(t):
            errors.append(f"{label}: type must be 2-40 lowercase letters, numbers, or hyphens")
            continue
        if t in BUILTIN_TYPES:
            errors.append(f"{label}: '{t}' is a reserved built-in type")
            continue
        if t in seen_types:
            errors.append(f"{label}: duplicate type '{t}'")
            continue
        seen_types.add(t)

        setting_ids = set()
        for s in tpl.get("settings", []):
            if s.get("type") not in VALID_SETTING_TYPES:
                errors.append(f"{label} ('{t}'): unknown setting type '{s.get('type')}' for '{s.get('id')}'")
            setting_ids.add(s.get("id"))
        known_settings_by_type[t] = setting_ids

        if not tpl.get("html", "").strip():
            errors.append(f"{label} ('{t}'): needs an HTML template")
            continue
        unknown_placeholders = extract_placeholders(tpl["html"]) - setting_ids
        if unknown_placeholders:
            errors.append(f"{label} ('{t}'): undeclared placeholder(s) {{{{{', '.join(sorted(unknown_placeholders))}}}}}")

    if not layout:
        errors.append("Add at least one section to the theme's default layout")

    for i, instance in enumerate(layout):
        t = instance.get("type")
        if t not in known_settings_by_type:
            errors.append(f"Layout section {i + 1}: unknown section type '{t}' (define it as a section template first)")
            continue
        unknown_keys = set(instance.get("settings", {})) - known_settings_by_type[t]
        if unknown_keys:
            errors.append(f"Layout section {i + 1} ('{t}'): unknown setting(s) {', '.join(sorted(unknown_keys))}")

    return errors


def _defaults_for(theme_definition: dict, section_type: str) -> dict:
    if section_type == "product-grid":
        return {s["id"]: s["default"] for s in PRODUCT_GRID_SETTINGS}
    for tpl in theme_definition.get("section_templates", []):
        if tpl["type"] == section_type:
            return {s["id"]: s["default"] for s in tpl.get("settings", [])}
    return {}


def fill_layout_defaults(theme_definition: dict, layout: list[dict]) -> list[dict]:
    """Fills in any settings a layout instance omitted with that section
    type's default — a layout entry only has to override what it actually
    customizes."""
    filled = []
    for instance in layout:
        defaults = _defaults_for(theme_definition, instance["type"])
        merged = {**defaults, **instance.get("settings", {})}
        filled.append({"id": instance.get("id") or instance["type"], "type": instance["type"], "settings": merged})
    return filled
