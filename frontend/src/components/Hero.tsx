"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform, type Variants } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, Play } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

// Content stays fully opaque even before hydration/animation kicks in — only
// a subtle slide-up plays once JS is ready. Fading from opacity: 0 here left
// the hero blank for however long hydration took on a cold load.
const item: Variants = {
  hidden: { y: 14, opacity: 1 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
};

// The headline's last phrase cycles through what Exofe actually does —
// kept as its own AnimatePresence-driven piece, outside the GSAP
// SplitText target, so the one-time load reveal and the ongoing
// word-swap never fight over the same DOM text. Each phrase is split
// into words so they animate in one after another, not as one block.
const ROTATING_PHRASES = [
  ["sell", "more."],
  ["grow", "faster."],
  ["reach", "everyone."],
  ["scale", "globally."],
];
const ROTATE_INTERVAL_MS = 2200;
const WORD_STAGGER_S = 0.1;

function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ROTATING_PHRASES.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex flex-wrap gap-x-2">
      {ROTATING_PHRASES[index].map((word, wordIndex) => (
        <span key={wordIndex} className="relative inline-block overflow-hidden align-bottom">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${index}-${word}`}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE, delay: wordIndex * WORD_STAGGER_S }}
              className="inline-block text-[#c4b5fd]"
            >
              {word}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const revealRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Hero fades out over the exact distance it takes to scroll the section
  // fully out of view — starts at rest while the hero still fills the
  // screen, finishes right as Features takes over.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  useLayoutEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.75;
  }, []);

  useLayoutEffect(() => {
    gsap.registerPlugin(SplitText);

    let split: SplitText | undefined;

    // Plays directly on mount instead of behind a ScrollTrigger — the hero
    // heading is always in view on load anyway, and gating it on a scroll
    // measurement was the thing leaving it stuck invisible (opacity: 0 from
    // the `fromTo` below) whenever that measurement raced with late-loading
    // fonts on a cold reload.
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
  }, []);

  return (
    <>
      <section id="home" ref={sectionRef} className="relative flex h-[90vh] min-h-[600px] flex-col overflow-hidden rounded-b-[1.5rem] bg-[#171326] scroll-mt-20 sm:rounded-b-[2rem]">
        <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 flex flex-col">
        {/* fullscreen background video, dulled and slowed down so it reads
            as ambient texture behind the text rather than competing for
            attention */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-55 brightness-[0.75] saturate-[0.95]"
        >
          <source src="/BV1.mp4" type="video/mp4" />
        </video>

        {/* dark overlay so the white text stays legible over any footage */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/65" />

        <motion.div
          ref={revealRef}
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-start justify-end px-4 pb-20 text-left sm:px-8 sm:pb-24"
        >
          {/* heading GSAP SplitText letter reveal skewX + opacity on the
              opener line, plus a rotating last word on the second line
              that keeps swapping on its own */}
          <motion.h1
            variants={item}
            className="text-[2.6rem] font-bold leading-[1.10] tracking-tight text-white sm:text-7xl md:text-[4.4rem]"
          >
            <span ref={headingRef} style={{ perspective: 400 }}>
              Build the business
            </span>
            <span className="mt-2 block text-[1.7rem] font-semibold text-white/85 sm:text-4xl md:text-[2.8rem]">
              <RotatingWord />
            </span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-lg text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
            Create your store, connect your customers, automate your sales and grow all with Exofe.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="mt-9 flex w-full flex-col items-start justify-start gap-4 sm:w-auto sm:flex-row">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                href="/signup"
                className="shine-btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[#c4b5fd] px-8 py-3.5 text-sm font-semibold text-[#171326] shadow-lg shadow-black/30 transition-shadow hover:shadow-black/50 sm:w-auto"
              >
                Start for free
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                href="/demo"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 sm:w-auto"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  <Play className="ml-0.5 h-2.5 w-2.5 fill-[#171326] text-[#171326]" strokeWidth={0} />
                </span>
                Explore Exofe
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
        </motion.div>
      </section>
    </>
  );
}
