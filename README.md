ADD:

Todo:
Scrap rug [data](https://rugsource.com/rugs/red-floral-tabriz-turkish-area-rug-9x13?srsltid=AfmBOoo09mJg-s_myz64TxI_tbqXCXRmnVLeQ2tzhtFFmONN4dkjbhnH), and have it generate better rugs

<div align="center">

```
+-------------------------------------------------------------------------------+
|#############################################################################|
|# * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - #|
|# . +---------------------------------------------------------------------+ . #|
|# . |  + - * - + - * - + - * - + - * - + - * - + - * - + - * - + - * - +  | . #|
|# . |  * . + . * . + . * . + . * . + . * . + . * . + . * . + . * . + . *  | . #|
|# . |                        ANTIQUE  RUG  GENERATOR                       | . #|
|# . |  * . + . * . + . * . + . * . + . * . + . * . + . * . + . * . + . *  | . #|
|# . |  + - * - + - * - + - * - + - * - + - * - + - * - + - * - + - * - +  | . #|
|# . +---------------------------------------------------------------------+ . #|
|# * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - * - #|
|#############################################################################|
+-------------------------------------------------------------------------------+
              Antique Sarouk  .  Deep Crimson field  .  200 x 300 knots
```

**Procedurally generated antique rug knot-grid patterns.**
_Every cell is a knot. Every design is deterministic, symmetrical, and exportable._

---

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/rug-generator)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

</div>

---

## Four Styles. Infinite Patterns.

```
+---------------------+   +---------------------+
|#####################|   |░░░░░░░░░░░░░░░░░░░░░|
|# * - * - * - * - v #|   |░ # + # + # + # + ^ ░|
|# . +-----------+ . #|   |░ . +-----------+ . ░|
|# . | * + * + * | . #|   |░ . | # ^ # ^ # | . ░|
|# . | o o @ o o | . #|   |░ . | ^ # @ # ^ | . ░|
|# . | * + * + * | . #|   |░ . | # ^ # ^ # | . ░|
|# . +-----------+ . #|   |░ . +-----------+ . ░|
|# * - * - * - * - v #|   |░ # + # + # + # + ^ ░|
|#####################|   |░░░░░░░░░░░░░░░░░░░░░|
+---------------------+   +---------------------+
  ANTIQUE SAROUK              HERIZ GEOMETRIC
  Deep Crimson . Navy         Brick Red . Indigo
  Dense floral vines          Bold, angular forms

+---------------------+   +---------------------+
|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|   |▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒|
|▓ * . * . * . * . * ▓|   |▒ + - * - + - * - + ▒|
|▓ . +-----------+ . ▓|   |▒ . +-----------+ . ▒|
|▓ . | * o * o * | . ▓|   |▒ . | + o + o + | . ▒|
|▓ . | o @ @ @ o | . ▓|   |▒ . | o + @ + o | . ▒|
|▓ . | * o * o * | . ▓|   |▒ . | + o + o + | . ▒|
|▓ . +-----------+ . ▓|   |▒ . +-----------+ . ▒|
|▓ * . * . * . * . * ▓|   |▒ + - * - + - * - + ▒|
|▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|   |▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒|
+---------------------+   +---------------------+
  KASHAN FLORAL               TABRIZ CLASSIC
  Royal Burgundy . Gold       Warm Camel . Deep Red
  Refined, intricate          Elegant, balanced
```

---

## The Knot Grid

Every pixel is one physical knot. The generator outputs a 2D grid of color indices — the exact chart a weaver follows.

```
  +------ RAW KNOT CHART (CSV export, 13x7 sample) ------+
  |  Col:  0  1  2  3  4  5  6  7  8  9 10 11 12         |
  |  Row 0: 1  1  1  1  1  1  1  1  1  1  1  1  1        |  <- border (Navy)
  |  Row 1: 1  2  2  2  2  2  2  2  2  2  2  2  1        |  <- guard (Ivory)
  |  Row 2: 1  2  0  0  3  0  0  0  3  0  0  0  1        |  <- field + vines
  |  Row 3: 1  2  0  3  5  5  5  3  0  3  5  5  1        |  <- flowers (Rose)
  |  Row 4: 1  2  0  3  5  4  5  3  1  1  1  1  1        |  <- gold accent
  |  Row 5: 1  2  0  0  5  5  5  1  1  4  1  1  1        |  <- medallion
  |  Row 6: 1  2  0  0  0  3  0  1  4  4  4  1  1        |  <- medallion ctr
  |                                                        |
  |  0=Crimson  1=Navy  2=Ivory  3=Green  4=Gold  5=Rose  |
  +--------------------------------------------------------+
            ^ each number = one knot = one color
```

---

## Symmetry: Generate 1/4, Reflect Everything

```
  seed "a7f2c9" + style "sarouk"

  +-----------+-----------+     +-------------------------+
  |           |           |     | * - * - * - * - * - * - |  <- border
  |  QUADRANT | mirror -> |     | - +---------+  * - * -  |
  |  generated|           |  -> | * | * o * o |  o * o *  |  <- field
  |  (top-left|           |     | - | o @ o @ |  @ o @ o  |  <- medallion
  |           |           |     | * | * o * o |  o * o *  |
  +-----------+-----------+     | - +---------+  * - * -  |
  |  mirror v | mirror v->|     | * - * - * - * - * - * - |  <- border
  |           |           |     +-------------------------+
  +-----------+-----------+
   1/4 generated              Full 200x300 knot grid
```

---

## The Iteration Loop

Every design is a `.rug.json` spec, not just pixels. Change one parameter. Everything else stays identical.

```
  +---- SPEC (.rug.json) ------------------------------------------------+
  |  {                                                                     |
  |    "seed":     "a7f2c9",   <- reseed this -> new random layout        |
  |    "style":    "sarouk",   <- change this -> new style grammar        |
  |    "layout": {                                                         |
  |      "field": {                                                        |
  |        "vineDensity":  0.65,  <- change this -> more/fewer vines      |
  |        "leafRoundness": 0.7   <- change this -> pointier leaves       |
  |      },                                                                |
  |      "medallion": {                                                    |
  |        "sizeX": 0.38          <- change this -> bigger medallion      |
  |      }                                                                 |
  |    },                                                                  |
  |    "locks":   ["medallion"],  <- AI won't touch locked regions        |
  |    "history": [v1, v2, v3]   <- full revert chain                    |
  |  }                                                                     |
  +------------------------------------------------------------------------+
       |                                  |
       v                                  v
  +------------+          +--------------------------------------+
  | knot grid  |          |  You: "make the border simpler"      |
  | 200x300    |          |  AI -> { op: "set",                  |
  | PNG / SVG  |          |          path: "border.motif",       |
  | CSV / JSON |          |          value: "geometric" }        |
  +------------+          |  -> re-render border only            |
                          +--------------------------------------+
```

---

## Color Palettes

```
  ANTIQUE SAROUK --------------------------------------------------------
  [#7B1B1B]  Deep Crimson    field background, dominant warm red
  [#1A2644]  Midnight Navy   border, medallion base
  [#F2ECD8]  Antique Ivory   guard stripes, rosette highlights
  [#2D5016]  Forest Green    vine scrolls, leaves
  [#C9A84C]  Warm Gold       flower accents, medallion ring
  [#C47B7B]  Dusty Rose      rosette petals
  [#2B4F8C]  Cobalt Blue     accent flowers
  [#B5541A]  Terracotta      palmettes

  HERIZ GEOMETRIC --------------------------------------------------------
  [#9B3A2A]  Brick Red       field
  [#1F2D5C]  Deep Indigo     border, geometric outlines
  [#EDE8D5]  Cream           fill, highlights
  [#C4611A]  Burnt Orange    accent shapes
  [#C9A020]  Ochre           medallion accents

  KASHAN FLORAL ----------------------------------------------------------
  [#5C0A2E]  Royal Burgundy  field (deepest red)
  [#14264A]  Deep Blue       border, medallion
  [#1A5C35]  Emerald         vine, leaves
  [#D4AF57]  Pale Gold       medallion highlights
  [#D4899A]  Blush Pink      petals

  TABRIZ CLASSIC ---------------------------------------------------------
  [#8B6914]  Warm Camel      field (warm golden ground)
  [#6B1515]  Deep Red        border
  [#F0EAD6]  Ivory           fill, rosette centers
  [#C9A030]  Gold            medallion, accents
```

---

## AI Mode — Patch Ops, Not Pixels

```
  +---- Conversation ---------------------------------------------------+
  |                                                                      |
  |  You -> "I love everything but the leaves feel too spiky            |
  |          and the border is too busy. Keep the medallion."           |
  |                                                                      |
  |  AI  -> {                                                            |
  |           "ops": [                                                   |
  |             { "op": "set",                                           |
  |               "path": "layout.field.leafRoundness",                 |
  |               "value": 0.88 },                                      |
  |             { "op": "set",                                           |
  |               "path": "layout.border.tileRepeatX",                  |
  |               "value": 5 },                                         |
  |             { "op": "addLock",                                       |
  |               "lock": { "type": "region",                           |
  |                         "regionType": "medallion" } }               |
  |           ],                                                         |
  |           "explanation": "Rounded leaves, simpler border,           |
  |                           medallion locked."                        |
  |         }                                                            |
  |                                                                      |
  |  App -> applies ops -> re-renders -> new version saved              |
  +----------------------------------------------------------------------+

  Powered by OpenRouter  .  Works with Claude, GPT-4, Gemini, and more
  API key entered in-app, never stored server-side
```

---

## Export Formats

```
  +-------------------------------------------------------------------+
  |  PNG  --- preview render with knot texture shading               |
  |           print-ready at 3x resolution                           |
  |                                                                   |
  |  SVG  --- run-length encoded vector chart                        |
  |           scales to any size, editable in Illustrator / Figma    |
  |                                                                   |
  |  CSV  --- raw knot grid: each cell = palette color index         |
  |           0,0,1,1,2,0,0,1,1,2,0,0,...                            |
  |           import into Excel or custom weaving software            |
  |                                                                   |
  |  JSON --- full .rug.json project file                            |
  |           { seed, style, palette, layout, locks, history }        |
  |           reload anytime, feed back to AI for iteration           |
  +-------------------------------------------------------------------+
```

---

## Getting Started

```bash
git clone https://github.com/your-repo/rug-generator
cd rug-generator
npm install
npm run dev
# -> http://localhost:3000
```

**Deploy to Vercel:**
```bash
npx vercel
```

No environment variables needed for the generator. For AI mode, get a key at [openrouter.ai/keys](https://openrouter.ai/keys) and enter it in the app's AI tab — never stored server-side.

---

## Project Structure

```
src/
+-- app/
|   +-- api/generate/route.ts   <- procedural knot grid generation
|   +-- api/ai/route.ts         <- OpenRouter proxy (patch ops only)
|   +-- page.tsx                <- full app UI
+-- components/
|   +-- RugCanvas.tsx           <- pan / pinch / zoom canvas renderer
|   +-- ControlPanel.tsx        <- sliders, toggles, reset to defaults
|   +-- AIPanel.tsx             <- chat + quick-edit prompt buttons
|   +-- PaletteDisplay.tsx      <- color legend + live color picker
|   +-- ExportPanel.tsx         <- PNG / SVG / CSV / JSON
|   +-- VersionHistory.tsx      <- snapshot log + revert
+-- lib/
    +-- types.ts                <- RugSpec — the canonical design schema
    +-- generator/
        +-- engine.ts           <- quadrant gen, symmetry, motifs, abrash
        +-- seededRandom.ts     <- deterministic mulberry32 PRNG
        +-- patchSpec.ts        <- apply AI patch ops to spec
        +-- styles/             <- sarouk / heriz / kashan / tabriz
```

---

<div align="center">

```
  .  *  .  *  .  *  .  *  .  *  .  *  .  *  .  *  .  *  .  *  .
  *                                                             *
  .    [rug]  every knot a decision, every seed a new world    .
  *                                                             *
  .  *  .  *  .  *  .  *  .  *  .  *  .  *  .  *  .  *  .  *  .
```

_"A rug is a poem you can walk on."_

**Next.js · TypeScript · Tailwind · Vercel · OpenRouter**

</div>
