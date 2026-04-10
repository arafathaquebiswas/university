const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Program = sequelize.define('Program', {
  progId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false, comment: 'Duration in years' },
  deptId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'programs', timestamps: true });

module.exports = Program;
