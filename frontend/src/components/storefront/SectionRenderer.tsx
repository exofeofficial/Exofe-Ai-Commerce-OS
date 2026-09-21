import type { PublicStorefront } from "@/lib/api";
import ProductGrid from "./sections/ProductGrid";

type PublicSection = PublicStorefront["sections"][number];

// "product-grid" is the one true built-in (needs a live loop over real
// products — see backend app/services/section_registry.py) and is
// rendered by a real React component. Everything else is a developer's own
// custom section template: the backend already substituted settings into
// the HTML and sanitized the result (see app/services/section_sanitizer.py),
// so it's safe to drop in directly here.
export default function SectionRenderer({ section, products }: { section: PublicSection; products: PublicStorefront["products"] }) {
  if (section.type === "product-grid") {
    return <ProductGrid settings={section.settings} products={products} />;
  }
  if (!section.html) return null;
  return <div dangerouslySetInnerHTML={{ __html: section.html }} />;
}
