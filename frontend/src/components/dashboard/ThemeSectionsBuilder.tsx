"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { SectionTemplate, SettingDef, ThemeDefinition } from "@/lib/api";

const SETTING_TYPES: SettingDef["type"][] = ["text", "richtext", "image", "url", "color", "select"];
const fieldClass = "rounded-lg border border-white/15 bg-[#10181b] px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-400 disabled:opacity-60";

function emptySetting(): SettingDef {
  return { id: "", type: "text", label: "", default: "" };
}
function emptyTemplate(): SectionTemplate {
  return { type: "", label: "", html: "", settings: [] };
}

export default function ThemeSectionsBuilder({
  value,
  onChange,
  disabled,
}: {
  value: ThemeDefinition;
  onChange: (value: ThemeDefinition) => void;
  disabled?: boolean;
}) {
  const { sectionTemplates, layout } = value;

  function updateTemplate(index: number, patch: Partial<SectionTemplate>) {
    onChange({ ...value, sectionTemplates: sectionTemplates.map((t, i) => (i === index ? { ...t, ...patch } : t)) });
  }
  function addTemplate() {
    onChange({ ...value, sectionTemplates: [...sectionTemplates, emptyTemplate()] });
  }
  function removeTemplate(index: number) {
    const removedType = sectionTemplates[index]?.type;
    onChange({
      ...value,
      sectionTemplates: sectionTemplates.filter((_, i) => i !== index),
      layout: layout.filter((l) => l.type !== removedType),
    });
  }

  function updateSetting(templateIndex: number, settingIndex: number, patch: Partial<SettingDef>) {
    const settings = sectionTemplates[templateIndex].settings.map((s, i) => (i === settingIndex ? { ...s, ...patch } : s));
    updateTemplate(templateIndex, { settings });
  }
  function addSetting(templateIndex: number) {
    updateTemplate(templateIndex, { settings: [...sectionTemplates[templateIndex].settings, emptySetting()] });
  }
  function removeSetting(templateIndex: number, settingIndex: number) {
    updateTemplate(templateIndex, { settings: sectionTemplates[templateIndex].settings.filter((_, i) => i !== settingIndex) });
  }

  function addLayoutEntry(type: string) {
    if (!type) return;
    onChange({ ...value, layout: [...layout, { id: `${type}-${Date.now()}`, type, settings: {} }] });
  }
  function removeLayoutEntry(index: number) {
    onChange({ ...value, layout: layout.filter((_, i) => i !== index) });
  }
  function moveLayoutEntry(index: number, dir: -1 | 1) {
    const next = [...layout];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...value, layout: next });
  }

  const availableTypes = ["product-grid", ...sectionTemplates.map((t) => t.type).filter(Boolean)];

  return (
    <div className="space-y-6 rounded-lg border border-white/10 p-4">
      <div>
        <div className="flex items-center justify-between">
          <span className="block text-sm text-white/65">Section types</span>
          <button type="button" disabled={disabled} onClick={addTemplate} className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
            <Plus size={14} /> Add section type
          </button>
        </div>
        <p className="mt-1 text-xs leading-5 text-white/35">
          Each one is real HTML with <code className="text-white/50">{"{{ placeholders }}"}</code> for whatever a merchant should be able to
          edit — text, colors, font size, images, links. Only what you expose as a setting becomes editable.
        </p>

        <div className="mt-3 space-y-4">
          {sectionTemplates.map((tpl, ti) => (
            <div key={ti} className="rounded-lg border border-white/10 p-3">
              <div className="flex items-start gap-2">
                <div className="grid flex-1 grid-cols-2 gap-2">
                  <input
                    disabled={disabled}
                    value={tpl.type}
                    onChange={(e) => updateTemplate(ti, { type: e.target.value })}
                    placeholder="type-slug (e.g. testimonials)"
                    className={fieldClass}
                  />
                  <input
                    disabled={disabled}
                    value={tpl.label}
                    onChange={(e) => updateTemplate(ti, { label: e.target.value })}
                    placeholder="Label (e.g. Testimonials)"
                    className={fieldClass}
                  />
                </div>
                <button type="button" disabled={disabled} onClick={() => removeTemplate(ti)} className="mt-2 text-white/40 hover:text-red-300">
                  <Trash2 size={16} />
                </button>
              </div>

              <textarea
                disabled={disabled}
                rows={4}
                value={tpl.html}
                onChange={(e) => updateTemplate(ti, { html: e.target.value })}
                placeholder='<div style="color:{{textColor}}"><h2>{{heading}}</h2></div>'
                className={`${fieldClass} mt-2 w-full font-mono`}
              />

              <div className="mt-3 space-y-2">
                {tpl.settings.map((s, si) => (
                  <div key={si} className="flex flex-wrap items-center gap-1.5">
                    <input
                      disabled={disabled}
                      value={s.id}
                      onChange={(e) => updateSetting(ti, si, { id: e.target.value })}
                      placeholder="settingId"
                      className={`${fieldClass} w-28`}
                    />
                    <select
                      disabled={disabled}
                      value={s.type}
                      onChange={(e) => updateSetting(ti, si, { type: e.target.value as SettingDef["type"] })}
                      className={`${fieldClass} w-24`}
                    >
                      {SETTING_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      disabled={disabled}
                      value={s.label}
                      onChange={(e) => updateSetting(ti, si, { label: e.target.value })}
                      placeholder="Label"
                      className={`${fieldClass} w-28`}
                    />
                    <input
                      disabled={disabled}
                      value={s.default}
                      onChange={(e) => updateSetting(ti, si, { default: e.target.value })}
                      placeholder="Default"
                      className={`${fieldClass} w-28`}
                    />
                    {s.type === "select" && (
                      <input
                        disabled={disabled}
                        value={(s.options ?? []).join(",")}
                        onChange={(e) =>
                          updateSetting(ti, si, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })
                        }
                        placeholder="opt1,opt2"
                        className={`${fieldClass} w-28`}
                      />
                    )}
                    <button type="button" disabled={disabled} onClick={() => removeSetting(ti, si)} className="text-white/40 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" disabled={disabled} onClick={() => addSetting(ti)} className="flex items-center gap-1 text-xs text-emerald-300">
                  <Plus size={12} /> Add setting
                </button>
              </div>
            </div>
          ))}
          {sectionTemplates.length === 0 && <p className="text-xs text-white/30">No section types yet — add one above.</p>}
        </div>
      </div>

      <div>
        <span className="block text-sm text-white/65">Default layout</span>
        <p className="mt-1 text-xs leading-5 text-white/35">The order sections appear when a merchant first installs this theme.</p>
        <div className="mt-3 space-y-2">
          {layout.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2">
              <span className="flex-1 text-sm text-white/80">{entry.type || "(untitled)"}</span>
              <button type="button" disabled={disabled || i === 0} onClick={() => moveLayoutEntry(i, -1)} className="text-white/40 hover:text-white disabled:opacity-30">
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                disabled={disabled || i === layout.length - 1}
                onClick={() => moveLayoutEntry(i, 1)}
                className="text-white/40 hover:text-white disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>
              <button type="button" disabled={disabled} onClick={() => removeLayoutEntry(i)} className="text-white/40 hover:text-red-300">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {layout.length === 0 && <p className="text-xs text-white/30">No sections in the layout yet.</p>}
        </div>
        <select disabled={disabled} value="" onChange={(e) => addLayoutEntry(e.target.value)} className={`${fieldClass} mt-2 w-full`}>
          <option value="">+ Add section to layout...</option>
          {availableTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
