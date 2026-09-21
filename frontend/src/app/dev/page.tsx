import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AppWindow,
  Blocks,
  BookOpen,
  Braces,
  Code2,
  GitBranch,
  LayoutTemplate,
  Paintbrush,
  Search,
  Sparkles,
  Store,
  Sun,
  Terminal,
  Webhook,
} from "lucide-react";
import styles from "./DevLanding.module.css";

export const metadata: Metadata = {
  title: "Exofe Dev Docs — Build apps and storefronts",
  description: "Documentation, APIs, and tools for building apps, themes, and storefronts with Exofe.",
};

export default function DevLandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/dev" className={styles.brand} aria-label="Exofe developer home">
          <span className={styles.brandMark} aria-hidden="true">
            <Image src="/logo-icon.png" alt="" width={26} height={26} />
          </span>
          <span>dev docs</span>
        </Link>

        <nav className={styles.nav} aria-label="Developer navigation">
          <a href="#apps">Apps</a>
          <a href="#storefronts">Storefronts</a>
          <a href="#themes">Themes</a>
          <a href="#references">References</a>
          <a href="#changelog">Changelog</a>
        </nav>

        <div className={styles.actions}>
          <button className={styles.askButton} type="button">
            <Sparkles size={15} aria-hidden="true" />
            <span>Ask assistant</span>
            <kbd>/</kbd>
          </button>
          <button className={styles.iconButton} type="button" aria-label="Search documentation">
            <Search size={17} />
          </button>
          <button className={styles.iconButton} type="button" aria-label="Toggle theme">
            <Sun size={17} />
          </button>
          <a className={styles.login} href={process.env.NODE_ENV === "production" ? "https://developer.exofe.com" : "/developer"}>Developer dashboard</a>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><Code2 size={15} /> Exofe developer platform</span>
          <h1>Build apps and storefronts for modern commerce.</h1>
          <p>
            Extend Exofe with custom apps, design high-converting storefronts, and connect every part
            of your commerce stack with developer-first APIs and tools.
          </p>
          <div className={styles.heroButtons}>
            <a href="#apps" className={styles.primaryButton}>Build your first app <ArrowRight size={16} /></a>
            <a href="#references" className={styles.secondaryButton}><BookOpen size={16} /> View API reference</a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <Image src="/dev-store-builder-hero.png" alt="Exofe store editor with desktop and mobile storefront previews" width={1640} height={909} priority />
        </div>
      </section>

      <section id="apps" className={styles.platformSection}>
        <div className={styles.sectionHeading}>
          <span>Build with Exofe</span>
          <h2>Choose what you want to build.</h2>
        </div>

        <div className={styles.cardGrid}>
          <article className={`${styles.featureCard} ${styles.cardBlue}`}>
            <div className={styles.cardIcon}><AppWindow size={22} /></div>
            <h3>Apps</h3>
            <p>Extend Exofe&apos;s core with apps that integrate into admin, products, orders, and checkout.</p>
            <a href="#quickstart">Build your first app <ArrowRight size={15} /></a>
            <div className={styles.apiArt} aria-hidden="true">
              <div className={styles.artToolbar}><i /><i /><i /></div>
              <div className={styles.artSidebar}><b /><b /><b /><b /></div>
              <div className={styles.artCode}><i /><i /><i /><i /><i /></div>
              <span className={styles.artBadge}><Braces size={22} /></span>
            </div>
          </article>

          <article id="storefronts" className={`${styles.featureCard} ${styles.cardMagenta}`}>
            <div className={styles.cardIcon}><Store size={22} /></div>
            <h3>Storefronts</h3>
            <p>Create branded shopping experiences with flexible layouts, products, cart, and checkout.</p>
            <a href="#quickstart">Build a storefront <ArrowRight size={15} /></a>
            <div className={styles.messageArt} aria-hidden="true">
              <div className={styles.phoneFrame}>
                <span /><b /><span /><em />
              </div>
              <div className={styles.flowLines}><i /><i /><i /><i /></div>
            </div>
          </article>

          <article id="themes" className={`${styles.featureCard} ${styles.cardViolet}`}>
            <div className={styles.cardIcon}><Paintbrush size={22} /></div>
            <h3>Themes & extensions</h3>
            <p>Shape every store with reusable themes, custom sections, blocks, and checkout extensions.</p>
            <a href="#references">Explore theme tools <ArrowRight size={15} /></a>
            <div className={styles.agentArt} aria-hidden="true">
              <div className={styles.agentWindow}>
                <span className={styles.agentSpark}><LayoutTemplate size={25} /></span>
                <i /><i /><i />
                <div><b /><b /><b /></div>
              </div>
              <span className={styles.gearOne}>✦</span>
              <span className={styles.gearTwo}>✦</span>
            </div>
          </article>
        </div>
      </section>

      <section id="quickstart" className={styles.quickstart}>
        <div className={styles.quickCopy}>
          <span className={styles.sectionKicker}><Terminal size={16} /> Exofe CLI</span>
          <h2>From zero to your first app in minutes.</h2>
          <p>
            Scaffold an app, connect a development store, and preview extensions locally with one
            focused workflow.
          </p>
          <a href="#references" className={styles.textLink}>Read the quickstart <ArrowRight size={16} /></a>
        </div>
        <div className={styles.terminal}>
          <div className={styles.terminalTop}>
            <span><i /><i /><i /></span>
            <b>terminal</b>
            <em>⌘ K</em>
          </div>
          <div className={styles.terminalBody}>
            <p><span>$</span> npm create exofe-app@latest</p>
            <p className={styles.muted}>◇ App name <b>inventory-sync</b></p>
            <p className={styles.muted}>◇ Template <b>Admin extension</b></p>
            <p className={styles.success}>✓ App project created successfully</p>
            <p><span>$</span> cd inventory-sync && npm run dev</p>
            <p className={styles.ready}>● Preview ready at <b>http://localhost:4100</b></p>
          </div>
        </div>
      </section>

      <section id="references" className={styles.resources}>
        <div className={styles.sectionHeading}>
          <span>Explore the platform</span>
          <h2>Go deeper with practical references.</h2>
        </div>
        <div className={styles.resourceGrid}>
          <a href="/docs"><BookOpen size={21} /><div><h3>Documentation</h3><p>Concepts, guides, and step-by-step tutorials.</p></div><ArrowRight size={18} /></a>
          <a href="/docs#api-reference"><Webhook size={21} /><div><h3>API reference</h3><p>Products, orders, customers, checkout, and webhooks.</p></div><ArrowRight size={18} /></a>
          <a href="/docs"><Blocks size={21} /><div><h3>App extensions</h3><p>Embed useful workflows across the Exofe admin.</p></div><ArrowRight size={18} /></a>
          <a id="changelog" href="/docs"><GitBranch size={21} /><div><h3>Changelog</h3><p>See what is new across Exofe developer tools.</p></div><ArrowRight size={18} /></a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <Image src="/logo-icon.png" alt="" width={26} height={26} />
          </span>
          <span>dev docs</span>
        </div>
        <p>Build better commerce with Exofe.</p>
        <div><a href="/docs">Docs</a><a href="mailto:hello@exofe.com">Support</a><a href="/privacy">Privacy</a></div>
      </footer>
    </main>
  );
}
