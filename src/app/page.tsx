"use client";

import { useState, useCallback } from "react";
import type { RugSpec, RenderResult, PatchOp, VersionEntry } from "@/lib/types";
import { STYLE_PRESETS } from "@/lib/generator/styles";
import { applyPatches } from "@/lib/generator/patchSpec";
import ControlPanel from "@/components/ControlPanel";
import RugCanvas from "@/components/RugCanvas";
import PaletteDisplay from "@/components/PaletteDisplay";
import ExportPanel from "@/components/ExportPanel";
import AIPanel from "@/components/AIPanel";
import VersionHistory from "@/components/VersionHistory";

const DEFAULT_SPEC: RugSpec = {
  id: "initial",
  name: "Antique Sarouk",
  style: "sarouk",
  version: 0,
  history: [],
  gridWidth: 200,
  gridHeight: 300,
  seed: "rug2024",
  symmetry: "mirror-both",
  variation: 0.08,
  palette: {
    background: "c0",
    colors: [
      { id: "c0", name: "Deep Crimson",  hex: "#7B1B1B" },
      { id: "c1", name: "Midnight Navy", hex: "#1A2644" },
      { id: "c2", name: "Antique Ivory", hex: "#F2ECD8" },
      { id: "c3", name: "Forest Green",  hex: "#2D5016" },
      { id: "c4", name: "Warm Gold",     hex: "#C9A84C" },
      { id: "c5", name: "Dusty Rose",    hex: "#C47B7B" },
      { id: "c6", name: "Cobalt Blue",   hex: "#2B4F8C" },
      { id: "c7", name: "Terracotta",    hex: "#B5541A" },
    ],
  },
  layout: {
    border: {
      mainBorderWidth: 0.12,
      guardWidth: 0.03,
      tileRepeatX: 8,
      motif: "vine-scroll",
      color: "c1",
      accentColor: "c2",
    },
    medallion: {
      enabled: true,
      sizeX: 0.38,
      sizeY: 0.28,
      complexity: 0.75,
      color: "c1",
      accentColor: "c4",
      innerRings: 2,
    },
    field: {
      vineEnabled: true,
      vineDensity: 0.65,
      vineCurvature: 0.8,
      vineColor: "c3",
      leavesEnabled: true,
      leafSize: 0.45,
      leafRoundness: 0.7,
      leafColor: "c3",
      flowersEnabled: true,
      flowerSize: 0.55,
      flowerComplexity: 0.8,
      flowerColor: "c5",
      flowerAccentColor: "c4",
      palmettesEnabled: true,
      palmetteSize: 0.5,
      palmetteColor: "c2",
      heratiEnabled: false,
      heratiDensity: 0,
    },
  },
  locks: [],
};

export default function Home() {
  const [spec, setSpec] = useState<RugSpec>(DEFAULT_SPEC);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState<"controls" | "ai" | "export" | "history">("controls");
  const [allVersions, setAllVersions] = useState<{ spec: RugSpec; result: RenderResult }[]>([]);
  const [cellSize, setCellSize] = useState(2);

  const generate = useCallback(async (specToUse?: RugSpec, note?: string) => {
    const s = specToUse ?? spec;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: s }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      const newVersion = (s.version ?? 0) + 1;
      const historyEntry: VersionEntry = {
        version: newVersion,
        timestamp: new Date().toISOString(),
        note: note ?? "Generated",
        seed: s.seed,
      };

      const newSpec: RugSpec = {
        ...data.spec,
        version: newVersion,
        history: [...(s.history ?? []), historyEntry],
      };

      const newResult: RenderResult = {
        grid: data.grid,
        palette: data.palette,
        width: data.width,
        height: data.height,
        spec: newSpec,
      };

      setResult(newResult);
      setSpec(newSpec);
      setAllVersions((v) => [...v, { spec: newSpec, result: newResult }]);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [spec]);

  const handleSpecChange = useCallback(
    (patch: Partial<RugSpec> | ((s: RugSpec) => RugSpec)) => {
      setSpec((s) => {
        if (typeof patch === "function") return patch(s);
        return { ...s, ...patch };
      });
    },
    []
  );

  const handleApplyAIPatches = useCallback(
    (ops: PatchOp[], explanation: string) => {
      setSpec((s) => {
        const newSeed = Math.random().toString(36).slice(2);
        const patched = applyPatches({ ...s, seed: newSeed }, ops);
        generate(patched, `AI: ${explanation}`);
        return patched;
      });
    },
    [generate]
  );

  const handleStylePresetLoad = useCallback(
    (styleKey: string) => {
      const preset = STYLE_PRESETS[styleKey];
      if (!preset) return;
      setSpec((s) => ({
        ...s,
        ...preset,
        id: s.id,
        version: s.version,
        history: s.history,
        seed: Math.random().toString(36).slice(2),
        gridWidth: s.gridWidth,
        gridHeight: s.gridHeight,
      }));
    },
    []
  );

  const handleRevert = useCallback(
    (version: number) => {
      const entry = allVersions.find((v) => v.spec.version === version);
      if (!entry) return;
      setSpec(entry.spec);
      setResult(entry.result);
    },
    [allVersions]
  );

  // Reset to the current style's default parameters (keep name, grid size, id, history)
  const handleReset = useCallback(() => {
    const preset = STYLE_PRESETS[spec.style] ?? STYLE_PRESETS.sarouk;
    setSpec((s) => ({
      ...s,
      ...(preset as Partial<RugSpec>),
      id: s.id,
      name: s.name,
      version: s.version,
      history: s.history,
      gridWidth: s.gridWidth,
      gridHeight: s.gridHeight,
      seed: Math.random().toString(36).slice(2),
    }));
  }, [spec.style]);

  // Update a color in the live palette and in the spec
  const handleColorChange = useCallback((colorId: string, newHex: string) => {
    setSpec((s) => ({
      ...s,
      palette: {
        ...s.palette,
        colors: s.palette.colors.map((c) =>
          c.id === colorId ? { ...c, hex: newHex } : c
        ),
      },
    }));
    // Also update result palette so the canvas re-renders immediately without a full regenerate
    setResult((r) => {
      if (!r) return r;
      return {
        ...r,
        palette: r.palette.map((c) =>
          c.id === colorId ? { ...c, hex: newHex } : c
        ),
        spec: {
          ...r.spec,
          palette: {
            ...r.spec.palette,
            colors: r.spec.palette.colors.map((c) =>
              c.id === colorId ? { ...c, hex: newHex } : c
            ),
          },
        },
      };
    });
  }, []);

  const totalKnots = result ? result.width * result.height : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-amber-950/30 to-stone-950 text-stone-100">
      {/* Header */}
      <header className="border-b border-amber-900/40 bg-black/40 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧶</span>
          <div>
            <h1 className="font-serif text-2xl text-amber-200 tracking-wide">Antique Rug Generator</h1>
            <p className="text-amber-600 text-xs tracking-widest uppercase">Knot-by-knot pattern design</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {result && (
            <div className="text-amber-600 text-xs text-right hidden sm:block">
              <div className="text-amber-400 font-medium">{spec.name}</div>
              <div>{result.width} × {result.height} knots · v{spec.version}</div>
            </div>
          )}
          {/* Quick style presets */}
          <div className="flex gap-1 flex-wrap">
            {["sarouk", "heriz", "kashan", "tabriz"].map((s) => (
              <button
                key={s}
                onClick={() => handleStylePresetLoad(s)}
                className="text-[10px] uppercase tracking-wider px-2 py-1 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-800/40 rounded text-amber-400 hover:text-amber-200 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-amber-900/30 bg-black/20 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-amber-900/30">
            {(["controls", "ai", "export", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[10px] uppercase tracking-wider font-semibold transition-colors ${
                  activeTab === tab
                    ? "text-amber-300 border-b-2 border-amber-400 bg-amber-900/20"
                    : "text-amber-700 hover:text-amber-400"
                }`}
              >
                {tab === "controls" ? "⚙ Design" : tab === "ai" ? "✦ AI" : tab === "export" ? "↓ Export" : "⟲ History"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-amber-900 scrollbar-track-transparent">
            {activeTab === "controls" && (
              <ControlPanel
                spec={spec}
                onChange={handleSpecChange}
                onGenerate={() => generate(undefined, "Manual generate")}
                onReset={handleReset}
                loading={loading}
              />
            )}
            {activeTab === "ai" && (
              <AIPanel
                spec={result?.spec ?? null}
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
                onApplyPatches={handleApplyAIPatches}
              />
            )}
            {activeTab === "export" && result && (
              <ExportPanel result={result} />
            )}
            {activeTab === "export" && !result && (
              <div className="text-amber-600 text-xs italic text-center pt-8">Generate a rug first.</div>
            )}
            {activeTab === "history" && (
              <VersionHistory
                history={spec.history}
                currentVersion={spec.version}
                onRevert={handleRevert}
              />
            )}
          </div>
        </aside>

        {/* Main canvas area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas toolbar */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-amber-900/30 bg-black/20">
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <span className="text-amber-700">Res:</span>
              {[1, 2, 3].map((z) => (
                <button
                  key={z}
                  onClick={() => setCellSize(z)}
                  title={`Cell size ${z}px — affects output quality`}
                  className={`px-2 py-0.5 rounded ${cellSize === z ? "bg-amber-700 text-white" : "bg-amber-900/30 hover:bg-amber-800/40 text-amber-400"}`}
                >
                  {z}×
                </button>
              ))}
              <span className="text-amber-800 text-[10px] ml-1">scroll or pinch to zoom</span>
            </div>
            {result && (
              <div className="text-amber-700 text-xs ml-auto">
                {result.palette.length} colors · {totalKnots.toLocaleString()} knots
              </div>
            )}
            {error && (
              <div className="text-red-400 text-xs bg-red-900/20 border border-red-800/40 rounded px-3 py-1 ml-auto">
                {error}
              </div>
            )}
          </div>

          {/* Canvas — fills remaining height, zoom/pan handled internally */}
          <div className="flex-1 relative">
            <RugCanvas result={result} loading={loading} cellSize={cellSize} />
          </div>
        </main>

        {/* Right sidebar — palette + quick info */}
        {result && (
          <aside className="w-56 flex-shrink-0 border-l border-amber-900/30 bg-black/20 p-4 overflow-y-auto">
            <PaletteDisplay
              palette={result.palette}
              totalKnots={totalKnots}
              onColorChange={handleColorChange}
            />
            {/* Spec summary */}
            <div className="mt-6 space-y-2">
              <h3 className="text-amber-300 font-serif text-sm font-semibold uppercase tracking-widest">Spec</h3>
              <div className="space-y-1 text-xs text-amber-500">
                <SpecRow label="Style" value={spec.style} />
                <SpecRow label="Symmetry" value={spec.symmetry} />
                <SpecRow label="Grid" value={`${spec.gridWidth}×${spec.gridHeight}`} />
                <SpecRow label="Variation" value={spec.variation.toFixed(2)} />
                <SpecRow label="Seed" value={spec.seed.slice(0, 8) + "…"} />
                <SpecRow label="Version" value={`v${spec.version}`} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-amber-700">{label}</span>
      <span className="text-amber-400 font-mono text-right truncate">{value}</span>
    </div>
  );
}
