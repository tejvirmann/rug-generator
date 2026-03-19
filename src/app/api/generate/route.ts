import { NextRequest, NextResponse } from "next/server";
import { generateRug, buildDefaultSpec } from "@/lib/generator/engine";
import type { RugSpec } from "@/lib/types";
import { STYLE_PRESETS } from "@/lib/generator/styles";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spec: specOverrides } = body as { spec?: Partial<RugSpec> };

    // Build spec: start from style preset if provided, then apply overrides
    const styleKey = specOverrides?.style ?? "sarouk";
    const stylePreset = STYLE_PRESETS[styleKey] ?? STYLE_PRESETS.sarouk;
    const spec = buildDefaultSpec({ ...stylePreset, ...specOverrides });

    const result = generateRug(spec);

    return NextResponse.json({
      ok: true,
      grid: result.grid,
      palette: result.palette,
      width: result.width,
      height: result.height,
      spec: result.spec,
    });
  } catch (err) {
    console.error("[generate]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
