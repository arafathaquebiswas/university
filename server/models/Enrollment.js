const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
  enrollId:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId:  { type: DataTypes.INTEGER, allowNull: false },
  courseId:   { type: DataTypes.INTEGER, allowNull: false },
  semester:   { type: DataTypes.STRING(30), allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'dropped', 'completed', 'withdrawn'),
    defaultValue: 'active',
  },
  attendancePercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.00 },
  enrolledAt:           { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'enrollments',
  timestamps: true,
  indexes: [{ unique: true, fields: ['studentId', 'courseId', 'semester'] }],
});

module.exports = Enrollment;
