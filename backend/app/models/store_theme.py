from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class SectionInstance(BaseModel):
    """One entry in a theme's layout — references a section type (either
    the "product-grid" built-in, or one of the theme's own SectionTemplate
    types) plus this instance's setting overrides."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: str
    type: str
    settings: dict = Field(default_factory=dict)


class SettingDef(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: str
    type: Literal["text", "richtext", "image", "url", "color", "select"]
    label: str
    default: str = ""
    options: list[str] | None = None


class SectionTemplate(BaseModel):
    """A developer-authored section type: real HTML with {{ settingId }}
    placeholders (Exofe's equivalent of a Liquid section's markup +
    {% schema %}) plus the schema of settings that fill those placeholders
    in. See app/services/section_sanitizer.py for how this is kept safe."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    type: str
    label: str
    html: str
    settings: list[SettingDef] = Field(default_factory=list)


class ThemeDefinition(BaseModel):
    """What a developer submits for kind="theme" — their own section
    templates, plus the default page layout composed from them (and/or the
    "product-grid" built-in)."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    section_templates: list[SectionTemplate] = Field(default_factory=list)
    layout: list[SectionInstance] = Field(default_factory=list)


class StoreThemeResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    business_id: str
    submission_id: str
    theme_name: str
    section_templates: list[SectionTemplate]
    sections: list[SectionInstance]
    updated_at: datetime


class UpdateStoreThemeRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    sections: list[SectionInstance]


class InstallThemeResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    submissionId: str
    themeName: str


# ── Public storefront ────────────────────────────────────────────────────────

class PublicStorefrontProduct(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: str
    name: str
    price: float
    image: str | None


class PublicSectionInstance(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: str
    type: str
    settings: dict
    # Fully rendered (placeholders substituted) and sanitized markup for a
    # custom section template — None for a built-in like "product-grid",
    # which the frontend renders with its own React component instead.
    html: str | None = None


class PublicStorefrontResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    business_name: str
    logo_url: str | None
    sections: list[PublicSectionInstance]
    products: list[PublicStorefrontProduct]
