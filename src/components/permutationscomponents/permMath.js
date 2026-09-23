// Local helpers for the Permutations & Combinations page. Anything reusable
// across topics (nPr, nCr, multinomial, factorial, circularPermutations)
// lives in ../../utils/statsMath instead — this file only has helpers that
// are specific to how this page visualises those results.

// Tallies letters in a word (ignoring spaces/punctuation, case-insensitive),
// preserving first-seen order — mirrors the notes' Example 2.3.2 (PARAGRAPH)
// letter-frequency table.
export function letterFrequency(word) {
  const letters = [];
  const counts = new Map();
  for (const ch of (word || "").toUpperCase()) {
    if (!/[A-Z]/.test(ch)) continue;
    if (!counts.has(ch)) {
      counts.set(ch, 0);
      letters.push(ch);
    }
    counts.set(ch, counts.get(ch) + 1);
  }
  return { letters, counts, total: letters.reduce((sum, l) => sum + counts.get(l), 0) };
}

// The "filling the slots" method's slot values: n, n-1, n-2, ... for
// distinct objects, or n repeated r times when repetition is allowed.
export function slotValues(n, r, repetitionAllowed) {
  const slots = [];
  for (let i = 0; i < r; i++) slots.push(repetitionAllowed ? n : Math.max(n - i, 0));
  return slots;
}

// Points evenly spaced around a circle of the given radius, centred at
// (cx, cy), starting at the top and going clockwise — used for the circular
// permutation visual.
export function circlePoints(n, cx, cy, radius) {
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  }
  return points;
}

export const PERSON_LABELS = "ABCDEFGHIJKL";
