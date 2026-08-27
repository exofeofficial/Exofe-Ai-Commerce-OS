"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowUpRight } from "lucide-react";

type CardData = {
  title: string;
  description: string;
  cta: string;
  image: string;
};

const CARDS: CardData[] = [
  {
    title: "Build faster",
    description: "Launch a complete AI-designed storefront in minutes, no developers or designers needed.",
    cta: "Explore Store Builder",
    image: "/B1.png",
  },
  {
    title: "Sell everywhere",
    description: "Reach customers on your website, WhatsApp, and AI-powered discovery, all from one catalog.",
    cta: "See WhatsApp Commerce",
    image: "/B2.png",
  },
  {
    title: "Run smarter",
    description: "Orders, shipping, and inventory stay in sync automatically, so nothing falls through the cracks.",
    cta: "Explore Order Management",
    image: "/B3.png",
  },
  {
    title: "Automate with AI",
    description: "Let AI answer questions, confirm orders, and follow up with customers around the clock.",
    cta: "Meet the AI Assistant",
    image: "/B4.png",
  },
  {
    title: "Grow with confidence",
    description: "Real-time insights show you what's working, so every decision is backed by data.",
    cta: "See Smart Analytics",
    image: "/B5.png",
  },
];

function Card({ index, card, scrollY }: { index: number; card: CardData; scrollY: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const offsetTop = useRef(0);
  // Starts at 0 to match the server-rendered markup (window isn't available
  // during SSR) and is filled in after mount — reading it eagerly in a
  // lazy initializer makes the client's first render diverge from the
  // server's and trips a hydration mismatch.
  const [vh, setVh] = useState(0);

  useLayoutEffect(() => {
    if (ref.current) offsetTop.current = ref.current.offsetTop;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a browser-only API (window.innerHeight), not derivable during render
    setVh(window.innerHeight);
  }, []);

  const progress = useTransform(scrollY, (sy) => {
    if (!vh) return 0;
    const top = offsetTop.current - sy;
    return 1 - Math.min(Math.max(top / vh, 0), 1);
  });

  // The first card sits directly under the heading with nothing to scroll
  // past first — starting it mid-entrance (offset, faded, scaled down)
  // just reads as a stray gap rather than an animation, so it renders
  // already in its settled state and only cards after it play the reveal.
  const y = useTransform(progress, [0, 1], [index === 0 ? 0 : 160, 0]);
  const opacity = useTransform(progress, [0, 1], [index === 0 ? 1 : 0, 1]);
  const scale = useTransform(progress, [0, 1], [index === 0 ? 1 : 0.94, 1]);

  return (
    <div ref={ref} className="sticky top-0 flex h-screen items-start justify-center px-6 pt-6 sm:px-12 sm:pt-10" style={{ zIndex: index + 1 }}>
      <motion.div style={{ y, opacity, scale }} className="relative flex h-[65vh] w-full max-w-[88rem] flex-col justify-center overflow-hidden rounded-3xl">
        <Image src={card.image} alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171326]/95 via-[#171326]/60 to-[#171326]/10" />

        <div className="relative z-10 flex flex-col gap-6 p-10 sm:p-14 md:max-w-md">
          <span className="text-xs font-bold uppercase tracking-widest text-[#fcba03]">0{index + 1}</span>
          <h3 className="text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">{card.title}</h3>
          <p className="text-base leading-relaxed text-white/70">{card.description}</p>
          <button
            type="button"
            className="mt-2 flex w-fit items-center gap-2 rounded-full bg-[#fcba03] px-5 py-3 text-sm font-semibold text-[#171326] transition-colors hover:bg-[#fcba03]/90"
          >
            {card.cta}
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function WhyChoose() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollY = useMotionValue(0);

  useLenis(() => {
    scrollY.set(window.scrollY);
  });

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
    }, sectionRef);

    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
      split?.revert();
    };
  }, []);

  return (
    // rounded-t + bg live on this outer <section> with no overflow-hidden —
    // every sticky card below sits inset from the edges via its own
    // padding, so nothing bleeds past the rounded corner and clips.
    // Adding overflow-hidden here would also silently break position:sticky.
    <section id="why-choose" ref={sectionRef} className="relative scroll-mt-20 rounded-t-[1.5rem] bg-[#f7f4fc] sm:rounded-t-[2rem]">
      <div className="relative w-full">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
          <h2
            ref={headingRef}
            className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-[#171326] sm:text-6xl"
            style={{ perspective: 400 }}
          >
            Built for businesses that mean business.
          </h2>
          <motion.p
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-lg text-sm leading-relaxed text-[#171326]/60 sm:text-base"
          >
            From building your store to growing with confidence, every step below runs on one AI-native
            platform, no juggling separate tools.
          </motion.p>
        </div>

        {CARDS.map((card, index) => (
          <Card key={card.title} index={index} card={card} scrollY={scrollY} />
        ))}
      </div>
    </section>
  );
}
