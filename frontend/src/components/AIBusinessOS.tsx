"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Megaphone,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const item: Variants = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

const LEFT_MODULES = [
  { id: "store", label: "Store", icon: Store, insight: "Your homepage CTA could convert 12% better." },
  { id: "products", label: "Products", icon: Package, insight: "3 best-selling products are running low on stock." },
  { id: "orders", label: "Orders", icon: ShoppingBag, insight: "Order volume is up 18% compared to last week." },
] as const;

const RIGHT_MODULES = [
  { id: "customers", label: "Customers", icon: Users, insight: "42 repeat customers haven't ordered in 30 days." },
  { id: "marketing", label: "Marketing", icon: Megaphone, insight: "Your best seller isn't in any active campaign." },
  { id: "analytics", label: "Analytics", icon: BarChart3, insight: "Weekend evenings are your strongest sales window." },
] as const;

const ALL_MODULES = [...LEFT_MODULES, ...RIGHT_MODULES];

const DEFAULT_INSIGHT = "Tap a module to see what Exofe AI notices about it.";

const RECOMMENDATIONS = [
  { text: "Promote your best seller", status: "Executed" },
  { text: "Re-engage repeat customers", status: "Approved" },
  { text: "Improve homepage CTA", status: "Pending" },
] as const;

const VALUE_POINTS = [
  {
    title: "Understand your business",
    desc: "AI sees the full picture across products, customers, sales, and performance.",
  },
  {
    title: "Recommend the next move",
    desc: "Get intelligent suggestions based on what's actually happening in your business.",
  },
  {
    title: "Take action with approval",
    desc: "Let AI help execute updates, campaigns, and optimizations safely.",
  },
];

type Module = (typeof ALL_MODULES)[number];

// 3 module cards stacked with justify-between (first flush to the top,
// last flush to the bottom) — their centers land at ~11%, 50%, ~89% of
// the column's height for a typical card size. Positioned absolute
// (inset-y-0) rather than a flex h-full, since SVG is a replaced element
// and percentage/flex-stretch heights on it are unreliable across
// browsers — absolute inset against a `relative` ancestor isn't.
const CONNECTOR_PATHS = [
  "M0 14 C 16 14, 16 50, 32 50",
  "M0 50 L 32 50",
  "M0 86 C 16 86, 16 50, 32 50",
];

function ConnectorLines({ mirror }: { mirror?: boolean }) {
  const gradientId = `ai-connector-flow-${mirror ? "right" : "left"}`;
  return (
    <svg
      viewBox="0 0 32 100"
      preserveAspectRatio="none"
      className={`absolute inset-y-0 hidden h-full w-8 sm:block ${mirror ? "left-0 -scale-x-100" : "right-0"}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#45157b" stopOpacity="0" />
          <stop offset="50%" stopColor="#fcba03" stopOpacity="1" />
          <stop offset="100%" stopColor="#45157b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {CONNECTOR_PATHS.map((d, i) => (
        <path key={`base-${i}`} d={d} stroke="currentColor" strokeWidth="1.5" fill="none" className="text-black/10" />
      ))}
      {CONNECTOR_PATHS.map((d, i) => (
        <path
          key={`flow-${i}`}
          d={d}
          pathLength={100}
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeDasharray="25 75"
          strokeLinecap="round"
          fill="none"
          style={{ animation: `connector-flow 2.4s linear infinite`, animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </svg>
  );
}

function ModuleCard({
  mod,
  align,
  onSelect,
  isActive,
}: {
  mod: Module;
  align?: "left" | "right";
  onSelect: (insight: string) => void;
  isActive: boolean;
}) {
  const Icon = mod.icon;
  return (
    <button
      type="button"
      onMouseEnter={() => onSelect(mod.insight)}
      onFocus={() => onSelect(mod.insight)}
      onClick={() => onSelect(mod.insight)}
      className={`module-card flex w-full items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
        align === "right" ? "sm:flex-row-reverse sm:text-right" : ""
      } ${
        isActive
          ? "border-[#45157b]/40 bg-[#45157b]/[.06] text-[#45157b] shadow-sm"
          : "border-black/[.06] bg-white text-foreground/70 hover:border-[#45157b]/20"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
          isActive ? "bg-[#45157b] text-white" : "bg-[#f7f4fc] text-[#45157b]"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      {mod.label}
    </button>
  );
}

function AIPanel({ activeInsight }: { activeInsight: string | null }) {
  return (
    <div className="ai-panel relative flex w-full max-w-xs flex-col gap-3.5 rounded-[24px] border border-white/10 bg-[#250B43] p-5 shadow-xl shadow-[#45157b]/20 sm:gap-4 sm:rounded-[28px] sm:p-6">
      <div className="pointer-events-none absolute -inset-px rounded-[24px] bg-gradient-to-br from-[#45157b]/40 via-transparent to-[#fcba03]/10 sm:rounded-[28px]" />

      <div className="relative flex items-center">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-[#fcba03]" strokeWidth={2.2} />
          Exofe AI
        </span>
      </div>

      <div className="relative min-h-[2.5rem] rounded-xl bg-white/5 px-3 py-2.5 text-xs leading-relaxed text-white/70">
        {activeInsight ?? DEFAULT_INSIGHT}
      </div>

      <div className="relative rounded-xl bg-white/[.04] p-3">
        <p className="text-[11px] font-semibold text-white/50">&quot;How can I grow sales this week?&quot;</p>
        <ul className="mt-2.5 flex flex-col gap-2">
          {RECOMMENDATIONS.map((r) => (
            <li key={r.text} className="flex items-center justify-between gap-2 text-xs text-white/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#fcba03]" strokeWidth={2.2} />
                {r.text}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                  r.status === "Executed"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : r.status === "Approved"
                      ? "bg-[#fcba03]/15 text-[#fcba03]"
                      : "bg-white/10 text-white/50"
                }`}
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AIBusinessOS() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = new SplitText(headingRef.current, { type: "words, chars", wordsClass: "split-word" });
      gsap.set(split.chars, { transformPerspective: 400 });
      gsap.fromTo(
        split.chars,
        { skewX: 14, rotateZ: -2, opacity: 0 },
        {
          skewX: 0,
          rotateZ: 0,
          opacity: 1,
          ease: "none",
          stagger: { each: 0.5 / split.chars.length, from: "start" },
          scrollTrigger: { trigger: headingRef.current, start: "top 90%", end: "top 40%", scrub: 0.8 },
        }
      );

      gsap.fromTo(
        ".module-card",
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: visualRef.current, start: "top 80%", toggleActions: "play none none reverse" },
        }
      );
      gsap.fromTo(
        ".ai-panel",
        { autoAlpha: 0, scale: 0.92, y: 20 },
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: visualRef.current, start: "top 80%", toggleActions: "play none none reverse" },
        }
      );
    }, sectionRef);

    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
      split?.revert();
    };
  }, []);

  return (
    <section
      id="ai-business-os"
      ref={sectionRef}
      className="relative scroll-mt-20 overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-10">
          {/* copy */}
          <div>
            <motion.span
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.6 }}
              variants={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#45157b]/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#45157b]"
            >
              <Sparkles className="h-3 w-3" strokeWidth={2.4} />
              AI Business OS
            </motion.span>

            <h2
              ref={headingRef}
              className="mt-4 text-[1.75rem] font-medium leading-[1.15] tracking-tight text-foreground sm:mt-5 sm:text-5xl"
              style={{ perspective: 400 }}
            >
              Don&apos;t just build a store.
              <span className="mt-1 block font-bold text-[#45157b]">Build a business that runs itself.</span>
            </h2>

            <motion.p
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={item}
              className="mt-4 max-w-md text-sm leading-relaxed text-foreground/60 sm:mt-5 sm:text-base"
            >
              Exofe connects your store, products, orders, customers, marketing, and analytics into one intelligent
              system — so AI can understand your business, recommend actions, and help operate it.
            </motion.p>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.6 }}
              variants={item}
              className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            >
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-black/[.08] bg-white px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-black/[.03]"
              >
                See how it works
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#45157b] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#45157b]/25 transition-transform hover:scale-[1.03]"
              >
                Start building
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
              </Link>
            </motion.div>
          </div>

          {/* connected AI visualization */}
          <div ref={visualRef} className="relative">
            {/* mobile: AI panel front and center, modules in a compact grid below */}
            <div className="flex flex-col items-center gap-6 sm:hidden">
              <AIPanel activeInsight={activeInsight} />
              <div className="grid w-full grid-cols-2 gap-3">
                {ALL_MODULES.map((mod) => (
                  <ModuleCard
                    key={mod.id}
                    mod={mod}
                    onSelect={setActiveInsight}
                    isActive={activeInsight === mod.insight}
                  />
                ))}
              </div>
            </div>

            {/* sm+: modules flank the AI panel with connector lines between them.
                Each side's [module column + connector] shares its own flex row so
                the connector stretches to match the 3-card column's real height —
                not the AI panel's, which is taller and would otherwise pull the
                curves' anchor points off the actual card centers. */}
            <div className="hidden items-center gap-0 sm:flex">
              <div className="relative flex-1 pr-8">
                <div className="flex flex-col justify-between gap-5" style={{ minHeight: "13rem" }}>
                  {LEFT_MODULES.map((mod) => (
                    <ModuleCard
                      key={mod.id}
                      mod={mod}
                      align="left"
                      onSelect={setActiveInsight}
                      isActive={activeInsight === mod.insight}
                    />
                  ))}
                </div>
                <ConnectorLines />
              </div>

              <AIPanel activeInsight={activeInsight} />

              <div className="relative flex-1 pl-8">
                <ConnectorLines mirror />
                <div className="flex flex-col justify-between gap-5" style={{ minHeight: "13rem" }}>
                  {RIGHT_MODULES.map((mod) => (
                    <ModuleCard
                      key={mod.id}
                      mod={mod}
                      align="right"
                      onSelect={setActiveInsight}
                      isActive={activeInsight === mod.insight}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* value points */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:mt-20 sm:gap-5 sm:grid-cols-3">
          {VALUE_POINTS.map((v, i) => (
            <motion.div
              key={v.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={item}
              transition={{ delay: i * 0.08 }}
              className="rounded-[24px] border border-black/[.06] bg-[#f7f4fc] p-5 sm:rounded-[28px] sm:p-6"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#45157b] text-xs font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
