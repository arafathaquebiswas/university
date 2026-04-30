const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InstallmentPlan = sequelize.define('InstallmentPlan', {
  planId:                { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId:             { type: DataTypes.INTEGER, allowNull: false },
  totalAmount:           { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  numberOfInstallments:  { type: DataTypes.INTEGER, allowNull: false },
  semester:              { type: DataTypes.STRING(20), allowNull: false },
  status:                { type: DataTypes.ENUM('active', 'completed', 'defaulted'), defaultValue: 'active' },
  createdBy:             { type: DataTypes.INTEGER },
}, { tableName: 'installment_plans', timestamps: true });

module.exports = InstallmentPlan;
