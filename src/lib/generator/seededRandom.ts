// Tiny seeded PRNG (mulberry32) — no external dependency needed for this piece.
// Returns a function that produces floats in [0, 1).

export function createRNG(seed: string): () => number {
  // Hash the string seed into a uint32
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;

  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function scopedRNG(globalSeed: string, scope: string): () => number {
  return createRNG(`${globalSeed}::${scope}`);
}
