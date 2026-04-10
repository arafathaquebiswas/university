const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseMaterial = sequelize.define('CourseMaterial', {
  materialId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  courseId:   { type: DataTypes.INTEGER, allowNull: false },
  uploadedBy: { type: DataTypes.INTEGER, allowNull: false },  // userId of faculty
  title:      { type: DataTypes.STRING(200), allowNull: false },
  filename:   { type: DataTypes.STRING(300), allowNull: false }, // stored filename on disk
  originalName: { type: DataTypes.STRING(300), allowNull: false },
  mimetype:   { type: DataTypes.STRING(100) },
  size:       { type: DataTypes.INTEGER },                    // bytes
}, { tableName: 'course_materials', timestamps: true });

module.exports = CourseMaterial;
