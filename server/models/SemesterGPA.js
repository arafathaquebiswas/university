const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SemesterGPA = sequelize.define('SemesterGPA', {
  id:                { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId:         { type: DataTypes.INTEGER, allowNull: false },
  semester:          { type: DataTypes.STRING(30), allowNull: false },
  semesterGPA:       { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
  creditsAttempted:  { type: DataTypes.INTEGER, defaultValue: 0 },
  creditsEarned:     { type: DataTypes.INTEGER, defaultValue: 0 },
  cumulativeGPA:     { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
  totalCreditsEarned:{ type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'semester_gpa',
  timestamps: true,
  indexes: [{ unique: true, fields: ['studentId', 'semester'] }],
});

module.exports = SemesterGPA;
