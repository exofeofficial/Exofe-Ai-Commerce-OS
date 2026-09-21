"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { flatNavItemsWithIcons } from "@/components/dashboard/Sidebar";

const EASE = [0.22, 1, 0.36, 1] as const;
const ALL_ITEMS = flatNavItemsWithIcons();

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

// Pills filter by matching against the same flattened nav list rather than
// a separate category dataset — one source of truth for "what pages exist",
// so a renamed/added nav entry never needs a second place updated.
const CATEGORIES: { label: string; test: (label: string) => boolean }[] = [
  { label: "Orders", test: (l) => /order|shipping/i.test(l) },
  { label: "Products", test: (l) => /product/i.test(l) },
  { label: "Customers", test: (l) => /customer/i.test(l) },
  { label: "Conversations", test: (l) => /conversation|whatsapp/i.test(l) },
  { label: "Automation", test: (l) => /automation|flow|template|interactive/i.test(l) },
  { label: "Analytics", test: (l) => /analytic/i.test(l) },
  { label: "Settings", test: (l) => /setting|team|integration|billing/i.test(l) },
];

// `open` is owned by the parent (Topbar) so both its search-bar button and
// the global Ctrl+K listener below drive the exact same instance instead of
// each needing their own state wiring.
export default function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K — works from anywhere in the dashboard since this
  // component lives in the always-mounted Topbar, not just while its own
  // trigger button has focus.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // Reset search state when `open` flips true — done during render (React's
  // documented pattern for "adjusting state when a prop changes") rather
  // than in an effect, since an effect body calling setState synchronously
  // causes an extra wasted render on every open.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveCategory(null);
      setHighlighted(0);
    }
  }

  // Focusing the input IS a real effect (an imperative DOM action), so it
  // stays here rather than joining the state reset above.
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo(() => {
    const category = CATEGORIES.find((c) => c.label === activeCategory);
    const q = query.trim().toLowerCase();
    return ALL_ITEMS.filter((item) => {
      if (category && !category.test(item.label)) return false;
      if (q && !item.label.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, activeCategory]);

  // Empty state (Shopify's "Find anything in ...") only when nothing's
  // been asked for yet — as soon as a category or query narrows things,
  // show the (possibly empty) results instead.
  const showEmptyState = !query && !activeCategory;

  const goTo = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showEmptyState || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[highlighted];
      if (item) goTo(item.href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 cursor-default bg-black/40"
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-black/[.06] px-4 py-3.5">
              <Search className="h-4 w-4 shrink-0 text-foreground/40" strokeWidth={2} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 px-4 py-3">
              {CATEGORIES.map((c) => {
                const isActive = activeCategory === c.label;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      setActiveCategory(isActive ? null : c.label);
                      setHighlighted(0);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive ? "bg-[#45157b] text-white" : "bg-black/[.05] text-foreground/70 hover:bg-black/[.08]"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {showEmptyState ? (
              <div className="flex flex-col items-center gap-3 px-4 pb-10 pt-6 text-center">
                <Search className="h-8 w-8 text-foreground/20" strokeWidth={1.5} />
                <p className="text-sm text-foreground/50">Find anything in Exofe</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto border-t border-black/[.06] p-2">
                {results.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-foreground/45">No matches for that search.</p>
                ) : (
                  results.map((item, i) => {
                    const Icon: IconType = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onMouseEnter={() => setHighlighted(i)}
                        onClick={() => goTo(item.href)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                          i === highlighted ? "bg-[#45157b]/[.08] text-[#45157b]" : "text-foreground/75"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                        {item.label}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
