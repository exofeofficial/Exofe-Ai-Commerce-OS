"use client";

import { useLayoutEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { MessageCircle, Package, Rocket } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const item: Variants = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

const STEPS = [
  {
    number: "01",
    title: "Build",
    desc: "Choose a theme, add your products, and customize your store with AI.",
    icon: MessageCircle,
    highlight: false,
  },
  {
    number: "02",
    title: "Connect",
    desc: "Connect WhatsApp, payments, shipping, and your business tools.",
    icon: Package,
    highlight: false,
  },
  {
    number: "03",
    title: "Sell",
    desc: "Publish your store and let Exofe help you manage sales, orders, and customers.",
    icon: Rocket,
    highlight: true,
  },
];

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  const Icon = step.icon;
  return (
    <div
      className={`step-card flex flex-col justify-between gap-10 rounded-[28px] p-7 text-[#171326] sm:p-8 ${
        step.highlight ? "bg-gradient-to-bl from-[#fde9a8] via-[#fef6df] to-white sm:-translate-y-4 sm:scale-[1.04]" : "bg-white"
      }`}
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 82%, 82% 100%, 0 100%)" }}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            step.highlight ? "bg-white/70 text-[#b98700]" : "bg-[#f7f4fc] text-[#45157b]"
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-[#171326]/35">Step {step.number}</span>
      </div>

      <div>
        <p className="text-5xl font-extrabold leading-none tracking-tight text-[#45157b] sm:text-6xl">{step.number}</p>
        <h3 className="mt-3 text-xl font-bold sm:text-2xl">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#171326]/60">{step.desc}</p>
      </div>
    </div>
  );
}

export default function GetStarted() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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
        ".step-card",
        { autoAlpha: 0, y: 40, skewY: 3 },
        {
          autoAlpha: 1,
          y: 0,
          skewY: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: cardsRef.current, start: "top 85%", toggleActions: "play none none reverse" },
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
      id="get-started"
      ref={sectionRef}
      className="relative scroll-mt-20 overflow-hidden rounded-b-[1.5rem] bg-[#f7f4fc] px-4 py-20 sm:rounded-b-[2rem] sm:px-6 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <h2
            ref={headingRef}
            className="max-w-lg text-3xl font-medium leading-[1.1] tracking-tight text-[#171326] sm:text-5xl"
            style={{ perspective: 400 }}
          >
            Get Started in Just 3 Easy Steps
          </h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={item}
            className="max-w-sm text-sm leading-relaxed text-[#171326]/55 sm:text-base"
          >
            Get your Exofe shop live in just 3 easy steps with a guided setup designed for speed and simplicity.
          </motion.p>
        </div>

        <div ref={cardsRef} className="mt-16 grid grid-cols-1 gap-5 sm:mt-20 sm:grid-cols-3">
          {STEPS.map((s) => (
            <StepCard key={s.title} step={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
