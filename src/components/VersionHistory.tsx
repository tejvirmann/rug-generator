"use client";

import type { VersionEntry } from "@/lib/types";

interface Props {
  history: VersionEntry[];
  currentVersion: number;
  onRevert: (version: number) => void;
}

export default function VersionHistory({ history, currentVersion, onRevert }: Props) {
  if (history.length === 0) {
    return (
      <div className="text-amber-600 text-xs italic text-center py-2">
        No history yet — generate a rug to begin.
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto">
      {[...history].reverse().map((entry) => (
        <div
          key={entry.version}
          className={`rounded-lg px-3 py-2 text-xs border ${
            entry.version === currentVersion
              ? "border-amber-500 bg-amber-900/40 text-amber-200"
              : "border-amber-900/30 bg-black/20 text-amber-500"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-bold">v{entry.version}</span>
            <span className="text-amber-600 text-[10px]">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            {entry.version !== currentVersion && (
              <button
                onClick={() => onRevert(entry.version)}
                className="text-amber-400 hover:text-amber-200 underline text-[10px]"
              >
                revert
              </button>
            )}
          </div>
          <div className="mt-0.5 text-amber-400/80 italic">{entry.note}</div>
          <div className="text-amber-700 font-mono text-[10px]">seed: {entry.seed.slice(0, 8)}…</div>
        </div>
      ))}
    </div>
  );
}
