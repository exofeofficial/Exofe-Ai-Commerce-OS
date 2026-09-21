"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;
const NAVBAR_OFFSET = 84; // matches Navbar.tsx's own scroll offset

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
};

type FooterLinkData = { label: string; href: string; external?: boolean };
type FooterGroupData = { title: string; links: FooterLinkData[] };

// Config-driven: every desktop column and every mobile accordion panel reads
// from this one array, so adding/renaming a link never touches JSX.
const FOOTER_GROUPS: FooterGroupData[] = [
  {
    title: "Product",
    links: [
      { label: "Store Builder", href: "/#features" },
      { label: "AI Business Assistant", href: "/#features" },
      { label: "WhatsApp Commerce", href: "/#features" },
      { label: "Orders & Shipping", href: "/#features" },
      { label: "AI Commerce", href: "/#features" },
      { label: "Smart Analytics", href: "/#features" },
      { label: "Themes", href: "/themes" },
      { label: "Apps", href: "/apps" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Start a Business", href: "/solutions/start-a-business" },
      { label: "Online Stores", href: "/solutions/online-stores" },
      { label: "WhatsApp Selling", href: "/solutions/whatsapp-selling" },
      { label: "Social Commerce", href: "/solutions/social-commerce" },
      { label: "COD Commerce", href: "/solutions/cod-commerce" },
      { label: "AI-Powered Commerce", href: "/solutions/ai-powered-commerce" },
      { label: "Migrate to Exofe", href: "/migrate" },
      { label: "For Growing Businesses", href: "/solutions/growing-businesses" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Developer Platform", href: "https://developer.exofe.com", external: true },
      { label: "Build Apps", href: "https://developer.exofe.com/docs/apps", external: true },
      { label: "Build Themes", href: "https://developer.exofe.com/docs/themes", external: true },
      { label: "AI & Agents", href: "https://developer.exofe.com/docs/ai-agents", external: true },
      { label: "API Documentation", href: "https://developer.exofe.com/docs", external: true },
      { label: "Webhooks", href: "https://developer.exofe.com/docs/webhooks", external: true },
      { label: "Development Stores", href: "https://developer.exofe.com/docs/development-stores", external: true },
      { label: "SDKs", href: "https://developer.exofe.com/docs/sdks", external: true },
      { label: "Changelog", href: "https://developer.exofe.com/changelog", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Exofe", href: "/about" },
      { label: "Why Exofe", href: "/why-exofe" },
      { label: "Blog", href: "/blog" },
      { label: "Partners", href: "/partners" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Documentation", href: "https://developer.exofe.com/docs", external: true },
      { label: "System Status", href: "/status" },
      { label: "Security", href: "/security" },
    ],
  },
];

const LEGAL_LINKS: FooterLinkData[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Acceptable Use", href: "/acceptable-use" },
  { label: "Security", href: "/security" },
];

// Brand-mark paths only — lucide-react dropped its social-brand icon set,
// so these four are hand-drawn minimal outlines rather than a dependency.
const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/exofe",
    path: "M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.26-.02-2.88-1.76-2.88-1.76 0-2.03 1.37-2.03 2.79V21h-4V9.5Z",
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/exofe",
    path: "M4 4l7.2 9.4L4.3 20H6l6.1-5.9L16.8 20H20l-7.6-9.9L19.4 4h-1.7l-5.6 5.5L7.2 4H4Zm2.6 1.5h1.7l9.1 12.9h-1.7L6.6 5.5Z",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@exofe",
    path: "M21.58 7.19c-.23-.87-.91-1.55-1.78-1.78C18.25 5 12 5 12 5s-6.25 0-7.8.41c-.87.23-1.55.91-1.78 1.78C2 8.74 2 12 2 12s0 3.26.42 4.81c.23.87.91 1.55 1.78 1.78C5.75 19 12 19 12 19s6.25 0 7.8-.41c.87-.23 1.55-.91 1.78-1.78C22 15.26 22 12 22 12s0-3.26-.42-4.81ZM10 15.5v-7l6 3.5-6 3.5Z",
  },
  {
    label: "GitHub",
    href: "https://github.com/exofeofficial",
    path: "M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.19-3.37-1.19-.45-1.17-1.11-1.48-1.11-1.48-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 2.5-.34c.85 0 1.71.11 2.5.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.78-4.57 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z",
  },
];

function useSectionScroll() {
  const pathname = usePathname();
  return (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname !== "/" || !href.startsWith("/#")) return;
    const target = document.querySelector(href.slice(1));
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };
}

function FooterLink({ link, onClick }: { link: FooterLinkData; onClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void }) {
  const className =
    "rounded-sm text-sm text-white/50 transition-colors duration-200 hover:text-[#c4b5fd] focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fcba03]";

  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} onClick={(e) => onClick?.(e, link.href)} className={className}>
      {link.label}
    </Link>
  );
}

function FooterGroup({ group, onLinkClick }: { group: FooterGroupData; onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void }) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wide text-white">{group.title}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {group.links.map((link) => (
          <li key={link.label}>
            <FooterLink link={link} onClick={onLinkClick} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLinks() {
  return (
    <ul className="flex items-center gap-3">
      {SOCIALS.map((s) => (
        <li key={s.label}>
          <motion.a
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors duration-200 hover:text-[#fcba03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fcba03]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d={s.path} />
            </svg>
          </motion.a>
        </li>
      ))}
    </ul>
  );
}

function FooterBrand() {
  return (
    <div className="relative">
      {/* extremely low-opacity purple glow, scoped to just this column */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-[#45157b] opacity-[0.07] blur-[90px]"
      />
      <div className="relative">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="" className="h-8 w-auto" />
          <span className="text-xl font-bold tracking-tight text-white">Exofe</span>
        </Link>
        <p className="mt-5 text-sm font-semibold text-white/80">Commerce, reimagined with AI.</p>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
          Build your storefront, manage operations, sell across channels and grow your business from one
          intelligent commerce platform.
        </p>
        <div className="mt-6">
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}

function MobileAccordionItem({
  group,
  isOpen,
  onToggle,
  onLinkClick,
}: {
  group: FooterGroupData;
  isOpen: boolean;
  onToggle: () => void;
  onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const panelId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-sm py-4 text-left text-sm font-bold uppercase tracking-wide text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fcba03]"
      >
        {group.title}
        <ChevronDown
          className={`h-4 w-4 text-white/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={2.2}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-3 pb-5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} onClick={onLinkClick} />
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LanguageRegion() {
  // Static placeholder for V1 — deliberately non-interactive and low-key so
  // it can be swapped for a real language/currency selector later without
  // touching the bottom bar's layout.
  return (
    <p className="text-[11px] text-white/25">
      Language: English &middot; Region: Pakistan
    </p>
  );
}

function FooterBottomBar() {
  const scrollToSection = useSectionScroll();

  return (
    <div className="border-t border-white/10 py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Exofe. All rights reserved.</p>
        <p className="text-xs font-semibold text-white/30">Build. Sell. Operate. Grow.</p>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LEGAL_LINKS.map((link) => (
            <li key={link.label}>
              <FooterLink link={link} onClick={scrollToSection} />
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5">
        <LanguageRegion />
      </div>
    </div>
  );
}

export default function Footer() {
  const scrollToSection = useSectionScroll();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const [productGroup, solutionsGroup, developersGroup, companyGroup, resourcesGroup] = FOOTER_GROUPS;

  return (
    <footer className="relative overflow-hidden bg-[#09090C] px-4 pt-16 sm:px-6 sm:pt-20">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={container}
        className="mx-auto w-full max-w-[1400px]"
      >
        {/* desktop / tablet grid */}
        <div className="hidden items-start gap-x-10 gap-y-14 sm:grid sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] lg:gap-x-8">
          <motion.div variants={item} className="sm:col-span-3 lg:col-span-1">
            <FooterBrand />
          </motion.div>

          <motion.nav variants={item} aria-label="Product links">
            <FooterGroup group={productGroup} onLinkClick={scrollToSection} />
          </motion.nav>
          <motion.nav variants={item} aria-label="Solutions links">
            <FooterGroup group={solutionsGroup} onLinkClick={scrollToSection} />
          </motion.nav>
          <motion.nav variants={item} aria-label="Developer links">
            <FooterGroup group={developersGroup} onLinkClick={scrollToSection} />
          </motion.nav>
          <motion.nav variants={item} aria-label="Company and resource links" className="flex flex-col gap-10">
            <FooterGroup group={companyGroup} onLinkClick={scrollToSection} />
            <FooterGroup group={resourcesGroup} onLinkClick={scrollToSection} />
          </motion.nav>
        </div>

        {/* mobile: brand block + accordions */}
        <div className="sm:hidden">
          <motion.div variants={item}>
            <FooterBrand />
          </motion.div>
          <motion.nav variants={item} aria-label="Footer links" className="mt-10 border-t border-white/10">
            {FOOTER_GROUPS.map((group) => (
              <MobileAccordionItem
                key={group.title}
                group={group}
                isOpen={openGroups.has(group.title)}
                onToggle={() => toggleGroup(group.title)}
                onLinkClick={scrollToSection}
              />
            ))}
          </motion.nav>
        </div>
      </motion.div>

      <div className="mx-auto w-full max-w-[1400px]">
        <FooterBottomBar />
      </div>
    </footer>
  );
}
