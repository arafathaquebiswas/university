const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Scholarship = sequelize.define('Scholarship', {
  scholarshipId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  criteria: { type: DataTypes.TEXT },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  minGPA: { type: DataTypes.DECIMAL(3, 2) },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'scholarships', timestamps: true });

module.exports = Scholarship;
