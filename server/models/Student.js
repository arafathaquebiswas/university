const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  studentId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  majorId: { type: DataTypes.INTEGER },
  currentGPA: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0.00 },
  enrollmentYear: { type: DataTypes.INTEGER },
  studentCode: { type: DataTypes.STRING(20), unique: true },
}, { tableName: 'students', timestamps: true });

module.exports = Student;
