const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Installment = sequelize.define('Installment', {
  installmentId:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  planId:         { type: DataTypes.INTEGER, allowNull: false },
  amount:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  dueDate:        { type: DataTypes.DATEONLY, allowNull: false },
  paymentDate:    { type: DataTypes.DATEONLY },
  status:         { type: DataTypes.ENUM('pending', 'paid', 'overdue'), defaultValue: 'pending' },
  transactionRef: { type: DataTypes.STRING(100) },
}, { tableName: 'installments', timestamps: true });

module.exports = Installment;
