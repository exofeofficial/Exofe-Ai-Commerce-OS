"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppWindow, CheckCircle2, Download, ExternalLink, Loader2, PackageCheck, Paintbrush, X, XCircle } from "lucide-react";
import {
  ApiError,
  getAdminSubmission,
  getAdminSubmissions,
  updateAdminSubmissionStatus,
  type AdminSubmission,
  type AdminSubmissionDetail,
  type AdminSubmissionStatus,
} from "@/lib/api";

const FILTERS: { id: AdminSubmissionStatus | "all"; label: string }[] = [
  { id: "submitted", label: "Pending review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

const STATUS_STYLES: Record<AdminSubmissionStatus, string> = {
  submitted: "bg-amber-500/15 text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};

function KindBadge({ kind }: { kind: "app" | "theme" }) {
  const Icon = kind === "app" ? AppWindow : Paintbrush;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium capitalize text-white/70">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {kind}
    </span>
  );
}

// Uploaded packages are stored as a base64 data URI directly in the row
// (see MAX_PACKAGE_BYTES in developer_submissions.py) — no filename/size is
// persisted separately, so size is estimated from the encoded string itself.
function estimateBytesFromDataUri(dataUri: string): number {
  const b64 = dataUri.slice(dataUri.indexOf(",") + 1);
  return Math.round((b64.length * 3) / 4);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ReviewModal({
  id,
  onClose,
  onDecided,
}: {
  id: string;
  onClose: () => void;
  onDecided: (updated: { id: string; status: AdminSubmissionStatus }) => void;
}) {
  const [submission, setSubmission] = useState<AdminSubmissionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminSubmission(id)
      .then((res) => {
        if (!cancelled) setSubmission(res.submission);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load this submission.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const decide = async (status: "approved" | "rejected") => {
    setDeciding(status);
    try {
      const updated = await updateAdminSubmissionStatus(id, status);
      onDecided({ id: updated.id, status: updated.status as AdminSubmissionStatus });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update this submission.");
      setDeciding(null);
    }
  };

  const isDataUri = submission?.packageUrl.startsWith("data:");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-6"
      >
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Submission review</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && !submission && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {!submission && !error && (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#45157b]" strokeWidth={2} />
          </div>
        )}

        {submission && (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <KindBadge kind={submission.kind} />
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[submission.status]}`}>
                {submission.status}
              </span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-white/60">{submission.category}</span>
            </div>
            <h2 className="mt-3 text-xl font-bold text-white">{submission.name}</h2>
            <p className="text-xs text-white/40">v{submission.version}</p>
            {submission.screenshotUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={submission.screenshotUrl}
                alt={`${submission.name} screenshot`}
                className="mt-4 h-40 w-full rounded-lg border border-white/10 object-cover"
              />
            )}
            <p className="mt-3 text-sm leading-6 text-white/70">{submission.description}</p>

            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-white/40">Developer</dt>
                <dd className="mt-1 text-white/80">{submission.developerName}</dd>
                <dd>
                  <a href={`mailto:${submission.developerEmail}`} className="text-xs text-[#8b6fd6] hover:underline">
                    {submission.developerEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-white/40">Price</dt>
                <dd className="mt-1 text-white/80">{submission.pricingModel === "free" ? "Free" : `$${submission.price.toFixed(2)}`}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/40">Support email</dt>
                <dd className="mt-1">
                  <a href={`mailto:${submission.supportEmail}`} className="text-[#8b6fd6] hover:underline">
                    {submission.supportEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-white/40">Live demo</dt>
                <dd className="mt-1">
                  <a
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#8b6fd6] hover:underline"
                  >
                    Open demo <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <dt className="text-xs text-white/40">Package</dt>
              {isDataUri ? (
                <a
                  href={submission.packageUrl}
                  download={`${submission.name.replace(/\s+/g, "-").toLowerCase()}.zip`}
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4" strokeWidth={2} />
                  Download package ({formatBytes(estimateBytesFromDataUri(submission.packageUrl))})
                </a>
              ) : (
                <a
                  href={submission.packageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-sm text-[#8b6fd6] hover:underline"
                >
                  Open package link <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {submission.notes && (
              <div className="mt-5">
                <dt className="text-xs text-white/40">Notes from developer</dt>
                <dd className="mt-1.5 rounded-lg border border-white/10 bg-white/[.03] p-3 text-sm leading-6 text-white/70">
                  {submission.notes}
                </dd>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            {submission.status === "submitted" && (
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  disabled={deciding !== null}
                  onClick={() => decide("approved")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
                >
                  {deciding === "approved" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </button>
                <button
                  type="button"
                  disabled={deciding !== null}
                  onClick={() => decide("rejected")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-60"
                >
                  {deciding === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function AdminApprovalsPage() {
  const [filter, setFilter] = useState<AdminSubmissionStatus | "all">("submitted");
  const [submissions, setSubmissions] = useState<AdminSubmission[] | null>(null);
  const [loadedFilter, setLoadedFilter] = useState<AdminSubmissionStatus | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminSubmissions(filter === "all" ? undefined : filter)
      .then((res) => {
        if (cancelled) return;
        setSubmissions(res.submissions);
        setLoadedFilter(filter);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load submissions.");
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  // stale data from the previous filter shouldn't render as this filter's
  // results while the new page is in flight
  const showingCurrentFilter = loadedFilter === filter;

  const handleDecided = ({ id, status }: { id: string; status: AdminSubmissionStatus }) => {
    setSubmissions((prev) => {
      if (!prev) return prev;
      // no longer belongs in this filtered view once its status changes
      if (filter !== "all" && filter !== status) return prev.filter((s) => s.id !== id);
      return prev.map((s) => (s.id === id ? { ...s, status } : s));
    });
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.id ? "bg-[#45157b] text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950 p-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!error && !showingCurrentFilter && (
        <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950">
          <Loader2 className="h-6 w-6 animate-spin text-[#45157b]" strokeWidth={2} />
        </div>
      )}

      {!error && showingCurrentFilter && submissions && submissions.length === 0 && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-950 p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#45157b]/15 text-[#45157b]">
            <PackageCheck className="h-6 w-6" strokeWidth={2} />
          </span>
          <h2 className="mt-4 text-lg font-bold text-white">
            {filter === "submitted" ? "Nothing awaiting review" : "No submissions here"}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-white/50">
            {filter === "submitted"
              ? "Apps and themes developers submit for review will show up here."
              : "Try a different filter above."}
          </p>
        </div>
      )}

      {!error && showingCurrentFilter && submissions && submissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <p className="text-sm font-semibold text-white">
              {submissions.length} submission{submissions.length === 1 ? "" : "s"}
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
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-white/[.03]">
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
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/40">
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setReviewing(s.id)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/5"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {reviewing && <ReviewModal id={reviewing} onClose={() => setReviewing(null)} onDecided={handleDecided} />}
    </>
  );
}
