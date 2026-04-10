const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Department = sequelize.define('Department', {
  deptId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  head: { type: DataTypes.STRING(100) },
}, { tableName: 'departments', timestamps: true });

module.exports = Department;
