export default function calculateAverageRating(ratings) {
  if (!ratings || ratings.length === 0) return 0; // Default to 0 if no ratings
  const totalScore = ratings.reduce(
    (sum, rating) => sum + (rating.score || 0),
    0
  );
  return (totalScore / ratings.length).toFixed(1); // Round to 1 decimal
}
