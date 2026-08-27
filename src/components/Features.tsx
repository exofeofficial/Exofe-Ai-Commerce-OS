"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, BarChart3, Bot, Clock, MessageCircle, Package, Sparkles } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const item: Variants = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.55, ease: EASE } },
};

const CARDS = [
  {
    id: "store-builder",
    badge: "Create",
    icon: Package,
    image: "/Builder.png",
    title: "AI Store Builder",
    desc: "Create a complete online store in minutes with AI-powered layouts, content, and product organization.",
    bg: "bg-[#eadaf4]",
  },
  {
    id: "ai-assistant",
    badge: "AI",
    icon: Bot,
    image: "/Ai.png",
    title: "AI Business Assistant",
    desc: "Analyze your business, improve your store, and take action with AI that understands your products, customers, and orders.",
    bg: "bg-[#f0ebd3]",
  },
  {
    id: "whatsapp-commerce",
    badge: "WhatsApp",
    icon: MessageCircle,
    image: "/f3.png",
    title: "WhatsApp Commerce",
    desc: "Turn conversations into sales with AI-powered ordering, customer support, and automated replies.",
    bg: "bg-[#eadaf4]",
  },
  {
    id: "orders-shipping",
    badge: "Commerce",
    icon: Clock,
    image: "/F4.png",
    title: "Orders & Shipping",
    desc: "Manage orders, COD deliveries, couriers, and shipment tracking from one simple workspace.",
    bg: "bg-[#f0ebd3]",
  },
  {
    id: "ai-commerce",
    badge: "AI Commerce",
    icon: Sparkles,
    image: "/f5.png",
    title: "AI Commerce",
    desc: "Make your products ready for discovery across AI-powered shopping and search experiences.",
    bg: "bg-[#eadaf4]",
  },
  {
    id: "analytics",
    badge: "Insights",
    icon: BarChart3,
    image: "/f6.png",
    title: "Smart Analytics",
    desc: "Understand sales, customers, products, and AI-driven insights without digging through spreadsheets.",
    bg: "bg-[#f0ebd3]",
  },
] as const;

function FeatureCard({ card }: { card: (typeof CARDS)[number] }) {
  const Icon = card.icon;
  return (
    <div className="group flex h-[29rem] w-[18.5rem] shrink-0 flex-col overflow-hidden rounded-[28px] bg-[#f7f5f0] sm:h-[33rem] sm:w-[21rem]">
      <div className="flex flex-col gap-2.5 p-5 pb-4">
        <div className="flex items-center justify-between">
          <span className="w-fit rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-[#171326]">{card.badge}</span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#171326]">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </div>
        <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-[#171326] sm:text-[1.7rem]">{card.title}</h3>
        <p className="min-h-[3.6rem] text-sm leading-relaxed text-[#171326]/70">{card.desc}</p>
        <Link
          href="/signup"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-[#171326] transition-opacity hover:opacity-70"
        >
          Read More
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </Link>
      </div>

      <div className={`relative min-h-0 flex-1 overflow-hidden rounded-t-[28px] ${card.bg}`}>
        {card.image ? (
          <Image
            src={card.image}
            alt={card.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="336px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="h-16 w-16 text-[#171326]/25" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  );
}

// Its own component (not a loop-local hook call) so each dot can subscribe
// to its own slice of scroll progress without breaking the rules of hooks.
function ProgressDot({ scrollYProgress, index, total }: { scrollYProgress: MotionValue<number>; index: number; total: number }) {
  const opacity = useTransform(scrollYProgress, [index / total, (index + 0.6) / total], [0.25, 1]);
  return <motion.span style={{ opacity }} className="h-1.5 w-6 rounded-full bg-[#45157b]" />;
}

export default function Features() {
  // The pin+horizontal-scroll recipe: an oversized wrapper (h-[300vh]) gives
  // the page enough vertical scroll distance to travel through, a sticky
  // inner viewport stays pinned on screen for that whole distance, and the
  // card row's x position is driven directly off scroll progress — once
  // scrollYProgress hits 1 the wrapper ends and normal page scroll resumes.
  const targetRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const patchBgRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end end"] });

  // Percentage-based x would be relative to the row's own rendered width,
  // which for a block-level flex row is just the viewport width (children
  // overflow it without growing it) — not the actual card content width.
  // That mismatch is exactly what made small screens run out of scroll
  // distance a couple cards in: the same "-73%" meant a much shorter
  // absolute distance on a narrow viewport than on a wide one. Measuring
  // the real content width and driving x in pixels fixes that at every
  // breakpoint, and re-measures on resize.
  const [scrollDistance, setScrollDistance] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      if (!rowRef.current) return;
      setScrollDistance(Math.max(rowRef.current.scrollWidth - window.innerWidth, 0));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollDistance]);

  // Same GSAP SplitText letter reveal used on every other section heading
  // on the page (skewX + opacity, scrubbed to scroll position). This only
  // needs to run during the approach into the section — by the time the
  // horizontal-scroll pin engages the heading is already fully revealed.
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    let split: SplitText | undefined;

    const ctx = gsap.context(() => {
      split = new SplitText(headingRef.current, { type: "words, chars", wordsClass: "split-word" });
      gsap.set(split.chars, { transformPerspective: 400 });

      gsap.fromTo(
        split.chars,
        { skewX: 30, opacity: 0 },
        {
          skewX: 0,
          opacity: 1,
          ease: "none",
          stagger: { each: 0.5 / split.chars.length, from: "start" },
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 90%",
            end: "top 40%",
            scrub: 0.8,
          },
        }
      );

      // The "advanced features." patch opens as its own left-to-right
      // wipe instead of per-character skew — same scroll trigger/timing
      // as the heading above so both finish revealing together.
      gsap.set(patchBgRef.current, { scaleX: 0, transformOrigin: "left center" });
      gsap.to(patchBgRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 90%",
          end: "top 40%",
          scrub: 0.8,
        },
      });
    }, targetRef);

    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
      split?.revert();
    };
  }, []);

  return (
    <section
      id="features"
      className="relative scroll-mt-20 bg-white"
    >
      <div ref={targetRef} className="relative h-[300vh]">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden px-4 py-10 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={item}
            className="mx-auto w-full max-w-6xl"
          >
            <div className="flex items-end justify-between gap-4">
              <h2
                ref={headingRef}
                className="max-w-xl text-3xl font-medium leading-[1.12] tracking-tight text-foreground sm:text-5xl"
                style={{ perspective: 400 }}
              >
                Unlock premium benefits{" "}
                <span className="sm:whitespace-nowrap">
                  with our{" "}
                  <span className="relative inline-block overflow-hidden whitespace-nowrap rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-light px-3 py-0.5">
                    <span ref={patchBgRef} className="absolute inset-0 bg-[#45157b]" />
                    <span className="relative text-white">advanced features.</span>
                  </span>
                </span>
              </h2>
              <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                {CARDS.map((c, i) => (
                  <ProgressDot key={c.id} scrollYProgress={scrollYProgress} index={i} total={CARDS.length} />
                ))}
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-foreground/55 sm:text-base">
              Exofe brings your storefront, customers, AI, conversations and commerce operations into one intelligent system.
            </p>
          </motion.div>

          <motion.div ref={rowRef} style={{ x }} className="mt-10 flex gap-5 pl-4 sm:pl-[calc((100vw-72rem)/2+1.5rem)]">
            {CARDS.map((card) => (
              <FeatureCard key={card.id} card={card} />
            ))}
            <div className="w-4 shrink-0 sm:w-1" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
