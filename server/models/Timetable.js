const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Timetable = sequelize.define('Timetable', {
  timetableId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  courseId:    { type: DataTypes.INTEGER, allowNull: false },
  dayOfWeek:   { type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), allowNull: false },
  startTime:   { type: DataTypes.TIME, allowNull: false },
  endTime:     { type: DataTypes.TIME, allowNull: false },
  room:        { type: DataTypes.STRING(50) },
  semester:    { type: DataTypes.STRING(20), allowNull: false },
}, { tableName: 'timetable', timestamps: true });

module.exports = Timetable;
