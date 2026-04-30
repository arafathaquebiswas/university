const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  logId:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:      { type: DataTypes.INTEGER },
  action:      { type: DataTypes.STRING(100), allowNull: false },
  targetTable: { type: DataTypes.STRING(100) },
  targetId:    { type: DataTypes.INTEGER },
  ipAddress:   { type: DataTypes.STRING(45) },
  details:     { type: DataTypes.TEXT },
  timestamp:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'audit_logs', timestamps: false });

module.exports = AuditLog;
