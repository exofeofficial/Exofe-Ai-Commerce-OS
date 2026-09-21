"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, BarChart3, MessageCircle, Sparkles, Store, ShoppingBag, Truck } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

// Hexagonal ring, evenly spaced 60° apart, positions in percent so the
// connector SVG (viewBox 0 0 100 100, preserveAspectRatio="none") can share
// the exact same 0-100 coordinate space — both scale identically with the
// container regardless of its real aspect ratio, so nodes and lines always
// line up without needing pixel-matched dimensions.
const MODULES = [
  { id: "store", label: "Store", meta: "Storefront live", icon: Store, x: 50, y: 10, essential: true },
  { id: "orders", label: "Orders", meta: "128 today", icon: ShoppingBag, x: 84, y: 30, essential: false },
  { id: "ai", label: "AI", meta: "3 new insights", icon: Sparkles, x: 84, y: 70, essential: true },
  { id: "analytics", label: "Analytics", meta: "+18% this week", icon: BarChart3, x: 50, y: 90, essential: false },
  { id: "whatsapp", label: "WhatsApp", meta: "2 new chats", icon: MessageCircle, x: 16, y: 70, essential: true },
  { id: "shipping", label: "Shipping", meta: "4 in transit", icon: Truck, x: 16, y: 30, essential: false },
] as const;

function EcosystemConnectors() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        {/* Centered radial gradient in userSpaceOnUse coordinates — a shared
            linear gradient would need per-line objectBoundingBox math, and
            the vertical/horizontal lines in this hex ring would hit the same
            zero-width-bbox bug fixed earlier in OneCatalogEveryChannel. A
            radial gradient anchored at the hub sidesteps it entirely: every
            line reads "bright near center, fading outward" regardless of
            its own angle. */}
        <radialGradient id="ecosystem-line" gradientUnits="userSpaceOnUse" cx="50" cy="50" r="42">
          <stop offset="0%" stopColor="#fcba03" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#45157b" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {MODULES.map((m, i) => (
        <line
          key={m.id}
          x1="50"
          y1="50"
          x2={m.x}
          y2={m.y}
          stroke="url(#ecosystem-line)"
          strokeWidth="0.35"
          className={`ecosystem-line ${m.essential ? "" : "hidden sm:block"}`}
          style={{ animationDelay: `${i * 0.35}s` }}
        />
      ))}
    </svg>
  );
}

function ModuleNode({ mod }: { mod: (typeof MODULES)[number] }) {
  const Icon = mod.icon;
  return (
    <div
      className={`ecosystem-node absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 shadow-lg shadow-black/20 backdrop-blur-sm ${
        mod.essential ? "" : "hidden sm:flex"
      }`}
      style={{ left: `${mod.x}%`, top: `${mod.y}%` }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#45157b]/50 text-[#fcba03]">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <div className="whitespace-nowrap">
        <p className="text-[11px] font-bold text-white">{mod.label}</p>
        <p className="text-[9px] text-white/45">{mod.meta}</p>
      </div>
    </div>
  );
}

function EcosystemVisual() {
  return (
    <div className="ecosystem-visual  relative mx-auto h-[300px] w-full max-w-sm sm:h-[360px] sm:max-w-md lg:mx-0 lg:h-[420px]">
      <EcosystemConnectors />

      <div className="ecosystem-node absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-[28px] border border-white/10 bg-gradient-to-br from-[#45157b] to-[#2a0c53] px-6 py-5 shadow-2xl shadow-[#45157b]/50">
        <span className="relative h-8 w-8 brightness-0 invert">
          <Image src="/logo-icon.png" alt="" fill sizes="32px" className="object-contain" />
        </span>
        <p className="text-sm font-bold text-white">Exofe</p>
      </div>

      {MODULES.map((m) => (
        <ModuleNode key={m.id} mod={m} />
      ))}
    </div>
  );
}

export default function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

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
        ".ecosystem-node",
        { autoAlpha: 0, scale: 0.85 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: visualRef.current, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );

      gsap.fromTo(
        ".ecosystem-line",
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.8,
          scrollTrigger: { trigger: visualRef.current, start: "top 85%", toggleActions: "play none none reverse" },
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
    <section ref={sectionRef} className="relative overflow-hidden  px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={container}
        className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-[32px] bg-gradient-to-br from-[#250B43] via-[#1a0730] to-[#09090C] px-6 py-14 sm:rounded-[40px] sm:px-12 sm:py-16 lg:px-16 lg:py-20"
      >
        {/* subtle radial lighting — kept sparse so the panel stays clean */}
        <div className="pointer-events-none absolute -left-24 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#45157b]/40 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-[#fcba03]/[0.08] blur-[110px]" />

        <div className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.span
              variants={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#fcba03]"
            >
              Ready to build with Exofe?
            </motion.span>

            <h2
              ref={headingRef}
              className="mt-5 text-3xl font-medium leading-[1.15] tracking-tight text-white sm:text-5xl"
              style={{ perspective: 400 }}
            >
              Build your business.
              <br />
              Let Exofe power the rest.
            </h2>

            <motion.p variants={item} className="mt-5 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
              Create your storefront, sell through WhatsApp, manage orders, automate operations and grow with AI —
              all from one connected platform.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/signup"
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#fcba03] px-8 py-3.5 text-sm font-bold text-[#17120A] shadow-lg shadow-[#fcba03]/20 transition-all hover:brightness-105 hover:shadow-[#fcba03]/30 sm:w-auto"
                >
                  Start building for free
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/demo"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#45157b]/60 bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] sm:w-auto"
                >
                  See Exofe in action
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.p variants={item} className="mt-8 text-xs font-semibold uppercase tracking-widest text-white/25">
              Store &middot; WhatsApp &middot; AI &middot; Orders &middot; Shipping &middot; Analytics
            </motion.p>
          </div>

          {/* RIGHT */}
          <div ref={visualRef}>
            <EcosystemVisual />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
