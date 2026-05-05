const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizQuestion = sequelize.define('QuizQuestion', {
  questionId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quizId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('mcq', 'short', 'true_false'), allowNull: false, defaultValue: 'mcq' },
  prompt: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.JSONB, defaultValue: [] },
  correctAnswer: { type: DataTypes.TEXT },
  marks: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
  questionOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
}, {
  tableName: 'quiz_questions',
  timestamps: true,
});

module.exports = QuizQuestion;