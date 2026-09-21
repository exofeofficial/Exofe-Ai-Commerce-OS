"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ChevronDown, Plus } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

const item: Variants = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

// The merchant's actual pre-signup objections, in the order they tend to
// come up — not a random grab-bag. First 6 stay visible; the rest sit
// behind "View all FAQs" further down the funnel.
const FAQS = [
  {
    q: "What is Exofe?",
    a: "Exofe is an AI-native commerce platform that helps businesses build, run, and grow their online business from one connected system.",
  },
  {
    q: "Is Exofe just a website builder?",
    a: "No. Exofe combines storefronts, products, orders, customers, WhatsApp commerce, shipping, analytics, and AI-powered business tools.",
  },
  {
    q: "Can I migrate my existing Shopify or WooCommerce store to Exofe?",
    a: "Yes. Exofe is being designed to import products, variants, collections, images, and other supported store data so you don't have to rebuild everything manually.",
  },
  {
    q: "Does Exofe support COD and shipping?",
    a: "Yes. COD is a core part of Exofe's commerce workflow, including order management, confirmation, shipping, and tracking. You can connect supported courier accounts or fall back to manual shipping where a direct integration isn't available.",
  },
  {
    q: "Can I sell through WhatsApp?",
    a: "Yes. Exofe includes WhatsApp commerce capabilities for product conversations, customer support, order assistance, and automation.",
  },
  {
    q: "What can Exofe AI do?",
    a: "Exofe AI can help create and improve store content, analyze business performance, recommend actions, and eventually perform approved business actions through secure Exofe tools.",
  },
  {
    q: "Do I need coding knowledge to use Exofe?",
    a: "No. Merchants can choose a theme, customize their store visually, manage products, and publish without touching code.",
  },
  {
    q: "Can I use my own domain with Exofe?",
    a: "Yes. You can start with an Exofe store URL and connect your own custom domain whenever you're ready.",
  },
  {
    q: "Does Exofe collect my COD payments?",
    a: "No. In the standard model, the courier collects COD and settles directly with the merchant. Exofe manages the order and shipment information.",
  },
  {
    q: "Does Exofe charge a transaction fee?",
    a: "Exofe doesn't take an additional percentage from your sales on supported plans. Payment gateway or courier charges may still apply.",
  },
  {
    q: "Can developers build apps and themes for Exofe?",
    a: "Yes. Exofe is building a developer ecosystem where developers can create apps, integrations, themes, and AI-powered commerce tools.",
  },
  {
    q: "How does shipping work on Exofe?",
    a: "Merchants can connect supported courier accounts and create or manage shipments directly from Exofe. A manual shipping fallback is also available where a direct courier integration isn't supported.",
  },
];

const VISIBLE_COUNT = 6;

function FaqAccordion({ faqs, openIndex, onToggle }: { faqs: typeof FAQS; openIndex: number; onToggle: (i: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {faqs.map((f, i) => {
        const isOpen = i === openIndex;
        return (
          <motion.div
            key={f.q}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={item}
            transition={{ delay: (i % VISIBLE_COUNT) * 0.06 }}
            className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${
              isOpen ? "border-[#45157b]/25 bg-gradient-to-br from-indigo-50 to-white" : "border-black/[.06] bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className="text-sm font-bold text-foreground sm:text-base">{f.q}</span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  isOpen ? "bg-[#45157b] text-white" : "bg-black/[.05] text-foreground/60"
                }`}
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-foreground/60">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [openIndex, setOpenIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

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

  const visibleFaqs = showAll ? FAQS : FAQS.slice(0, VISIBLE_COUNT);

  return (
    <section id="faq" ref={sectionRef} className="relative scroll-mt-20 bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            ref={headingRef}
            className="text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl"
            style={{ perspective: 400 }}
          >
            Questions? We&apos;ve got answers.
          </h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={item}
            className="mx-auto mt-4 max-w-md text-sm text-foreground/55 sm:text-base"
          >
            Everything you need to know before building your business with Exofe.
          </motion.p>
        </div>

        <div className="mt-12 sm:mt-14">
          <FaqAccordion faqs={visibleFaqs} openIndex={openIndex} onToggle={setOpenIndex} />
        </div>

        {!showAll && (
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} variants={item} className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[.08] bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-black/[.03]"
            >
              View all FAQs
              <ChevronDown className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
