"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowUpRight } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const item: Variants = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

const ITEMS = [
  {
    number: "01",
    title: "Build faster",
    desc: "Launch a complete AI-designed storefront in minutes, no developers or designers needed.",
    cta: "Explore Store Builder",
    image: "/B1.png",
  },
  {
    number: "02",
    title: "Sell everywhere",
    desc: "Reach customers on your website, WhatsApp, and AI-powered discovery, all from one catalog.",
    cta: "See WhatsApp Commerce",
    image: "/B2.png",
  },
  {
    number: "03",
    title: "Run smarter",
    desc: "Orders, shipping, and inventory stay in sync automatically, so nothing falls through the cracks.",
    cta: "Explore Order Management",
    image: "/B3.png",
  },
  {
    number: "04",
    title: "Automate with AI",
    desc: "Let AI answer questions, confirm orders, and follow up with customers around the clock.",
    cta: "Meet the AI Assistant",
    image: "/B4.png",
  },
  {
    number: "05",
    title: "Grow with confidence",
    desc: "Real-time insights show you what's working, so every decision is backed by data.",
    cta: "See Smart Analytics",
    image: "/B5.png",
  },
];

function StoryRow({ story, index }: { story: (typeof ITEMS)[number]; index: number }) {
  const isEven = index % 2 === 0;
  const rowRef = useRef<HTMLDivElement>(null);

  // Parallax: image and number drift at different rates as the row moves
  // through the viewport — the layered depth is what reads as "modern"
  // rather than everything moving in lockstep with the page scroll.
  const { scrollYProgress } = useScroll({ target: rowRef, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const numberY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <div ref={rowRef} className="story-row relative grid items-center gap-8 py-12 sm:grid-cols-2 sm:gap-16 sm:py-16">
      <div className={`story-text relative z-10 ${isEven ? "sm:order-1" : "sm:order-2"}`}>
        <motion.span
          style={{ y: numberY }}
          className="inline-block text-7xl font-extrabold leading-none text-[#45157b]/10 sm:text-8xl"
        >
          {story.number}
        </motion.span>
        <h3 className="mt-2 text-2xl font-bold text-[#171326] sm:text-3xl">{story.title}</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#171326]/60 sm:text-base">{story.desc}</p>
        <a
          href="/signup"
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#45157b] px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          {story.cta}
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
        </a>
      </div>

      <div className={isEven ? "sm:order-2" : "sm:order-1"}>
        <div className="story-image relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-[#171326]">
          <motion.div style={{ y: imageY }} className="absolute inset-x-0 -top-[15%] h-[130%]">
            <Image src={story.image} alt={story.title} fill className="object-cover" sizes="(min-width: 640px) 560px, 100vw" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function WhyChoose() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

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

      // each row: image scales/slides in from its own side, text fades up
      // a beat later — mirrored depending on which side the image sits on.
      gsap.utils.toArray<HTMLElement>(".story-row").forEach((row, i) => {
        const fromSide = i % 2 === 0 ? 60 : -60;
        const image = row.querySelector(".story-image");
        const text = row.querySelector(".story-text");

        gsap.fromTo(
          image,
          { autoAlpha: 0, x: fromSide, scale: 0.92 },
          {
            autoAlpha: 1,
            x: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 80%", toggleActions: "play none none reverse" },
          }
        );
        gsap.fromTo(
          text,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            delay: 0.15,
            ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 80%", toggleActions: "play none none reverse" },
          }
        );
      });
    }, sectionRef);

    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
      split?.revert();
    };
  }, []);

  return (
    <section id="why-choose" ref={sectionRef} className="relative scroll-mt-20 overflow-hidden rounded-t-[1.5rem] bg-[#f7f4fc] px-4 py-20 sm:rounded-t-[2rem] sm:px-6 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            ref={headingRef}
            className="text-4xl font-medium leading-[1.1] tracking-tight text-[#171326] sm:text-6xl"
            style={{ perspective: 400 }}
          >
            Built for businesses that mean business.
          </h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={item}
            className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-[#171326]/60 sm:text-base"
          >
            From building your store to growing with confidence, every step below runs on one AI-native
            platform, no juggling separate tools.
          </motion.p>
        </div>

        <div className="relative mt-16 sm:mt-20">
          <div className="flex flex-col divide-y divide-[#171326]/[.06]">
            {ITEMS.map((story, i) => (
              <StoryRow key={story.title} story={story} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
