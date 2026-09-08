/**
 * Calculate the average of an array of ratings.
 *
 * Accepts either:
 *  - An array of numbers (e.g. [5, 4, 3])
 *  - An array of objects with a numeric `score` property (e.g. the Sanity
 *    `user.ratings` array: [{ score: 5, review: "..." }])
 *
 * Returns the average rounded to one decimal place, or `null` when there are
 * no valid ratings.
 */
interface ScoredRating {
  score?: number;
  review?: string;
  [key: string]: unknown;
}

export default function calculateAverageRating(
  ratings: Array<ScoredRating | number> | number[]
): number | null {
  if (!Array.isArray(ratings) || ratings.length === 0) return null;

  const scores = ratings
    .map(rating => {
      if (typeof rating === 'number') return rating;
      if (rating && typeof rating === 'object' && 'score' in rating)
        return Number((rating as ScoredRating).score);
      return NaN;
    })
    .filter(score => Number.isFinite(score) && score >= 1 && score <= 5);

  if (scores.length === 0) return null;

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average * 10) / 10;
}
