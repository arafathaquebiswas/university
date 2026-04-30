const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScholarshipApplication = sequelize.define('ScholarshipApplication', {
  applicationId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId:     { type: DataTypes.INTEGER, allowNull: false },
  scholarshipId: { type: DataTypes.INTEGER, allowNull: false },
  status:        { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  appliedAt:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  reviewedBy:    { type: DataTypes.INTEGER },
  reviewedAt:    { type: DataTypes.DATE },
  remarks:       { type: DataTypes.STRING(255) },
}, {
  tableName: 'scholarship_applications',
  timestamps: true,
  indexes: [{ unique: true, fields: ['studentId', 'scholarshipId'] }],
});

module.exports = ScholarshipApplication;
