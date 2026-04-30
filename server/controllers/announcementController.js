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

// DELETE /api/announcements/:id
const deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findByPk(req.params.id);
    if (!ann) return res.status(404).json({ error: 'Announcement not found' });
    if (req.user.role !== 'admin' && ann.createdBy !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await ann.destroy();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/announcements/my-courses (student: only their enrolled courses)
const getMyCoursesAnnouncements = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const enrollments = await Enrollment.findAll({
      where: { studentId: student.studentId, status: 'active' },
    });

    const courseIds = enrollments.map(e => e.courseId);
    if (courseIds.length === 0) return res.json([]);

    const announcements = await Announcement.findAll({
      where: { courseId: courseIds },
      include: [
        { association: 'creator', attributes: ['username', 'role'] },
        { association: 'course', attributes: ['courseId', 'courseCode', 'title'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json(announcements);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createAnnouncement, getAnnouncements, getGlobalAnnouncements, deleteAnnouncement, getMyCoursesAnnouncements };
