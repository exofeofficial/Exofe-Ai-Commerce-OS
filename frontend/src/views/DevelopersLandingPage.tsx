"use client";

import Link from "next/link";
import { Boxes, Code2, KeyRound, MessageSquareText, Sparkles, Truck } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const NAV_LINKS = [
  { label: "Products", href: "#products" },
  { label: "Shipping", href: "#shipping" },
  { label: "Authentication", href: "#authentication" },
  { label: "Quick start", href: "#quick-start" },
];

const CARDS = [
  {
    id: "products",
    icon: Boxes,
    title: "Products",
    description: "List, create, update, and delete items in your catalog from your own storefront or app.",
    cta: "Explore the Products API",
  },
  {
    id: "shipping",
    icon: Truck,
    title: "Shipping",
    description: "Read and update delivery areas, charges, estimated time, COD and pickup availability.",
    cta: "Explore the Shipping API",
  },
  {
    id: "authentication",
    icon: KeyRound,
    title: "Authentication",
    description: "Generate an API key from your dashboard and send it on every request — no login flow needed.",
    cta: "Set up authentication",
  },
] as const;

function EndpointRow({ method, path, description }: { method: string; path: string; description: string }) {
  const methodColor: Record<string, string> = {
    GET: "text-emerald-400",
    POST: "text-sky-400",
    PATCH: "text-amber-400",
    DELETE: "text-rose-400",
  };
  return (
    <div className="flex flex-col gap-1 border-b border-white/[.06] py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <div className="flex shrink-0 items-baseline gap-3 sm:w-64">
        <span className={`w-14 shrink-0 text-xs font-bold ${methodColor[method]}`}>{method}</span>
        <code className="text-sm text-white/90">{path}</code>
      </div>
      <p className="text-sm text-white/50">{description}</p>
    </div>
  );
}

export default function DevelopersLandingPage() {
  return (
    <div className="min-h-screen bg-[#131220] text-white">
      {/* header — deliberately its own, distinct from the marketing site's
          Navbar (see HIDDEN_CHROME_ROUTES), the way a dev-docs surface
          usually reads as its own product next to the main site */}
      <header className="sticky top-0 z-30 border-b border-white/[.08] bg-[#131220]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.png" alt="" className="h-6 w-6 object-contain" />
              <span className="text-sm font-bold text-white/40">dev</span>
              <span className="text-sm font-bold text-white">docs</span>
            </Link>
            <nav className="hidden items-center gap-5 md:flex">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="text-sm text-white/60 transition-colors hover:text-white">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/home"
              className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-3.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/[.08] hover:text-white sm:flex"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#a78bfa]" strokeWidth={2} />
              Ask Xo
            </Link>
            <Link
              href="/docs"
              className="hidden rounded-full px-3.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white sm:block"
            >
              Help
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[#131220] transition-opacity hover:opacity-90"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="border-b border-white/[.08] bg-gradient-to-br from-[#1c1a2a] via-[#1c1a2a] to-[#2a1d4a]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
              Exofe API
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Build on <span className="text-[#a78bfa]">Exofe</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/55">
              Connect your own storefront, website, or internal tool to Exofe. Sync your product
              catalog and shipping settings with a simple REST API, authenticated with a key you
              control.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#quick-start"
                className="rounded-full bg-[#45157b] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Read the quick start
              </a>
              <Link
                href="/dashboard/settings?tab=developers"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[.06] hover:text-white"
              >
                Get your API key
              </Link>
            </div>
          </div>

          {/* decorative mockup — a fake "browser" showing a request/response
              pair, kept purely illustrative rather than a literal screenshot */}
          <div className="relative hidden md:block">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0c16] shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-white/[.06] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-3 text-[11px] text-white/30">POST /public/products</span>
              </div>
              <pre className="overflow-x-auto px-4 py-4 text-[11px] leading-relaxed text-emerald-300/90">
{`{
  "name": "Iced Latte",
  "category": "Drinks",
  "price": 450,
  "stock": 40,
  "status": "active"
}`}
              </pre>
            </div>
            <div className="absolute -bottom-6 -right-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#1c1a2a] px-4 py-3 shadow-xl">
              <MessageSquareText className="h-4 w-4 text-emerald-400" strokeWidth={2} />
              <span className="text-xs font-medium text-white/70">201 Created</span>
            </div>
          </div>
        </div>
      </section>

      {/* three cards */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {CARDS.map(({ id, icon: Icon, title, description, cta }) => (
            <div key={id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[.03] p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#45157b]/25">
                <Icon className="h-5 w-5 text-[#c4b5fd]" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/50">{description}</p>
              <a
                href={`#${id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#c4b5fd] hover:text-white"
              >
                {cta} <span aria-hidden>→</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* products */}
      <section id="products" className="border-t border-white/[.08] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
            Manage your catalog programmatically. These are the exact same product records that
            show up in your Exofe dashboard and in WhatsApp conversations.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.02] px-5">
            <EndpointRow method="GET" path="/public/products" description="List products — supports ?search=, ?category=, ?status=" />
            <EndpointRow method="GET" path="/public/products/{id}" description="Get one product" />
            <EndpointRow method="POST" path="/public/products" description="Create a product" />
            <EndpointRow method="PATCH" path="/public/products/{id}" description="Update a product (full replace)" />
            <EndpointRow method="DELETE" path="/public/products/{id}" description="Delete a product" />
          </div>
        </div>
      </section>

      {/* shipping */}
      <section id="shipping" className="border-t border-white/[.08] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold">Shipping</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
            The same delivery settings shown on your dashboard&apos;s Settings page — areas, charge,
            estimated time, cash on delivery and pickup availability.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.02] px-5">
            <EndpointRow method="GET" path="/public/shipping" description="Get current shipping settings" />
            <EndpointRow method="PATCH" path="/public/shipping" description="Update shipping settings" />
          </div>
        </div>
      </section>

      {/* authentication */}
      <section id="authentication" className="border-t border-white/[.08] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold">Authentication</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
            Every request needs an API key, generated from{" "}
            <Link href="/dashboard/settings?tab=developers" className="text-[#c4b5fd] underline underline-offset-2 hover:text-white">
              Settings → Developers
            </Link>
            . Send it as the <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/90">X-API-Key</code> header — there&apos;s
            no login flow or session to manage.
          </p>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.02] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Header</p>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-[#0d0c16] p-4 text-xs leading-relaxed text-white/80">
              X-API-Key: exf_live_...
            </pre>
            <p className="mt-4 text-xs leading-relaxed text-white/45">
              Keys can be revoked at any time from the same Developers section. A revoked key stops
              working immediately on every endpoint.
            </p>
          </div>
        </div>
      </section>

      {/* quick start */}
      <section id="quick-start" className="border-t border-white/[.08] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold">Quick start</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
            Once you have a key, every endpoint is a plain REST call — no SDK required.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#0d0c16] p-5 text-[13px] leading-relaxed text-emerald-300/90">
{`curl ${API_BASE_URL}/public/products \\
  -H "X-API-Key: exf_live_..."

curl -X POST ${API_BASE_URL}/public/products \\
  -H "X-API-Key: exf_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Iced Latte","category":"Drinks","price":450,"stock":40,"status":"active"}'

curl -X PATCH ${API_BASE_URL}/public/shipping \\
  -H "X-API-Key: exf_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"areas":"Lahore, Karachi","charge":150,"estimatedTime":"1-2 days","cashOnDelivery":true,"pickupAvailable":false}'`}
          </pre>
        </div>
      </section>

      {/* footer CTA */}
      <section className="border-t border-white/[.08] bg-white/[.02] px-4 py-14 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <Code2 className="h-8 w-8 text-[#c4b5fd]" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold">Ready to build?</h2>
          <p className="max-w-md text-sm text-white/50">
            Generate a key from your dashboard and make your first request in a couple of minutes.
          </p>
          <Link
            href="/dashboard/settings?tab=developers"
            className="mt-2 rounded-full bg-[#45157b] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get your API key
          </Link>
        </div>
      </section>
    </div>
  );
}
