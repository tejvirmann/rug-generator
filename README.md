
<div align="center">

# 🧶 Antique Rug Generator

**Procedurally generated antique rug knot-grid patterns.**  
_Sarouk · Heriz · Kashan · Tabriz · and beyond._

---

```
╔══════════════════════════════════════════════════════════╗
║  ░░▒▒▓▓██ ✦ ✦ ✦  ANTIQUE RUG GENERATOR  ✦ ✦ ✦ ██▓▓▒▒░░  ║
║  ░░  ✿ ❧  每一个结都是一幅画  ❧ ✿  ░░  ║
║  ░░▒▒▓▓██ ─────── every knot, a brushstroke ──────── ██▓▓▒▒░░  ║
╚══════════════════════════════════════════════════════════╝
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/rug-generator)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

</div>

---

## ✦ What Is This?

A **web application** that generates **antique rug knot-grid patterns** — the same kind of chart a real rug weaver uses to hand-knot a rug. Every dot in the output grid represents one physical knot.

Designs are **procedurally generated** using authentic antique rug structural grammars — field layouts, vine scrolls, floral rosettes, palmettes, central medallions, and tiered borders — all placed with weaving-aware constraints.

```
┌──────────────────────────── KNOT GRID ────────────────────────────┐
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████  ← border │
│  ████ ░░╔══════════════════════════╗░░ ████  │
│  ████ ░░║  ✿  ❧ ❧ ✿  ║░░ ████  │
│  ████ ░░║  ❧ ◈ MEDALLION ◈ ❧  ║░░ ████  │
│  ████ ░░║  ✿  ❧ ❧ ✿  ║░░ ████  │
│  ████ ░░╚══════════════════════════╝░░ ████  │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████  │
└───────────────────────────────────────────────────────────────────┘
  ↑ each cell = 1 knot     symmetry: mirror-both (¼ generated + flipped)
```

---

## 🎨 Rug Styles

| Style | Character | Palette | Motifs |
|-------|-----------|---------|--------|
| **Antique Sarouk** | Curvy, dense florals | Deep Crimson · Navy · Ivory · Gold | Vine scrolls · rosettes · palmettes |
| **Heriz Geometric** | Bold, angular | Brick Red · Indigo · Cream | Geometric flowers · large medallion |
| **Kashan Floral** | Refined, intricate | Royal Burgundy · Emerald · Gold | Fine vines · elaborate medallion |
| **Tabriz Classic** | Elegant, balanced | Warm Camel · Deep Red · Navy | Mixed floral + geometric |

---

## ⚙️ How It Works

### 1. ¼ Generation + Mirror Symmetry

Most antique rugs are **bi-axially symmetric** — left/right and top/bottom. The engine:

1. Generates **one quadrant** (top-left ¼ of the rug)
2. Reflects it to fill all 4 quadrants
3. Adds **border + medallion** on the full grid (centered)
4. Applies optional **variation** (subtle abrash-like imperfection)

```
┌─────┬─────┐
│  Q  │ →Q  │   Q = generated quadrant
├─────┼─────┤   ↓Q = vertical mirror
│ ↓Q  │↓→Q  │   →Q = horizontal mirror
└─────┴─────┘   ↓→Q = both
```

### 2. Structural Spec (`.rug.json`)

Every design is stored as a **structured project file**, not just pixels:

```json
{
  "id": "uuid",
  "name": "My Sarouk",
  "style": "sarouk",
  "seed": "abc123",
  "symmetry": "mirror-both",
  "variation": 0.08,
  "palette": { "colors": [...] },
  "layout": {
    "border": { "motif": "vine-scroll", "tileRepeatX": 8, ... },
    "medallion": { "sizeX": 0.38, "innerRings": 2, ... },
    "field": { "vineDensity": 0.65, "leafRoundness": 0.7, ... }
  },
  "locks": [],
  "history": [...]
}
```

This means **every iteration is a diff** — not a new image from scratch.

### 3. Deterministic Seeds + Scoped Seeds

- **Same seed + same params = identical output** every time
- Change one parameter → only that part changes
- `scopedRNG(seed, "field")` keeps field consistent when you change only the border seed

### 4. AI Mode (OpenRouter)

The LLM never outputs pixels. It outputs **patch operations** on the spec:

```
You: "make the leaves rounder and less dense"

AI → ops:
  { op: "set", path: "layout.field.leafRoundness", value: 0.9 }
  { op: "set", path: "layout.field.vineDensity",   value: 0.4 }

Renderer: spec + ops → new knot grid
```

---

## 🖥️ Features

- **🎛 Design controls** — sliders for every parameter: vine density, leaf roundness, flower complexity, medallion size, border width, symmetry, variation, and more
- **✦ AI chat panel** — describe a change, get an edited spec back, regenerate instantly  
- **⟲ Version history** — every generate creates a versioned snapshot; revert anytime
- **🎨 Palette display** — color legend with knot counts and percentages
- **🔍 Zoom** — 1×/2×/3×/4× cell size for inspecting individual knots
- **↓ Export** — PNG · SVG · CSV knot chart · JSON project file
- **🧶 Quick style presets** — Sarouk, Heriz, Kashan, Tabriz in one click
- **📐 Symmetry modes** — mirror-both, mirror-x, mirror-y, rotate-180, none

---

## 🚀 Getting Started

### Local development

```bash
git clone https://github.com/your-repo/rug-generator
cd rug-generator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or click the button at the top of this README.

**No environment variables required** to run the base generator. The AI panel requires an [OpenRouter](https://openrouter.ai) API key — enter it in the app's AI tab. It's never stored on the server.

---

## 🔁 Iteration Workflow

```
1. Pick a style preset  →  Sarouk / Heriz / Kashan / Tabriz
2. Click "Generate Rug" →  full knot-grid appears
3. Adjust one slider    →  e.g. reduce vine density
4. Generate again       →  only that aspect changes (seed preserved)
5. Use AI panel         →  "make the border simpler, keep the medallion"
6. AI patches the spec  →  new version auto-generates
7. Love it?             →  Export PNG / SVG / CSV / JSON
8. Changed mind?        →  History tab → revert to any version
```

---

## 📦 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   ← knot grid generation endpoint
│   │   └── ai/route.ts         ← OpenRouter proxy (patch ops)
│   ├── page.tsx                ← main application UI
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── RugCanvas.tsx           ← WebGL-style canvas renderer
│   ├── ControlPanel.tsx        ← all design sliders + toggles
│   ├── AIPanel.tsx             ← chat interface + quick prompts
│   ├── PaletteDisplay.tsx      ← color legend with knot counts
│   ├── ExportPanel.tsx         ← PNG / SVG / CSV / JSON export
│   └── VersionHistory.tsx      ← version log + revert
└── lib/
    ├── types.ts                ← RugSpec schema (the "source of truth")
    └── generator/
        ├── engine.ts           ← core procedural generator
        ├── seededRandom.ts     ← deterministic PRNG
        ├── patchSpec.ts        ← apply AI patch ops to spec
        └── styles/
            ├── sarouk.ts
            ├── heriz.ts
            ├── kashan.ts
            └── tabriz.ts
```

---

## 🎨 Color Palettes

<table>
<tr>
<td align="center">🔴 <b>Sarouk</b></td>
<td>
<code style="background:#7B1B1B;color:white">Deep Crimson</code>
<code style="background:#1A2644;color:white">Midnight Navy</code>
<code style="background:#F2ECD8;color:black">Antique Ivory</code>
<code style="background:#C9A84C;color:black">Warm Gold</code>
</td>
</tr>
<tr>
<td align="center">🧱 <b>Heriz</b></td>
<td>
<code style="background:#9B3A2A;color:white">Brick Red</code>
<code style="background:#1F2D5C;color:white">Deep Indigo</code>
<code style="background:#EDE8D5;color:black">Cream</code>
<code style="background:#C9A020;color:black">Ochre</code>
</td>
</tr>
<tr>
<td align="center">💜 <b>Kashan</b></td>
<td>
<code style="background:#5C0A2E;color:white">Royal Burgundy</code>
<code style="background:#14264A;color:white">Deep Blue</code>
<code style="background:#1A5C35;color:white">Emerald</code>
<code style="background:#D4AF57;color:black">Pale Gold</code>
</td>
</tr>
<tr>
<td align="center">🟤 <b>Tabriz</b></td>
<td>
<code style="background:#8B6914;color:white">Warm Camel</code>
<code style="background:#6B1515;color:white">Deep Red</code>
<code style="background:#F0EAD6;color:black">Ivory</code>
<code style="background:#C9A030;color:black">Gold</code>
</td>
</tr>
</table>

---

## 🤖 AI Integration

The app connects to [OpenRouter](https://openrouter.ai) — a unified API for many LLMs including Claude, GPT-4, Gemini, and open-source models.

**How to use:**
1. Get a key at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Enter it in the **AI tab** inside the app
3. Type a change request — the AI patches only what you describe

**The AI understands things like:**
- "make the border pattern more geometric"
- "reduce leaf density, keep the medallion"
- "make it look more worn / more variation"
- "increase flower complexity, bigger rosettes"
- "remove the vines, keep everything else"
- "make the border 20% thinner"

The key is **never stored** — it's sent per-request to OpenRouter.

---

## 📐 Export Formats

| Format | Use case |
|--------|----------|
| **PNG** | Preview / share / print |
| **SVG** | Vector chart — scalable, editable in Illustrator / Figma |
| **CSV** | Raw knot grid (`row,col = color_index`) — for spreadsheets or custom tools |
| **JSON** | Full project file — reopen, edit, or feed back to AI |

---

<div align="center">

_"A rug is a poem you can walk on."_

**Built with Next.js · Deployed on Vercel · Powered by procedural geometry + optional AI**

🧶 ✦ 🌿 ✦ 🌸 ✦ 🧶

</div>
