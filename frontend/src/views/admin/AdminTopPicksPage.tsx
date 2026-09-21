"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppWindow, Loader2, Paintbrush, Sparkles, Star } from "lucide-react";
import {
  ApiError,
  getAdminSubmissions,
  updateAdminSubmissionFeatured,
  type AdminSubmission,
} from "@/lib/api";

const MAX_FEATURED = 3;

function KindBadge({ kind }: { kind: "app" | "theme" }) {
  const Icon = kind === "app" ? AppWindow : Paintbrush;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium capitalize text-white/70">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {kind}
    </span>
  );
}

export default function AdminTopPicksPage() {
  const [submissions, setSubmissions] = useState<AdminSubmission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminSubmissions("approved")
      .then((res) => {
        if (!cancelled) setSubmissions(res.submissions);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load approved submissions.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredCount = submissions?.filter((s) => s.isFeatured).length ?? 0;

  const toggleFeatured = async (submission: AdminSubmission) => {
    setToggling(submission.id);
    setError(null);
    try {
      const updated = await updateAdminSubmissionFeatured(submission.id, !submission.isFeatured);
      setSubmissions((prev) => prev?.map((s) => (s.id === updated.id ? { ...s, isFeatured: updated.isFeatured } : s)) ?? prev);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update this submission.");
    } finally {
      setToggling(null);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/60">
          Pick up to {MAX_FEATURED} apps or themes to feature as &quot;Today&apos;s top picks&quot; on themes.exofe.com.
        </p>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            featuredCount >= MAX_FEATURED ? "bg-amber-500/15 text-amber-400" : "bg-white/5 text-white/60"
          }`}
        >
          {featuredCount} of {MAX_FEATURED} featured
        </span>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {!submissions && !error && (
        <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950">
          <Loader2 className="h-6 w-6 animate-spin text-[#45157b]" strokeWidth={2} />
        </div>
      )}

      {submissions && submissions.length === 0 && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950 p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#45157b]/15 text-[#45157b]">
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </span>
          <h2 className="mt-4 text-lg font-bold text-white">No approved apps or themes yet</h2>
          <p className="mt-1.5 max-w-sm text-sm text-white/50">
            Approve a submission from the Approvals tab before featuring it here.
          </p>
        </div>
      )}

      {submissions && submissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <p className="text-sm font-semibold text-white">
              {submissions.length} approved submission{submissions.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Developer</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium text-right">Featured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((s) => (
                  <tr key={s.id} className={`transition-colors hover:bg-white/[.03] ${s.isFeatured ? "bg-amber-500/[.04]" : ""}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white">{s.name}</p>
                      <p className="mt-0.5 text-xs text-white/40">{s.category}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <KindBadge kind={s.kind} />
                    </td>
                    <td className="px-5 py-3.5 text-white/60">
                      <p>{s.developerName}</p>
                      <p className="text-xs text-white/35">{s.developerEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-white/70">{s.pricingModel === "free" ? "Free" : `$${s.price.toFixed(2)}`}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        disabled={toggling === s.id || (!s.isFeatured && featuredCount >= MAX_FEATURED)}
                        onClick={() => toggleFeatured(s)}
                        title={!s.isFeatured && featuredCount >= MAX_FEATURED ? `Unfeature something else first (max ${MAX_FEATURED})` : undefined}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          s.isFeatured
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                            : "border-white/10 text-white/60 hover:bg-white/5"
                        }`}
                      >
                        {toggling === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Star className="h-3.5 w-3.5" fill={s.isFeatured ? "currentColor" : "none"} />
                        )}
                        {s.isFeatured ? "Featured" : "Feature"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </>
  );
}
