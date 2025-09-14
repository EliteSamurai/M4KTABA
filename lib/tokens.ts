'use client';

// Design tokens and vertical rhythm helpers (flag: tokens_rhythm)

export const tokens = {
  spacingBasePx: 8,
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
};

export function rhythm(steps: number): string {
  const n = Number.isFinite(steps) ? steps : 0;
  return `${n * tokens.spacingBasePx}px`;
}
