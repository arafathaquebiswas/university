const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grade = sequelize.define('Grade', {
  gradeId:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  enrollId:  { type: DataTypes.INTEGER, allowNull: false, unique: true },

  // ── Raw quiz inputs ──────────────────────────────────────────────────────
  quizScores:    { type: DataTypes.ARRAY(DataTypes.FLOAT), defaultValue: [] },
  quizMaxPerItem:{ type: DataTypes.FLOAT, defaultValue: 10 },   // max marks per quiz
  totalQuizzes:  { type: DataTypes.INTEGER, defaultValue: 0 },

  // ── Component scores (0–100 %) ───────────────────────────────────────────
  midtermScore: { type: DataTypes.FLOAT },
  finalScore:   { type: DataTypes.FLOAT },
  labScore:     { type: DataTypes.FLOAT },
  hasLab:       { type: DataTypes.BOOLEAN, defaultValue: false },

  // ── Calculated (stored for fast reads) ───────────────────────────────────
  quizAverage:    { type: DataTypes.FLOAT },   // after N-1 rule, as %
  droppedQuizIdx: { type: DataTypes.INTEGER, defaultValue: -1 },
  totalMarks:     { type: DataTypes.FLOAT },   // weighted total (0–100)
  letterGrade:    { type: DataTypes.STRING(5) },
  cgpaPoints:     { type: DataTypes.FLOAT },

  // ── Policy weights (snapshot at time of grading) ─────────────────────────
  quizWeight:    { type: DataTypes.FLOAT, defaultValue: 0.20 },
  midtermWeight: { type: DataTypes.FLOAT, defaultValue: 0.30 },
  finalWeight:   { type: DataTypes.FLOAT, defaultValue: 0.40 },
  labWeight:     { type: DataTypes.FLOAT, defaultValue: 0.10 },

  remarks:     { type: DataTypes.STRING(200) },
  isFinalized: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'grades', timestamps: true });

module.exports = Grade;
