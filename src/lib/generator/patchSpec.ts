import type { RugSpec, PatchOp, LockEntry } from "@/lib/types";

// Safely get a nested value by dot-path
function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// Safely set a nested value by dot-path, returning a new object
function setPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const keys = path.split(".");
  const result = { ...obj };
  let cur: Record<string, unknown> = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = { ...(cur[k] as Record<string, unknown>) };
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
  return result;
}

export function applyPatches(spec: RugSpec, ops: PatchOp[]): RugSpec {
  let s = spec as unknown as Record<string, unknown>;

  for (const op of ops) {
    if (op.op === "set") {
      s = setPath(s, op.path, op.value);
    } else if (op.op === "increment") {
      const current = getPath(s, op.path);
      if (typeof current === "number") {
        s = setPath(s, op.path, current + op.delta);
      }
    } else if (op.op === "addLock") {
      const locks = [...((s.locks as LockEntry[]) || []), op.lock];
      s = { ...s, locks };
    } else if (op.op === "removeLock") {
      const locks = ((s.locks as LockEntry[]) || []).filter(
        (l) => !(l.type === op.lockType && l.regionType === op.regionType)
      );
      s = { ...s, locks };
    } else if (op.op === "reseed") {
      const newSeed = Math.random().toString(36).slice(2);
      if (op.scope === "global") {
        s = setPath(s, "seed", newSeed);
      }
      // Scoped reseeds use the same global seed mechanism for now;
      // the engine uses scopedRNG(seed, scope) so changing the global seed
      // is sufficient for full-spec regeneration.
    }
  }

  return s as unknown as RugSpec;
}
