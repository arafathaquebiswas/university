const path = require('path');
const fs   = require('fs');
const { CourseMaterial, Course, Faculty } = require('../models');
const { UPLOAD_DIR } = require('../middleware/upload');

// POST /api/materials  — faculty uploads a file
const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { courseId, title } = req.body;
    if (!courseId || !title)
      return res.status(400).json({ error: 'courseId and title are required' });

    // Verify this faculty owns the course
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ where: { userId: req.user.userId } });
      if (!faculty) return res.status(403).json({ error: 'Faculty profile not found' });

      const course = await Course.findByPk(courseId);
      if (!course || course.facultyId !== faculty.facultyId)
        return res.status(403).json({ error: 'You can only upload to your own courses' });
    }

    const material = await CourseMaterial.create({
      courseId:     parseInt(courseId),
      uploadedBy:   req.user.userId,
      title:        title.trim(),
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
    });

    return res.status(201).json(material);
  } catch (err) {
    console.error('uploadMaterial:', err);
    // Clean up orphaned file if DB insert failed
    if (req.file) {
      fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
    }
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/materials/course/:courseId  — list materials for a course
const getCourseMaterials = async (req, res) => {
  try {
    const materials = await CourseMaterial.findAll({
      where: { courseId: req.params.courseId },
      order: [['createdAt', 'DESC']],
    });
    return res.json(materials);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/materials/download/:materialId  — download/stream file
const downloadMaterial = async (req, res) => {
  try {
    const material = await CourseMaterial.findByPk(req.params.materialId);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    const filePath = path.join(UPLOAD_DIR, material.filename);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: 'File not found on server' });

    res.setHeader('Content-Disposition', `attachment; filename="${material.originalName}"`);
    res.setHeader('Content-Type', material.mimetype || 'application/octet-stream');
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/materials/:materialId  — faculty deletes their own file
const deleteMaterial = async (req, res) => {
  try {
    const material = await CourseMaterial.findByPk(req.params.materialId);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    // Only the uploader or admin can delete
    if (req.user.role !== 'admin' && material.uploadedBy !== req.user.userId)
      return res.status(403).json({ error: 'Forbidden' });

    // Remove file from disk
    const filePath = path.join(UPLOAD_DIR, material.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await material.destroy();
    return res.json({ message: 'Material deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { uploadMaterial, getCourseMaterials, downloadMaterial, deleteMaterial };
