const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AccountsStaff = sequelize.define('AccountsStaff', {
  staffId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  sector: { type: DataTypes.STRING(50), defaultValue: 'accounts' },
}, { tableName: 'accounts_staff', timestamps: true });

module.exports = AccountsStaff;
