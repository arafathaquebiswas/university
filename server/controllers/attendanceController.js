const { AttendanceRecord, Student, Course, Enrollment, User } = require('../models');
const { calcAttendancePct, attendanceStatus } = require('../utils/gradingEngine');
const { Op } = require('sequelize');

// POST /api/attendance — faculty marks a class session
const markAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body;
    // records: [{ studentId, status }]
    if (!courseId || !date || !Array.isArray(records))
      return res.status(400).json({ error: 'courseId, date and records[] required' });

    for (const r of records) {
      const [rec, created] = await AttendanceRecord.findOrCreate({
        where: { studentId: r.studentId, courseId, date },
        defaults: { status: r.status, markedBy: req.user.userId },
      });
      if (!created) await rec.update({ status: r.status });
    }

    // Recalculate attendance % for each student
    await recalcCourseAttendance(courseId, records.map(r => r.studentId));

    return res.json({ message: `Attendance saved for ${records.length} students` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Recalculate & persist attendance % for listed students in a course
const recalcCourseAttendance = async (courseId, studentIds) => {
  // Total distinct class dates for this course
  const totalClasses = await AttendanceRecord.count({
    where: { courseId },
    distinct: true,
    col: 'date',
  });

  for (const studentId of studentIds) {
    const attended = await AttendanceRecord.count({
      where: { studentId, courseId, status: { [Op.in]: ['present', 'late'] } },
    });
    const pct = calcAttendancePct(attended, totalClasses);

    await Enrollment.update(
      { attendancePercentage: pct },
      { where: { studentId, courseId, status: 'active' } }
    );
  }
};

// GET /api/attendance/course/:courseId — full sheet for a course
const getCourseAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const where = { courseId: req.params.courseId };
    if (date) where.date = date;

    // All class dates for this course
    const allDates = await AttendanceRecord.findAll({
      where: { courseId: req.params.courseId },
      attributes: ['date'],
      group: ['date'],
      order: [['date', 'ASC']],
      raw: true,
    });

    const records = await AttendanceRecord.findAll({
      where,
      include: [{ model: Student, as: 'student',
        include: [{ model: User, as: 'user', attributes: ['username', 'email'] }] }],
      order: [['date', 'DESC']],
    });

    // Per-student summary
    const studentSummary = {};
    const total = allDates.length;
    for (const r of records) {
      const sid = r.studentId;
      if (!studentSummary[sid]) {
        studentSummary[sid] = {
          student: r.student,
          attended: 0, absent: 0, late: 0, total,
        };
      }
      if (r.status === 'present') studentSummary[sid].attended++;
      else if (r.status === 'absent') studentSummary[sid].absent++;
      else if (r.status === 'late') studentSummary[sid].late++;
    }

    // Add computed % and status
    const summary = Object.values(studentSummary).map(s => {
      const pct = calcAttendancePct(s.attended + s.late, s.total);
      return { ...s, percentage: pct, status: attendanceStatus(pct) };
    });

    return res.json({ records, summary, totalClasses: total, allDates: allDates.map(d => d.date) });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/attendance/my — current student's full attendance
const getMyAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    // Active enrollments
    const enrollments = await Enrollment.findAll({
      where: { studentId: student.studentId, status: { [Op.ne]: 'dropped' } },
      include: [{ model: Course, as: 'course', attributes: ['courseId','title','courseCode','semester'] }],
    });

    const result = [];
    for (const en of enrollments) {
      const cid = en.courseId;

      const totalClasses = await AttendanceRecord.count({
        where: { courseId: cid },
        distinct: true,
        col: 'date',
      });

      const attended = await AttendanceRecord.count({
        where: { studentId: student.studentId, courseId: cid, status: { [Op.in]: ['present', 'late'] } },
      });

      const absent = await AttendanceRecord.count({
        where: { studentId: student.studentId, courseId: cid, status: 'absent' },
      });

      const pct = calcAttendancePct(attended, totalClasses);

      // Per-date records
      const records = await AttendanceRecord.findAll({
        where: { studentId: student.studentId, courseId: cid },
        order: [['date', 'DESC']],
        attributes: ['date', 'status'],
      });

      result.push({
        course: en.course,
        semester: en.semester,
        totalClasses,
        attended,
        absent,
        missed: totalClasses - attended,
        percentage: pct,
        status: attendanceStatus(pct),
        records,
        warning: pct < 75,
      });
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/attendance/student/:studentId — admin/faculty view
const getStudentAttendance = async (req, res) => {
  try {
    req.user = { userId: -1 }; // bypass userId check
    const student = await Student.findByPk(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Not found' });

    const tmp = { ...req, user: { userId: student.userId } };
    // Reuse my-attendance logic
    const spy = { json: (d) => res.json(d), status: (c) => ({ json: (d) => res.status(c).json(d) }) };
    return getMyAttendance({ ...req, user: { userId: student.userId } }, res);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { markAttendance, getCourseAttendance, getMyAttendance, getStudentAttendance };
