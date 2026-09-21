import type { PublicStorefront } from "@/lib/api";

export default function ProductGrid({
  settings,
  products,
}: {
  settings: Record<string, string>;
  products: PublicStorefront["products"];
}) {
  const limit = Number(settings.productsToShow) || 8;
  const shown = products.slice(0, limit);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {settings.heading && <h2 className="mb-8 text-2xl font-bold text-[#171326]">{settings.heading}</h2>}
        {shown.length === 0 ? (
          <p className="text-sm text-black/50">No products yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-black/[.08]">
                <div className="aspect-square bg-black/[.04]">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-[#171326]">{p.name}</p>
                  <p className="mt-1 text-sm text-black/60">${p.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
