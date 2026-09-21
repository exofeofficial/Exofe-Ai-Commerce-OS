"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AppWindow, ArrowRight, BookOpen, CheckCircle2, ChevronRight, Clock3, Code2, DollarSign, ExternalLink, FileArchive, FileCode2, Image as ImageIcon, LayoutDashboard, Link2, Loader2, LogOut, Menu, Paintbrush, Plus, Search, Send, ShieldCheck, Upload, Wallet, X } from "lucide-react";
import { ApiError, getDeveloperSubmissions, saveDeveloperSubmission, submitDeveloperSubmission, uploadDeveloperPackage, uploadDeveloperScreenshot, type DeveloperSubmission, type DeveloperSubmissionInput, type ThemeDefinition } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import ThemeSectionsBuilder from "@/components/dashboard/ThemeSectionsBuilder";

type Tab = "overview" | "app" | "theme" | "submissions" | "revenue";
const tabs = [{ id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "app", label: "My apps", icon: AppWindow }, { id: "theme", label: "My themes", icon: Paintbrush }, { id: "submissions", label: "Submissions", icon: Send }, { id: "revenue", label: "Revenue", icon: Wallet }] as const;
const statusLabels = { draft: "Draft", submitted: "In review", approved: "Approved", rejected: "Rejected" };
const emptyThemeDefinition = (): ThemeDefinition => ({ sectionTemplates: [], layout: [] });
const fresh = (kind: "app" | "theme"): DeveloperSubmissionInput => ({ kind, name: "", summary: "", description: "", version: "1.0.0", category: kind === "theme" ? "Store design" : "Productivity", demoUrl: "", screenshotUrl: "", packageUrl: "", supportEmail: "", notes: "", pricingModel: "free", price: 0, themeDefinition: kind === "theme" ? emptyThemeDefinition() : null });
const inputClass = "mt-2 w-full rounded-lg border border-white/15 bg-[#10181b] px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-60";
const formatBytes = (bytes: number) => (bytes <= 0 ? "" : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);
const primaryClass = "inline-flex items-center justify-center gap-2 rounded-lg bg-[#66ebbc] px-4 py-2.5 text-sm font-semibold text-[#08231a] transition hover:bg-[#8af4cf] disabled:opacity-50";

export default function DeveloperPortal() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [items, setItems] = useState<DeveloperSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<DeveloperSubmissionInput | null>(null);
  const [editing, setEditing] = useState<DeveloperSubmission | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [consent, setConsent] = useState(false);
  const [packageMode, setPackageMode] = useState<"upload" | "link">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [screenshotMode, setScreenshotMode] = useState<"upload" | "link">("upload");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [uploadedScreenshot, setUploadedScreenshot] = useState<{ name: string; size: number } | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const locked = !!editing && editing.status !== "draft";

  const load = useCallback(async () => {
    if (!getToken()) { router.replace("/developer/login"); return; }
    try { setItems((await getDeveloperSubmissions()).submissions); setError(""); }
    catch (err) {
      if (err instanceof ApiError && err.status === 401) { clearToken(); router.replace("/developer/login"); }
      else setError(err instanceof Error ? err.message : "Couldn't load your submissions.");
    } finally { setLoading(false); }
  }, [router]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (form) dialog.current?.showModal();
    else dialog.current?.close();
  }, [form]);

  function open(kind: "app" | "theme", existing?: DeveloperSubmission) {
    setEditing(existing ?? null);
    if (existing) {
      const { kind, name, summary, description, version, category, demoUrl, screenshotUrl, packageUrl, supportEmail, notes, pricingModel, price, themeDefinition } = existing;
      setForm({ kind, name, summary, description, version, category, demoUrl, screenshotUrl, packageUrl, supportEmail, notes, pricingModel, price, themeDefinition: themeDefinition ?? (kind === "theme" ? emptyThemeDefinition() : null) });
      // A data: URI only ever comes from the upload endpoints below — there's
      // no way to recover the original filename from it, so the label is
      // generic for a draft that was already uploaded before this session.
      if (packageUrl.startsWith("data:")) { setPackageMode("upload"); setUploadedFile({ name: "Uploaded package.zip", size: 0 }); }
      else { setPackageMode("link"); setUploadedFile(null); }
      if (screenshotUrl.startsWith("data:")) { setScreenshotMode("upload"); setUploadedScreenshot({ name: "Uploaded screenshot", size: 0 }); }
      else { setScreenshotMode("link"); setUploadedScreenshot(null); }
    } else { setForm(fresh(kind)); setPackageMode("upload"); setUploadedFile(null); setScreenshotMode("upload"); setUploadedScreenshot(null); }
    setConsent(false); setFormError("");
  }
  function update<K extends keyof DeveloperSubmissionInput>(key: K, value: DeveloperSubmissionInput[K]) {
    setForm((old) => old ? { ...old, [key]: value } : old);
  }
  function switchPackageMode(mode: "upload" | "link") {
    setPackageMode(mode); setUploadedFile(null); update("packageUrl", "");
  }
  function switchScreenshotMode(mode: "upload" | "link") {
    setScreenshotMode(mode); setUploadedScreenshot(null); update("screenshotUrl", "");
  }
  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets picking the same file again re-fire onChange
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) { setFormError("Upload a .zip file."); return; }
    setUploading(true); setFormError("");
    try {
      const result = await uploadDeveloperPackage(file);
      update("packageUrl", result.url);
      setUploadedFile({ name: result.name, size: result.size });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { clearToken(); router.replace("/developer/login"); return; }
      setFormError(err instanceof Error ? err.message : "Couldn't upload that file. Please try again.");
    } finally { setUploading(false); }
  }
  async function handleScreenshotSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setFormError("Upload an image file."); return; }
    setUploadingScreenshot(true); setFormError("");
    try {
      const result = await uploadDeveloperScreenshot(file);
      update("screenshotUrl", result.url);
      setUploadedScreenshot({ name: result.name, size: result.size });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { clearToken(); router.replace("/developer/login"); return; }
      setFormError(err instanceof Error ? err.message : "Couldn't upload that image. Please try again.");
    } finally { setUploadingScreenshot(false); }
  }
  function upsert(item: DeveloperSubmission) {
    setItems((old) => [item, ...old.filter((other) => other.id !== item.id)]);
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || busy || locked || uploading || uploadingScreenshot) return;
    const submit = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "submit";
    if (!form.screenshotUrl) { setFormError(screenshotMode === "upload" ? "Upload a screenshot before saving." : "Add a link to your screenshot."); return; }
    if (!form.packageUrl) { setFormError(packageMode === "upload" ? "Upload your package before saving." : "Add a link to your package."); return; }
    if (form.kind === "theme" && !form.themeDefinition?.layout.length) { setFormError("Add at least one section to the theme's layout."); return; }
    if (form.pricingModel === "paid" && form.price <= 0) { setFormError("Set a price greater than 0, or switch to Free."); return; }
    if (submit && !consent) { setFormError("Confirm that you own this work and it is ready for review."); return; }
    setBusy(true); setFormError(""); setNotice("");
    try {
      const saved = await saveDeveloperSubmission(form, editing?.id);
      upsert(saved); setEditing(saved);
      if (submit) upsert(await submitDeveloperSubmission(saved.id));
      setNotice(submit ? "Submission received. You can track its review status here." : "Draft saved. You can return to it anytime.");
      setForm(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { clearToken(); router.replace("/developer/login"); }
      setFormError(err instanceof ApiError && err.fields ? Object.values(err.fields).join(". ") : err instanceof Error ? err.message : "Couldn't save. Please try again.");
    } finally { setBusy(false); }
  }

  const filtered = items.filter((item) => (tab === "overview" || tab === "submissions" || item.kind === tab) && (tab !== "submissions" || item.status !== "draft") && `${item.name} ${item.summary}`.toLowerCase().includes(search.toLowerCase()));
  const stats = [{ label: "Your apps", value: items.filter((i) => i.kind === "app").length, icon: AppWindow }, { label: "Your themes", value: items.filter((i) => i.kind === "theme").length, icon: Paintbrush }, { label: "In review", value: items.filter((i) => i.status === "submitted").length, icon: Clock3 }, { label: "Approved", value: items.filter((i) => i.status === "approved").length, icon: CheckCircle2 }];

  return (
    <div className="min-h-screen bg-[#0a1012] font-[Arial,Helvetica,sans-serif] text-[#edf4f1]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1214]/95 backdrop-blur">
        <div className="flex h-[72px] items-center justify-between px-5 lg:px-8">
          <Link href="/developer" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#65ebbb] text-[#0b3024]"><Code2 size={21} /></span><span className="text-lg font-bold tracking-tight">exofe <span className="font-normal text-white/45">/ developers</span></span></Link>
          <div className="flex items-center gap-5"><Link href="/dev" className="hidden items-center gap-2 text-sm text-white/55 hover:text-white sm:flex"><BookOpen size={16} /> Documentation <ExternalLink size={13} /></Link><button onClick={() => { clearToken(); router.replace("/developer/login"); }} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:text-white"><LogOut size={15} /> Sign out</button></div>
        </div>
      </header>
      <div className="flex flex-col lg:flex-row">
        {/* mobile: compact bar + toggleable dropdown menu, instead of the
            desktop's persistent rail */}
        <div className="border-b border-white/10 lg:hidden">
          <button type="button" onClick={() => setMobileNavOpen((v) => !v)} aria-expanded={mobileNavOpen} aria-controls="developer-mobile-nav" className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-white">
            <span className="flex items-center gap-2.5">{(() => { const ActiveIcon = tabs.find((t) => t.id === tab)?.icon ?? LayoutDashboard; return <ActiveIcon size={17} className="text-emerald-300" />; })()}{tabs.find((t) => t.id === tab)?.label}</span>
            <motion.span animate={{ rotate: mobileNavOpen ? 90 : 0 }} transition={{ duration: 0.18 }}><Menu size={18} className="text-white/50" /></motion.span>
          </button>
          <AnimatePresence initial={false}>
            {mobileNavOpen && (
              <motion.nav
                id="developer-mobile-nav"
                aria-label="Developer workspace"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1 px-5 pb-3">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => { setTab(id); setSearch(""); setMobileNavOpen(false); }} aria-current={tab === id ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${tab === id ? "bg-[#19332a] text-[#77edc3]" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
                      <Icon size={16} />{label}
                    </button>
                  ))}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        {/* desktop: persistent slim rail with a sliding active-tab indicator */}
        <aside className="hidden shrink-0 flex-col lg:sticky lg:top-[72px] lg:flex lg:h-[calc(100vh-72px)] lg:w-56 lg:border-r lg:border-white/10 lg:py-10 lg:pl-8 lg:pr-5">
          <p className="mb-5 text-[10px] font-bold tracking-[.18em] text-white/30">DEVELOPER WORKSPACE</p>
          <nav aria-label="Developer workspace" className="flex flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setTab(id); setSearch(""); }} aria-current={tab === id ? "page" : undefined} className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${tab === id ? "text-[#77edc3]" : "text-white/50 hover:text-white"}`}>
                {tab === id && <motion.span layoutId="dev-tab-bg" className="absolute inset-0 rounded-lg bg-[#19332a]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                <Icon size={16} className="relative" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-transparent p-4"><BookOpen className="mb-3 text-emerald-300" size={22} /><h2 className="text-sm font-semibold">A little guidance?</h2><p className="mt-2 text-xs leading-5 text-white/45">Explore the tools and guides for your next build.</p><Link href="/dev" className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-300">Explore developer docs <ArrowRight size={14} /></Link></div>
        </aside>
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-9 lg:px-12 lg:py-10">
          <div className="mb-7 flex items-center gap-2 text-xs text-white/35">Workspace <ChevronRight size={12} /><span className="text-white/65">{tabs.find((t) => t.id === tab)?.label}</span></div>
          <div className="flex flex-wrap items-center justify-between gap-5"><div><p className="mb-2 text-[11px] font-semibold tracking-[.15em] text-emerald-300">BUILD SOMETHING GREAT</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{tab === "overview" ? "Your ideas. Your workspace." : tabs.find((t) => t.id === tab)?.label}</h1><p className="mt-3 text-sm leading-6 text-white/45">Create, manage, and submit your apps and themes for Exofe.</p></div>{tab !== "revenue" && <button disabled={loading || !!error} onClick={() => open(tab === "theme" ? "theme" : "app")} className={primaryClass}><Plus size={17} /> New submission</button>}</div>

          {notice && <div role="status" className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-200"><CheckCircle2 size={18} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")} className="ml-auto"><X size={16} /></button></div>}
          {error ? <div role="alert" className="mt-8 rounded-xl border border-red-300/20 p-6 text-red-200"><p>{error}</p><button onClick={() => void load()} className="mt-3 text-sm underline">Try again</button></div> : loading ? <div className="grid min-h-80 place-items-center" role="status"><span className="flex items-center gap-3 text-white/50"><Loader2 className="animate-spin" />Loading your workspace…</span></div> : (
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18, ease: "easeInOut" }}>
                {tab === "revenue" ? <>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#10191b] p-5"><div className="flex items-center justify-between text-xs text-white/45">Total earned<DollarSign size={17} className="text-white/30" /></div><p className="mt-4 text-3xl font-medium">$0.00</p></div>
              <div className="rounded-xl border border-white/10 bg-[#10191b] p-5"><div className="flex items-center justify-between text-xs text-white/45">Paid listings<Wallet size={17} className="text-white/30" /></div><p className="mt-4 text-3xl font-medium">{items.filter((i) => i.pricingModel === "paid").length.toString().padStart(2, "0")}</p></div>
              <div className="rounded-xl border border-white/10 bg-[#10191b] p-5"><div className="flex items-center justify-between text-xs text-white/45">Live &amp; sellable<CheckCircle2 size={17} className="text-white/30" /></div><p className="mt-4 text-3xl font-medium">{items.filter((i) => i.pricingModel === "paid" && i.status === "approved").length.toString().padStart(2, "0")}</p></div>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100"><Wallet size={18} className="mt-0.5 shrink-0 text-amber-300" /><p>The Exofe marketplace doesn&apos;t process real purchases yet, so there&apos;s nothing to pay out — this tab will start filling in automatically once merchants can buy paid apps and themes. Meanwhile, here&apos;s what you&apos;ve priced and how it&apos;ll look once it can sell.</p></div>
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Your paid listings <span className="ml-2 rounded-md bg-white/5 px-2 py-1 text-xs text-white/40">{items.filter((i) => i.pricingModel === "paid").length}</span></h2>
              {items.filter((i) => i.pricingModel === "paid").length === 0 ? <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-white/15 px-5 py-12 text-center"><span className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-white/40"><Wallet size={24} /></span><h3 className="text-base font-medium">No paid apps or themes yet</h3><p className="mt-2 max-w-sm text-sm leading-6 text-white/40">Set a price on a submission and it&apos;ll show up here.</p></div> : <div className="mt-5 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-white/[.025] text-xs text-white/40"><tr>{["Project", "Type", "Price", "Status", ""].map((label, i) => <th key={i} className="px-5 py-4 font-normal">{label}</th>)}</tr></thead><tbody>{items.filter((i) => i.pricingModel === "paid").map((item) => <tr key={item.id} className="border-t border-white/5"><td className="px-5 py-5"><button onClick={() => open(item.kind, item)} className="font-medium hover:text-emerald-300">{item.name}</button><p className="mt-1 text-xs text-white/35">v{item.version}</p></td><td className="px-5 capitalize text-white/55">{item.kind}</td><td className="px-5 text-white/70">${item.price.toFixed(2)}</td><td className="px-5"><span className={`rounded-full px-2.5 py-1 text-xs ${item.status === "submitted" ? "bg-amber-300/10 text-amber-200" : item.status === "approved" ? "bg-emerald-300/10 text-emerald-200" : item.status === "rejected" ? "bg-red-300/10 text-red-200" : "bg-white/5 text-white/50"}`}>{statusLabels[item.status]}</span></td><td className="px-5"><button onClick={() => open(item.kind, item)} aria-label={`Open ${item.name}`}><ChevronRight size={17} /></button></td></tr>)}</tbody></table></div>}
            </section>
          </> : <>
            <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-white/10 bg-[#10191b] p-5"><div className="flex items-center justify-between text-xs text-white/45">{label}<Icon size={17} className="text-white/30" /></div><p className="mt-4 text-3xl font-medium">{value.toString().padStart(2, "0")}</p></div>)}</div>
            {tab === "overview" && <section className="mt-7 grid gap-4 xl:grid-cols-2">{([{ kind: "app", title: "Build a better workflow.", description: "Connect tools, solve merchant problems, and extend what's possible with Exofe.", icon: AppWindow, label: "Submit an app" }, { kind: "theme", title: "Design the next storefront.", description: "Turn your design into a theme that helps brands create their own space.", icon: Paintbrush, label: "Submit a theme" }] as const).map(({ kind, title, description, icon: Icon, label }) => <article key={kind} className={`relative overflow-hidden rounded-2xl border border-white/10 p-7 ${kind === "app" ? "bg-gradient-to-br from-[#152e28] to-[#101c1c]" : "bg-gradient-to-br from-[#28233d] to-[#151923]"}`}><div className="mb-6 flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${kind === "app" ? "bg-emerald-300/10 text-emerald-300" : "bg-violet-300/10 text-violet-300"}`}><Icon size={20} /></span><span className="text-[10px] font-bold tracking-[.16em] text-white/40">EXOFE {kind === "app" ? "APPS" : "THEMES"}</span></div><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-3 max-w-sm text-sm leading-6 text-white/45">{description}</p><button onClick={() => open(kind)} className="mt-6 flex items-center gap-2 text-sm font-semibold text-white/85">{label}<ArrowRight size={16} /></button></article>)}</section>}
            <section className="mt-9"><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">{tab === "overview" ? "Your projects" : "Manage submissions"} <span className="ml-2 rounded-md bg-white/5 px-2 py-1 text-xs text-white/40">{filtered.length}</span></h2><label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-white/35"><Search size={15} /><input aria-label="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…" className="w-40 bg-transparent text-xs text-white outline-none" /></label></div>
              {filtered.length === 0 ? <div className="flex flex-col items-center rounded-xl border border-dashed border-white/15 px-5 py-12 text-center"><span className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-white/40"><FileCode2 size={24} /></span><h3 className="text-base font-medium">{search ? "No matching projects" : tab === "submissions" ? "No submissions in review yet" : "Your next big idea starts here"}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-white/40">{search ? "Try a different project name." : "Add your project details, save a draft, and submit when you're ready."}</p>{!search && <button onClick={() => open(tab === "theme" ? "theme" : "app")} className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-300"><Plus size={16} /> Create your first {tab === "theme" ? "theme" : "app"}</button>}</div> : <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-white/[.025] text-xs text-white/40"><tr>{["Project", "Type", "Status", "Updated", ""].map((label, i) => <th key={i} className="px-5 py-4 font-normal">{label}</th>)}</tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-t border-white/5"><td className="px-5 py-5"><button onClick={() => open(item.kind, item)} className="font-medium hover:text-emerald-300">{item.name}</button><p className="mt-1 text-xs text-white/35">v{item.version}</p></td><td className="px-5 capitalize text-white/55">{item.kind}</td><td className="px-5"><span className={`rounded-full px-2.5 py-1 text-xs ${item.status === "submitted" ? "bg-amber-300/10 text-amber-200" : item.status === "approved" ? "bg-emerald-300/10 text-emerald-200" : item.status === "rejected" ? "bg-red-300/10 text-red-200" : "bg-white/5 text-white/50"}`}>{statusLabels[item.status]}</span></td><td className="px-5 text-xs text-white/40">{new Date(item.updatedAt).toLocaleDateString()}</td><td className="px-5"><button onClick={() => open(item.kind, item)} aria-label={`Open ${item.name}`}><ChevronRight size={17} /></button></td></tr>)}</tbody></table></div>}
            </section>
            <div className="mt-8 flex items-start gap-3 text-xs leading-5 text-white/35"><ShieldCheck size={17} className="shrink-0 text-emerald-300/60" /><p>Submissions go through review before approval. Keep your demo and package links accessible to the review team.</p></div>
          </>}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>


      <dialog ref={dialog} data-lenis-prevent aria-label="Project submission" onCancel={(event) => { if (busy) event.preventDefault(); else setForm(null); }} onClose={() => { if (!busy) setForm(null); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#0d1518] p-0 text-white shadow-2xl backdrop:bg-black/75">
        {form && <form onSubmit={save}>
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/10 bg-[#0d1518] p-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-300">Developer submission</p><h2 className="mt-2 text-xl font-semibold">{locked ? form.name : editing ? "Edit your draft" : "Bring your next idea to Exofe"}</h2></div><button type="button" disabled={busy} aria-label="Close submission" onClick={() => setForm(null)} className="rounded-lg p-2 text-white/50 hover:bg-white/5"><X size={20} /></button></div>
          <fieldset disabled={busy || locked} className="space-y-5 p-6">
            <div className="grid grid-cols-2 gap-3">{(["app", "theme"] as const).map((kind) => <button key={kind} type="button" aria-pressed={form.kind === kind} onClick={() => update("kind", kind)} className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm capitalize ${form.kind === kind ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-white/45"}`}>{kind === "app" ? <AppWindow size={18} /> : <Paintbrush size={18} />}{kind}</button>)}</div>
            <label className="block text-sm text-white/65">Project name<input autoFocus required minLength={2} maxLength={100} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Give your project a name" className={inputClass} /></label>
            <label className="block text-sm text-white/65">Short description<input required minLength={10} maxLength={180} value={form.summary} onChange={(e) => update("summary", e.target.value)} placeholder="What does your project do?" className={inputClass} /></label>
            <label className="block text-sm text-white/65">About your project<textarea required minLength={20} maxLength={10000} rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the features and how merchants can use them." className={inputClass} /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-white/65">Version<input required maxLength={40} value={form.version} onChange={(e) => update("version", e.target.value)} className={inputClass} /></label><label className="text-sm text-white/65">Category<select value={form.category} onChange={(e) => update("category", e.target.value as DeveloperSubmissionInput["category"])} className={inputClass}>{["Productivity", "Marketing", "Store design", "Orders & shipping", "Customer support", "Other"].map((category) => <option key={category}>{category}</option>)}</select></label></div>
            <div className="text-sm text-white/65">
              <span className="block">Pricing</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="flex gap-2">
                  <button type="button" disabled={busy || locked} onClick={() => { update("pricingModel", "free"); update("price", 0); }} className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium ${form.pricingModel === "free" ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-white/45"}`}>Free</button>
                  <button type="button" disabled={busy || locked} onClick={() => update("pricingModel", "paid")} className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium ${form.pricingModel === "paid" ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-white/45"}`}>Paid</button>
                </div>
                {form.pricingModel === "paid" && (
                  <label className="relative block">
                    <DollarSign size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input type="number" required min={0.01} max={10000} step="0.01" disabled={busy || locked} value={form.price || ""} onChange={(e) => update("price", Number(e.target.value))} placeholder="19.99" className={`${inputClass} mt-0 pl-9`} />
                  </label>
                )}
              </div>
              <span className="mt-2 block text-xs leading-5 text-white/35">What a merchant pays to install this. The marketplace can&apos;t process real payments yet — see the Revenue tab.</span>
            </div>
            <label className="block text-sm text-white/65">Live demo URL<input type="url" required pattern="https://.*" maxLength={2048} value={form.demoUrl} onChange={(e) => update("demoUrl", e.target.value)} placeholder="https://your-demo.com" className={inputClass} /></label>
            <div className="text-sm text-white/65">
              <span className="block">Screenshot</span>
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={busy || locked} onClick={() => switchScreenshotMode("upload")} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${screenshotMode === "upload" ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-white/45"}`}><Upload size={14} /> Upload an image</button>
                <button type="button" disabled={busy || locked} onClick={() => switchScreenshotMode("link")} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${screenshotMode === "link" ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-white/45"}`}><Link2 size={14} /> Paste a link instead</button>
              </div>
              {screenshotMode === "upload" ? (
                <div className="mt-3">
                  {uploadedScreenshot ? (
                    <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-[#10181b] px-3.5 py-3">
                      {form.screenshotUrl.startsWith("data:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.screenshotUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                      ) : (
                        <ImageIcon size={18} className="shrink-0 text-emerald-300" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-white">{uploadedScreenshot.name}</span>
                      {uploadedScreenshot.size > 0 && <span className="shrink-0 text-xs text-white/40">{formatBytes(uploadedScreenshot.size)}</span>}
                      {!locked && <button type="button" disabled={busy} onClick={() => { setUploadedScreenshot(null); update("screenshotUrl", ""); }} aria-label="Remove image" className="shrink-0 text-white/40 hover:text-white"><X size={16} /></button>}
                    </div>
                  ) : (
                    <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3.5 py-5 text-sm ${uploadingScreenshot ? "border-white/10 text-white/30" : "border-white/20 text-white/50 hover:border-emerald-400/50 hover:text-emerald-200"}`}>
                      {uploadingScreenshot ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> Choose an image</>}
                      <input type="file" accept="image/*" disabled={busy || locked || uploadingScreenshot} onChange={handleScreenshotSelected} className="hidden" />
                    </label>
                  )}
                  <span className="mt-2 block text-xs leading-5 text-white/35">Up to 3MB. This is what merchants see on the Exofe theme/app store.</span>
                </div>
              ) : (
                <>
                  <input type="url" required={screenshotMode === "link"} pattern="https://.*" maxLength={2048} disabled={busy || locked} value={form.screenshotUrl} onChange={(e) => update("screenshotUrl", e.target.value)} placeholder="https://your-cdn.com/screenshot.png" className={inputClass} />
                  <span className="mt-2 block text-xs leading-5 text-white/35">Link to a hosted screenshot of your {form.kind}.</span>
                </>
              )}
            </div>
            <div className="text-sm text-white/65">
              <span className="block">{form.kind === "theme" ? "Theme package" : "App package"}</span>
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={busy || locked} onClick={() => switchPackageMode("upload")} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${packageMode === "upload" ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-white/45"}`}><Upload size={14} /> Upload a .zip</button>
                <button type="button" disabled={busy || locked} onClick={() => switchPackageMode("link")} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${packageMode === "link" ? "border-emerald-300/60 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-white/45"}`}><Link2 size={14} /> Paste a link instead</button>
              </div>
              {packageMode === "upload" ? (
                <div className="mt-3">
                  {uploadedFile ? (
                    <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-[#10181b] px-3.5 py-3">
                      <FileArchive size={18} className="shrink-0 text-emerald-300" />
                      <span className="min-w-0 flex-1 truncate text-sm text-white">{uploadedFile.name}</span>
                      {uploadedFile.size > 0 && <span className="shrink-0 text-xs text-white/40">{formatBytes(uploadedFile.size)}</span>}
                      {!locked && <button type="button" disabled={busy} onClick={() => { setUploadedFile(null); update("packageUrl", ""); }} aria-label="Remove file" className="shrink-0 text-white/40 hover:text-white"><X size={16} /></button>}
                    </div>
                  ) : (
                    <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3.5 py-5 text-sm ${uploading ? "border-white/10 text-white/30" : "border-white/20 text-white/50 hover:border-emerald-400/50 hover:text-emerald-200"}`}>
                      {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Upload size={16} /> Choose a .zip file</>}
                      <input type="file" accept=".zip" disabled={busy || locked || uploading} onChange={handleFileSelected} className="hidden" />
                    </label>
                  )}
                  <span className="mt-2 block text-xs leading-5 text-white/35">Up to 6MB. Include everything reviewers need to run or preview your {form.kind}.</span>
                </div>
              ) : (
                <>
                  <input type="url" required={packageMode === "link"} pattern="https://.*" maxLength={2048} disabled={busy || locked} value={form.packageUrl} onChange={(e) => update("packageUrl", e.target.value)} placeholder="https://github.com/your-name/your-project" className={inputClass} />
                  <span className="mt-2 block text-xs leading-5 text-white/35">Link to your repository or downloadable package. Make sure reviewers can access it.</span>
                </>
              )}
            </div>
            {form.kind === "theme" && (
              <label className="block text-sm text-white/65">
                Theme sections
                <div className="mt-2">
                  <ThemeSectionsBuilder
                    value={form.themeDefinition ?? emptyThemeDefinition()}
                    onChange={(v) => update("themeDefinition", v)}
                    disabled={busy || locked}
                  />
                </div>
              </label>
            )}
            <label className="block text-sm text-white/65">Support email<input type="email" required maxLength={254} value={form.supportEmail} onChange={(e) => update("supportEmail", e.target.value)} placeholder="support@your-domain.com" className={inputClass} /></label>
            <label className="block text-sm text-white/65">Review notes <span className="text-white/30">(optional)</span><textarea maxLength={5000} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Setup instructions or anything the review team should know. Do not include passwords or API keys." className={inputClass} /></label>
            {!locked && <label className="flex items-start gap-3 text-xs leading-5 text-white/55"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-emerald-300" />I own or have permission to distribute this work, and my demo and package are ready for review.</label>}
          </fieldset>
          {formError && <p role="alert" className="mx-6 mb-5 rounded-lg bg-red-300/10 p-3 text-sm text-red-200">{formError}</p>}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 p-6">{locked ? <span className="mr-auto text-sm text-emerald-200">Status: {statusLabels[editing!.status]}</span> : <><button type="submit" value="draft" disabled={busy} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white/70 disabled:opacity-50">Save draft</button><button type="submit" value="submit" disabled={busy} className={primaryClass}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit for review</button></>}</div>
        </form>}
      </dialog>
    </div>
  );
}
