# app/services/section_sanitizer.py
#
# The safety layer that makes developer-authored section templates
# possible at all: a template is real HTML with {{ settingId }}
# placeholders (Exofe's equivalent of a Liquid section's markup +
# {% schema %}), never arbitrary JS. Two passes:
#   1. sanitize_template() — at submission time, strips dangerous tags/
#      attributes from the raw template. Placeholders survive untouched
#      (nh3 doesn't treat "{{ x }}" as an unsafe URL scheme, so src="{{ x }}"
#      isn't stripped just because it isn't yet a real URL).
#   2. render_template() — at render time, substitutes each placeholder
#      with its (HTML-escaped) current value, then sanitizes the RESULT
#      again — defense in depth against a merchant's own text setting
#      containing markup.
import html
import re

import nh3

ALLOWED_TAGS = {
    "div", "section", "span", "p", "a", "button", "img",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "br", "strong", "em", "b", "i", "blockquote",
}
ALLOWED_ATTRIBUTES = {
    "*": {"class", "style"},
    "a": {"href", "target"},
    "img": {"src", "alt"},
}
ALLOWED_URL_SCHEMES = {"http", "https", "data"}

PLACEHOLDER_RE = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")


def _clean(value: str) -> str:
    return nh3.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=ALLOWED_URL_SCHEMES,
        link_rel="noopener noreferrer",
    )


def sanitize_template(raw_html: str) -> str:
    return _clean(raw_html)


def extract_placeholders(raw_html: str) -> set[str]:
    return set(PLACEHOLDER_RE.findall(raw_html))


def render_template(sanitized_html: str, settings: dict[str, str]) -> str:
    def replace(match: re.Match) -> str:
        return html.escape(str(settings.get(match.group(1), "")), quote=True)

    return _clean(PLACEHOLDER_RE.sub(replace, sanitized_html))
