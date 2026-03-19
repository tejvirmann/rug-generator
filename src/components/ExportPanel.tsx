"use client";

import type { RenderResult } from "@/lib/types";

interface Props {
  result: RenderResult;
}

export default function ExportPanel({ result }: Props) {
  const { grid, palette, width, height, spec } = result;

  function exportJSON() {
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    download(blob, `${spec.name.replace(/\s+/g, "-").toLowerCase()}-v${spec.version}.rug.json`);
  }

  function exportCSV() {
    const rows = grid.map((row) => row.join(",")).join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    download(blob, `${spec.name.replace(/\s+/g, "-").toLowerCase()}-knot-chart.csv`);
  }

  function exportPNG() {
    const canvas = document.createElement("canvas");
    const cellSize = 3;
    canvas.width = width * cellSize;
    canvas.height = height * cellSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const colorIdx = Math.max(0, Math.min(palette.length - 1, grid[row][col]));
        ctx.fillStyle = palette[colorIdx]?.hex ?? "#888";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }

    canvas.toBlob((blob) => {
      if (blob) download(blob, `${spec.name.replace(/\s+/g, "-").toLowerCase()}-v${spec.version}.png`);
    });
  }

  function exportSVG() {
    const cellSize = 2;
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * cellSize}" height="${height * cellSize}">\n`;
    svgContent += `<title>${spec.name}</title>\n`;

    // Palette defs
    svgContent += `<defs>\n`;
    palette.forEach((c) => {
      svgContent += `  <rect id="${c.id}" width="${cellSize}" height="${cellSize}" fill="${c.hex}"/>\n`;
    });
    svgContent += `</defs>\n`;

    // Render as run-length encoded rectangles for smaller file size
    for (let row = 0; row < height; row++) {
      let runStart = 0;
      let runColor = grid[row][0];
      for (let col = 1; col <= width; col++) {
        const cur = col < width ? grid[row][col] : -1;
        if (cur !== runColor) {
          const colorIdx = Math.max(0, Math.min(palette.length - 1, runColor));
          const fill = palette[colorIdx]?.hex ?? "#888";
          svgContent += `<rect x="${runStart * cellSize}" y="${row * cellSize}" width="${(col - runStart) * cellSize}" height="${cellSize}" fill="${fill}"/>\n`;
          runStart = col;
          runColor = cur;
        }
      }
    }

    svgContent += `</svg>`;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    download(blob, `${spec.name.replace(/\s+/g, "-").toLowerCase()}-v${spec.version}.svg`);
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalKnots = width * height;

  return (
    <div className="space-y-3">
      <h3 className="text-amber-300 font-serif text-sm font-semibold uppercase tracking-widest">
        Export
      </h3>
      <div className="text-amber-500 text-xs">
        {width} × {height} knots &bull; {totalKnots.toLocaleString()} total
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ExportButton onClick={exportPNG} label="PNG" icon="🖼" desc="Preview image" />
        <ExportButton onClick={exportSVG} label="SVG" icon="✏️" desc="Vector chart" />
        <ExportButton onClick={exportCSV} label="CSV" icon="📊" desc="Knot grid data" />
        <ExportButton onClick={exportJSON} label="JSON" icon="💾" desc="Project file" />
      </div>
    </div>
  );
}

function ExportButton({ onClick, label, icon, desc }: { onClick: () => void; label: string; icon: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 bg-amber-900/30 hover:bg-amber-800/50 border border-amber-800/40 hover:border-amber-600 rounded-lg py-3 px-2 transition-all text-center group"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-amber-200 font-bold text-sm group-hover:text-white">{label}</span>
      <span className="text-amber-600 text-[10px]">{desc}</span>
    </button>
  );
}
