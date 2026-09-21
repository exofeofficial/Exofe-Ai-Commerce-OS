from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator
from pydantic.alias_generators import to_camel


class SubmissionInput(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, str_strip_whitespace=True, extra="forbid")
    kind: Literal["app", "theme"]
    name: str = Field(min_length=2, max_length=100)
    summary: str = Field(min_length=10, max_length=180)
    description: str = Field(min_length=20, max_length=10000)
    version: str = Field(min_length=1, max_length=40)
    category: Literal["Productivity", "Marketing", "Store design", "Orders & shipping", "Customer support", "Other"]
    demo_url: str = Field(max_length=2048)
    # No max_length here — an uploaded screenshot/package is stored as a
    # base64 data URI (see POST .../submissions/upload-image and .../upload),
    # which for a real file is far longer than a URL ever would be. Length is
    # instead checked per-case below.
    screenshot_url: str
    package_url: str
    support_email: str = Field(min_length=3, max_length=254)
    notes: str = Field(default="", max_length=5000)
    pricing_model: Literal["free", "paid"] = "free"
    # Merchants pay this once to install a paid theme/app — there's no
    # purchase flow wired up to actually charge anyone yet (see the
    # Revenue tab in DeveloperPortal.tsx), this is just what the developer
    # declares it'll cost once that exists.
    price: float = Field(default=0, ge=0, le=10000)

    @model_validator(mode="after")
    def validate_pricing(self) -> "SubmissionInput":
        if self.pricing_model == "free" and self.price != 0:
            raise ValueError("A free submission can't have a price")
        if self.pricing_model == "paid" and self.price <= 0:
            raise ValueError("Set a price greater than 0 for a paid submission")
        return self

    @field_validator("demo_url")
    @classmethod
    def validate_demo_url(cls, value: str) -> str:
        url = HttpUrl(value)
        if url.scheme != "https" or url.username or url.password:
            raise ValueError("Use an HTTPS link without embedded credentials")
        return str(url)

    @field_validator("screenshot_url")
    @classmethod
    def validate_screenshot_url(cls, value: str) -> str:
        # Either a directly-uploaded image (see POST .../submissions/upload-image)
        # or a link to an already-hosted screenshot.
        if value.startswith("data:image/"):
            # ~4.5MB of base64 comfortably covers the 3MB raw-image cap on
            # the upload endpoint (base64 inflates size by ~4/3).
            if len(value) > 4_500_000:
                raise ValueError("Uploaded image is too large")
            return value
        if not value:
            raise ValueError("Add a screenshot")
        if len(value) > 2048:
            raise ValueError("Link is too long")
        url = HttpUrl(value)
        if url.scheme != "https" or url.username or url.password:
            raise ValueError("Use an HTTPS link without embedded credentials")
        return str(url)

    @field_validator("package_url")
    @classmethod
    def validate_package_url(cls, value: str) -> str:
        # Either a directly-uploaded zip (see POST .../submissions/upload,
        # which only ever produces this exact prefix) or a link to a
        # repository/hosted package for developers who'd rather not upload.
        if value.startswith("data:application/zip;base64,"):
            # Generous ceiling matching the upload endpoint's 6MB file cap
            # (base64 inflates size by ~4/3) — defense in depth in case this
            # value didn't actually come from that endpoint.
            if len(value) > 9_000_000:
                raise ValueError("Uploaded package is too large")
            return value
        if len(value) > 2048:
            raise ValueError("Link is too long")
        url = HttpUrl(value)
        if url.scheme != "https" or url.username or url.password:
            raise ValueError("Use an HTTPS link without embedded credentials")
        return str(url)

    @field_validator("support_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        import re
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid support email")
        return value


class SubmissionResponse(SubmissionInput):
    id: str
    status: Literal["draft", "submitted", "approved", "rejected"]
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None = None


class SubmissionList(BaseModel):
    submissions: list[SubmissionResponse]


class PublicThemeSummary(BaseModel):
    # Trimmed, unauthenticated view of an approved theme for the public
    # theme store — no support_email/notes/description, and no package_url
    # (that's a multi-MB base64 blob for uploaded themes; a listing page
    # doesn't need it, only an actual install would). screenshot_url CAN be
    # a similarly large base64 blob, but that one the store grid actually
    # has to render, so it stays.
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: str
    name: str
    summary: str
    category: str
    demo_url: str
    screenshot_url: str
    pricing_model: Literal["free", "paid"]
    price: float
    version: str
    # Admin-curated via /admin/submissions/{id}/featured — the store uses
    # this (not any automatic ranking) to fill "Today's top picks".
    is_featured: bool


class PublicThemeList(BaseModel):
    themes: list[PublicThemeSummary]


class PublicThemeDetail(PublicThemeSummary):
    # The single-theme page needs more than the grid card does — full
    # description and a support contact — fetched separately (see
    # GET .../public/themes/{id}) so the list above stays lean.
    description: str
    support_email: str


class PublicThemeDetailResponse(BaseModel):
    theme: PublicThemeDetail
