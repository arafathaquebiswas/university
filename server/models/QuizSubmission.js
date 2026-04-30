const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizSubmission = sequelize.define('QuizSubmission', {
  submissionId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quizId:       { type: DataTypes.INTEGER, allowNull: false },
  studentId:    { type: DataTypes.INTEGER, allowNull: false },
  score:        { type: DataTypes.FLOAT },
  submittedAt:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status:       { type: DataTypes.ENUM('pending', 'graded'), defaultValue: 'pending' },
}, {
  tableName: 'quiz_submissions',
  timestamps: true,
  indexes: [{ unique: true, fields: ['quizId', 'studentId'] }],
});

module.exports = QuizSubmission;
