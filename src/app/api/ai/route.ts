import { NextRequest, NextResponse } from "next/server";
import type { RugSpec, AIPatchResponse } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an expert antique rug designer assistant. 
The user has a rug design described as a JSON spec (RugSpec). 
They will describe a change they want. 
You must respond with ONLY a valid JSON object with this exact shape:

{
  "ops": [
    // array of patch operations
  ],
  "explanation": "one sentence describing what changed"
}

Available patch op types:
- { "op": "set", "path": "dot.path.to.field", "value": <any> }
- { "op": "increment", "path": "dot.path.to.number", "delta": <number> }
- { "op": "reseed", "scope": "global" | "field" | "border" | "medallion" }
- { "op": "addLock", "lock": { "type": "region" | "color" | "full", "regionType"?: "field"|"border"|"medallion"|"corner" } }
- { "op": "removeLock", "lockType": "region"|"color"|"full", "regionType"?: string }

Common paths you can set:
- layout.field.vineDensity (0-1)
- layout.field.vineCurvature (0-1)
- layout.field.leafSize (0-1)
- layout.field.leafRoundness (0-1)
- layout.field.flowerSize (0-1)
- layout.field.flowerComplexity (0-1)
- layout.field.vineEnabled (boolean)
- layout.field.leavesEnabled (boolean)
- layout.field.flowersEnabled (boolean)
- layout.field.palmettesEnabled (boolean)
- layout.field.palmetteSize (0-1)
- layout.medallion.enabled (boolean)
- layout.medallion.sizeX (0-1)
- layout.medallion.sizeY (0-1)
- layout.medallion.complexity (0-1)
- layout.medallion.innerRings (0-3)
- layout.border.mainBorderWidth (0.05-0.25)
- layout.border.guardWidth (0.01-0.08)
- layout.border.tileRepeatX (4-16)
- layout.border.motif ("vine-scroll"|"geometric"|"floral-stripe"|"meander")
- variation (0-1, handmade imperfection)
- symmetry ("none"|"mirror-x"|"mirror-y"|"mirror-both"|"rotate-180")
- palette.colors[N].hex (hex color string)
- name (string)

To change only one region, use reseed with that scope. 
To change colors in the palette, use set with path like "palette.colors.0.hex".
ONLY return the JSON object. No markdown, no explanation outside the JSON.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, spec, apiKey } = body as {
      prompt: string;
      spec: RugSpec;
      apiKey: string;
    };

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "No OpenRouter API key provided." }, { status: 400 });
    }

    const messages = [
      {
        role: "user",
        content: `Current rug spec:\n${JSON.stringify(spec, null, 2)}\n\nUser request: ${prompt}`,
      },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://rug-generator.vercel.app",
        "X-Title": "Antique Rug Generator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ ok: false, error: errText }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: AIPatchResponse;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ ok: false, error: "Model returned invalid JSON: " + content }, { status: 502 });
    }

    return NextResponse.json({ ok: true, ...parsed });
  } catch (err) {
    console.error("[ai]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
