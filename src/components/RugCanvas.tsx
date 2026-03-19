"use client";

import { useEffect, useRef, useReducer } from "react";
import type { RenderResult } from "@/lib/types";

interface Props {
  result: RenderResult | null;
  loading: boolean;
  cellSize?: number;
}

interface View {
  zoom: number;
  panX: number;
  panY: number;
}

// Single source of truth for view lives in a ref.
// useReducer is only used to trigger re-renders when the ref changes.
// This eliminates all stale-closure issues in event handlers.

export default function RugCanvas({ result, loading, cellSize = 2 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>({ zoom: 1, panX: 0, panY: 0 });
  const isDraggingRef = useRef(false);
  const [renderTick, forceUpdate] = useReducer((n: number) => n + 1, 0);

  function commitView(v: View) {
    viewRef.current = v;
    forceUpdate();
  }

  // ── Draw canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { grid, palette, width, height } = result;
    canvas.width = width * cellSize;
    canvas.height = height * cellSize;

    const rgbs = palette.map((c) => hexToRgb(c.hex));
    const imageData = ctx.createImageData(width * cellSize, height * cellSize);
    const data = imageData.data;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const colorIdx = Math.max(0, Math.min(palette.length - 1, grid[row][col]));
        const [r, g, b] = rgbs[colorIdx] ?? [180, 60, 60];
        for (let dy = 0; dy < cellSize; dy++) {
          for (let dx = 0; dx < cellSize; dx++) {
            const px = ((row * cellSize + dy) * width * cellSize + (col * cellSize + dx)) * 4;
            const f = knotShade(dx, dy, cellSize);
            data[px]     = Math.min(255, r * f);
            data[px + 1] = Math.min(255, g * f);
            data[px + 2] = Math.min(255, b * f);
            data[px + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [result, cellSize]);

  // Fit rug to container whenever result or cellSize changes
  useEffect(() => {
    if (!result || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const rw = result.width * cellSize;
    const rh = result.height * cellSize;
    const z = Math.min((cw * 0.9) / rw, (ch * 0.9) / rh, 1.5);
    commitView({ zoom: z, panX: (cw - rw * z) / 2, panY: (ch - rh * z) / 2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, cellSize]);

  // ── All pointer/touch/wheel events via native listeners ──────────────────
  // This is the critical part: native listeners let us set { passive: false }
  // so e.preventDefault() actually works for touch and wheel.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── Shared helpers ──────────────────────────────────────────────────────
    function getRect() { return el!.getBoundingClientRect(); }

    function applyZoom(cx: number, cy: number, factor: number) {
      const v = viewRef.current;
      const newZoom = clamp(v.zoom * factor, 0.05, 16);
      const s = newZoom / v.zoom;
      commitView({
        zoom: newZoom,
        panX: cx - (cx - v.panX) * s,
        panY: cy - (cy - v.panY) * s,
      });
    }

    // ── Wheel ───────────────────────────────────────────────────────────────
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = getRect();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      applyZoom(e.clientX - rect.left, e.clientY - rect.top, factor);
    }

    // ── Mouse ───────────────────────────────────────────────────────────────
    let mouseDrag: { startX: number; startY: number; startPanX: number; startPanY: number } | null = null;

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      const rect = getRect();
      const v = viewRef.current;
      mouseDrag = { startX: e.clientX - rect.left, startY: e.clientY - rect.top, startPanX: v.panX, startPanY: v.panY };
      isDraggingRef.current = true;
      forceUpdate(); // update cursor
    }

    function onMouseMove(e: MouseEvent) {
      if (!mouseDrag) return;
      const rect = getRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const v = viewRef.current;
      commitView({
        zoom: v.zoom,
        panX: mouseDrag.startPanX + (x - mouseDrag.startX),
        panY: mouseDrag.startPanY + (y - mouseDrag.startY),
      });
    }

    function onMouseUp() {
      mouseDrag = null;
      isDraggingRef.current = false;
      forceUpdate(); // update cursor
    }

    // ── Touch ───────────────────────────────────────────────────────────────
    let touchDrag: { startX: number; startY: number; startPanX: number; startPanY: number } | null = null;
    let pinch: {
      startDist: number;
      startZoom: number;
      startPanX: number;
      startPanY: number;
      startMidX: number;
      startMidY: number;
    } | null = null;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      const rect = getRect();
      const v = viewRef.current;

      if (e.touches.length >= 2) {
        const t0 = e.touches[0], t1 = e.touches[1];
        const midX = (t0.clientX + t1.clientX) / 2 - rect.left;
        const midY = (t0.clientY + t1.clientY) / 2 - rect.top;
        pinch = {
          startDist: Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY),
          startZoom: v.zoom,
          startPanX: v.panX,
          startPanY: v.panY,
          startMidX: midX,
          startMidY: midY,
        };
        touchDrag = null;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        touchDrag = {
          startX: t.clientX - rect.left,
          startY: t.clientY - rect.top,
          startPanX: v.panX,
          startPanY: v.panY,
        };
        pinch = null;
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const rect = getRect();

      if (e.touches.length >= 2 && pinch) {
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const midX = (t0.clientX + t1.clientX) / 2 - rect.left;
        const midY = (t0.clientY + t1.clientY) / 2 - rect.top;

        const newZoom = clamp(pinch.startZoom * (dist / pinch.startDist), 0.05, 16);
        const s = newZoom / pinch.startZoom;

        // Keep the initial pinch midpoint fixed under fingers, plus track translation
        commitView({
          zoom: newZoom,
          panX: pinch.startMidX - (pinch.startMidX - pinch.startPanX) * s + (midX - pinch.startMidX),
          panY: pinch.startMidY - (pinch.startMidY - pinch.startPanY) * s + (midY - pinch.startMidY),
        });
      } else if (e.touches.length === 1 && touchDrag) {
        const t = e.touches[0];
        const v = viewRef.current;
        commitView({
          zoom: v.zoom,
          panX: touchDrag.startPanX + (t.clientX - rect.left - touchDrag.startX),
          panY: touchDrag.startPanY + (t.clientY - rect.top - touchDrag.startY),
        });
      }
    }

    function onTouchEnd() {
      touchDrag = null;
      pinch = null;
    }

    // Attach — wheel and touch need { passive: false } so preventDefault works
    el.addEventListener("wheel",      onWheel,      { passive: false });
    el.addEventListener("mousedown",  onMouseDown);
    el.addEventListener("mousemove",  onMouseMove);
    el.addEventListener("mouseup",    onMouseUp);
    el.addEventListener("mouseleave", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd);

    return () => {
      el.removeEventListener("wheel",      onWheel);
      el.removeEventListener("mousedown",  onMouseDown);
      el.removeEventListener("mousemove",  onMouseMove);
      el.removeEventListener("mouseup",    onMouseUp);
      el.removeEventListener("mouseleave", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once — all live state accessed via refs

  // ── Zoom button helpers ──────────────────────────────────────────────────
  function zoomAtCenter(factor: number) {
    const el = containerRef.current;
    if (!el) return;
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    const v = viewRef.current;
    const newZoom = clamp(v.zoom * factor, 0.05, 16);
    const s = newZoom / v.zoom;
    commitView({ zoom: newZoom, panX: cx - (cx - v.panX) * s, panY: cy - (cy - v.panY) * s });
  }

  function resetView() {
    if (!result || !containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const rw = result.width * cellSize;
    const rh = result.height * cellSize;
    const z = Math.min((cw * 0.9) / rw, (ch * 0.9) / rh, 1.5);
    commitView({ zoom: z, panX: (cw - rw * z) / 2, panY: (ch - rh * z) / 2 });
  }

  // ── Render ───────────────────────────────────────────────────────────────
  // IMPORTANT: containerRef must ALWAYS be in the DOM so the useEffect that
  // attaches native listeners (wheel, touch) can find it on first mount.
  // Loading / empty states are rendered INSIDE the container, not as separate
  // top-level returns, so the ref is never null when the effect runs.

  const v = viewRef.current;

  return (
    <div className="relative w-full h-full select-none" style={{ userSelect: "none" }}>
      {/* The pan/zoom viewport — always mounted */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        style={{
          cursor: result ? (isDraggingRef.current ? "grabbing" : "grab") : "default",
          touchAction: "none",
        }}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-stone-950/60">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mx-auto mb-4" />
              <p className="text-amber-200 font-serif text-lg">Weaving your rug…</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-amber-700 border-2 border-dashed border-amber-800/40 rounded-lg px-12 py-10">
              <div className="text-6xl mb-4">🧶</div>
              <p className="font-serif text-lg">Generate a rug to begin</p>
            </div>
          </div>
        )}

        {/* The moveable canvas layer */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transformOrigin: "0 0",
            transform: `translate(${v.panX}px,${v.panY}px) scale(${v.zoom})`,
            willChange: "transform",
            // Hide canvas until result exists so the empty div doesn't intercept touches
            visibility: result ? "visible" : "hidden",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              imageRendering: "pixelated",
              display: "block",
              boxShadow: "0 12px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(180,120,60,0.2)",
            }}
          />
        </div>
      </div>

      {/* Floating zoom controls */}
      {result && (
        <>
          <div
            className="absolute bottom-4 right-4 flex flex-col gap-1.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ZoomBtn onClick={() => zoomAtCenter(1.35)} title="Zoom in">+</ZoomBtn>
            <ZoomBtn onClick={() => zoomAtCenter(1 / 1.35)} title="Zoom out">−</ZoomBtn>
            <ZoomBtn onClick={resetView} title="Fit to screen" small>⊡</ZoomBtn>
          </div>

          <div
            className="absolute bottom-4 left-4 text-amber-600 text-[11px] font-mono bg-black/50 px-2 py-0.5 rounded pointer-events-none"
            suppressHydrationWarning
          >
            {(v.zoom * 100).toFixed(0)}%
          </div>
        </>
      )}

      {/* Referenced to satisfy lint — forceUpdate drives re-renders */}
      <span className="hidden">{renderTick}</span>
    </div>
  );
}

function ZoomBtn({
  onClick, title, children, small = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      title={title}
      className={`w-8 h-8 rounded-lg bg-black/70 hover:bg-amber-900/80 border border-amber-900/40 hover:border-amber-600/60 text-amber-300 font-bold flex items-center justify-center transition-colors shadow-lg ${small ? "text-xs" : "text-lg"}`}
    >
      {children}
    </button>
  );
}

function knotShade(dx: number, dy: number, cs: number): number {
  if (cs <= 1) return 1;
  const e = Math.min(dx, dy, cs - 1 - dx, cs - 1 - dy);
  if (e === 0) return 0.72;
  if (e === 1) return 0.91;
  return 1.0;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
