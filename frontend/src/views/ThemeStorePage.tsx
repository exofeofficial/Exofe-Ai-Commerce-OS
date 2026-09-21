"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink, Eye, ImageOff, Menu, Search, Sparkles, Store, X } from "lucide-react";
import { getPublicThemes, type PublicTheme } from "@/lib/api";

const CATEGORIES = [
  "Productivity",
  "Marketing",
  "Store design",
  "Orders & shipping",
  "Customer support",
  "Other",
] as const;

// A handful of brand-toned gradients cycled by index — fallback for a
// submission with no screenshot (an old row from before that field existed,
// or a link the developer never got around to adding).
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #45157b, #7c3aed)",
  "linear-gradient(135deg, #171326, #45157b)",
  "linear-gradient(135deg, #7c3aed, #c4b5fd)",
  "linear-gradient(135deg, #45157b, #b98700)",
];

// No giant name-as-text-overlay for a theme with no screenshot — that reads
// fine for a short real name but turns into an ugly wall of text for a long
// one, and doubles up on the name already shown below. A quiet icon reads
// as "no preview yet" instead.
function ThemeImage({ theme, index, className }: { theme: PublicTheme; index: number; className: string }) {
  if (theme.screenshotUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={theme.screenshotUrl} alt={theme.name} className={`${className} object-cover`} />;
  }
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }}>
      <ImageOff className="h-7 w-7 text-white/50" strokeWidth={1.5} />
    </div>
  );
}

// Hover overlay with a centered eye icon — clicking it (or the image)
// opens the theme's own detail page, not the external live demo (that stays
// a separate link in the card footer below).
function PreviewOverlay({ id }: { id: string }) {
  return (
    <Link
      href={`/themes/${id}`}
      aria-label="Preview theme"
      className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35"
    >
      <span className="flex h-10 w-10 scale-90 items-center justify-center rounded-full bg-white text-[#171326] opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
        <Eye className="h-4.5 w-4.5" />
      </span>
    </Link>
  );
}

function ThemeCardBody({ theme }: { theme: PublicTheme }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-block truncate rounded-full bg-[#eadaf4] px-2.5 py-1 text-[11px] font-semibold text-[#45157b]">
          {theme.category}
        </span>
        <span className="shrink-0 text-sm font-semibold text-[#171326]">
          {theme.pricingModel === "free" ? "Free" : `$${theme.price.toFixed(2)}`}
        </span>
      </div>
      <Link href={`/themes/${theme.id}`} className="mt-2 block">
        <h3 className="truncate text-base font-semibold text-[#171326] group-hover:text-[#45157b]">{theme.name}</h3>
      </Link>
      <p className="mt-1 line-clamp-2 min-h-[2.5em] text-sm leading-snug text-black/55">{theme.summary}</p>
      <a
        href={theme.demoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#45157b] hover:underline"
      >
        View demo <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function ThemeCard({ theme, index }: { theme: PublicTheme; index: number }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-black/[.08] bg-white transition-all hover:-translate-y-0.5 hover:border-black/[.12] hover:shadow-lg hover:shadow-black/[.08]">
      <div className="relative">
        <ThemeImage theme={theme} index={index} className="h-40 w-full" />
        <PreviewOverlay id={theme.id} />
      </div>
      <ThemeCardBody theme={theme} />
    </div>
  );
}

function FeaturedThemeCard({ theme, index, rank }: { theme: PublicTheme; index: number; rank: number }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-black/[.08] bg-white transition-all hover:-translate-y-0.5 hover:border-black/[.12] hover:shadow-lg hover:shadow-black/[.08]">
      <div className="relative">
        <span className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#171326] text-xs font-bold text-white shadow">
          {rank}
        </span>
        <ThemeImage theme={theme} index={index} className="h-48 w-full" />
        <PreviewOverlay id={theme.id} />
      </div>
      <ThemeCardBody theme={theme} />
    </div>
  );
}

export default function ThemeStorePage() {
  const [themes, setThemes] = useState<PublicTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPublicThemes()
      .then(({ themes }) => {
        if (!cancelled) setThemes(themes);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Curated by an admin (see /admin/top-picks), not computed here — up to
  // 3 themes can carry isFeatured at once.
  const topPicks = useMemo(() => themes.filter((t) => t.isFeatured), [themes]);
  const topPickIds = useMemo(() => new Set(topPicks.map((t) => t.id)), [topPicks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return themes.filter((theme) => {
      if (topPickIds.has(theme.id)) return false; // already shown in "Today's top picks"
      const matchesCategory = category === "All" || theme.category === category;
      const matchesSearch = !q || theme.name.toLowerCase().includes(q) || theme.summary.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [themes, category, search, topPickIds]);

  // If every theme happens to be featured, showing an empty "All themes"
  // grid under it would be redundant, unless the visitor is actively
  // filtering/searching.
  const showBrowseSection = themes.length > topPicks.length || category !== "All" || search.trim() !== "";

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-black/[.08] bg-white/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-icon.png" alt="" width={26} height={26} />
              <span className="text-base font-bold text-[#171326]">
                exofe <span className="font-normal text-black/40">/ themes</span>
              </span>
            </Link>

            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setBrowseOpen((v) => !v)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[#171326] hover:bg-black/[.04]"
              >
                Browse themes
                <ChevronDown className={`h-4 w-4 transition-transform ${browseOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {browseOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-black/[.08] bg-white p-1.5 shadow-lg"
                  >
                    {["All", ...CATEGORIES].map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCategory(c);
                          setBrowseOpen(false);
                        }}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/[.04] ${
                          category === c ? "bg-[#f7f4fc] font-semibold text-[#45157b]" : "text-[#171326]"
                        }`}
                      >
                        {c === "All" ? "All categories" : c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <div className="relative flex items-center">
              <AnimatePresence>
                {searchOpen && (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search themes..."
                    className="mr-1 rounded-full border border-black/[.12] bg-white px-3.5 py-1.5 text-sm outline-none focus:border-[#45157b]"
                  />
                )}
              </AnimatePresence>
              <button
                type="button"
                aria-label="Search themes"
                onClick={() => setSearchOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[.04]"
              >
                {searchOpen ? <X className="h-4.5 w-4.5 text-[#171326]" /> : <Search className="h-4.5 w-4.5 text-[#171326]" />}
              </button>
            </div>
            <Link href="/login" className="rounded-full px-3.5 py-2 text-sm font-medium text-[#171326] hover:bg-black/[.04]">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#45157b] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Sign up
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileNavOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[.04] lg:hidden"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-black/[.08] lg:hidden"
            >
              <div className="flex flex-col gap-1 px-5 py-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search themes..."
                  className="mb-2 rounded-lg border border-black/[.12] bg-white px-3.5 py-2 text-sm outline-none focus:border-[#45157b]"
                />
                {["All", ...CATEGORIES].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(c);
                      setMobileNavOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-left text-sm ${
                      category === c ? "bg-[#f7f4fc] font-semibold text-[#45157b]" : "text-[#171326] hover:bg-black/[.04]"
                    }`}
                  >
                    {c === "All" ? "All categories" : c}
                  </button>
                ))}
                <div className="mt-2 flex items-center gap-2 border-t border-black/[.08] pt-3">
                  <Link href="/login" className="flex-1 rounded-full px-3.5 py-2 text-center text-sm font-medium text-[#171326] hover:bg-black/[.04]">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1 rounded-full bg-[#45157b] px-4 py-2 text-center text-sm font-semibold text-white"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="bg-[#f7f4fc] px-5 py-16 lg:px-10 lg:py-24">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#45157b]">Exofe Theme Store</span>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight text-[#171326] lg:text-6xl">
          Choose the right theme for your storefront
        </h1>
        <p className="mt-4 max-w-xl text-black/60">
          Look for a design with the features you need most, built and maintained by Exofe developers.
        </p>
      </section>

      {/* ── Today's top picks ──────────────────────────────────────────── */}
      {!loading && topPicks.length > 0 && (
        <section className="px-5 pt-12 lg:px-10">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#45157b]" />
            <h2 className="text-lg font-semibold text-[#171326]">Today&apos;s top picks</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topPicks.map((theme, i) => (
              <FeaturedThemeCard key={theme.id} theme={theme} index={i} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* ── Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <section className="px-5 py-12 lg:px-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-black/[.08]">
                <div className="h-36 bg-black/[.06]" />
                <div className="space-y-2 p-5">
                  <div className="h-4 w-20 rounded bg-black/[.06]" />
                  <div className="h-5 w-32 rounded bg-black/[.06]" />
                  <div className="h-4 w-full rounded bg-black/[.06]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : themes.length === 0 ? (
        <section className="px-5 py-12 lg:px-10">
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-black/[.12] bg-[#f7f5f0] px-6 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eadaf4]">
              <Store className="h-6 w-6 text-[#45157b]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#171326]">No themes published yet</h3>
            <p className="mt-1 max-w-sm text-sm text-black/55">Approved themes from Exofe developers will show up here.</p>
            <Link
              href="/developer"
              className="mt-5 rounded-full bg-[#45157b] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Explore the Developer Portal
            </Link>
          </div>
        </section>
      ) : showBrowseSection ? (
        <section className="px-5 py-12 lg:px-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#171326]">{category === "All" ? "All themes" : category}</h2>
            <span className="text-sm text-black/50">
              {filtered.length} theme{filtered.length === 1 ? "" : "s"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-black/[.12] bg-[#f7f5f0] px-6 py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eadaf4]">
                <Store className="h-6 w-6 text-[#45157b]" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#171326]">No themes match that search</h3>
              <p className="mt-1 max-w-sm text-sm text-black/55">Try a different category or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((theme, i) => (
                <ThemeCard key={theme.id} theme={theme} index={i} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
