// Points: base points from guessing, multiplier from drawing, round score.

/**
 * The multiplier is the accuracy itself: 70 % accuracy = 70x, a perfect
 * drawing = 100x, never below 1x. (A play-tester asked for exactly this:
 * the number on the plate should be the number you earned.)
 */
export const DEFAULT_CURVE = Object.freeze({ linear: true, max: 100 });

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

/** Multiplier for an accuracy in [0, 1]: accuracy × max, rounded, at least 1. */
export function multiplierFor(accuracy, curve = DEFAULT_CURVE) {
  const a = accuracy > 0 ? (accuracy > 1 ? 1 : accuracy) : 0;
  return Math.max(1, Math.round(a * curve.max));
}

/** Validate a curve: linear with a whole-number maximum of at least 1. */
export function validateCurve(curve) {
  if (!curve || curve.linear !== true) return 'curve must be linear';
  if (!(Number.isInteger(curve.max) && curve.max >= 1)) return 'curve max must be a whole number ≥ 1';
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
