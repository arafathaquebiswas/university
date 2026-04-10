const { Announcement, User, Course, Department, Notification, Enrollment, Student } = require('../models');

// POST /api/announcements
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, courseId, deptId, isGlobal } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content are required' });

    const ann = await Announcement.create({ title, content, courseId, deptId, isGlobal, createdBy: req.user.userId });

    // Notify enrolled students if course-specific
    if (courseId) {
      const enrollments = await Enrollment.findAll({
        where: { courseId, status: 'active' },
        include: [{ association: 'student', include: [{ association: 'user' }] }],
      });
      await Promise.all(enrollments.map(e =>
        Notification.create({
          userId: e.student.userId,
          type: 'announcement',
          message: `New announcement in your course: "${title}"`,
        })
      ));
    }

    return res.status(201).json(ann);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/announcements
const getAnnouncements = async (req, res) => {
  try {
    const { courseId, deptId } = req.query;
    const where = {};
    if (courseId) where.courseId = courseId;
    if (deptId) where.deptId = deptId;

    const announcements = await Announcement.findAll({
      where,
      include: [{ association: 'creator', attributes: ['username', 'role'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json(announcements);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/announcements/global
const getGlobalAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: { isGlobal: true },
      include: [{ association: 'creator', attributes: ['username', 'role'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json(announcements);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createAnnouncement, getAnnouncements, getGlobalAnnouncements };
