"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Loader2, Paintbrush, Save } from "lucide-react";
import {
  ApiError,
  getStoreTheme,
  updateStoreTheme,
  PRODUCT_GRID_SETTINGS,
  type SectionInstance,
  type SectionTemplate,
  type SettingDef,
  type StoreTheme,
} from "@/lib/api";

function SettingField({
  def,
  value,
  onChange,
}: {
  def: SettingDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputClass =
    "mt-1.5 w-full rounded-lg border border-ink/[.12] bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-[#45157b]";

  if (def.type === "richtext") {
    return (
      <label className="block text-xs font-medium text-foreground/60">
        {def.label}
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </label>
    );
  }
  if (def.type === "select") {
    return (
      <label className="block text-xs font-medium text-foreground/60">
        {def.label}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {def.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (def.type === "color") {
    return (
      <label className="block text-xs font-medium text-foreground/60">
        {def.label}
        <div className="mt-1.5 flex items-center gap-2">
          <input type="color" value={value || "#171326"} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 rounded border border-ink/[.12]" />
          <input value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-0`} />
        </div>
      </label>
    );
  }
  // text, url, image — image is a plain URL field for now, matching how a
  // developer's theme submission screenshot works (upload OR link), but
  // per-section images here are link-only to keep the customizer scoped.
  return (
    <label className="block text-xs font-medium text-foreground/60">
      {def.label}
      <input type={def.type === "url" || def.type === "image" ? "url" : "text"} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder={def.type === "image" ? "https://..." : undefined} />
    </label>
  );
}

// The one built-in, synthesized into the same shape as a developer's own
// SectionTemplate so the rest of this component doesn't need to know the
// difference.
const PRODUCT_GRID_TEMPLATE: SectionTemplate = { type: "product-grid", label: "Product grid", html: "", settings: PRODUCT_GRID_SETTINGS };

export default function StoreThemeCustomizer() {
  const [theme, setTheme] = useState<StoreTheme | null>(null);
  const [sections, setSections] = useState<SectionInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notInstalled, setNotInstalled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStoreTheme()
      .then((storeTheme) => {
        setTheme(storeTheme);
        setSections(storeTheme.sections);
        setSelectedId(storeTheme.sections[0]?.id ?? null);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotInstalled(true);
        else setError(err instanceof Error ? err.message : "Couldn't load your storefront.");
      });
  }, []);

  const registryByType = useMemo(() => {
    const map = new Map((theme?.sectionTemplates ?? []).map((s) => [s.type, s]));
    map.set("product-grid", PRODUCT_GRID_TEMPLATE);
    return map;
  }, [theme]);
  const selected = sections.find((s) => s.id === selectedId) ?? null;
  const selectedDef = selected ? registryByType.get(selected.type) : null;

  function updateSetting(settingId: string, value: string) {
    setSaved(false);
    setSections((prev) => prev.map((s) => (s.id === selectedId ? { ...s, settings: { ...s.settings, [settingId]: value } } : s)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateStoreTheme(sections);
      setSections(updated.sections);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  }

  if (notInstalled) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center gap-3 rounded-2xl border border-ink/[.06] bg-surface p-6 text-center shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#45157b] dark:bg-indigo-500/15">
          <Paintbrush className="h-6 w-6" strokeWidth={2} />
        </span>
        <p className="text-sm font-bold text-foreground">No theme installed yet</p>
        <p className="max-w-xs text-sm text-foreground/50">Pick a theme from the Theme Store to start customizing your storefront.</p>
        <Link href="/themes" className="mt-2 rounded-full bg-[#45157b] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
          Browse themes
        </Link>
      </div>
    );
  }

  if (error && !theme) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-2xl border border-ink/[.06] bg-surface p-6 text-center text-sm text-red-500 shadow-sm">
        {error}
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-2xl border border-ink/[.06] bg-surface shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-[#45157b]" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/40">Storefront</p>
          <h1 className="text-xl font-bold text-foreground">{theme.themeName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/store/${theme.businessId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-ink/[.12] px-3.5 py-2 text-sm font-medium text-foreground hover:bg-ink/[.03]"
          >
            Preview <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#45157b] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}

      <div className="flex flex-col gap-5 lg:flex-row">
        <aside className="w-full shrink-0 rounded-2xl border border-ink/[.06] bg-surface p-2 lg:w-56">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setSelectedId(section.id)}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                section.id === selectedId ? "bg-[#45157b]/10 text-[#45157b]" : "text-foreground/70 hover:bg-ink/[.04]"
              }`}
            >
              {registryByType.get(section.type)?.label ?? section.type}
            </button>
          ))}
        </aside>

        <div className="flex-1 rounded-2xl border border-ink/[.06] bg-surface p-6">
          {selected && selectedDef ? (
            <div className="max-w-md space-y-4">
              {selectedDef.settings.map((def) => (
                <SettingField key={def.id} def={def} value={selected.settings[def.id] ?? def.default} onChange={(v) => updateSetting(def.id, v)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/50">Select a section to edit its settings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
