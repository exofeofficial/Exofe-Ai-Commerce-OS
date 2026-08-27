"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, ArrowUp, Bot, Plus, Sparkles, User } from "lucide-react";
import { askAssistant, ApiError, type AssistantReply } from "@/lib/api";
import { getUserProfile } from "@/lib/user";

const EASE = [0.22, 1, 0.36, 1] as const;

const SUGGESTIONS = [
  "How do I connect my WhatsApp number?",
  "Help me add my first product",
  "How does the AI take orders?",
  "What's the difference between the plans?",
];

type ThreadEntry = { question: string; reply: AssistantReply | null; error?: string };

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};

const item: Variants = {
  hidden: { y: 12, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: EASE } },
};

export default function HomeWelcomePage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [firstName, setFirstName] = useState("");
  const [message, setMessage] = useState("");
  const [thread, setThread] = useState<ThreadEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFirstName(getUserProfile()?.firstName ?? "");
  }, []);

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

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setMessage("");
    setThread((prev) => [...prev, { question, reply: null }]);

    try {
      const reply = await askAssistant(question);
      setThread((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, reply } : t)));
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : "Couldn't reach the assistant. Please try again.";
      setThread((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, reply: null, error: errorMsg } : t)));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(message);
  };

  const handleReset = () => {
    setThread([]);
    setMessage("");
  };

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
          {firstName ? `Welcome to Exofe, ${firstName}.` : "Welcome to Exofe."}
          <br />
          <span className="text-[#45157b]">Where do you want to start?</span>
        </h1>

        {/* search bar */}
        <motion.form
          variants={item}
          onSubmit={handleSubmit}
          className="mt-9 flex w-full items-center gap-1.5 rounded-full border border-ink/[.08] bg-surface p-2 pl-3 shadow-sm transition-shadow focus-within:shadow-md"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#45157b]">
            <Bot className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Help me get started"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleReset}
            aria-label="Start a new question"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-ink/[.05] hover:text-foreground/70"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="submit"
            disabled={!message.trim() || loading}
            aria-label="Ask"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[.06] text-foreground/35 transition-colors enabled:bg-[#45157b] enabled:text-white enabled:hover:opacity-90 disabled:cursor-not-allowed"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </motion.form>

        {/* suggestion chips, hidden once a conversation has started */}
        {thread.length === 0 && (
          <motion.div variants={item} className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-ink/[.08] bg-surface px-3.5 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:border-[#45157b]/30 hover:text-[#45157b]"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* conversation thread */}
      <div className="mt-8 flex w-full max-w-2xl flex-col gap-5 pb-10">
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
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#45157b] px-4 py-2.5 text-sm text-white">
                  {entry.question}
                </div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/[.06] text-foreground/50">
                  <User className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#45157b]">
                  <Bot className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                </span>
                {entry.reply ? (
                  <div className="flex max-w-[80%] flex-col items-start gap-2.5">
                    <div className="rounded-2xl rounded-tl-sm border border-ink/[.06] bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm">
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
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-ink/[.06] bg-surface px-4 py-3 shadow-sm">
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
  );
}
