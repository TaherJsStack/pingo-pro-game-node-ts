export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: T[]): T;
  bool(prob?: number): boolean;
  shuffle<T>(arr: T[]): T[];
}

export function createRng(seed?: number): Rng {
  let s = (seed ?? Date.now()) >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min;
  return {
    next,
    int,
    pick: <T>(a: T[]) => a[int(0, a.length - 1)],
    bool: (p = 0.5) => next() < p,
    shuffle: <T>(a: T[]) => {
      const r = [...a];
      for (let i = r.length - 1; i > 0; i--) {
        const j = int(0, i);
        [r[i], r[j]] = [r[j], r[i]];
      }
      return r;
    },
  };
}
