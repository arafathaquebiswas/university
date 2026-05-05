const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizAttempt = sequelize.define('QuizAttempt', {
  attemptId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quizId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  answers: { type: DataTypes.JSONB, defaultValue: [] },
  resultBreakdown: { type: DataTypes.JSONB, defaultValue: [] },
  autoMarks: { type: DataTypes.FLOAT, defaultValue: 0 },
  manualMarks: { type: DataTypes.FLOAT, defaultValue: 0 },
  obtainedMarks: { type: DataTypes.FLOAT, defaultValue: 0 },
  totalMarks: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.ENUM('submitted', 'graded'), defaultValue: 'submitted' },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  gradedAt: { type: DataTypes.DATE },
  gradedBy: { type: DataTypes.INTEGER },
}, {
  tableName: 'quiz_attempts',
  timestamps: true,
  indexes: [{ unique: true, fields: ['quizId', 'studentId'] }],
});

module.exports = QuizAttempt;