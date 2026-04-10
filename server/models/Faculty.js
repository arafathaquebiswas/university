const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Faculty = sequelize.define('Faculty', {
  facultyId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  officeNumber: { type: DataTypes.STRING(20) },
  specialization: { type: DataTypes.STRING(100) },
  designation: { type: DataTypes.STRING(50) },
}, { tableName: 'faculty', timestamps: true });

module.exports = Faculty;
