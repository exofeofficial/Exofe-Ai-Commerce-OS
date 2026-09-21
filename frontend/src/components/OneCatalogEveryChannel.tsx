"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Sparkles, Store } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const item: Variants = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

const CHANNELS = [
  { id: "store", label: "Online Store", blurb: "Storefront product card", icon: Store, images: undefined },
  { id: "whatsapp", label: "WhatsApp Commerce", blurb: "Conversational recommendation", icon: undefined, images: ["/I5.png"] },
  { id: "search", label: "AI Search", blurb: "Ranked result with live price", icon: undefined, images: ["/I1.png"] },
  { id: "assistant", label: "AI Assistant", blurb: "Conversational shopping", icon: undefined, images: ["/I2.png"] },
  { id: "social", label: "Social & Discovery", blurb: "Discovery feed card", icon: undefined, images: ["/I3.png", "/I4.png"] },
] as const;

// Grid is max-w-4xl (896px) with 5 columns and gap-4 (16px) once it reaches
// its full width at the lg breakpoint (1024px viewport already leaves the
// content area >= 896px after padding, so the grid is pinned at exactly
// 896px for every lg+ viewport). Column width = (896 - 4*16) / 5 = 166.4,
// so column centers land at 83.2 / 265.6 / 448 / 630.4 / 812.8 — matched
// 1:1 against a viewBox of the same pixel size so the SVG needs no
// preserveAspectRatio stretching (the AI Business OS connector's non-square
// viewBox only stayed undistorted because its aspect ratio roughly matched
// its box; a wide-short box like this one needs an exact pixel match).
const CONNECTOR_VIEW_W = 896;
const CONNECTOR_VIEW_H = 80;
const FAN_X = [83.2, 265.6, 448, 630.4, 812.8];
const CENTER_X = 448;

function fanPath(x: number) {
  if (x === CENTER_X) return `M${CENTER_X} 0 L${CENTER_X} ${CONNECTOR_VIEW_H}`;
  return `M${CENTER_X} 0 C ${CENTER_X} ${CONNECTOR_VIEW_H * 0.4}, ${x} ${CONNECTOR_VIEW_H * 0.6}, ${x} ${CONNECTOR_VIEW_H}`;
}

function CatalogConnectors() {
  return (
    <svg
      viewBox={`0 0 ${CONNECTOR_VIEW_W} ${CONNECTOR_VIEW_H}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        {/* userSpaceOnUse (not the default objectBoundingBox) — the center
            connector is a perfectly vertical line, giving it a zero-width
            bounding box, and the SVG spec ignores an objectBoundingBox
            gradient on a zero-width/height box entirely. userSpaceOnUse
            defines the gradient in the SVG's own coordinate space instead,
            so it renders identically on every path regardless of its
            individual bounding box. */}
        <linearGradient
          id="catalog-connector-flow"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2={CONNECTOR_VIEW_H}
        >
          <stop offset="0%" stopColor="#45157b" stopOpacity="0" />
          <stop offset="50%" stopColor="#fcba03" stopOpacity="1" />
          <stop offset="100%" stopColor="#45157b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {FAN_X.map((x, i) => (
        <path key={`base-${i}`} d={fanPath(x)} stroke="currentColor" strokeWidth="1.5" fill="none" className="text-black/10" />
      ))}
      {FAN_X.map((x, i) => (
        <path
          key={`flow-${i}`}
          d={fanPath(x)}
          pathLength={100}
          stroke="url(#catalog-connector-flow)"
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

function ChannelCard({ channel }: { channel: (typeof CHANNELS)[number] }) {
  const Icon = channel.icon;
  return (
    <div className="channel-card relative flex flex-col gap-3 rounded-[24px] p-4 transition-all duration-300 hover:-translate-y-1">
      <span
        aria-hidden
        className="absolute -top-4 left-1/2 hidden h-4 w-px -translate-x-1/2 bg-gradient-to-b from-[#45157b]/30 to-transparent sm:block lg:hidden"
      />
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#45157b]">
            <Icon className="h-6 w-6" strokeWidth={1.8} />
          </span>
        ) : (
          <span className="flex shrink-0 -space-x-1.5">
            {channel.images!.map((src) => (
              <span key={src} className="relative h-8 w-8 overflow-hidden">
                <Image src={src} alt="" fill sizes="32px" className="object-contain" />
              </span>
            ))}
          </span>
        )}
        <div>
          <p className="text-xs font-bold text-[#171326]">{channel.label}</p>
          <p className="text-[10px] text-[#171326]/45">{channel.blurb}</p>
        </div>
      </div>
    </div>
  );
}

export default function OneCatalogEveryChannel() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
        ".connector-track",
        { autoAlpha: 0, scaleY: 0.4 },
        {
          autoAlpha: 1,
          scaleY: 1,
          duration: 0.6,
          ease: "power3.out",
          transformOrigin: "top center",
          scrollTrigger: { trigger: gridRef.current, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );

      gsap.fromTo(
        ".channel-card",
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          delay: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 85%", toggleActions: "play none none reverse" },
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
    <section id="one-catalog" ref={sectionRef} className="relative scroll-mt-20 overflow-hidden bg-[#f7f4fc] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            variants={item}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#45157b]/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#45157b]"
          >
            <Sparkles className="h-3 w-3" strokeWidth={2.4} />
            One catalog. Multiple channels.
          </motion.span>

          <h2
            ref={headingRef}
            className="mt-5 text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-5xl"
            style={{ perspective: 400 }}
          >
            Your products, everywhere customers search.
          </h2>

          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={item}
            className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground/55 sm:text-base"
          >
            Update a product once in Exofe, and it stays in sync everywhere it appears — price, stock, and
            availability included.
          </motion.p>
        </div>

        {/* catalog source mark */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          variants={item}
          className="relative mx-auto mt-14 h-16 w-16 sm:mt-16 sm:h-20 sm:w-20"
        >
          <Image src="/logo-icon.png" alt="Exofe" fill sizes="80px" className="object-contain" />
        </motion.div>

        {/* connecting flow — simple stub below lg, animated fan-out SVG once
            the grid reaches its fixed 5-column width */}
        <div className="connector-track mx-auto mt-4 h-8 w-px bg-gradient-to-b from-white/0 via-[#45157b]/20 to-[#45157b]/20 lg:hidden" />
        <div className="connector-track relative mx-auto mt-4 hidden h-20 w-full max-w-4xl lg:block">
          <CatalogConnectors />
        </div>

        {/* channel cards */}
        <div ref={gridRef} className="mx-auto grid max-w-4xl grid-cols-1 gap-4 pt-6 sm:grid-cols-3 lg:grid-cols-5 lg:pt-0">
          {CHANNELS.map((c) => (
            <ChannelCard key={c.id} channel={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
