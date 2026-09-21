"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, ImageOff, Loader2, Mail, Sparkles, Store, Tag } from "lucide-react";
import { ApiError, getPublicTheme, installTheme, type PublicThemeDetail } from "@/lib/api";
import { getToken } from "@/lib/auth";

// Same fallback gradients as the store grid (ThemeStorePage.tsx) — kept in
// sync by index so a theme without a screenshot looks the same in both
// places, just bigger here.
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #45157b, #7c3aed)",
  "linear-gradient(135deg, #171326, #45157b)",
  "linear-gradient(135deg, #7c3aed, #c4b5fd)",
  "linear-gradient(135deg, #45157b, #b98700)",
];

export default function ThemeDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [theme, setTheme] = useState<PublicThemeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);

  async function activate() {
    setInstalling(true);
    setInstallError(null);
    try {
      await installTheme(id);
      setInstalled(true);
      router.push("/dashboard/store-theme");
    } catch (err) {
      setInstallError(err instanceof ApiError ? err.message : "Couldn't activate this theme.");
    } finally {
      setInstalling(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    getPublicTheme(id)
      .then((res) => {
        if (!cancelled) setTheme(res.theme);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load this theme.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-black/[.08] bg-white/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-5 lg:px-10">
          <Link href="/themes" className="flex items-center gap-2 text-sm font-medium text-[#171326] hover:text-[#45157b]">
            <ArrowLeft className="h-4 w-4" />
            <Image src="/logo-icon.png" alt="" width={22} height={22} />
            exofe <span className="font-normal text-black/40">/ themes</span>
          </Link>
          {theme && (
            <a
              href={theme.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#45157b] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              View live demo
            </a>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 lg:px-10 lg:py-14">
        {loading && (
          <div className="animate-pulse">
            <div className="h-80 w-full rounded-2xl bg-black/[.06]" />
            <div className="mt-6 h-8 w-64 rounded bg-black/[.06]" />
            <div className="mt-3 h-4 w-full max-w-lg rounded bg-black/[.06]" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-black/[.12] bg-[#f7f5f0] px-6 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eadaf4]">
              <Store className="h-6 w-6 text-[#45157b]" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-[#171326]">{error}</h1>
            <Link
              href="/themes"
              className="mt-5 rounded-full bg-[#45157b] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Back to Theme Store
            </Link>
          </div>
        )}

        {!loading && theme && (
          <>
            {theme.screenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={theme.screenshotUrl}
                alt={theme.name}
                className="h-56 w-full rounded-2xl border border-black/[.08] object-cover sm:h-72 lg:h-96"
              />
            ) : (
              <div
                className="flex h-56 w-full items-center justify-center rounded-2xl border border-black/[.08] sm:h-72 lg:h-96"
                style={{ background: CARD_GRADIENTS[theme.name.length % CARD_GRADIENTS.length] }}
              >
                <ImageOff className="h-12 w-12 text-white/50" strokeWidth={1.5} />
              </div>
            )}

            <div className="mt-8 flex flex-col gap-8 lg:flex-row">
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-full bg-[#eadaf4] px-2.5 py-1 text-xs font-semibold text-[#45157b]">
                  {theme.category}
                </span>
                <h1 className="mt-3 text-3xl font-bold text-[#171326] lg:text-4xl">{theme.name}</h1>
                <p className="mt-2 text-base text-black/60">{theme.summary}</p>

                <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-black/40">About this theme</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/70">{theme.description}</p>
              </div>

              <aside className="w-full shrink-0 lg:w-64">
                <div className="rounded-2xl border border-black/[.08] p-5">
                  <p className="text-2xl font-bold text-[#171326]">
                    {theme.pricingModel === "free" ? "Free" : `$${theme.price.toFixed(2)}`}
                  </p>
                  <a
                    href={theme.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 rounded-full border border-black/[.12] px-4 py-2.5 text-sm font-semibold text-[#171326] transition-colors hover:bg-black/[.03]"
                  >
                    View live demo <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {getToken() ? (
                    <button
                      type="button"
                      onClick={activate}
                      disabled={installing || installed}
                      className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full bg-[#45157b] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {installing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : installed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {installed ? "Activated" : "Activate this theme"}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full bg-[#45157b] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Log in to activate
                    </Link>
                  )}
                  {installError && <p className="mt-2 text-xs text-red-500">{installError}</p>}

                  <dl className="mt-6 space-y-4 border-t border-black/[.08] pt-5 text-sm">
                    <div className="flex items-center gap-2 text-black/60">
                      <Tag className="h-4 w-4 shrink-0" />
                      <span>Version {theme.version}</span>
                    </div>
                    <div>
                      <dt className="flex items-center gap-2 text-black/60">
                        <Mail className="h-4 w-4 shrink-0" />
                        Support
                      </dt>
                      <dd className="mt-1 pl-6">
                        <a href={`mailto:${theme.supportEmail}`} className="text-[#45157b] hover:underline">
                          {theme.supportEmail}
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
