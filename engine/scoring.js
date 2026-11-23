// Points: base points from guessing, multiplier from drawing, round score.

/**
 * The multiplier curve: piecewise linear in log10(multiplier) through these
 * anchors of [accuracy, multiplier]. Below the first anchor it is 1x, above
 * the last it is the last value. Tuned with tools/tune-curve.mjs.
 */
export const DEFAULT_CURVE = Object.freeze({
  anchors: Object.freeze([
    Object.freeze([0.55, 1]),
    Object.freeze([0.7, 10]),
    Object.freeze([0.85, 100]),
    Object.freeze([0.95, 1000]),
  ]),
});

export const DEFAULT_RULES = Object.freeze({
  /** Base points by the clue the place was guessed on (index 0 = clue 1). */
  basePoints: Object.freeze([5, 4, 3, 2, 1]),
  /** Points taken off the base for each wrong guess (the base never drops below 1 once solved). */
  wrongGuessPenalty: 1,
  curve: DEFAULT_CURVE,
});

/**
 * The outline gap at which accuracy reaches 0. The gap is the average distance
 * between the drawn line and the real border (both ways), as a share of the
 * place's equal-area radius: a careful sketch is around 0.06–0.10, a plain
 * circle on a compact country 0.10–0.19, a wrong shape 0.3 or more.
 */
export const ZERO_GAP = 0.36;

/**
 * Accuracy from the outline gap (see judge.outlineGap): 100 % for a perfect
 * outline, falling linearly to 0 % at ZERO_GAP. The same scale for every place,
 * so a place that really is close to a square (Egypt, Colorado) rewards a good
 * square. Rounded to 0.1 %.
 */
export function accuracyFromGap(gap, zeroGap = ZERO_GAP) {
  if (!(gap >= 0) || !Number.isFinite(gap)) return 0;
  const a = 1 - gap / zeroGap;
  const clamped = a < 0 ? 0 : a > 1 ? 1 : a;
  return Math.round(clamped * 1000) / 1000;
}

/** Round to two significant figures: 1, 1.4, 12, 130, 1000. */
export function stampValue(m) {
  if (!(m > 0)) return 1;
  if (m < 10) return Math.round(m * 10) / 10;
  if (m < 100) return Math.round(m);
  if (m < 1000) return Math.round(m / 10) * 10;
  return Math.round(m / 100) * 100;
}

/** Multiplier for an accuracy in [0, 1]. */
export function multiplierFor(accuracy, curve = DEFAULT_CURVE) {
  const pts = curve.anchors;
  if (!(accuracy > pts[0][0])) return stampValue(pts[0][1]);
  const last = pts[pts.length - 1];
  if (accuracy >= last[0]) return stampValue(last[1]);
  for (let i = 1; i < pts.length; i++) {
    const [x1, m1] = pts[i];
    if (accuracy <= x1) {
      const [x0, m0] = pts[i - 1];
      const t = (accuracy - x0) / (x1 - x0);
      const lg = Math.log10(m0) + t * (Math.log10(m1) - Math.log10(m0));
      return stampValue(10 ** lg);
    }
  }
  return stampValue(last[1]);
}

/** Validate a curve: ≥2 anchors, accuracies strictly rising in (0,1], multipliers rising from 1. */
export function validateCurve(curve) {
  const a = curve?.anchors;
  if (!Array.isArray(a) || a.length < 2) return 'curve needs at least two anchors';
  if (a[0][1] !== 1) return 'first anchor multiplier must be 1';
  for (let i = 0; i < a.length; i++) {
    const [x, m] = a[i];
    if (!(x >= 0 && x <= 1)) return `anchor ${i} accuracy out of range`;
    if (!(m >= 1)) return `anchor ${i} multiplier below 1`;
    if (i && !(x > a[i - 1][0] && m > a[i - 1][1])) return `anchor ${i} not increasing`;
  }
  return null;
}

/**
 * Base points for a solved turn.
 * @param {number|null} solvedAt  clue index (0-based) of the correct guess, or null
 * @param {number} wrong          wrong guesses made before solving
 */
export function basePointsFor(solvedAt, wrong, rules = DEFAULT_RULES) {
  if (solvedAt === null || solvedAt === undefined) return 0;
  const base = rules.basePoints[solvedAt] ?? 0;
  if (!base) return 0;
  return Math.max(1, base - wrong * rules.wrongGuessPenalty);
}

export function roundScore(base, multiplier) {
  return Math.round(base * multiplier);
}
