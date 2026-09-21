"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { AlertCircle, ArrowRight, ArrowUp, ArrowUpRight, ChevronDown, Paperclip, Plus, Sparkles, User, X } from "lucide-react";
import { askAssistant, ApiError } from "@/lib/api";
import { getUserProfile } from "@/lib/user";
import { getConversation, upsertConversation, type ThreadEntry } from "@/lib/conversations";

const EASE = [0.22, 1, 0.36, 1] as const;

const SUGGESTIONS = [
  "How do I connect my WhatsApp number?",
  "Help me add my first product",
  "How does the AI take orders?",
  "What's the difference between the plans?",
];

const THEMES = [
  { name: "Aurora", tag: "Free", gradient: "from-[#45157b] to-[#7c3aed]" },
  { name: "Sandstone", tag: "Premium", gradient: "from-[#fde9a8] to-[#fcba03]" },
  { name: "Midnight", tag: "Premium", gradient: "from-[#171326] to-[#45157b]" },
  { name: "Meadow", tag: "Free", gradient: "from-emerald-300 to-emerald-600" },
  { name: "Blossom", tag: "Premium", gradient: "from-pink-300 to-rose-500" },
  { name: "Slate", tag: "Free", gradient: "from-slate-300 to-slate-600" },
] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};

const item: Variants = {
  hidden: { y: 12, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: EASE } },
};

// Suggestions cascade in one-by-one from the left, like a stack unfurling,
// rather than all fading in together as one block.
const suggestionContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const suggestionItem: Variants = {
  hidden: { x: -24, opacity: 0 },
  show: { x: 0, opacity: 1, transition: { duration: 0.35, ease: EASE } },
};

type AttachedImage = { file: File; dataUrl: string };

// Shared by both the empty-state search bar and the in-thread input below —
// opens upward ("up") for the latter since it's pinned to the bottom of the
// screen, downward otherwise.
function PlusMenu({
  open,
  direction,
  onToggle,
  onClose,
  onUpload,
  onDescribeIssue,
}: {
  open: boolean;
  direction: "up" | "down";
  onToggle: () => void;
  onClose: () => void;
  onUpload: () => void;
  onDescribeIssue: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Add attachment"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-ink/[.05] hover:text-foreground/70"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="fixed inset-0 z-40 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: direction === "up" ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: direction === "up" ? 6 : -6 }}
              transition={{ duration: 0.15, ease: EASE }}
              className={`absolute z-50 w-64 overflow-hidden rounded-2xl border border-ink/[.08] bg-white py-1.5 shadow-lg dark:bg-[#171326] ${
                direction === "up" ? "bottom-full left-0 mb-2 origin-bottom-left" : "top-full left-0 mt-2 origin-top-left"
              }`}
            >
              <button
                type="button"
                onClick={onUpload}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-ink/[.04]"
              >
                <Paperclip className="h-4 w-4 shrink-0 text-foreground/50" strokeWidth={2} />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">Upload image</span>
                  <span className="block text-xs text-foreground/45">Attach a screenshot for Xo to look at</span>
                </span>
              </button>
              <button
                type="button"
                onClick={onDescribeIssue}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-ink/[.04]"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-foreground/50" strokeWidth={2} />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">Describe an issue</span>
                  <span className="block text-xs text-foreground/45">Start a message about a problem you&apos;re facing</span>
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AttachmentChip({ image, onRemove }: { image: AttachedImage; onRemove: () => void }) {
  return (
    <div className="group relative shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.dataUrl} alt={image.file.name} className="h-9 w-9 rounded-lg object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${image.file.name}`}
        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-white"
      >
        <X className="h-2.5 w-2.5" strokeWidth={3} />
      </button>
    </div>
  );
}

export default function HomeWelcomePage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get("c");

  const [firstName, setFirstName] = useState("");
  const [message, setMessage] = useState("");
  // Lazy initializers cover the very first load of /dashboard/home?c=<id>;
  // the effect below covers a sidebar Link navigating to a *different*
  // ?c=<id> while this same page instance is already mounted — Next's
  // router doesn't remount a page for a same-route search-param change, so
  // without it a second conversation's link would silently do nothing.
  const [thread, setThread] = useState<ThreadEntry[]>(() =>
    conversationParam ? (getConversation(conversationParam)?.entries ?? []) : []
  );
  const [conversationId, setConversationId] = useState(
    () => getConversation(conversationParam ?? "")?.id ?? crypto.randomUUID()
  );
  const [loading, setLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [plusOpen, setPlusOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFirstName(getUserProfile()?.firstName ?? "");
  }, []);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets picking the same file again re-fire onChange
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedImage({ file, dataUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleDescribeIssue = () => {
    setPlusOpen(false);
    setMessage((prev) => prev || "I'm having trouble with ");
    requestAnimationFrame(() => messageInputRef.current?.focus());
  };

  // React's documented "adjusting state when a prop changes" pattern —
  // computed during render rather than in an effect, so a sidebar Link
  // navigating to a different ?c=<id> takes effect on the very next paint
  // instead of one render later.
  const [prevConversationParam, setPrevConversationParam] = useState(conversationParam);
  if (conversationParam !== prevConversationParam) {
    setPrevConversationParam(conversationParam);
    if (conversationParam) {
      const saved = getConversation(conversationParam);
      if (saved) {
        setConversationId(saved.id);
        setThread(saved.entries);
      }
    } else {
      // The sidebar's "New conversation" action (and deleting the
      // currently-open one) navigate here by dropping the ?c= param —
      // without this branch the old thread would keep showing since
      // nothing else clears it for a param that disappears.
      setConversationId(crypto.randomUUID());
      setThread([]);
    }
  }

  // Same GSAP SplitText letter reveal used on the marketing site's Hero
  // heading (skewX + opacity, per-character stagger) — the welcome
  // message here is meant to feel like the same product, same voice.
  useLayoutEffect(() => {
    gsap.registerPlugin(SplitText);
    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = new SplitText(headingRef.current, { type: "words, chars", wordsClass: "split-word" });
      gsap.set(split.chars, { transformPerspective: 400 });

      gsap.fromTo(
        split.chars,
        { skewX: 30, opacity: 0 },
        { skewX: 0, opacity: 1, ease: "none", stagger: { each: 0.5 / split.chars.length, from: "start" } }
      );
    }, sectionRef);

    return () => {
      ctx.revert();
      split?.revert();
    };
  }, [firstName]);

  const ask = async (question: string, image?: AttachedImage | null) => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setMessage("");
    setAttachedImage(null);

    // Built explicitly (not via the setThread(prev => ...) updater form)
    // because upsertConversation needs the actual array to persist, not
    // just a React state update.
    const withQuestion = [...thread, { question, reply: null, imageUrl: image?.dataUrl }];
    setThread(withQuestion);
    upsertConversation(conversationId, withQuestion[0].question, withQuestion);

    try {
      const reply = await askAssistant(question, image?.file);
      const withReply = withQuestion.map((t, i) => (i === withQuestion.length - 1 ? { ...t, reply } : t));
      setThread(withReply);
      upsertConversation(conversationId, withReply[0].question, withReply);
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : "Couldn't reach the assistant. Please try again.";
      const withError = withQuestion.map((t, i) => (i === withQuestion.length - 1 ? { ...t, reply: null, error: errorMsg } : t));
      setThread(withError);
      upsertConversation(conversationId, withError[0].question, withError);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(message, attachedImage);
  };

  const handleReset = () => {
    setThread([]);
    setMessage("");
    setAttachedImage(null);
    setConversationId(crypto.randomUUID());
    // Silent URL cleanup, not a Next navigation — a refresh shouldn't
    // re-resume the conversation just closed.
    window.history.replaceState(null, "", "/dashboard/home");
  };

  if (thread.length > 0) {
    return (
      // In-flow, not fixed — this only takes over the dashboard's own
      // content area, so the real Topbar/Sidebar chrome stays visible and
      // untouched around it. No background of its own — it sits directly
      // on whatever the page behind it already is.
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* top bar — same max-w-2xl centered width as the thread/input
            below, so the title and the +/close buttons sit close together
            instead of stretching to the full (much wider) content column */}
        <div className="mx-auto flex w-full max-w-2xl shrink-0 items-center justify-between gap-3 border-b border-ink/[.06] px-4 py-3.5 sm:px-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{thread[0].question}</p>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground/40" strokeWidth={2} />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleReset}
              aria-label="Start a new chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-ink/[.05] hover:text-foreground"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Close chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-ink/[.05] hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* scrollable thread */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
            <AnimatePresence initial={false}>
              {thread.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-start justify-end gap-2.5">
                    <div className="flex max-w-[80%] flex-col items-end gap-1.5">
                      {entry.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.imageUrl} alt="" className="h-28 w-28 rounded-2xl object-cover" />
                      )}
                      <div className="rounded-2xl rounded-tr-sm bg-[#45157b] px-4 py-2.5 text-sm text-white">
                        {entry.question}
                      </div>
                    </div>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/[.06] text-foreground/50">
                      <User className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/XO%20Icon.png" alt="" className="h-6 w-6 object-contain contrast-125" />
                    </span>
                    {entry.reply ? (
                      <div className="flex max-w-[80%] flex-col items-start gap-2.5">
                        <div className="rounded-2xl rounded-tl-sm border border-ink/[.06] bg-white px-4 py-2.5 text-sm text-foreground shadow-sm">
                          {entry.reply.reply}
                        </div>
                        {entry.reply.suggestedHref && (
                          <Link
                            href={entry.reply.suggestedHref}
                            className="flex items-center gap-1.5 rounded-full bg-[#FCBA03] px-4 py-2 text-xs font-bold text-[#1a1730] transition-transform hover:scale-[1.02]"
                          >
                            {entry.reply.suggestedLabel ?? "Take me there"}
                            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                          </Link>
                        )}
                      </div>
                    ) : entry.error ? (
                      <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400">
                        {entry.error}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-ink/[.06] bg-white px-4 py-3 shadow-sm">
                        {[0, 1, 2].map((d) => (
                          <motion.span
                            key={d}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: d * 0.15, ease: "easeInOut" }}
                            className="h-1.5 w-1.5 rounded-full bg-foreground/40"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* bottom input */}
        <div className="shrink-0 border-t border-ink/[.06] px-4 py-4 sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-2xl items-center gap-1.5 rounded-full border border-ink/[.08] bg-white p-2 pl-3 shadow-sm transition-shadow focus-within:shadow-md"
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
            <PlusMenu
              open={plusOpen}
              direction="up"
              onToggle={() => setPlusOpen((v) => !v)}
              onClose={() => setPlusOpen(false)}
              onUpload={() => {
                setPlusOpen(false);
                fileInputRef.current?.click();
              }}
              onDescribeIssue={handleDescribeIssue}
            />
            {attachedImage && <AttachmentChip image={attachedImage} onRemove={() => setAttachedImage(null)} />}
            <input
              ref={messageInputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask anything..."
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!message.trim() || loading}
              aria-label="Ask"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[.06] text-foreground/35 transition-colors enabled:bg-[#45157b] enabled:text-white enabled:hover:opacity-90 disabled:cursor-not-allowed"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="flex min-h-[calc(100vh-8rem)] flex-col items-center px-4 pt-10 sm:pt-16">
      <motion.div initial="hidden" animate="show" variants={container} className="flex w-full max-w-2xl flex-col items-center text-center">
        <motion.span
          variants={item}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/[.08] bg-surface px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/50 shadow-sm"
        >
          <Sparkles className="h-3 w-3 text-[#45157b]" strokeWidth={2.4} />
          Exofe Assistant
        </motion.span>

        <h1
          ref={headingRef}
          className="mt-6 text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl"
          style={{ perspective: 400 }}
        >
          {firstName ? `Meet Xo, ${firstName}.` : "Meet "}
          <span className="text-[#45157b]">Xo</span> AI that understands your busines
        </h1>

        {/* search bar */}
        <motion.form
          variants={item}
          onSubmit={handleSubmit}
          className="mt-9 flex w-full items-center gap-1.5 rounded-full border border-ink/[.08] bg-surface p-2 pl-3 shadow-sm transition-shadow focus-within:shadow-md"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/XO%20Icon.png" alt="" className="h-8 w-8 object-contain contrast-125" />
          </span>
          <input
            ref={messageInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Help me get started"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
          />
          {attachedImage && <AttachmentChip image={attachedImage} onRemove={() => setAttachedImage(null)} />}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
          <PlusMenu
            open={plusOpen}
            direction="down"
            onToggle={() => setPlusOpen((v) => !v)}
            onClose={() => setPlusOpen(false)}
            onUpload={() => {
              setPlusOpen(false);
              fileInputRef.current?.click();
            }}
            onDescribeIssue={handleDescribeIssue}
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            aria-label="Ask"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[.06] text-foreground/35 transition-colors enabled:bg-[#45157b] enabled:text-white enabled:hover:opacity-90 disabled:cursor-not-allowed"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </motion.form>
      </motion.div>

      {/* Suggestions replace the themes section, in the same spot, while the
          input is focused — a plain inline list (no card/border/shadow),
          not a floating popup, per reference. onMouseDown fires before the
          input's onBlur so picking a suggestion registers before the list
          would otherwise close out from under the click. */}
      {isInputFocused && thread.length === 0 ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={suggestionContainer}
          className="mt-8 flex w-full max-w-2xl flex-col"
        >
          {SUGGESTIONS.map((s) => (
            <motion.button
              key={s}
              variants={suggestionItem}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                ask(s);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-left text-sm text-foreground/70 transition-colors hover:bg-ink/[.04] hover:text-foreground"
            >
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-foreground/30" strokeWidth={2.4} />
              {s}
            </motion.button>
          ))}
        </motion.div>
      ) : null}

      {/* themes — hidden whenever the suggestions list above is showing in
          its place */}
      {!(isInputFocused && thread.length === 0) && (
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="mt-12 flex w-full max-w-7xl flex-col items-center"
      >
        <motion.h2 variants={item} className="w-full text-left text-2xl font-bold text-foreground">
          Exofe <span className="italic font-medium ">Premium &amp; Free</span> Themes
        </motion.h2>

        <div className="mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((theme) => (
            <motion.div
              key={theme.name}
              variants={item}
              className="group overflow-hidden rounded-2xl border border-ink/[.06] bg-surface shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`relative aspect-[4/3] bg-gradient-to-br ${theme.gradient}`}>
                <span
                  className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    theme.tag === "Premium" ? "bg-white/90 text-[#171326]" : "bg-black/30 text-white"
                  }`}
                >
                  {theme.tag}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{theme.name}</p>
                <ArrowRight className="h-3.5 w-3.5 text-foreground/30 transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={item} className="mt-5">
          <Link
            href="/dashboard/themes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#45157b] hover:underline"
          >
            Explore themes
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </motion.div>
      </motion.div>
      )}
    </div>
  );
}
