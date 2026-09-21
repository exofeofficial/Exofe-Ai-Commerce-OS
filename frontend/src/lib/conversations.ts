import type { AssistantReply } from "@/lib/api";

// Recently started Exo Assistant conversations, shown in the sidebar and
// resumable from there. No backend thread-history endpoint exists yet, so
// this is a client-side log stored in localStorage rather than real
// server-persisted chat history.
const STORAGE_KEY = "exofe_conversations";
const MAX_ENTRIES = 10;
const CHANGE_EVENT = "exofe-conversations-changed";

export type ThreadEntry = { question: string; reply: AssistantReply | null; error?: string; imageUrl?: string };
export type SavedConversation = { id: string; title: string; entries: ThreadEntry[]; createdAt: number };

// useSyncExternalStore requires getSnapshot to return a referentially
// stable value when nothing has actually changed — JSON.parse-ing on every
// call would hand back a new array each time and trigger React's "the
// result of getSnapshot should be cached" infinite-loop guard. Caching the
// last-parsed result against the raw string it came from keeps the same
// array reference across calls until the underlying value truly changes.
let cachedRaw: string | null = null;
let cachedParsed: SavedConversation[] = [];

export function getConversations(): SavedConversation[] {
  if (typeof window === "undefined") return cachedParsed;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedParsed = raw ? (JSON.parse(raw) as SavedConversation[]) : [];
    } catch {
      cachedParsed = [];
    }
  }

  return cachedParsed;
}

export function getConversation(id: string): SavedConversation | null {
  return getConversations().find((c) => c.id === id) ?? null;
}

export function groupConversationsByDate(conversations: SavedConversation[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const groups = new Map<string, SavedConversation[]>();
  for (const c of conversations) {
    const label = c.createdAt >= startOfToday ? "Today" : c.createdAt >= startOfYesterday ? "Yesterday" : "Older";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(c);
  }

  return ["Today", "Yesterday", "Older"]
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label)! }));
}

// Called after every exchange in a thread (not just the first question) so
// the saved copy stays in sync with what's on screen. Upserts by id rather
// than always prepending, so continuing an existing chat updates it in
// place — and moves it to the top — instead of creating a duplicate entry.
export function upsertConversation(id: string, title: string, entries: ThreadEntry[]) {
  if (typeof window === "undefined") return;
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return;

  const existing = getConversations();
  // Preserve the original createdAt across updates — only a brand-new
  // conversation id gets "now", otherwise every reply would bump it to the
  // top of its date group instead of staying under the day it started.
  const createdAt = existing.find((c) => c.id === id)?.createdAt ?? Date.now();
  const withoutThis = existing.filter((c) => c.id !== id);
  const next = [{ id, title: trimmedTitle, entries, createdAt }, ...withoutThis].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function deleteConversation(id: string) {
  if (typeof window === "undefined") return;
  const next = getConversations().filter((c) => c.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Sidebar and the Home page are siblings in the dashboard layout, not
// parent/child, so a plain callback prop can't connect them — this custom
// event is how the sidebar notices a new/updated conversation without a
// shared state library.
export function onConversationsChanged(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
