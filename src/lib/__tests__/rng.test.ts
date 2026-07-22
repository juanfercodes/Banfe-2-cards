import { describe, expect, it } from 'vitest';
import { createRng, seedFromTimestamp } from '@/lib/rng';

describe('createRng', () => {
  it('returns values in [0, 1)', () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic — same seed produces same sequence', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('different seeds produce different sequences', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it('distribution sanity — mean ≈ 0.5 over 10k draws', () => {
    const rng = createRng(99999);
    const n = 10000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += rng();
    }
    const mean = sum / n;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });
});

describe('seedFromTimestamp', () => {
  it('returns a number', () => {
    expect(typeof seedFromTimestamp(1700000000000)).toBe('number');
  });

  it('different timestamps produce different seeds', () => {
    expect(seedFromTimestamp(1000)).not.toBe(seedFromTimestamp(2000));
  });

  it('uses Date.now() when no argument given', () => {
    const s = seedFromTimestamp();
    expect(typeof s).toBe('number');
    expect(Number.isFinite(s)).toBe(true);
  });
});
