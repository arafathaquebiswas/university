const { Enrollment, Student, Course, Grade, User, Notification, FinancialRecord } = require('../models');
const { Op } = require('sequelize');

const COURSE_FEE   = 20000;
const SEMESTER_FEE = 10000;

// POST /api/enrollments  — student enrolls
const enroll = async (req, res) => {
  try {
    const { courseId, semester } = req.body;
    if (!courseId || !semester)
      return res.status(400).json({ error: 'courseId and semester are required' });

    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const course = await Course.findByPk(courseId);
    if (!course || !course.isActive) return res.status(404).json({ error: 'Course not found or inactive' });

    // Check capacity
    const enrolled = await Enrollment.count({ where: { courseId, semester, status: 'active' } });
    if (enrolled >= course.maxCapacity)
      return res.status(409).json({ error: 'Course is full' });

    // No duplicates for active enrollments
    const exists = await Enrollment.findOne({
      where: { studentId: student.studentId, courseId, semester, status: 'active' },
    });
    if (exists) return res.status(409).json({ error: 'Already enrolled in this course' });

    const enrollment = await Enrollment.create({ studentId: student.studentId, courseId, semester });

    // Create semester registration fee if not already generated for this semester
    const semFeeExists = await FinancialRecord.findOne({
      where: {
        studentId: student.studentId,
        semester,
        type: 'tuition',
        description: { [Op.like]: 'Semester Registration Fee%' },
      },
    });
    if (!semFeeExists) {
      await FinancialRecord.create({
        studentId: student.studentId,
        amount: SEMESTER_FEE,
        type: 'tuition',
        status: 'pending',
        semester,
        description: `Semester Registration Fee — ${semester}`,
      });
    }

    // Course fee for this enrollment
    await FinancialRecord.create({
      studentId: student.studentId,
      amount: COURSE_FEE,
      type: 'tuition',
      status: 'pending',
      semester,
      description: `Course Fee: ${course.title} (${course.courseCode})`,
    });

    await Notification.create({
      userId: req.user.userId,
      type: 'enrollment',
      message: `Enrolled in ${course.title} for ${semester}. BDT ${COURSE_FEE.toLocaleString()} course fee added to your account.`,
    });

    return res.status(201).json(enrollment);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/enrollments/:id  — student drops
const drop = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id, { include: [{ association: 'student' }] });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student || enrollment.studentId !== student.studentId)
      if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Forbidden' });

    await enrollment.update({ status: 'dropped' });
    return res.json({ message: 'Course dropped successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/enrollments/student/:studentId
const getStudentEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { studentId: req.params.studentId },
      include: [
        { association: 'course', include: [{ association: 'faculty', include: [{ association: 'user', attributes: ['username'] }] }] },
        { association: 'grade' },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json(enrollments);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/enrollments/course/:courseId
const getCourseEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { courseId: req.params.courseId, status: 'active' },
      include: [
        { association: 'student', include: [{ association: 'user', attributes: ['username', 'email'] }] },
        { association: 'grade' },
      ],
    });
    return res.json(enrollments);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/enrollments/my  — current student's enrollments
const getMyEnrollments = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const enrollments = await Enrollment.findAll({
      where: { studentId: student.studentId, status: { [Op.ne]: 'dropped' } },
      include: [
        {
          model: require('../models').Course,
          as: 'course',
          include: [
            {
              model: require('../models').Faculty,
              as: 'faculty',
              include: [
                {
                  model: require('../models').User,
                  as: 'user',
                  attributes: ['username']
                }
              ]
            }
          ]
        }
      ],
      order: [['semester', 'DESC']],
    });
    return res.json(enrollments);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { enroll, drop, getStudentEnrollments, getCourseEnrollments, getMyEnrollments };
