const { Course, Faculty, Program, User, Enrollment } = require('../models');

// GET /api/courses
const getCourses = async (req, res) => {
  try {
    const { progId, facultyId, semester } = req.query;
    const where = { isActive: true };
    if (progId) where.progId = progId;
    if (facultyId) where.facultyId = facultyId;
    if (semester) where.semester = semester;

    const courses = await Course.findAll({
      where,
      include: [
        { association: 'faculty', include: [{ association: 'user', attributes: ['username', 'email'] }] },
        { association: 'program', include: [{ association: 'department' }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/courses/:id
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { association: 'faculty', include: [{ association: 'user', attributes: ['username', 'email'] }] },
        { association: 'program', include: [{ association: 'department' }] },
      ],
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/courses  (admin or faculty)
const createCourse = async (req, res) => {
  try {
    const { courseCode, title, description, credits, progId, facultyId, semester, maxCapacity } = req.body;
    if (!title || !credits) return res.status(400).json({ error: 'title and credits are required' });

    const course = await Course.create({ courseCode, title, description, credits, progId, facultyId, semester, maxCapacity });
    return res.status(201).json(course);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Course code already exists' });
    return res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/courses/:id
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Faculty can only update their own courses
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ where: { userId: req.user.userId } });
      if (!faculty || course.facultyId !== faculty.facultyId)
        return res.status(403).json({ error: 'Forbidden' });
    }

    await course.update(req.body);
    return res.json(course);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    await course.update({ isActive: false });
    return res.json({ message: 'Course deactivated' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/courses/faculty/:facultyId
const getFacultyCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { facultyId: req.params.facultyId, isActive: true },
      include: [{ association: 'program' }],
    });
    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, getFacultyCourses };
