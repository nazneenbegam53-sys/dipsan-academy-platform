// Grades one attempt against its exam's questions.
// `answers` shape: { [questionId]: { selected, markedForReview, visited } }
function gradeAttempt(questions, answers) {
  let score = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  for (const q of questions) {
    const marks = q.marks ?? 4;
    const negative = q.negativeMarks ?? 1;
    totalMarks += marks;

    const entry = answers[q._id.toString()];
    const selected = entry ? entry.selected : undefined;

    if (selected === undefined || selected === null) {
      unattemptedCount++;
      continue;
    }

    let isCorrect = false;
    if (q.type === "multi-correct") {
      const correctSet = new Set(q.correctOptionIndexes || []);
      const selectedSet = new Set(Array.isArray(selected) ? selected : [selected]);
      isCorrect =
        correctSet.size === selectedSet.size &&
        [...correctSet].every((i) => selectedSet.has(i));
    } else if (q.type === "numerical") {
      const tolerance = q.numericTolerance || 0;
      isCorrect = Math.abs(Number(selected) - Number(q.correctNumericValue)) <= tolerance;
    } else {
      // mcq, true-false, assertion-reason all use a single correctOptionIndex
      isCorrect = Number(selected) === q.correctOptionIndex;
    }

    if (isCorrect) {
      score += marks;
      correctCount++;
    } else {
      score -= negative;
      wrongCount++;
    }
  }

  return { score, totalMarks, correctCount, wrongCount, unattemptedCount };
}

module.exports = { gradeAttempt };
