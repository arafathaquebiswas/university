const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  recordId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
    allowNull: false,
  },
  markedBy: { type: DataTypes.INTEGER },
}, {
  tableName: 'attendance_records',
  timestamps: true,
  indexes: [{ unique: true, fields: ['studentId', 'courseId', 'date'] }],
});

module.exports = AttendanceRecord;
