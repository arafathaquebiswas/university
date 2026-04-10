/**
 * BRACU Grading Engine
 * Handles all academic calculation logic:
 * - Quiz N-1 rule
 * - Weighted mark calculation
 * - 13-level grade scale
 * - GPA / CGPA
 * - Scholarship eligibility
 * - What-if simulation
 */

// ─── N-1 Rule ────────────────────────────────────────────────────────────────
// Drop the single lowest quiz score; count the rest.
const applyNMinusOne = (scores = []) => {
  if (scores.length === 0) return { kept: [], dropped: null, droppedIndex: -1 };
  if (scores.length === 1) return { kept: scores, dropped: null, droppedIndex: -1 };

  let minVal = Infinity;
  let droppedIndex = 0;
  scores.forEach((s, i) => { if (s < minVal) { minVal = s; droppedIndex = i; } });

  const kept = scores.filter((_, i) => i !== droppedIndex);
  return { kept, dropped: minVal, droppedIndex };
};

// Quiz average as 0–100 % after N-1 drop
const calcQuizAverage = (scores = [], maxPerItem = 10) => {
  if (scores.length === 0) return 0;
  const { kept } = applyNMinusOne(scores);
  if (kept.length === 0) return 0;
  const sum = kept.reduce((a, b) => a + b, 0);
  const max = kept.length * maxPerItem;
  return max > 0 ? (sum / max) * 100 : 0;
};

// ─── Grading Scale ────────────────────────────────────────────────────────────
// Returns { letter, points } for a total mark (0–100)
const getGrade = (totalMarks) => {
  const t = parseFloat(totalMarks) || 0;
  if (t >= 97) return { letter: 'A+', points: 4.0 };
  if (t >= 90) return { letter: 'A',  points: 4.0 };
  if (t >= 85) return { letter: 'A-', points: 3.7 };
  if (t >= 80) return { letter: 'B+', points: 3.3 };
  if (t >= 75) return { letter: 'B',  points: 3.0 };
  if (t >= 70) return { letter: 'B-', points: 2.7 };
  if (t >= 65) return { letter: 'C+', points: 2.3 };
  if (t >= 60) return { letter: 'C',  points: 2.0 };
  if (t >= 57) return { letter: 'C-', points: 1.7 };
  if (t >= 55) return { letter: 'D+', points: 1.3 };
  if (t >= 52) return { letter: 'D',  points: 1.0 };
  if (t >= 50) return { letter: 'D-', points: 0.7 };
  return { letter: 'F', points: 0.0 };
};

// All 13 grade descriptors (for UI tables)
const GRADE_SCALE = [
  { min: 97, max: 100, letter: 'A+', points: 4.0 },
  { min: 90, max: 96.99, letter: 'A',  points: 4.0 },
  { min: 85, max: 89.99, letter: 'A-', points: 3.7 },
  { min: 80, max: 84.99, letter: 'B+', points: 3.3 },
  { min: 75, max: 79.99, letter: 'B',  points: 3.0 },
  { min: 70, max: 74.99, letter: 'B-', points: 2.7 },
  { min: 65, max: 69.99, letter: 'C+', points: 2.3 },
  { min: 60, max: 64.99, letter: 'C',  points: 2.0 },
  { min: 57, max: 59.99, letter: 'C-', points: 1.7 },
  { min: 55, max: 56.99, letter: 'D+', points: 1.3 },
  { min: 52, max: 54.99, letter: 'D',  points: 1.0 },
  { min: 50, max: 51.99, letter: 'D-', points: 0.7 },
  { min: 0,  max: 49.99, letter: 'F',  points: 0.0 },
];

// ─── Total Mark (weighted) ────────────────────────────────────────────────────
const DEFAULT_POLICY = {
  quizWeight:     0.20,
  midtermWeight:  0.30,
  finalWeight:    0.40,
  labWeight:      0.10,
  quizMaxPerItem: 10,
  hasLab:         false,
};

const calcTotalMarks = (quizAvg, midterm, final, lab, policy = {}) => {
  const p = { ...DEFAULT_POLICY, ...policy };
  // If no lab: redistribute lab weight to final
  const effectiveFinal = p.hasLab ? p.finalWeight : p.finalWeight + p.labWeight;
  const effectiveLab   = p.hasLab ? p.labWeight   : 0;

  return (
    (quizAvg  || 0) * p.quizWeight +
    (midterm  || 0) * p.midtermWeight +
    (final    || 0) * effectiveFinal +
    (lab      || 0) * effectiveLab
  );
};

// ─── Full Grade Calculation ───────────────────────────────────────────────────
const calculateGrade = (input = {}, policy = {}) => {
  const p = { ...DEFAULT_POLICY, ...policy };
  const {
    quizScores = [],
    midtermScore = 0,
    finalScore = 0,
    labScore = 0,
  } = input;

  const { kept, dropped, droppedIndex } = applyNMinusOne(quizScores);
  const quizAvg   = calcQuizAverage(quizScores, p.quizMaxPerItem);
  const totalMarks = calcTotalMarks(quizAvg, midtermScore, finalScore, labScore, p);
  const { letter, points } = getGrade(totalMarks);

  return {
    quizDetails: {
      allScores:    quizScores,
      keptScores:   kept,
      droppedScore: dropped,
      droppedIndex,
      average:      parseFloat(quizAvg.toFixed(2)),
    },
    components: {
      quizContribution:     parseFloat((quizAvg  * p.quizWeight).toFixed(2)),
      midtermContribution:  parseFloat(((midtermScore || 0) * p.midtermWeight).toFixed(2)),
      finalContribution:    parseFloat(((finalScore   || 0) * (p.hasLab ? p.finalWeight : p.finalWeight + p.labWeight)).toFixed(2)),
      labContribution:      parseFloat(((labScore     || 0) * (p.hasLab ? p.labWeight : 0)).toFixed(2)),
    },
    totalMarks:   parseFloat(totalMarks.toFixed(2)),
    letterGrade:  letter,
    cgpaPoints:   points,
    policy:       p,
  };
};

// ─── What-If Simulation ───────────────────────────────────────────────────────
// Returns grade for each possible final score increment
const whatIfSimulation = (input = {}, policy = {}, steps = 10) => {
  const results = [];
  for (let finalScore = 0; finalScore <= 100; finalScore += steps) {
    results.push({
      finalScore,
      ...calculateGrade({ ...input, finalScore }, policy),
    });
  }
  return results;
};

// Required final score to achieve a target grade
const requiredFinalForGrade = (input = {}, policy = {}, targetLetter) => {
  const p = { ...DEFAULT_POLICY, ...policy };
  const target = GRADE_SCALE.find(g => g.letter === targetLetter);
  if (!target) return null;

  const quizAvg = calcQuizAverage(input.quizScores || [], p.quizMaxPerItem);
  const effectiveFinal = p.hasLab ? p.finalWeight : p.finalWeight + p.labWeight;

  // required = (targetMin - quiz - mid - lab) / effectiveFinal
  const other =
    quizAvg * p.quizWeight +
    (input.midtermScore || 0) * p.midtermWeight +
    (input.labScore     || 0) * (p.hasLab ? p.labWeight : 0);

  const required = (target.min - other) / effectiveFinal;
  return parseFloat(Math.max(0, Math.min(100, required)).toFixed(1));
};

// ─── GPA / CGPA ──────────────────────────────────────────────────────────────
// enrollments: [{ credits: 3, cgpaPoints: 3.7 }, ...]
const calcGPA = (enrollments = []) => {
  const completed = enrollments.filter(e => e.cgpaPoints !== null && e.cgpaPoints !== undefined);
  if (completed.length === 0) return 0;
  const totalCredits = completed.reduce((s, e) => s + (e.credits || 3), 0);
  const totalPoints  = completed.reduce((s, e) => s + (e.cgpaPoints * (e.credits || 3)), 0);
  return totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
};

// ─── Scholarship Eligibility ──────────────────────────────────────────────────
const MERIT_BRACKETS = [
  { min: 4.00, max: 4.00, discount: 100 },
  { min: 3.95, max: 3.99, discount: 75  },
  { min: 3.90, max: 3.94, discount: 50  },
  { min: 3.85, max: 3.89, discount: 25  },
  { min: 3.70, max: 3.84, discount: 10  },
];

const checkScholarship = (cgpa, { hasF = false, hasRetake = false, completedCredits = 0, minCredits = 0 } = {}) => {
  const cgpaNum = parseFloat(cgpa) || 0;

  // Need-based (BRAC Scholarship)
  const needBased = {
    eligible:   cgpaNum >= 3.00,
    cgpa:       cgpaNum,
    minRequired: 3.00,
  };

  // Merit-based
  let meritDiscount = 0;
  let meritBracket  = null;
  if (!hasF && !hasRetake && completedCredits >= minCredits) {
    for (const b of MERIT_BRACKETS) {
      if (cgpaNum >= b.min && cgpaNum <= b.max) {
        meritDiscount = b.discount;
        meritBracket  = b;
        break;
      }
      if (cgpaNum >= 4.00) { meritDiscount = 100; meritBracket = MERIT_BRACKETS[0]; break; }
    }
  }

  return {
    needBased,
    merit: {
      eligible:  meritDiscount > 0,
      discount:  meritDiscount,
      bracket:   meritBracket,
      blockedBy: hasF ? 'F grade' : hasRetake ? 'retaken course' : null,
    },
    bestOption: meritDiscount > 0 ? 'merit' : needBased.eligible ? 'need' : 'none',
  };
};

// ─── Attendance ───────────────────────────────────────────────────────────────
const calcAttendancePct = (attended, total) => {
  if (!total || total === 0) return 0;
  return parseFloat(((attended / total) * 100).toFixed(1));
};

const attendanceStatus = (pct) => {
  if (pct >= 90) return { level: 'excellent', label: 'Excellent', color: 'green' };
  if (pct >= 75) return { level: 'good',      label: 'Good',      color: 'blue'  };
  if (pct >= 60) return { level: 'warning',   label: 'Warning',   color: 'yellow'};
  return            { level: 'critical',  label: 'Critical',  color: 'red'   };
};

module.exports = {
  applyNMinusOne,
  calcQuizAverage,
  getGrade,
  calcTotalMarks,
  calculateGrade,
  whatIfSimulation,
  requiredFinalForGrade,
  calcGPA,
  checkScholarship,
  calcAttendancePct,
  attendanceStatus,
  GRADE_SCALE,
  MERIT_BRACKETS,
  DEFAULT_POLICY,
};
