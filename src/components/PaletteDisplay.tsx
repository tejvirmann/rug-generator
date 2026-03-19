"use client";

import { useRef } from "react";
import type { ColorEntry } from "@/lib/types";

interface Props {
  palette: ColorEntry[];
  totalKnots: number;
  onColorChange?: (colorId: string, newHex: string) => void;
}

export default function PaletteDisplay({ palette, totalKnots, onColorChange }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="text-amber-300 font-serif text-sm font-semibold uppercase tracking-widest">
        Colors
      </h3>
      <p className="text-amber-700 text-[10px] italic">Click any swatch to change its color.</p>
      <div className="space-y-1.5">
        {palette.map((color) => {
          const pct =
            totalKnots > 0 && color.knotCount
              ? ((color.knotCount / totalKnots) * 100).toFixed(1)
              : "—";
          return (
            <ColorRow
              key={color.id}
              color={color}
              pct={pct}
              onColorChange={onColorChange}
            />
          );
        })}
      </div>
    </div>
  );
}

function ColorRow({
  color,
  pct,
  onColorChange,
}: {
  color: ColorEntry;
  pct: string;
  onColorChange?: (id: string, hex: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2 text-xs group">
      {/* Swatch — clicking opens the native color picker */}
      <button
        title="Click to change color"
        onClick={() => inputRef.current?.click()}
        className="w-6 h-6 rounded-sm border-2 border-white/10 hover:border-amber-400 flex-shrink-0 transition-all relative overflow-hidden shadow-sm"
        style={{ backgroundColor: color.hex }}
      >
        {/* Pencil icon on hover */}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-[8px] text-white">
          ✏
        </span>
      </button>

      {/* Hidden native color input */}
      <input
        ref={inputRef}
        type="color"
        value={color.hex}
        onChange={(e) => onColorChange?.(color.id, e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />

      <div className="flex-1 min-w-0">
        <div className="text-amber-100 truncate font-medium leading-tight">{color.name}</div>
        <div className="text-amber-500/70 font-mono text-[10px]">{color.hex}</div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-amber-400 tabular-nums font-mono">{pct}%</div>
        {color.knotCount !== undefined && (
          <div className="text-amber-700 text-[10px] tabular-nums">
            {color.knotCount.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
