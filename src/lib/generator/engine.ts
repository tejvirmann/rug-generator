import type { RugSpec, RenderResult, ColorEntry, MotifParams, MedallionParams, BorderParams } from "@/lib/types";
import { createRNG, scopedRNG } from "./seededRandom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paletteIndex(spec: RugSpec, colorId: string): number {
  const idx = spec.palette.colors.findIndex((c) => c.id === colorId);
  return idx >= 0 ? idx : 0;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Simple catmull-rom spline point
function catmullPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[1] - 3 * p2[0] + p3[0]) * t3),
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

// Draw a filled circle on the grid
function drawCircle(
  grid: number[][],
  cx: number,
  cy: number,
  r: number,
  colorIdx: number,
  w: number,
  h: number
) {
  const ri = Math.ceil(r);
  for (let dy = -ri; dy <= ri; dy++) {
    for (let dx = -ri; dx <= ri; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const x = Math.round(cx + dx);
        const y = Math.round(cy + dy);
        if (x >= 0 && x < w && y >= 0 && y < h) {
          grid[y][x] = colorIdx;
        }
      }
    }
  }
}

// Draw a thick line between two points
function drawLine(
  grid: number[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thickness: number,
  colorIdx: number,
  w: number,
  h: number
) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = lerp(x0, x1, t);
    const py = lerp(y0, y1, t);
    drawCircle(grid, px, py, thickness / 2, colorIdx, w, h);
  }
}

// Draw a diamond / rhombus
function drawDiamond(
  grid: number[][],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  colorIdx: number,
  w: number,
  h: number
) {
  const ri = Math.ceil(Math.max(rx, ry));
  for (let dy = -ri; dy <= ri; dy++) {
    for (let dx = -ri; dx <= ri; dx++) {
      if (Math.abs(dx) / rx + Math.abs(dy) / ry <= 1) {
        const x = Math.round(cx + dx);
        const y = Math.round(cy + dy);
        if (x >= 0 && x < w && y >= 0 && y < h) {
          grid[y][x] = colorIdx;
        }
      }
    }
  }
}

// Draw an ellipse
function drawEllipse(
  grid: number[][],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  colorIdx: number,
  w: number,
  h: number
) {
  const ri = Math.ceil(Math.max(rx, ry));
  for (let dy = -ri; dy <= ri; dy++) {
    for (let dx = -ri; dx <= ri; dx++) {
      const nx = dx / rx, ny = dy / ry;
      if (nx * nx + ny * ny <= 1) {
        const x = Math.round(cx + dx);
        const y = Math.round(cy + dy);
        if (x >= 0 && x < w && y >= 0 && y < h) {
          grid[y][x] = colorIdx;
        }
      }
    }
  }
}

// Draw a star/rosette with `petals` arms
function drawRosette(
  grid: number[][],
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  petals: number,
  colorIdx: number,
  accentIdx: number,
  w: number,
  h: number
) {
  // Fill center
  drawCircle(grid, cx, cy, innerR * 0.8, accentIdx, w, h);
  // Petals as small ellipses rotated around center
  for (let p = 0; p < petals; p++) {
    const angle = (p / petals) * Math.PI * 2;
    const px = cx + Math.cos(angle) * (innerR + outerR) / 2;
    const py = cy + Math.sin(angle) * (innerR + outerR) / 2;
    const petalR = outerR - innerR;
    drawEllipse(grid, px, py, petalR * 0.7, petalR * 1.2, colorIdx, w, h);
  }
  drawCircle(grid, cx, cy, innerR * 0.5, accentIdx, w, h);
}

// Draw a leaf shape (tapered ellipse)
function drawLeaf(
  grid: number[][],
  cx: number,
  cy: number,
  length: number,
  width: number,
  angle: number,
  roundness: number,
  colorIdx: number,
  w: number,
  h: number
) {
  const steps = Math.ceil(length * 2);
  const cosa = Math.cos(angle);
  const sina = Math.sin(angle);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0 at tip, 1 at base
    const along = (t - 0.5) * length;
    const across = width * 0.5 * Math.sin(t * Math.PI) * (0.5 + roundness * 0.5);
    const px = cx + cosa * along;
    const py = cy + sina * along;
    drawCircle(grid, px, py, across, colorIdx, w, h);
  }
}

// Draw a palmette (fan shape)
function drawPalmette(
  grid: number[][],
  cx: number,
  cy: number,
  size: number,
  colorIdx: number,
  accentIdx: number,
  w: number,
  h: number
) {
  const fronds = 7;
  for (let f = 0; f < fronds; f++) {
    const angle = lerp(-Math.PI * 0.4, Math.PI * 0.4, f / (fronds - 1)) - Math.PI / 2;
    const len = size * (f === Math.floor(fronds / 2) ? 1.0 : 0.7 + 0.3 * Math.sin((f / fronds) * Math.PI));
    const ex = cx + Math.cos(angle) * len;
    const ey = cy + Math.sin(angle) * len;
    const thick = Math.max(1, size * 0.12);
    drawLine(grid, cx, cy, ex, ey, thick, f % 2 === 0 ? colorIdx : accentIdx, w, h);
    drawCircle(grid, ex, ey, size * 0.1, accentIdx, w, h);
  }
  drawCircle(grid, cx, cy, size * 0.15, accentIdx, w, h);
}

// ─── Quadrant generator ────────────────────────────────────────────────────────

// We generate one quadrant (top-left) then mirror to the other 3.
// The field occupies the interior after borders are excluded.

function generateQuadrant(
  spec: RugSpec,
  qw: number,  // quadrant width in knots
  qh: number,  // quadrant height in knots
  bgIdx: number
): number[][] {
  const grid: number[][] = Array.from({ length: qh }, () =>
    new Array(qw).fill(bgIdx)
  );
  const rng = scopedRNG(spec.seed, "field");

  const field = spec.layout.field;
  const pal = spec.palette.colors;

  function idx(id: string) {
    const i = pal.findIndex((c) => c.id === id);
    return i >= 0 ? i : 0;
  }

  // ── Vine scroll paths ────────────────────────────────────────────────────
  if (field.vineEnabled && field.vineDensity > 0) {
    const vineIdx = idx(field.vineColor);
    const numVines = Math.ceil(field.vineDensity * 4) + 1;
    const vineThickness = Math.max(1.5, qw * 0.012);

    for (let v = 0; v < numVines; v++) {
      // Generate control points for a vine across the quadrant
      const numPts = 4 + Math.floor(rng() * 3);
      const pts: [number, number][] = [];
      for (let p = 0; p < numPts; p++) {
        const tx = (p / (numPts - 1)) * qw;
        const ty = (v / (numVines - 1) + (rng() - 0.5) * 0.3) * qh;
        const curvature = field.vineCurvature;
        pts.push([
          clamp(tx + (rng() - 0.5) * qw * 0.2 * curvature, 0, qw - 1),
          clamp(ty + (rng() - 0.5) * qh * 0.3 * curvature, 0, qh - 1),
        ]);
      }

      // Render vine as catmull-rom spline
      for (let seg = 0; seg < pts.length - 1; seg++) {
        const p0 = pts[Math.max(0, seg - 1)];
        const p1 = pts[seg];
        const p2 = pts[seg + 1];
        const p3 = pts[Math.min(pts.length - 1, seg + 2)];
        const steps = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 2);
        for (let s = 0; s <= steps; s++) {
          const [px, py] = catmullPoint(p0, p1, p2, p3, s / steps);
          drawCircle(grid, px, py, vineThickness / 2, vineIdx, qw, qh);
        }
      }

      // ── Leaves along vine ──────────────────────────────────────────────
      if (field.leavesEnabled) {
        const leafIdx = idx(field.leafColor);
        const leafSpacing = Math.max(8, qw * (0.08 + (1 - field.vineDensity) * 0.1));
        for (let seg = 0; seg < pts.length - 1; seg++) {
          const p1 = pts[seg], p2 = pts[seg + 1];
          const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
          const numLeaves = Math.floor(segLen / leafSpacing);
          for (let l = 0; l < numLeaves; l++) {
            const t = (l + 0.5) / numLeaves;
            const lx = lerp(p1[0], p2[0], t) + (rng() - 0.5) * 4;
            const ly = lerp(p1[1], p2[1], t) + (rng() - 0.5) * 4;
            const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) + (l % 2 === 0 ? 0.6 : -0.6) + (rng() - 0.5) * 0.2;
            const leafLen = qw * field.leafSize * (0.05 + rng() * 0.04);
            const leafW = leafLen * (0.35 + field.leafRoundness * 0.3);
            drawLeaf(grid, lx, ly, leafLen, leafW, angle, field.leafRoundness, leafIdx, qw, qh);
          }
        }
      }

      // ── Flowers along vine ────────────────────────────────────────────
      if (field.flowersEnabled) {
        const flIdx = idx(field.flowerColor);
        const flAccIdx = idx(field.flowerAccentColor);
        const flSpacing = Math.max(15, qw * (0.12 + (1 - field.vineDensity) * 0.08));
        for (let seg = 0; seg < pts.length - 1; seg++) {
          const p1 = pts[seg], p2 = pts[seg + 1];
          const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
          const numFl = Math.max(1, Math.floor(segLen / flSpacing));
          for (let f = 0; f < numFl; f++) {
            const t = (f + 0.5) / numFl;
            const fx = lerp(p1[0], p2[0], t) + (rng() - 0.5) * 6;
            const fy = lerp(p1[1], p2[1], t) + (rng() - 0.5) * 6;
            const outerR = qw * field.flowerSize * (0.035 + rng() * 0.02);
            const petals = 6 + Math.floor(field.flowerComplexity * 6);
            drawRosette(grid, fx, fy, outerR, outerR * 0.45, petals, flIdx, flAccIdx, qw, qh);
          }
        }
      }
    }
  }

  // ── Standalone flowers (no vine) ─────────────────────────────────────────
  if (field.flowersEnabled && !field.vineEnabled) {
    const rngF = scopedRNG(spec.seed, "standalone-flowers");
    const flIdx = idx(field.flowerColor);
    const flAccIdx = idx(field.flowerAccentColor);
    const count = Math.ceil(field.flowerComplexity * 6) + 3;
    for (let i = 0; i < count; i++) {
      const fx = rngF() * qw;
      const fy = rngF() * qh;
      const outerR = qw * field.flowerSize * (0.04 + rngF() * 0.025);
      const petals = 6 + Math.floor(field.flowerComplexity * 6);
      drawRosette(grid, fx, fy, outerR, outerR * 0.45, petals, flIdx, flAccIdx, qw, qh);
    }
  }

  // ── Palmettes (placed at regular intervals) ──────────────────────────────
  if (field.palmettesEnabled) {
    const rngP = scopedRNG(spec.seed, "palmettes");
    const pIdx = idx(field.palmetteColor);
    const pAccIdx = idx(field.flowerAccentColor);
    const cols = 2, rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = (c + 0.5) / cols * qw + (rngP() - 0.5) * qw * 0.08;
        const py = (r + 0.5) / rows * qh + (rngP() - 0.5) * qh * 0.06;
        const size = qw * field.palmetteSize * (0.04 + rngP() * 0.02);
        drawPalmette(grid, px, py, size, pIdx, pAccIdx, qw, qh);
      }
    }
  }

  return grid;
}

// ─── Medallion ────────────────────────────────────────────────────────────────

function renderMedallion(
  grid: number[][],
  spec: RugSpec,
  w: number,
  h: number,
  borderPx: number
) {
  const m = spec.layout.medallion;
  if (!m.enabled) return;

  const pal = spec.palette.colors;
  function idx(id: string) {
    const i = pal.findIndex((c) => c.id === id);
    return i >= 0 ? i : 0;
  }

  const fieldW = w - borderPx * 2;
  const fieldH = h - borderPx * 2;
  const cx = w / 2;
  const cy = h / 2;
  const rx = (fieldW * m.sizeX) / 2;
  const ry = (fieldH * m.sizeY) / 2;
  const mIdx = idx(m.color);
  const aIdx = idx(m.accentColor);
  const rng = scopedRNG(spec.seed, "medallion");

  // Outer ellipse
  drawEllipse(grid, cx, cy, rx, ry, mIdx, w, h);

  // Inner rings
  for (let ring = 1; ring <= m.innerRings; ring++) {
    const scale = 1 - ring * (0.18 / m.innerRings);
    const ringIdx = ring % 2 === 0 ? aIdx : mIdx;
    drawEllipse(grid, cx, cy, rx * scale, ry * scale, ringIdx, w, h);
  }

  // Center rosette
  const roseR = Math.min(rx, ry) * 0.25;
  const petals = 8 + Math.floor(m.complexity * 8);
  drawRosette(grid, cx, cy, roseR, roseR * 0.4, petals, aIdx, mIdx, w, h);

  // Corner pendants (diamond shapes at top/bottom/left/right of medallion)
  const pendantR = Math.min(rx, ry) * 0.15;
  const pendantPositions: [number, number][] = [
    [cx, cy - ry - pendantR * 0.8],
    [cx, cy + ry + pendantR * 0.8],
    [cx - rx - pendantR * 0.8, cy],
    [cx + rx + pendantR * 0.8, cy],
  ];
  for (const [px, py] of pendantPositions) {
    if (px >= 0 && px < w && py >= 0 && py < h) {
      drawDiamond(grid, px, py, pendantR, pendantR * 1.5, aIdx, w, h);
      drawCircle(grid, px, py, pendantR * 0.4, mIdx, w, h);
    }
  }

  // Perimeter rosettes
  const numPerimRosettes = 6 + Math.floor(m.complexity * 6);
  for (let i = 0; i < numPerimRosettes; i++) {
    const angle = (i / numPerimRosettes) * Math.PI * 2;
    const perimX = cx + Math.cos(angle) * rx * 0.85;
    const perimY = cy + Math.sin(angle) * ry * 0.85;
    const pr = roseR * 0.25;
    drawRosette(grid, perimX, perimY, pr, pr * 0.4, 6, mIdx, aIdx, w, h);
  }
}

// ─── Border ───────────────────────────────────────────────────────────────────

function renderBorder(
  grid: number[][],
  spec: RugSpec,
  w: number,
  h: number,
  borderPx: number,
  guardPx: number
) {
  const b = spec.layout.border;
  const pal = spec.palette.colors;
  function idx(id: string) {
    const i = pal.findIndex((c) => c.id === id);
    return i >= 0 ? i : 0;
  }

  const bIdx = idx(b.color);
  const aIdx = idx(b.accentColor);

  // Fill main border band (all 4 sides)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inBorderZone =
        x < borderPx || x >= w - borderPx ||
        y < borderPx || y >= h - borderPx;
      if (inBorderZone) {
        grid[y][x] = bIdx;
      }
    }
  }

  // Guard stripes
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inGuard =
        (x >= borderPx - guardPx && x < borderPx) ||
        (x >= w - borderPx && x < w - borderPx + guardPx) ||
        (y >= borderPx - guardPx && y < borderPx) ||
        (y >= h - borderPx && y < h - borderPx + guardPx);
      if (inGuard) {
        grid[y][x] = aIdx;
      }
    }
  }

  // Border motifs
  const rng = scopedRNG(spec.seed, "border");
  const motif = b.motif;

  if (motif === "vine-scroll" || motif === "floral-stripe") {
    // Top and bottom horizontal border motifs
    const tileW = Math.floor(w / b.tileRepeatX);
    for (let tile = 0; tile < b.tileRepeatX; tile++) {
      const tx = tile * tileW + tileW / 2;

      // Top border
      const tyTop = borderPx / 2;
      const rosetteR = borderPx * 0.22;
      drawRosette(grid, tx, tyTop, rosetteR, rosetteR * 0.4, 6, aIdx, bIdx, w, h);

      // Vine between rosettes
      if (tile < b.tileRepeatX - 1) {
        const nx = (tile + 1) * tileW + tileW / 2;
        const midY = tyTop + (rng() - 0.5) * borderPx * 0.25;
        drawLine(grid, tx, tyTop, (tx + nx) / 2, midY, Math.max(1, borderPx * 0.06), aIdx, w, h);
        drawLine(grid, (tx + nx) / 2, midY, nx, tyTop, Math.max(1, borderPx * 0.06), aIdx, w, h);
        drawLeaf(grid, (tx + nx) / 2, midY - borderPx * 0.12, borderPx * 0.18, borderPx * 0.08, -Math.PI / 2, 0.7, aIdx, w, h);
      }

      // Bottom border (mirror)
      const tyBot = h - borderPx / 2;
      drawRosette(grid, tx, tyBot, rosetteR, rosetteR * 0.4, 6, aIdx, bIdx, w, h);
      if (tile < b.tileRepeatX - 1) {
        const nx = (tile + 1) * tileW + tileW / 2;
        const midY = tyBot - (rng() - 0.5) * borderPx * 0.25;
        drawLine(grid, tx, tyBot, (tx + nx) / 2, midY, Math.max(1, borderPx * 0.06), aIdx, w, h);
        drawLine(grid, (tx + nx) / 2, midY, nx, tyBot, Math.max(1, borderPx * 0.06), aIdx, w, h);
        drawLeaf(grid, (tx + nx) / 2, midY + borderPx * 0.12, borderPx * 0.18, borderPx * 0.08, Math.PI / 2, 0.7, aIdx, w, h);
      }
    }

    // Left and right vertical border motifs
    const tileH = Math.floor(h / b.tileRepeatX);
    for (let tile = 0; tile < b.tileRepeatX; tile++) {
      const ty = tile * tileH + tileH / 2;
      const txLeft = borderPx / 2;
      const txRight = w - borderPx / 2;
      const rosetteR = borderPx * 0.22;

      drawRosette(grid, txLeft, ty, rosetteR, rosetteR * 0.4, 6, aIdx, bIdx, w, h);
      drawRosette(grid, txRight, ty, rosetteR, rosetteR * 0.4, 6, aIdx, bIdx, w, h);

      if (tile < b.tileRepeatX - 1) {
        const ny = (tile + 1) * tileH + tileH / 2;
        drawLeaf(grid, txLeft, (ty + ny) / 2, tileH * 0.25, borderPx * 0.1, 0, 0.65, aIdx, w, h);
        drawLeaf(grid, txRight, (ty + ny) / 2, tileH * 0.25, borderPx * 0.1, 0, 0.65, aIdx, w, h);
      }
    }
  } else if (motif === "geometric" || motif === "meander") {
    // Geometric stepped meander / key pattern
    const step = Math.max(2, Math.floor(borderPx / 4));
    const thick = Math.max(1, Math.floor(step / 2));

    // Top meander
    let x = 0, dir = 1;
    const py = Math.floor(borderPx * 0.55);
    while (x < w) {
      const nx = clamp(x + step * 4 * dir, 0, w - 1);
      drawLine(grid, x, py, nx, py, thick, aIdx, w, h);
      const ny = Math.floor(borderPx * 0.3);
      drawLine(grid, nx, py, nx, ny, thick, aIdx, w, h);
      drawLine(grid, nx, ny, nx + step * dir, ny, thick, aIdx, w, h);
      drawLine(grid, nx + step * dir, ny, nx + step * dir, py + step, thick, aIdx, w, h);
      x = nx + step * dir;
      dir *= -1;
      if (x <= 0 || x >= w - 1) break;
    }

    // Bottom meander (mirrored)
    x = 0; dir = 1;
    const pyB = h - Math.floor(borderPx * 0.55);
    while (x < w) {
      const nx = clamp(x + step * 4 * dir, 0, w - 1);
      drawLine(grid, x, pyB, nx, pyB, thick, aIdx, w, h);
      const ny = h - Math.floor(borderPx * 0.3);
      drawLine(grid, nx, pyB, nx, ny, thick, aIdx, w, h);
      drawLine(grid, nx, ny, nx + step * dir, ny, thick, aIdx, w, h);
      x = nx + step * dir;
      dir *= -1;
      if (x <= 0 || x >= w - 1) break;
    }
  }

  // Corner squares
  const cs = borderPx;
  const cornerPositions: [number, number][] = [
    [cs / 2, cs / 2],
    [w - cs / 2, cs / 2],
    [cs / 2, h - cs / 2],
    [w - cs / 2, h - cs / 2],
  ];
  for (const [cx, cy] of cornerPositions) {
    const cr = cs * 0.32;
    drawRosette(grid, cx, cy, cr, cr * 0.45, 8, aIdx, bIdx, w, h);
  }
}

// ─── Symmetry application ────────────────────────────────────────────────────

function applySymmetry(
  quadrant: number[][],
  qw: number,
  qh: number,
  mode: string
): { grid: number[][], w: number, h: number } {
  if (mode === "none") {
    return { grid: quadrant, w: qw, h: qh };
  }

  const w = mode === "mirror-y" || mode === "none" ? qw : qw * 2;
  const h = mode === "mirror-x" || mode === "none" ? qh : qh * 2;

  const grid: number[][] = Array.from({ length: h }, () => new Array(w).fill(0));

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const v = quadrant[y][x];
      // top-left quadrant always
      grid[y][x] = v;
      // top-right (mirror-x)
      if (mode === "mirror-x" || mode === "mirror-both" || mode === "rotate-180") {
        grid[y][w - 1 - x] = v;
      }
      // bottom-left (mirror-y)
      if (mode === "mirror-y" || mode === "mirror-both" || mode === "rotate-180") {
        grid[h - 1 - y][x] = v;
      }
      // bottom-right
      if (mode === "mirror-both" || mode === "rotate-180") {
        grid[h - 1 - y][w - 1 - x] = v;
      }
    }
  }

  return { grid, w, h };
}

// ─── Variation / abrash ───────────────────────────────────────────────────────

function applyVariation(
  grid: number[][],
  w: number,
  h: number,
  paletteLen: number,
  strength: number,
  seed: string
) {
  if (strength <= 0) return;
  const rng = scopedRNG(seed, "variation");
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rng() < strength * 0.03) {
        // Shift color by ±1 in palette (subtle abrash effect)
        const current = grid[y][x];
        const shift = rng() < 0.5 ? -1 : 1;
        grid[y][x] = clamp(current + shift, 0, paletteLen - 1);
      }
    }
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function generateRug(spec: RugSpec): RenderResult {
  const { gridWidth, gridHeight, symmetry } = spec;

  // Determine quadrant size based on symmetry
  const useHalfX = symmetry === "mirror-x" || symmetry === "mirror-both" || symmetry === "rotate-180";
  const useHalfY = symmetry === "mirror-y" || symmetry === "mirror-both" || symmetry === "rotate-180";
  const qw = useHalfX ? Math.floor(gridWidth / 2) : gridWidth;
  const qh = useHalfY ? Math.floor(gridHeight / 2) : gridHeight;

  const bgIdx = spec.palette.colors.findIndex((c) => c.id === spec.palette.background);
  const safeBgIdx = bgIdx >= 0 ? bgIdx : 0;

  // Generate the quadrant
  const quadrant = generateQuadrant(spec, qw, qh, safeBgIdx);

  // Apply symmetry to get full grid
  const { grid, w, h } = applySymmetry(quadrant, qw, qh, symmetry);

  // Calculate border sizes
  const borderPx = Math.floor(w * spec.layout.border.mainBorderWidth);
  const guardPx = Math.floor(w * spec.layout.border.guardWidth);

  // Render border on full grid
  renderBorder(grid, spec, w, h, borderPx, guardPx);

  // Render medallion on full grid (centered, always applied after symmetry)
  renderMedallion(grid, spec, w, h, borderPx);

  // Apply variation
  applyVariation(grid, w, h, spec.palette.colors.length, spec.variation, spec.seed);

  // Count knots per color
  const knotCounts = new Array(spec.palette.colors.length).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = grid[y][x];
      if (v >= 0 && v < knotCounts.length) knotCounts[v]++;
    }
  }

  const palette: ColorEntry[] = spec.palette.colors.map((c, i) => ({
    ...c,
    knotCount: knotCounts[i],
  }));

  return {
    grid,
    palette,
    width: w,
    height: h,
    spec,
  };
}

// ─── Default spec builder ─────────────────────────────────────────────────────

export function buildDefaultSpec(overrides: Partial<RugSpec> = {}): RugSpec {
  const saroukBase: RugSpec = {
    id: crypto.randomUUID(),
    name: "Untitled Rug",
    style: "sarouk",
    version: 1,
    history: [],
    gridWidth: 200,
    gridHeight: 300,
    seed: Math.random().toString(36).slice(2),
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

  return deepMerge(saroukBase as unknown as Record<string, unknown>, overrides as Record<string, unknown>) as unknown as RugSpec;
}

// Simple deep merge utility
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object"
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
