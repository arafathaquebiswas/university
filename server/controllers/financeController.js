const {
  FinancialRecord,
  Student,
  Scholarship,
  User,
  Notification,
  Grade,
  Enrollment,
  SemesterGPA,
  Course,
  Faculty,
} = require('../models');

const { checkScholarship } = require('../utils/gradingEngine');
const { Op } = require('sequelize');

const COURSE_FEE = 20000;
const SEMESTER_FEE = 10000;
const OVERDUE_FINE_RATE = 0.05;

const calculateOverdueFine = (amount) => {
  return Math.round(Number(amount || 0) * OVERDUE_FINE_RATE);
};

const applyOverdueStatusAndFine = async (record) => {
  if (!record || !record.dueDate || record.status === 'paid' || record.type === 'fine') {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(record.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate >= today) return;

  await record.update({ status: 'overdue' });

  const existingFine = await FinancialRecord.findOne({
    where: {
      studentId: record.studentId,
      type: 'fine',
      description: {
        [Op.like]: `%Overdue Fine for record ${record.recordId}%`,
      },
    },
  });

  if (!existingFine) {
    await FinancialRecord.create({
      studentId: record.studentId,
      amount: calculateOverdueFine(record.amount),
      type: 'fine',
      semester: record.semester,
      dueDate: new Date(),
      status: 'pending',
      description: `Overdue Fine for record ${record.recordId}`,
    });
  }
};

const applyOverdueFines = async () => {
  const pendingRecords = await FinancialRecord.findAll({
    where: { status: 'pending' },
  });

  for (const record of pendingRecords) {
    await applyOverdueStatusAndFine(record);
  }
};

// POST /api/finance/generate-semester-invoice
const generateSemesterInvoice = async (req, res) => {
  try {
    const { studentId, semester, dueDate } = req.body;

    if (!studentId || !semester) {
      return res.status(400).json({ error: 'studentId and semester are required' });
    }

    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const existing = await FinancialRecord.findOne({
      where: {
        studentId,
        semester,
        type: 'tuition',
        description: {
          [Op.like]: 'Semester Registration Fee%',
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: `Invoice already generated for ${semester}`,
      });
    }

    const enrollments = await Enrollment.findAll({
      where: { studentId, semester },
      include: [{ model: Course, as: 'course' }],
    });

    if (!enrollments.length) {
      return res.status(400).json({
        error: 'No enrollments found for this semester',
      });
    }

    const records = [];

    const semesterRecord = await FinancialRecord.create({
      studentId,
      amount: SEMESTER_FEE,
      type: 'tuition',
      semester,
      dueDate,
      description: `Semester Registration Fee — ${semester}`,
    });

    await applyOverdueStatusAndFine(semesterRecord);
    records.push(semesterRecord);

    for (const enr of enrollments) {
      const courseRecord = await FinancialRecord.create({
        studentId,
        amount: COURSE_FEE,
        type: 'tuition',
        semester,
        dueDate,
        description: `Course Fee: ${enr.course.title} (${enr.course.courseCode})`,
      });

      await applyOverdueStatusAndFine(courseRecord);
      records.push(courseRecord);
    }

    const total = SEMESTER_FEE + enrollments.length * COURSE_FEE;

    await Notification.create({
      userId: student.userId,
      type: 'payment',
      message: `Fee invoice for ${semester}: BDT ${total.toLocaleString()} — ${
        enrollments.length
      } course(s) + semester fee. Due: ${dueDate || 'N/A'}`,
    });

    return res.status(201).json({
      records,
      total,
      courseCount: enrollments.length,
    });
  } catch (err) {
    console.error('generateSemesterInvoice:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/finance/invoices
const generateInvoice = async (req, res) => {
  try {
    const { studentId, amount, type, semester, dueDate, description } = req.body;

    if (!studentId || !amount || !type) {
      return res.status(400).json({
        error: 'studentId, amount and type required',
      });
    }

    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const record = await FinancialRecord.create({
      studentId,
      amount,
      type,
      semester,
      dueDate,
      description,
    });

    await applyOverdueStatusAndFine(record);
    await record.reload();

    await Notification.create({
      userId: student.userId,
      type: 'payment',
      message: `Invoice generated: ${type} — BDT ${Number(
        amount
      ).toLocaleString()} for ${semester || 'this semester'}. Due: ${
        dueDate || 'N/A'
      }`,
    });

    return res.status(201).json(record);
  } catch (err) {
    console.error('generateInvoice:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/finance/pay
const makePayment = async (req, res) => {
  try {
    const { recordId, transactionRef } = req.body;

    const student = await Student.findOne({
      where: { userId: req.user.userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const record = await FinancialRecord.findOne({
      where: {
        recordId,
        studentId: student.studentId,
      },
    });

    if (!record) return res.status(404).json({ error: 'Record not found' });

    if (record.status === 'paid') {
      return res.status(409).json({ error: 'Already paid' });
    }

    await record.update({
      status: 'paid',
      paymentDate: new Date(),
      transactionRef,
    });

    return res.json({
      message: 'Payment recorded',
      record,
    });
  } catch (err) {
    console.error('makePayment:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/finance/my
const getMyFinancials = async (req, res) => {
  try {
    await applyOverdueFines();

    const student = await Student.findOne({
      where: { userId: req.user.userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const records = await FinancialRecord.findAll({
      where: { studentId: student.studentId },
      include: [{ model: Scholarship, as: 'scholarship' }],
      order: [['createdAt', 'DESC']],
    });

    const scholarshipRecords = records.filter(r => r.type === 'scholarship');

    const scholarshipTotal = scholarshipRecords.reduce(
      (sum, r) => sum + parseFloat(r.amount || 0),
      0
    );

    const summary = {
      totalDue: records
        .filter(r => r.status === 'pending' || r.status === 'overdue')
        .reduce((s, r) => s + parseFloat(r.amount || 0), 0),

      totalPaid: records
        .filter(r => r.status === 'paid' && r.type !== 'scholarship')
        .reduce((s, r) => s + parseFloat(r.amount || 0), 0),

      overdue: records.filter(r => r.status === 'overdue').length,
      scholarshipTotal,
    };

    return res.json({
      records,
      summary,
      scholarships: scholarshipRecords,
      scholarshipTotal,
    });
  } catch (err) {
    console.error('getMyFinancials:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/finance/student/:studentId
const getStudentFinancials = async (req, res) => {
  try {
    await applyOverdueFines();

    const records = await FinancialRecord.findAll({
      where: { studentId: req.params.studentId },
      include: [{ model: Scholarship, as: 'scholarship' }],
      order: [['createdAt', 'DESC']],
    });

    const scholarshipRecords = records.filter(r => r.type === 'scholarship');

    const scholarshipTotal = scholarshipRecords.reduce(
      (sum, r) => sum + parseFloat(r.amount || 0),
      0
    );

    const summary = {
      totalDue: records
        .filter(r => r.status === 'pending' || r.status === 'overdue')
        .reduce((s, r) => s + parseFloat(r.amount || 0), 0),

      totalPaid: records
        .filter(r => r.status === 'paid' && r.type !== 'scholarship')
        .reduce((s, r) => s + parseFloat(r.amount || 0), 0),

      overdue: records.filter(r => r.status === 'overdue').length,
      scholarshipTotal,
    };

    return res.json({
      records,
      summary,
      scholarships: scholarshipRecords,
      scholarshipTotal,
    });
  } catch (err) {
    console.error('getStudentFinancials:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/finance/all
const getAllFinancials = async (req, res) => {
  try {
    await applyOverdueFines();

    const { status, semester, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (semester) where.semester = semester;

    const { count, rows } = await FinancialRecord.findAndCountAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          include: [{ model: User, as: 'user', attributes: ['username', 'email'] }],
        },
        { model: Scholarship, as: 'scholarship' },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      total: count,
      page: parseInt(page),
      records: rows,
    });
  } catch (err) {
    console.error('getAllFinancials:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/finance/scholarship/apply
const applyScholarship = async (req, res) => {
  try {
    const { scholarshipId } = req.body;

    const student = await Student.findOne({
      where: { userId: req.user.userId },
      include: [
        { model: User, as: 'user' },
        { model: SemesterGPA, as: 'semesterGPAs' },
      ],
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const scholarship = await Scholarship.findByPk(scholarshipId);

    if (!scholarship || !scholarship.isActive) {
      return res.status(404).json({ error: 'Scholarship not available' });
    }

    const existing = await FinancialRecord.findOne({
      where: {
        studentId: student.studentId,
        scholarshipId,
        type: 'scholarship',
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Scholarship already applied for this student',
        record: existing,
      });
    }

    const grades = await Grade.findAll({
      include: [
        {
          model: Enrollment,
          as: 'enrollment',
          where: { studentId: student.studentId },
        },
      ],
    });

    const hasF = grades.some(g => g.letterGrade === 'F');

    const eligibility = checkScholarship(student.currentGPA, { hasF });

    if (
      scholarship.minGPA &&
      parseFloat(student.currentGPA) < parseFloat(scholarship.minGPA)
    ) {
      return res.status(400).json({
        error: `Minimum CGPA of ${scholarship.minGPA} required. Your CGPA: ${student.currentGPA}`,
        eligibility,
      });
    }

    const record = await FinancialRecord.create({
      studentId: student.studentId,
      amount: scholarship.amount,
      type: 'scholarship',
      status: 'paid',
      description: `Scholarship: ${scholarship.name}`,
      scholarshipId,
      paymentDate: new Date(),
    });

    await Notification.create({
      userId: student.userId,
      type: 'payment',
      message: `Scholarship applied: ${scholarship.name} — BDT ${Number(
        scholarship.amount
      ).toLocaleString()} credited.`,
    });

    return res.status(201).json({
      message: 'Scholarship applied',
      record,
      eligibility,
    });
  } catch (err) {
    console.error('applyScholarship:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/finance/scholarships
const getScholarships = async (req, res) => {
  try {
    const items = await Scholarship.findAll({
      where: { isActive: true },
    });

    return res.json(items);
  } catch (err) {
    console.error('getScholarships:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/finance/faculty/:facultyId
const getFacultyPayment = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const faculty = await Faculty.findByPk(facultyId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    const courses = await Course.findAll({
      where: { facultyId },
      order: [['courseCode', 'ASC']],
    });

    const perCourseAmount = 50000;
    const total = courses.length * perCourseAmount;

    return res.json({
      faculty,
      courses,
      perCourseAmount,
      total,
    });
  } catch (err) {
    console.error('getFacultyPayment:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/finance/records/:recordId/mark-paid
const markRecordPaid = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { transactionRef } = req.body;

    const record = await FinancialRecord.findByPk(recordId, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });

    if (!record) {
      return res.status(404).json({ error: 'Financial record not found' });
    }

    if (record.status === 'paid') {
      return res.status(409).json({ error: 'Already paid' });
    }

    await record.update({
      status: 'paid',
      paymentDate: new Date(),
      transactionRef: transactionRef || 'MANUAL-ACCOUNTS',
    });

    if (record.student?.userId) {
      await Notification.create({
        userId: record.student.userId,
        type: 'payment',
        message: `Payment confirmed: ${record.type} — BDT ${Number(
          record.amount
        ).toLocaleString()} for ${record.semester || 'this semester'}.`,
      });
    }

    return res.json({
      message: 'Record marked as paid',
      record,
    });
  } catch (err) {
    console.error('markRecordPaid:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  generateInvoice,
  generateSemesterInvoice,
  makePayment,
  markRecordPaid,
  getMyFinancials,
  getStudentFinancials,
  getAllFinancials,
  applyScholarship,
  getScholarships,
  getFacultyPayment,
};