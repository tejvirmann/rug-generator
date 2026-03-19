// ─── Core rug design spec ────────────────────────────────────────────────────
// This is the "source of truth" saved as .rug.json. The renderer converts it
// deterministically to a pixel/knot grid. Every iteration is a diff of this.

export type SymmetryMode =
  | "none"
  | "mirror-x"
  | "mirror-y"
  | "mirror-both"
  | "rotate-180";

export type RugStyle = "sarouk" | "heriz" | "kashan" | "tabriz" | "custom";

export interface ColorEntry {
  id: string;        // short id e.g. "c0"
  name: string;      // e.g. "Deep Crimson"
  hex: string;       // e.g. "#8B1A1A"
  knotCount?: number; // filled in after rendering
}

export interface Palette {
  background: string;     // color id for field background
  colors: ColorEntry[];
}

export interface LayoutRegion {
  type: "field" | "border" | "guard" | "medallion" | "corner" | "spandrel";
  // fractional sizes (0–1 of total grid)
  widthFraction?: number;   // for borders: fraction of total width per side
  heightFraction?: number;
  enabled: boolean;
}

export interface MotifParams {
  // vine / scroll
  vineEnabled: boolean;
  vineDensity: number;       // 0–1
  vineCurvature: number;     // 0–1
  vineColor: string;         // color id

  // leaves
  leavesEnabled: boolean;
  leafSize: number;          // 0–1
  leafRoundness: number;     // 0–1
  leafColor: string;

  // flowers / rosettes
  flowersEnabled: boolean;
  flowerSize: number;        // 0–1
  flowerComplexity: number;  // 0–1  (petal count / detail)
  flowerColor: string;
  flowerAccentColor: string;

  // palmettes
  palmettesEnabled: boolean;
  palmetteSize: number;
  palmetteColor: string;

  // herati / geometric fill
  heratiEnabled: boolean;
  heratiDensity: number;
}

export interface MedallionParams {
  enabled: boolean;
  sizeX: number;      // 0–1 fraction of field width
  sizeY: number;
  complexity: number; // 0–1
  color: string;      // color id
  accentColor: string;
  innerRings: number; // 0–3
}

export interface BorderParams {
  mainBorderWidth: number;   // 0–1 fraction of total width per side
  guardWidth: number;        // fraction
  tileRepeatX: number;       // how many repeats of the tile motif
  motif: "vine-scroll" | "geometric" | "floral-stripe" | "meander";
  color: string;
  accentColor: string;
}

export interface LockEntry {
  type: "region" | "color" | "full";
  regionType?: LayoutRegion["type"];
}

export interface VersionEntry {
  version: number;
  timestamp: string;       // ISO
  note: string;            // user or AI description of what changed
  seed: string;
}

export interface RugSpec {
  // identity
  id: string;
  name: string;
  style: RugStyle;
  version: number;
  history: VersionEntry[];

  // grid
  gridWidth: number;    // knots
  gridHeight: number;

  // generation
  seed: string;
  symmetry: SymmetryMode;
  variation: number;        // 0–1 — intentional "handmade" imperfection

  // design
  palette: Palette;
  layout: {
    border: BorderParams;
    medallion: MedallionParams;
    field: MotifParams;
  };

  // locks — regions/aspects that must not change on next generation
  locks: LockEntry[];
}

// ─── Rendered output ──────────────────────────────────────────────────────────
export interface RenderResult {
  grid: number[][];          // [row][col] = palette color index
  palette: ColorEntry[];     // ordered palette used for the grid indices
  width: number;
  height: number;
  spec: RugSpec;
}

// ─── AI patch ops ─────────────────────────────────────────────────────────────
export type PatchOp =
  | { op: "set"; path: string; value: unknown }
  | { op: "increment"; path: string; delta: number }
  | { op: "addLock"; lock: LockEntry }
  | { op: "removeLock"; lockType: LockEntry["type"]; regionType?: string }
  | { op: "reseed"; scope: "global" | "field" | "border" | "medallion" };

export interface AIPatchResponse {
  ops: PatchOp[];
  explanation: string;
}
