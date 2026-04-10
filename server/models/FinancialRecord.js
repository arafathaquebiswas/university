const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinancialRecord = sequelize.define('FinancialRecord', {
  recordId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  type: {
    type: DataTypes.ENUM('tuition', 'library_fee', 'lab_fee', 'scholarship', 'payment', 'fine'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'overdue', 'waived'),
    defaultValue: 'pending',
  },
  semester: { type: DataTypes.STRING(20) },
  dueDate: { type: DataTypes.DATEONLY },
  paymentDate: { type: DataTypes.DATEONLY },
  scholarshipId: { type: DataTypes.INTEGER },
  description: { type: DataTypes.STRING(255) },
  transactionRef: { type: DataTypes.STRING(100) },
}, { tableName: 'financial_records', timestamps: true });

module.exports = FinancialRecord;
