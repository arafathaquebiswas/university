const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  courseId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  courseCode: { type: DataTypes.STRING(20), unique: true },
  title: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  credits: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  progId: { type: DataTypes.INTEGER },
  facultyId: { type: DataTypes.INTEGER },
  semester: { type: DataTypes.STRING(20) },
  maxCapacity: { type: DataTypes.INTEGER, defaultValue: 40 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'courses', timestamps: true });

module.exports = Course;
