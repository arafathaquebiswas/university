const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  notificationId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM('grade', 'attendance', 'payment', 'announcement', 'enrollment', 'system'),
    allowNull: false,
  },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('read', 'unread'), defaultValue: 'unread' },
  link: { type: DataTypes.STRING(255) },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'notifications', timestamps: true });

module.exports = Notification;
