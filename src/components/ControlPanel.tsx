"use client";

import type { RugSpec } from "@/lib/types";
import { STYLE_LABELS } from "@/lib/generator/styles";

interface Props {
  spec: RugSpec;
  onChange: (patch: Partial<RugSpec> | ((s: RugSpec) => RugSpec)) => void;
  onGenerate: () => void;
  onReset: () => void;
  loading: boolean;
}

export default function ControlPanel({ spec, onChange, onGenerate, onReset, loading }: Props) {
  const field = spec.layout.field;
  const medallion = spec.layout.medallion;
  const border = spec.layout.border;

  function setField(key: string, value: unknown) {
    onChange((s) => ({
      ...s,
      layout: { ...s.layout, field: { ...s.layout.field, [key]: value } },
    }));
  }

  function setMedallion(key: string, value: unknown) {
    onChange((s) => ({
      ...s,
      layout: { ...s.layout, medallion: { ...s.layout.medallion, [key]: value } },
    }));
  }

  function setBorder(key: string, value: unknown) {
    onChange((s) => ({
      ...s,
      layout: { ...s.layout, border: { ...s.layout.border, [key]: value } },
    }));
  }

  return (
    <div className="space-y-5 text-sm">
      {/* Name */}
      <div>
        <Label>Rug Name</Label>
        <input
          type="text"
          value={spec.name}
          onChange={(e) => onChange((s) => ({ ...s, name: e.target.value }))}
          className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-1.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Style */}
      <div>
        <Label>Style</Label>
        <select
          value={spec.style}
          onChange={(e) => onChange((s) => ({ ...s, style: e.target.value as RugSpec["style"] }))}
          className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-1.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500"
        >
          {Object.entries(STYLE_LABELS).map(([k, v]) => (
            <option key={k} value={k} className="bg-stone-900">{v}</option>
          ))}
        </select>
      </div>

      {/* Grid size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Width (knots)</Label>
          <input
            type="number"
            value={spec.gridWidth}
            min={80} max={400} step={10}
            onChange={(e) => onChange((s) => ({ ...s, gridWidth: Number(e.target.value) }))}
            className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-1.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <Label>Height (knots)</Label>
          <input
            type="number"
            value={spec.gridHeight}
            min={80} max={600} step={10}
            onChange={(e) => onChange((s) => ({ ...s, gridHeight: Number(e.target.value) }))}
            className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-1.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Symmetry */}
      <div>
        <Label>Symmetry</Label>
        <select
          value={spec.symmetry}
          onChange={(e) => onChange((s) => ({ ...s, symmetry: e.target.value as RugSpec["symmetry"] }))}
          className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-1.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="mirror-both" className="bg-stone-900">Mirror Both (¼ + flip) ✦</option>
          <option value="mirror-x" className="bg-stone-900">Mirror Horizontal</option>
          <option value="mirror-y" className="bg-stone-900">Mirror Vertical</option>
          <option value="rotate-180" className="bg-stone-900">Rotate 180°</option>
          <option value="none" className="bg-stone-900">None</option>
        </select>
      </div>

      {/* Variation */}
      <Slider
        label="Handmade Variation"
        value={spec.variation}
        min={0} max={0.3} step={0.01}
        onChange={(v) => onChange((s) => ({ ...s, variation: v }))}
        hint="Adds subtle abrash / imperfection"
      />

      <Divider label="Field" />

      <Toggle label="Vine Scroll" value={field.vineEnabled} onChange={(v) => setField("vineEnabled", v)} />
      {field.vineEnabled && (
        <>
          <Slider label="Vine Density" value={field.vineDensity} min={0} max={1} step={0.05} onChange={(v) => setField("vineDensity", v)} />
          <Slider label="Vine Curvature" value={field.vineCurvature} min={0} max={1} step={0.05} onChange={(v) => setField("vineCurvature", v)} />
        </>
      )}
      <Toggle label="Leaves" value={field.leavesEnabled} onChange={(v) => setField("leavesEnabled", v)} />
      {field.leavesEnabled && (
        <>
          <Slider label="Leaf Size" value={field.leafSize} min={0.1} max={1} step={0.05} onChange={(v) => setField("leafSize", v)} />
          <Slider label="Leaf Roundness" value={field.leafRoundness} min={0} max={1} step={0.05} onChange={(v) => setField("leafRoundness", v)} />
        </>
      )}
      <Toggle label="Flowers / Rosettes" value={field.flowersEnabled} onChange={(v) => setField("flowersEnabled", v)} />
      {field.flowersEnabled && (
        <>
          <Slider label="Flower Size" value={field.flowerSize} min={0.1} max={1} step={0.05} onChange={(v) => setField("flowerSize", v)} />
          <Slider label="Flower Complexity" value={field.flowerComplexity} min={0} max={1} step={0.05} onChange={(v) => setField("flowerComplexity", v)} />
        </>
      )}
      <Toggle label="Palmettes" value={field.palmettesEnabled} onChange={(v) => setField("palmettesEnabled", v)} />
      {field.palmettesEnabled && (
        <Slider label="Palmette Size" value={field.palmetteSize} min={0.1} max={1} step={0.05} onChange={(v) => setField("palmetteSize", v)} />
      )}

      <Divider label="Medallion" />
      <Toggle label="Medallion" value={medallion.enabled} onChange={(v) => setMedallion("enabled", v)} />
      {medallion.enabled && (
        <>
          <Slider label="Medallion Width" value={medallion.sizeX} min={0.1} max={0.8} step={0.02} onChange={(v) => setMedallion("sizeX", v)} />
          <Slider label="Medallion Height" value={medallion.sizeY} min={0.1} max={0.6} step={0.02} onChange={(v) => setMedallion("sizeY", v)} />
          <Slider label="Complexity" value={medallion.complexity} min={0} max={1} step={0.05} onChange={(v) => setMedallion("complexity", v)} />
          <div>
            <Label>Inner Rings</Label>
            <input
              type="number" value={medallion.innerRings} min={0} max={3}
              onChange={(e) => setMedallion("innerRings", Number(e.target.value))}
              className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-1.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </>
      )}

      <Divider label="Border" />
      <Slider label="Border Width" value={border.mainBorderWidth} min={0.05} max={0.25} step={0.01} onChange={(v) => setBorder("mainBorderWidth", v)} />
      <Slider label="Guard Width" value={border.guardWidth} min={0.01} max={0.08} step={0.005} onChange={(v) => setBorder("guardWidth", v)} />
      <Slider label="Tile Repeats" value={border.tileRepeatX} min={4} max={16} step={1} onChange={(v) => setBorder("tileRepeatX", v)} />
      <div>
        <Label>Border Motif</Label>
        <select
          value={border.motif}
          onChange={(e) => setBorder("motif", e.target.value)}
          className="w-full bg-black/30 border border-amber-800/40 rounded-lg px-3 py-1.5 text-amber-100 text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="vine-scroll" className="bg-stone-900">Vine Scroll</option>
          <option value="floral-stripe" className="bg-stone-900">Floral Stripe</option>
          <option value="geometric" className="bg-stone-900">Geometric Meander</option>
          <option value="meander" className="bg-stone-900">Greek Meander</option>
        </select>
      </div>

      {/* Generate + Reset buttons */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="w-full py-3 rounded-xl font-serif text-base font-bold bg-gradient-to-r from-amber-700 to-red-800 hover:from-amber-600 hover:to-red-700 text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? "Weaving…" : "✦ Generate Rug ✦"}
      </button>
      <button
        onClick={onReset}
        disabled={loading}
        className="w-full py-2 rounded-xl text-xs font-semibold bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700/40 text-amber-600 hover:text-amber-400 transition-all disabled:opacity-40"
      >
        ↺ Reset to style defaults
      </button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-amber-400 text-xs uppercase tracking-wider mb-1">{children}</div>;
}

function Slider({
  label, value, min, max, step, onChange, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <Label>{label}</Label>
        <span className="text-amber-500 text-xs font-mono">{value.toFixed(step < 0.1 ? 2 : 0)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-500 h-1.5"
      />
      {hint && <div className="text-amber-700 text-[10px] mt-0.5 italic">{hint}</div>}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-amber-600" : "bg-stone-700"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 h-px bg-amber-900/40" />
      <span className="text-amber-600 text-xs uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-amber-900/40" />
    </div>
  );
}
