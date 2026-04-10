const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseGradingPolicy = sequelize.define('CourseGradingPolicy', {
  policyId:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  courseId:  { type: DataTypes.INTEGER, allowNull: false, unique: true },

  // Weight distribution (must sum to 1.0)
  quizWeight:    { type: DataTypes.FLOAT, defaultValue: 0.20 },
  midtermWeight: { type: DataTypes.FLOAT, defaultValue: 0.30 },
  finalWeight:   { type: DataTypes.FLOAT, defaultValue: 0.40 },
  labWeight:     { type: DataTypes.FLOAT, defaultValue: 0.10 },

  // Quiz settings
  quizMaxPerItem:      { type: DataTypes.FLOAT,   defaultValue: 10 },
  totalQuizzesPlanned: { type: DataTypes.INTEGER, defaultValue: 4 },

  // Lab flag
  hasLab: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'course_grading_policies', timestamps: true });

module.exports = CourseGradingPolicy;
