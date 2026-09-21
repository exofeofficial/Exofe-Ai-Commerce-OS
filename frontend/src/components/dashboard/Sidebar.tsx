"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  ChevronDown,
  CreditCard,
  Home,
  LayoutDashboard,
  MessageCircle,
  MoreHorizontal,
  Package,
  Plug,
  Search,
  Settings,
  ShoppingBag,
  SquarePen,
  Trash2,
  Users,
  UserCog,
  Workflow,
  X,
} from "lucide-react";
import UpgradeCard from "@/components/dashboard/UpgradeCard";
import type { TrialStatus } from "@/lib/trial";
import {
  deleteConversation,
  getConversations,
  groupConversationsByDate,
  onConversationsChanged,
  type SavedConversation,
} from "@/lib/conversations";

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;
type NavLink = { type: "link"; label: string; href: string; icon: IconType };
type NavGroup = { type: "group"; label: string; icon: IconType; children: { label: string; href: string }[] };
type NavEntry = NavLink | NavGroup;

// Conversations sits right under Dashboard on purpose, this is a WhatsApp
// automation product, that's where people will spend most of their time.
export const NAV: NavEntry[] = [
  { type: "link", label: "Home", href: "/dashboard/home", icon: Home },
  { type: "link", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { type: "link", label: "Conversations", href: "/dashboard/conversations", icon: MessageCircle },
  { type: "link", label: "Orders", href: "/dashboard/orders", icon: Package },
  { type: "link", label: "Products", href: "/dashboard/products", icon: ShoppingBag },
  { type: "link", label: "Customers", href: "/dashboard/customers", icon: Users },
  { type: "link", label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { type: "link", label: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot },
  {
    type: "group",
    label: "Automation",
    icon: Workflow,
    children: [
      { label: "AI Automations", href: "/dashboard/automation/ai" },
      { label: "Interactive Messages", href: "/dashboard/automation/interactive-messages" },
      { label: "Templates", href: "/dashboard/automation/templates" },
      { label: "Flow Builder", href: "/dashboard/automation/flow-builder" },
    ],
  },
  { type: "link", label: "Team", href: "/dashboard/team", icon: UserCog },
  { type: "link", label: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { type: "link", label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { type: "link", label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function flatLinks(): { label: string; href: string }[] {
  return NAV.flatMap((entry) => (entry.type === "link" ? [{ label: entry.label, href: entry.href }] : entry.children));
}

// Same flatten, but keeps the icon (group children inherit their group's
// icon) — for the "all pages" grids (mobile MoreSheet).
export function flatNavItemsWithIcons(): { label: string; href: string; icon: IconType }[] {
  return NAV.flatMap((entry) =>
    entry.type === "link"
      ? [{ label: entry.label, href: entry.href, icon: entry.icon }]
      : entry.children.map((c) => ({ label: c.label, href: c.href, icon: entry.icon }))
  );
}

// Nested routes (like /dashboard/integrations/whatsapp) should still
// highlight their parent nav item and use its label as the page title.
// Picks the longest NAV href that prefixes the current path.
export function getActiveNavHref(pathname: string | null): string {
  const links = flatLinks();
  if (!pathname) return links[0].href;
  const match = [...links]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  return match?.href ?? links[0].href;
}

// Used for the Topbar title, returns the matched link's own label, so a
// route inside the Automation group shows "Interactive Messages", not
// the group name "Automation".
export function getPageTitle(pathname: string | null): string {
  const activeHref = getActiveNavHref(pathname);
  return flatLinks().find((l) => l.href === activeHref)?.label ?? "Dashboard";
}

const EASE = [0.22, 1, 0.36, 1] as const;

// Stable reference — useSyncExternalStore's server-snapshot must return the
// same value every call, a fresh `[]` literal each render would not.
const EMPTY_CONVERSATIONS: SavedConversation[] = [];

// Flush against the topbar and left edge (no margin, no rounding, no own
// logo header) — the logo already lives in the always-full-width Topbar
// now, so repeating it here would just be noise.
export default function Sidebar({ onClose, trial }: { onClose?: () => void; trial: TrialStatus }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = getActiveNavHref(pathname);

  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    const group = NAV.find((n): n is NavGroup => n.type === "group" && n.children.some((c) => c.href === activeHref));
    return group?.label ?? null;
  });

  // Home page and Sidebar are siblings in the dashboard layout, not
  // parent/child, so this subscribes to the custom event conversations.ts
  // dispatches rather than receiving the list as a prop. useSyncExternalStore
  // (not a state+effect pair) because localStorage is exactly the kind of
  // external mutable source it exists for — server snapshot is a stable
  // empty array since localStorage doesn't exist during SSR.
  const conversations = useSyncExternalStore(onConversationsChanged, getConversations, () => EMPTY_CONVERSATIONS);

  // The search/new-conversation/history panel is portalled to document.body
  // rather than rendered in place — the sidebar's own root has
  // overflow-hidden (needed to contain the scrollable nav within its
  // rounded shell), which would otherwise clip a panel this size, and the
  // trigger sits close to the bottom of a 256px-wide column with no room
  // for a wider dropdown to open downward.
  const conversationsTriggerRef = useRef<HTMLButtonElement>(null);
  const [conversationsOpen, setConversationsOpen] = useState(false);
  const [conversationsQuery, setConversationsQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [panelPos, setPanelPos] = useState<{ left: number; bottom: number } | null>(null);

  const closeConversationsPanel = () => {
    setConversationsOpen(false);
    setConversationsQuery("");
    setOpenMenuId(null);
  };

  const openConversationsPanel = () => {
    const rect = conversationsTriggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPanelPos({ left: rect.right + 8, bottom: window.innerHeight - rect.bottom });
    }
    setConversationsOpen(true);
  };

  useEffect(() => {
    if (!conversationsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConversationsPanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [conversationsOpen]);

  const filteredConversations = groupConversationsByDate(
    conversations.filter((c) => c.title.toLowerCase().includes(conversationsQuery.trim().toLowerCase()))
  );

  const goToConversation = (id: string) => {
    router.push(`/dashboard/home?c=${id}`);
    onClose?.();
    closeConversationsPanel();
  };

  const startNewConversation = () => {
    router.push("/dashboard/home");
    onClose?.();
    closeConversationsPanel();
  };

  const removeConversation = (id: string) => {
    deleteConversation(id);
    setOpenMenuId(null);
    // If the deleted conversation is the one currently open, drop the ?c=
    // param too — otherwise the page would keep showing a thread that no
    // longer exists in storage.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("c") === id) {
      router.push("/dashboard/home");
    }
  };

  // Settings is pinned below the scrollable list, separated by its own
  // divider — same spot it sits in the Shopify layout this was matched to,
  // rather than competing for space with the main nav items above it.
  const mainNav = NAV.filter((entry) => entry.label !== "Settings");
  const settingsEntry = NAV.find((entry): entry is NavLink => entry.label === "Settings");

  const renderEntry = (entry: NavEntry) => {
    const Icon = entry.icon;

    if (entry.type === "link") {
      const isActive = entry.href === activeHref;
      return (
        <Link
          key={entry.href}
          href={entry.href}
          onClick={onClose}
          className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-black/[.04]"
        >
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute inset-0 rounded-lg bg-white shadow-sm"
            />
          )}
          <Icon className={`relative h-[18px] w-[18px] shrink-0 ${isActive ? "text-[#45157b]" : "text-foreground/50"}`} strokeWidth={2} />
          <span className={`relative ${isActive ? "font-semibold text-[#45157b]" : "text-foreground/75"}`}>{entry.label}</span>
        </Link>
      );
    }

    const hasActiveChild = entry.children.some((c) => c.href === activeHref);
    const isOpen = openGroup === entry.label;

    return (
      <div key={entry.label}>
        <button
          type="button"
          onClick={() => setOpenGroup(isOpen ? null : entry.label)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] ${
            hasActiveChild ? "text-[#45157b]" : "text-foreground/75"
          }`}
        >
          <Icon className={`h-[18px] w-[18px] shrink-0 ${hasActiveChild ? "text-[#45157b]" : "text-foreground/50"}`} strokeWidth={2} />
          <span className="flex-1 text-left">{entry.label}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-[27px] flex flex-col gap-0.5 border-l border-black/[.08] py-1 pl-3">
                {entry.children.map((child) => {
                  const isActive = child.href === activeHref;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onClose}
                      className={`rounded-lg px-2.5 py-2 text-sm transition-colors ${
                        isActive ? "bg-white font-medium text-[#45157b] shadow-sm" : "text-foreground/55 hover:bg-black/[.04]"
                      }`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="fixed left-0 top-16 z-20 hidden h-[calc(100vh-4rem)] w-64 flex-col overflow-hidden border-r border-black/[.06] bg-[#f4f4f5] lg:flex">
      {onClose && (
        <div className="flex items-center justify-end px-5 py-4 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-black/[.05] hover:text-foreground"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
      )}

      <nav className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pt-4 pb-2">{mainNav.map(renderEntry)}</nav>

      {/* Resumable — clicking loads the saved thread back into the Home
          page via ?c=<id> (see HomeWelcomePage's lazy useState initializer). */}
      {conversations.length > 0 && (
        <div className="relative shrink-0 border-t border-black/[.06] px-3 py-2.5">
          <button
            ref={conversationsTriggerRef}
            type="button"
            onClick={() => (conversationsOpen ? closeConversationsPanel() : openConversationsPanel())}
            className="flex w-full items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold text-foreground/50 transition-colors hover:bg-black/[.04]"
          >
            Exo Conversations
            <ChevronDown
              className={`h-3 w-3 transition-transform ${conversationsOpen ? "rotate-180" : ""}`}
              strokeWidth={2.4}
            />
          </button>
          <div className="mt-0.5 flex flex-col gap-0.5">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/home?c=${c.id}`}
                onClick={onClose}
                title={c.title}
                className="truncate rounded-lg px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-black/[.04]"
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {settingsEntry && (
        <div className="relative border-t border-black/[.06] px-3 py-2">{renderEntry(settingsEntry)}</div>
      )}

      <div className="relative border-t border-black/[.06] p-3">
        <UpgradeCard trial={trial} />
      </div>

      {conversationsOpen &&
        panelPos &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close conversation list"
              onClick={closeConversationsPanel}
              className="fixed inset-0 z-[100] cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: EASE }}
              style={{ left: panelPos.left, bottom: panelPos.bottom }}
              className="fixed z-[101] w-80 overflow-hidden rounded-xl border border-black/[.08] bg-white shadow-lg"
            >
              <div className="flex items-center gap-2 border-b border-black/[.06] px-3 py-2.5">
                <Search className="h-4 w-4 shrink-0 text-foreground/40" strokeWidth={2} />
                <input
                  autoFocus
                  value={conversationsQuery}
                  onChange={(e) => setConversationsQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
                />
              </div>

              <button
                type="button"
                onClick={startNewConversation}
                className="flex w-full items-center gap-2.5 border-b border-black/[.06] px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-black/[.04]"
              >
                <SquarePen className="h-4 w-4 text-foreground/50" strokeWidth={2} />
                New conversation
              </button>

              <div className="max-h-72 overflow-y-auto py-1.5">
                {filteredConversations.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-foreground/40">No conversations found</p>
                ) : (
                  filteredConversations.map((group) => (
                    <div key={group.label} className="px-1.5 py-1">
                      <p className="px-2 py-1 text-xs font-semibold text-foreground/40">{group.label}</p>
                      {group.items.map((c) => (
                        <div key={c.id} className="group/row relative flex items-center rounded-lg hover:bg-black/[.04]">
                          <button
                            type="button"
                            onClick={() => goToConversation(c.id)}
                            className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-sm text-foreground/70"
                          >
                            {c.title}
                          </button>
                          <div className="relative shrink-0 pr-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === c.id ? null : c.id);
                              }}
                              aria-label="Conversation options"
                              className={`flex h-7 w-7 items-center justify-center rounded-md text-foreground/40 opacity-0 transition-opacity hover:bg-black/[.08] hover:text-foreground group-hover/row:opacity-100 ${
                                openMenuId === c.id ? "opacity-100" : ""
                              }`}
                            >
                              <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                            </button>
                            {openMenuId === c.id && (
                              <div className="absolute bottom-full right-0 z-10 mb-1 w-32 overflow-hidden rounded-lg border border-black/[.08] bg-white shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => removeConversation(c.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>,
          document.body
        )}
    </div>
  );
}
