const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportantDate = sequelize.define('ImportantDate', {
  dateId:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:       { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.STRING(500) },
  eventDate:   { type: DataTypes.DATEONLY, allowNull: false },
  category:    { type: DataTypes.ENUM('exam', 'registration', 'holiday', 'event', 'deadline'), defaultValue: 'event' },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'important_dates', timestamps: true });

module.exports = ImportantDate;
