const { FinancialRecord, Student, Scholarship, User, Notification, Grade, Enrollment, SemesterGPA, Course } = require('../models');
const { checkScholarship } = require('../utils/gradingEngine');
const { Op } = require('sequelize');

const COURSE_FEE   = 20000;
const SEMESTER_FEE = 10000;

// POST /api/finance/generate-semester-invoice — auto-calculate from enrollments
const generateSemesterInvoice = async (req, res) => {
  try {
    const { studentId, semester, dueDate } = req.body;
    if (!studentId || !semester)
      return res.status(400).json({ error: 'studentId and semester are required' });

    const student = await Student.findByPk(studentId, { include: [{ model: User, as: 'user' }] });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const existing = await FinancialRecord.findOne({
      where: { studentId, semester, type: 'tuition', description: { [Op.like]: 'Semester Registration Fee%' } },
    });
    if (existing)
      return res.status(409).json({ error: `Invoice already generated for ${semester}` });

    const enrollments = await Enrollment.findAll({
      where: { studentId, semester },
      include: [{ model: Course, as: 'course' }],
    });
    if (!enrollments.length)
      return res.status(400).json({ error: 'No enrollments found for this semester' });

    const records = [];

    records.push(await FinancialRecord.create({
      studentId, amount: SEMESTER_FEE, type: 'tuition',
      semester, dueDate, description: `Semester Registration Fee — ${semester}`,
    }));

    for (const enr of enrollments) {
      records.push(await FinancialRecord.create({
        studentId, amount: COURSE_FEE, type: 'tuition',
        semester, dueDate,
        description: `Course Fee: ${enr.course.title} (${enr.course.courseCode})`,
      }));
    }

    const total = SEMESTER_FEE + enrollments.length * COURSE_FEE;

    await Notification.create({
      userId:  student.userId,
      type:    'payment',
      message: `Fee invoice for ${semester}: BDT ${total.toLocaleString()} — ${enrollments.length} course(s) × BDT 20,000 + BDT 10,000 semester fee. Due: ${dueDate || 'N/A'}`,
    });

    return res.status(201).json({ records, total, courseCount: enrollments.length });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/finance/invoices — manual invoice (staff override)
const generateInvoice = async (req, res) => {
  try {
    const { studentId, amount, type, semester, dueDate, description } = req.body;
    if (!studentId || !amount || !type)
      return res.status(400).json({ error: 'studentId, amount and type required' });

    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user' }],
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const record = await FinancialRecord.create({ studentId, amount, type, semester, dueDate, description });

    await Notification.create({
      userId:  student.userId,
      type:    'payment',
      message: `Invoice generated: ${type} — BDT ${Number(amount).toLocaleString()} for ${semester || 'this semester'}. Due: ${dueDate || 'N/A'}`,
    });

    return res.status(201).json(record);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/finance/pay — student records a payment
const makePayment = async (req, res) => {
  try {
    const { recordId, transactionRef } = req.body;
    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const record = await FinancialRecord.findOne({ where: { recordId, studentId: student.studentId } });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    if (record.status === 'paid') return res.status(409).json({ error: 'Already paid' });

    await record.update({ status: 'paid', paymentDate: new Date(), transactionRef });
    return res.json({ message: 'Payment recorded', record });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/finance/my — student's financial summary
const getMyFinancials = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const records = await FinancialRecord.findAll({
      where: { studentId: student.studentId },
      include: [{ model: Scholarship, as: 'scholarship' }],
      order: [['createdAt', 'DESC']],
    });

    const summary = {
      totalDue:  records.filter(r => r.status === 'pending').reduce((s, r) => s + parseFloat(r.amount), 0),
      totalPaid: records.filter(r => r.status === 'paid').reduce((s, r) => s + parseFloat(r.amount), 0),
      overdue:   records.filter(r => r.status === 'overdue').length,
    };

    return res.json({ records, summary });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/finance/student/:studentId  (staff/admin)
const getStudentFinancials = async (req, res) => {
  try {
    const records = await FinancialRecord.findAll({
      where: { studentId: req.params.studentId },
      include: [{ model: Scholarship, as: 'scholarship' }],
      order: [['createdAt', 'DESC']],
    });
    const summary = {
      totalDue:  records.filter(r => r.status === 'pending').reduce((s, r) => s + parseFloat(r.amount), 0),
      totalPaid: records.filter(r => r.status === 'paid').reduce((s, r) => s + parseFloat(r.amount), 0),
    };
    return res.json({ records, summary });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/finance/all — accounts staff dashboard
const getAllFinancials = async (req, res) => {
  try {
    const { status, semester, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (semester) where.semester = semester;

    const { count, rows } = await FinancialRecord.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['username','email'] }] },
        { model: Scholarship, as: 'scholarship' },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
    });
    return res.json({ total: count, page: parseInt(page), records: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/finance/scholarship/apply — auto-check eligibility then apply
const applyScholarship = async (req, res) => {
  try {
    const { scholarshipId } = req.body;
    const student = await Student.findOne({
      where: { userId: req.user.userId },
      include: [{ model: User, as: 'user' }, { model: SemesterGPA, as: 'semesterGPAs' }],
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const scholarship = await Scholarship.findByPk(scholarshipId);
    if (!scholarship || !scholarship.isActive)
      return res.status(404).json({ error: 'Scholarship not available' });

    const grades = await Grade.findAll({
      include: [{ model: Enrollment, as: 'enrollment', where: { studentId: student.studentId } }],
    });
    const hasF = grades.some(g => g.letterGrade === 'F');

    const eligibility = checkScholarship(student.currentGPA, { hasF });

    // Validate: need-based requires CGPA ≥ 3.00; merit checks were done in engine
    if (scholarship.minGPA && parseFloat(student.currentGPA) < parseFloat(scholarship.minGPA))
      return res.status(400).json({
        error: `Minimum CGPA of ${scholarship.minGPA} required. Your CGPA: ${student.currentGPA}`,
        eligibility,
      });

    const record = await FinancialRecord.create({
      studentId:    student.studentId,
      amount:       scholarship.amount,
      type:         'scholarship',
      status:       'paid',
      description:  `Scholarship: ${scholarship.name}`,
      scholarshipId,
      paymentDate:  new Date(),
    });

    await Notification.create({
      userId:  student.userId,
      type:    'payment',
      message: `Scholarship applied: ${scholarship.name} — BDT ${Number(scholarship.amount).toLocaleString()} credited.`,
    });

    return res.status(201).json({ message: 'Scholarship applied', record, eligibility });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/finance/scholarships
const getScholarships = async (req, res) => {
  try {
    const items = await Scholarship.findAll({ where: { isActive: true } });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { generateInvoice, generateSemesterInvoice, makePayment, getMyFinancials, getStudentFinancials, getAllFinancials, applyScholarship, getScholarships };
