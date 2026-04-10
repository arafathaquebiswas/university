const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Announcement = sequelize.define('Announcement', {
  announcementId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  courseId: { type: DataTypes.INTEGER },
  deptId: { type: DataTypes.INTEGER },
  createdBy: { type: DataTypes.INTEGER },
  isGlobal: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'announcements', timestamps: true });

module.exports = Announcement;
