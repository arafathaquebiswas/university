const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quiz = sequelize.define('Quiz', {
  quizId:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  courseId:     { type: DataTypes.INTEGER, allowNull: false },
  title:        { type: DataTypes.STRING(200), allowNull: false },
  description:  { type: DataTypes.TEXT },
  totalMarks:   { type: DataTypes.FLOAT, defaultValue: 10 },
  duration:     { type: DataTypes.INTEGER, comment: 'Duration in minutes' },
  scheduledAt:  { type: DataTypes.DATE },
  isPublished:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'quizzes', timestamps: true });

module.exports = Quiz;
