"use client";

import { useEffect, useState } from "react";
import { ApiError, getPublicStorefront, type PublicStorefront } from "@/lib/api";
import SectionRenderer from "@/components/storefront/SectionRenderer";

export default function StorefrontPage({ businessId }: { businessId: string }) {
  const [store, setStore] = useState<PublicStorefront | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublicStorefront(businessId)
      .then((res) => {
        if (!cancelled) setStore(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load this store.");
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-center">
        <p className="text-sm text-black/50">{error}</p>
      </div>
    );
  }

  if (!store) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex h-14 items-center gap-2 border-b border-black/[.06] px-6">
        {store.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logoUrl} alt="" className="h-7 w-7 rounded object-cover" />
        )}
        <span className="text-sm font-semibold text-[#171326]">{store.businessName}</span>
      </header>

      {store.sections.length === 0 ? (
        <div className="flex min-h-[60vh] items-center justify-center text-center">
          <p className="text-sm text-black/50">This store hasn&apos;t set up its page yet.</p>
        </div>
      ) : (
        store.sections.map((section) => <SectionRenderer key={section.id} section={section} products={store.products} />)
      )}
    </div>
  );
}
