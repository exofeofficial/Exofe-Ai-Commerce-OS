// Shared plan catalog — used by the marketing Pricing section and the
// dashboard Billing page, so the two never drift out of sync.
// Mirrors backend/app/services/billing_service.py PLAN_PRICES — keep in sync.
//
// Pricing philosophy (2026 relaunch): four paid tiers priced to sit
// comfortably under Shopify's Pakistan pricing without reading as a
// "cheap clone" — Grow is the intended hero plan. Annual discounts are
// NOT a flat percentage across tiers (Launch is discounted harder to
// pull in new merchants), so yearly is stored explicitly per plan
// rather than computed from monthly.

export type PlanId = "launch" | "grow" | "scale" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number | null; // null = custom (Enterprise)
  yearly: number | null; // null = custom (Enterprise) — explicit, not a flat % of monthly
  popular: boolean;
  aiActionsPerMonth: number | null; // null = custom (Enterprise)
  desc: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "launch",
    name: "Launch",
    tagline: "For new businesses",
    monthly: 1490,
    yearly: 990,
    popular: false,
    aiActionsPerMonth: 250,
    desc: "Everything a new store needs to go live.",
    features: [
      "100 products",
      "100 orders/month",
      "1 staff account",
      "Free themes + custom domain",
      "AI Store Builder (limited)",
      "WhatsApp Commerce add-on",
      "1 courier integration",
      "Basic analytics",
      "Standard support",
    ],
  },
  {
    id: "grow",
    name: "Grow",
    tagline: "For businesses ready to grow",
    monthly: 3990,
    yearly: 2990,
    popular: true,
    aiActionsPerMonth: 1000,
    desc: "Almost your entire ecommerce operation, in one plan.",
    features: [
      "Everything in Launch",
      "Unlimited products & orders",
      "5 staff accounts",
      "All standard themes",
      "Full AI Store Builder & Assistant",
      "WhatsApp Commerce included",
      "500 AI-assisted WhatsApp conversations",
      "Multiple courier integrations",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For high-volume commerce",
    monthly: 9990,
    yearly: 7490,
    popular: false,
    aiActionsPerMonth: 5000,
    desc: "For teams running serious order volume.",
    features: [
      "Everything in Grow",
      "15 staff accounts",
      "Advanced theme customization",
      "Advanced AI Assistant",
      "Full API access",
      "Advanced analytics + AI insights",
      "Priority migration",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For custom, large-scale operations",
    monthly: null,
    yearly: null,
    popular: false,
    aiActionsPerMonth: null,
    desc: "Custom limits, integrations, and a dedicated team.",
    features: [
      "Everything in Scale",
      "Unlimited staff accounts",
      "Custom courier integrations",
      "Advanced API access",
      "Managed migration",
      "Dedicated support",
    ],
  },
];

// A permanent (non-expiring) zero-cost tier, separate from the time-limited
// free trial — purely an acquisition funnel: experience Exofe, then hit a
// natural ceiling and upgrade. Deliberately capped hard so it can't be run
// as a full store long-term.
export const FREE_PLAN = {
  name: "Exofe Free",
  monthly: 0,
  aiActionsPerMonth: 50,
  features: [
    "10 products",
    "20 orders/month",
    "yourstore.shop.exofe.com subdomain",
    "1 free theme",
    "Basic store editor",
    "Cash on Delivery",
    "Exofe branding",
  ],
  limitations: ["No custom domain", "No advanced WhatsApp automation"],
  upgradeNudge: "You've reached 20 orders — upgrade to Launch to keep selling.",
};

// Time-limited launch promo, not a permanent price tier — first N
// merchants lock in Grow's features at a discount for a fixed period.
export const FOUNDING_MERCHANT_OFFER = {
  badge: "Founding Merchant",
  price: 1999,
  lockMonths: 12,
  seats: 500,
  normalPrice: 3990,
  includesPlan: "grow" as PlanId,
};

export const ZERO_TRANSACTION_FEE_LINE = "0% Exofe transaction fee — we don't take a cut from your sales.";

// Detailed side-by-side matrix — same 4 paid tiers as PLANS, one row per
// capability. Rendered as the "compare all features" table below the cards.
export const COMPARISON_ROWS: { label: string; values: [string, string, string, string] }[] = [
  { label: "Products", values: ["100", "Unlimited", "Unlimited", "Unlimited"] },
  { label: "Orders", values: ["100/mo", "Unlimited", "Unlimited", "Unlimited"] },
  { label: "Staff accounts", values: ["1", "5", "15", "Unlimited"] },
  { label: "Exofe subdomain", values: ["✓", "✓", "✓", "✓"] },
  { label: "Custom domain", values: ["✓", "✓", "✓", "✓"] },
  { label: "Themes", values: ["Free themes", "All standard themes", "All themes", "All themes"] },
  { label: "Theme customization", values: ["✓", "✓", "Advanced", "Advanced"] },
  { label: "AI Store Builder", values: ["Limited", "✓", "✓", "✓"] },
  { label: "AI Business Assistant", values: ["Limited", "✓", "Advanced", "Advanced"] },
  { label: "WhatsApp Commerce", values: ["Add-on / limited", "✓", "✓", "✓"] },
  { label: "Cash on Delivery", values: ["✓", "✓", "✓", "✓"] },
  { label: "Courier integrations", values: ["1", "Multiple", "Multiple", "Custom"] },
  { label: "Analytics", values: ["Basic", "Advanced", "Advanced + AI", "Custom"] },
  { label: "Store migration", values: ["Products only", "Full", "Priority", "Managed"] },
  { label: "API access", values: ["—", "Limited", "Full", "Advanced"] },
  { label: "Support", values: ["Standard", "Priority", "Priority", "Dedicated"] },
];
