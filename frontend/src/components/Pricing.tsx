"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { FOUNDING_MERCHANT_OFFER, FREE_PLAN, PLANS, ZERO_TRANSACTION_FEE_LINE } from "@/lib/plans";

const EASE = [0.22, 1, 0.36, 1] as const;

const item: Variants = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

const cardIn: Variants = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const PRIMARY_PLANS = PLANS.filter((p) => p.id !== "enterprise");
const ENTERPRISE = PLANS.find((p) => p.id === "enterprise")!;

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [yearly, setYearly] = useState(false);

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
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 90%",
            end: "top 40%",
            scrub: 0.8,
          },
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
    <section id="pricing" ref={sectionRef} className="relative scroll-mt-20 bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            ref={headingRef}
            className="text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl"
            style={{ perspective: 400 }}
          >
            Start small. Grow without rebuilding.
          </h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={item}
            className="mx-auto mt-4 max-w-md text-sm text-foreground/55 sm:text-base"
          >
            Your storefront, AI, WhatsApp commerce, and operations — together in one plan.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            variants={item}
            className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 sm:text-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
            {ZERO_TRANSACTION_FEE_LINE}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            variants={item}
            className="mx-auto mt-8 inline-flex items-center gap-1 rounded-full border border-black/[.08] bg-white p-1 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-300 ${
                !yearly ? "bg-[#45157b] text-white shadow-sm" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-300 ${
                yearly ? "bg-[#45157b] text-white shadow-sm" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Save up to 33% yearly
            </button>
          </motion.div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PRIMARY_PLANS.map((p, i) => {
            const price = yearly ? p.yearly! : p.monthly!;
            return (
              <motion.div
                key={p.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={cardIn}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className={`relative flex flex-col overflow-hidden rounded-[28px] border p-6 transition-shadow duration-300 hover:shadow-xl ${
                  p.popular
                    ? "border-transparent bg-[#171326] text-white shadow-lg shadow-[#45157b]/20 sm:-translate-y-3"
                    : "border-black/[.06] bg-white text-foreground"
                }`}
              >
                {p.popular && (
                  <span className="absolute right-6 top-6 rounded-full bg-[#fcba03] px-3 py-1 text-[11px] font-bold text-[#171326]">
                    Recommended
                  </span>
                )}

                <p className={`text-lg font-bold ${p.popular ? "text-white" : "text-foreground"}`}>{p.name}</p>
                <p className={`mt-1 text-sm ${p.popular ? "text-white/55" : "text-foreground/55"}`}>{p.tagline}</p>

                <div className="mt-5 flex items-end gap-1.5">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${p.id}-${yearly}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className={`text-4xl font-extrabold tracking-tight ${p.popular ? "text-white" : "text-foreground"}`}
                    >
                      Rs {price.toLocaleString()}
                    </motion.span>
                  </AnimatePresence>
                  <span className={`pb-1 text-sm ${p.popular ? "text-white/50" : "text-foreground/50"}`}>/mo</span>
                </div>
                <p className={`mt-1 text-xs ${p.popular ? "text-white/40" : "text-foreground/40"}`}>{p.aiActionsPerMonth} AI actions/month</p>

                <Link
                  href="/signup"
                  className={`mt-5 w-full rounded-full py-3 text-center text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02] ${
                    p.popular ? "bg-[#fcba03] text-[#171326]" : "bg-black/[.05] text-foreground hover:bg-black/[.08]"
                  }`}
                >
                  Start for free
                </Link>

                <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-current/10 pt-6">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${p.popular ? "text-white/70" : "text-foreground/65"}`}>
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${p.popular ? "text-[#fcba03]" : "text-[#45157b]"}`}
                        strokeWidth={2}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Enterprise + Free — secondary row, not competing visually with the 3 primary cards */}
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardIn}
            className="flex flex-col justify-between gap-4 rounded-[28px] border border-black/[.06] bg-[#f7f4fc] p-6 sm:flex-row sm:items-center"
          >
            <div>
              <p className="text-base font-bold text-foreground">{ENTERPRISE.name}</p>
              <p className="mt-1 text-sm text-foreground/55">{ENTERPRISE.desc}</p>
            </div>
            <Link
              href="/demo"
              className="inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-[#45157b] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Let&apos;s talk
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardIn}
            className="flex flex-col justify-between gap-4 rounded-[28px] border border-black/[.06] bg-white p-6 sm:flex-row sm:items-center"
          >
            <div>
              <p className="text-base font-bold text-foreground">{FREE_PLAN.name} — Rs 0</p>
              <p className="mt-1 text-sm text-foreground/55">
                {FREE_PLAN.features.slice(0, 3).join(" · ")}. {FREE_PLAN.upgradeNudge}
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-black/[.05] px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-black/[.08]"
            >
              Start free
            </Link>
          </motion.div>
        </div>

        {/* founding merchant promo */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={item}
          className="mt-5 flex flex-col items-center gap-3 rounded-[28px] bg-gradient-to-r from-[#45157b] to-[#2f0e5c] p-6 text-center sm:flex-row sm:justify-between sm:text-left"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fcba03]/20 text-[#fcba03]">
              <Sparkles className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-sm font-bold text-white">
                {FOUNDING_MERCHANT_OFFER.badge} — first {FOUNDING_MERCHANT_OFFER.seats} merchants only
              </p>
              <p className="mt-0.5 text-xs text-white/60 sm:text-sm">
                Rs {FOUNDING_MERCHANT_OFFER.price.toLocaleString()}/mo locked for {FOUNDING_MERCHANT_OFFER.lockMonths} months, all Grow
                features included. Normal price Rs {FOUNDING_MERCHANT_OFFER.normalPrice.toLocaleString()} after launch.
              </p>
            </div>
          </div>
          <Link
            href="/signup"
            className="w-full shrink-0 rounded-full bg-[#fcba03] px-6 py-3 text-center text-sm font-semibold text-[#171326] transition-transform hover:scale-[1.03] sm:w-auto"
          >
            Claim your seat
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
