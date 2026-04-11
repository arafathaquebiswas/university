const PDFDocument = require('pdfkit');
const {
  Grade, Enrollment, Student, Course, User, Notification,
  CourseGradingPolicy, SemesterGPA,
} = require('../models');
const {
  calculateGrade, whatIfSimulation, requiredFinalForGrade,
  calcGPA, checkScholarship, DEFAULT_POLICY,
} = require('../utils/gradingEngine');
const { Op } = require('sequelize');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getPolicy = async (courseId) => {
  const p = await CourseGradingPolicy.findOne({ where: { courseId } });
  return p ? p.toJSON() : DEFAULT_POLICY;
};

const recalcStudentGPA = async (studentId) => {
  // All completed enrollments with finalized grades
  const grades = await Grade.findAll({
    include: [{
      model: Enrollment,
      as: 'enrollment',
      where: { studentId, status: 'completed' },
      include: [{ model: Course, as: 'course', attributes: ['credits', 'semester'] }],
    }],
    where: { isFinalized: true },
  });

  if (grades.length === 0) return;

  const semMap = {};
  grades.forEach(g => {
    const sem    = g.enrollment.course?.semester || 'Unknown';
    const cred   = g.enrollment.course?.credits  || 3;
    const points = g.cgpaPoints ?? 0;
    if (!semMap[sem]) semMap[sem] = [];
    semMap[sem].push({ credits: cred, cgpaPoints: points });
  });

  let totalCredits = 0, totalPoints = 0;
  for (const [semester, items] of Object.entries(semMap)) {
    const semGPA  = calcGPA(items);
    const semCred = items.reduce((s, i) => s + i.credits, 0);
    totalCredits += semCred;
    totalPoints  += items.reduce((s, i) => s + i.cgpaPoints * i.credits, 0);

    const cgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
    await SemesterGPA.upsert({
      studentId, semester,
      semesterGPA:        semGPA,
      creditsAttempted:   semCred,
      creditsEarned:      items.filter(i => i.cgpaPoints > 0).reduce((s, i) => s + i.credits, 0),
      cumulativeGPA:      cgpa,
      totalCreditsEarned: totalCredits,
    });
  }

  const cgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
  await Student.update({ currentGPA: cgpa }, { where: { studentId } });
};

// ─── POST /api/grades  — faculty submits / updates marks ─────────────────────
const submitGrade = async (req, res) => {
  try {
    const {
      enrollId,
      quizScores,
      midtermScore,
      finalScore,
      labScore,
      remarks,
      finalize = false,
    } = req.body;

    if (!enrollId) return res.status(400).json({ error: 'enrollId is required' });

    const enrollment = await Enrollment.findByPk(enrollId, {
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user' }] },
        { model: Course,  as: 'course' },
      ],
    });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    // Fetch grading policy for this course
    const policy = await getPolicy(enrollment.courseId);

    // Run calculation
    const result = calculateGrade(
      { quizScores: quizScores || [], midtermScore, finalScore, labScore },
      policy
    );

    const gradeData = {
      enrollId,
      quizScores:     quizScores || [],
      quizMaxPerItem: policy.quizMaxPerItem,
      totalQuizzes:   (quizScores || []).length,
      midtermScore:   midtermScore ?? null,
      finalScore:     finalScore   ?? null,
      labScore:       labScore     ?? null,
      hasLab:         policy.hasLab,
      quizAverage:    result.quizDetails.average,
      droppedQuizIdx: result.quizDetails.droppedIndex,
      totalMarks:     result.totalMarks,
      letterGrade:    result.letterGrade,
      cgpaPoints:     result.cgpaPoints,
      quizWeight:     policy.quizWeight,
      midtermWeight:  policy.midtermWeight,
      finalWeight:    policy.finalWeight,
      labWeight:      policy.labWeight,
      remarks,
      isFinalized:    finalize,
    };

    let grade = await Grade.findOne({ where: { enrollId } });
    if (grade) {
      await grade.update(gradeData);
    } else {
      grade = await Grade.create(gradeData);
    }

    if (finalize) {
      await enrollment.update({ status: 'completed' });
      await recalcStudentGPA(enrollment.studentId);

      await Notification.create({
        userId:  enrollment.student.userId,
        type:    'grade',
        message: `Grade finalized for ${enrollment.course.title}: ${result.letterGrade} (${result.totalMarks.toFixed(1)})`,
      });
    }

    return res.json({ grade, calculation: result });
  } catch (err) {
    console.error('submitGrade:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── GET /api/grades/my — student's grades ────────────────────────────────────
const getMyGrades = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.userId } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const enrollments = await Enrollment.findAll({
      where: { studentId: student.studentId },
      include: [
        { model: Course, as: 'course', attributes: ['title', 'courseCode', 'credits', 'semester'] },
        { model: Grade,  as: 'grade' },
      ],
      order: [['semester', 'DESC']],
    });

    const semesterGPAs = await SemesterGPA.findAll({
      where: { studentId: student.studentId },
      order: [['semester', 'DESC']],
    });

    return res.json({
      enrollments,
      semesterGPAs,
      currentCGPA: student.currentGPA,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── GET /api/grades/student/:studentId ──────────────────────────────────────
const getStudentGrades = async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { studentId: req.params.studentId },
      include: [
        { model: Course, as: 'course', attributes: ['title', 'courseCode', 'credits', 'semester'] },
        { model: Grade,  as: 'grade' },
      ],
      order: [['semester', 'DESC']],
    });
    return res.json(enrollments);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── GET /api/grades/course/:courseId — faculty view ─────────────────────────
const getCourseGrades = async (req, res) => {
  try {
    const [enrollments, policy] = await Promise.all([
      Enrollment.findAll({
        where: { courseId: req.params.courseId },
        include: [
          { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['username', 'email'] }] },
          { model: Grade,   as: 'grade' },
        ],
        order: [['createdAt', 'ASC']],
      }),
      getPolicy(req.params.courseId),
    ]);
    return res.json({ enrollments, policy });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── POST /api/grades/whatif — what-if simulation ────────────────────────────
const whatIf = async (req, res) => {
  try {
    const { enrollId, whatIfFinalScore } = req.body;
    if (!enrollId) return res.status(400).json({ error: 'enrollId required' });

    const grade = await Grade.findOne({ where: { enrollId } });
    const enrollment = await Enrollment.findByPk(enrollId);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const policy = await getPolicy(enrollment.courseId);
    const currentInput = {
      quizScores:   grade?.quizScores   || [],
      midtermScore: grade?.midtermScore ?? 0,
      finalScore:   whatIfFinalScore    ?? 0,
      labScore:     grade?.labScore     ?? 0,
    };

    // Simulate for all final-score values 0–100 (step 5)
    const simulations = [];
    for (let fs = 0; fs <= 100; fs += 5) {
      const r = calculateGrade({ ...currentInput, finalScore: fs }, policy);
      simulations.push({ finalScore: fs, totalMarks: r.totalMarks, letterGrade: r.letterGrade, cgpaPoints: r.cgpaPoints });
    }

    // Also compute specific value
    const specific = calculateGrade(currentInput, policy);

    // Required final for each grade target
    const targets = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-'];
    const required = {};
    targets.forEach(t => {
      required[t] = requiredFinalForGrade(currentInput, policy, t);
    });

    return res.json({ specific, simulations, required, currentInput, policy });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── GET /api/grades/policy/:courseId ────────────────────────────────────────
const getCoursePolicy = async (req, res) => {
  try {
    const policy = await CourseGradingPolicy.findOne({ where: { courseId: req.params.courseId } });
    return res.json(policy || DEFAULT_POLICY);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── PUT /api/grades/policy/:courseId ────────────────────────────────────────
const setCoursePolicy = async (req, res) => {
  try {
    const { courseId } = req.params;
    const [policy] = await CourseGradingPolicy.upsert({ courseId, ...req.body });
    return res.json(policy);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── GET /api/grades/scholarship/:studentId ───────────────────────────────────
const getScholarshipStatus = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.studentId, {
      include: [{ model: SemesterGPA, as: 'semesterGPAs' }],
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Check for F grades or retakes
    const grades = await Grade.findAll({
      include: [{ model: Enrollment, as: 'enrollment', where: { studentId: student.studentId } }],
    });
    const hasF = grades.some(g => g.letterGrade === 'F');

    const eligibility = checkScholarship(student.currentGPA, {
      hasF,
      hasRetake: false,
      completedCredits: student.semesterGPAs.reduce((s, g) => s + (g.creditsEarned || 0), 0),
      minCredits: 12,
    });

    return res.json({
      cgpa: student.currentGPA,
      eligibility,
      semesterGPAs: student.semesterGPAs,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── GET /api/grades/gradesheet/pdf — student downloads their grade sheet ─────
const downloadGradeSheet = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.userId },
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }],
    });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const enrollments = await Enrollment.findAll({
      where: { studentId: student.studentId },
      include: [
        { model: Course, as: 'course', attributes: ['title', 'courseCode', 'credits', 'semester'] },
        { model: Grade,  as: 'grade' },
      ],
      order: [['semester', 'DESC']],
    });

    const semesterGPAs = await SemesterGPA.findAll({
      where: { studentId: student.studentId },
      order: [['semester', 'DESC']],
    });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="grade_sheet_${student.studentId}.pdf"`);
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(18).font('Helvetica-Bold').text('BRAC University', { align: 'center' });
    doc.fontSize(13).font('Helvetica').text('Official Academic Grade Sheet', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── Student info ──
    doc.fontSize(10).font('Helvetica-Bold').text('Student Information', { underline: true });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Name:  ${student.user?.username || '—'}`);
    doc.text(`Email: ${student.user?.email || '—'}`);
    doc.text(`Student ID: ${student.studentCode || student.studentId}`);
    doc.text(`CGPA: ${student.currentGPA || '—'}   |   Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown(0.8);

    // ── Course grades table ──
    doc.font('Helvetica-Bold').fontSize(10).text('Course Grades', { underline: true });
    doc.moveDown(0.4);

    const colX = [50, 110, 290, 350, 410, 460, 510];
    const headers = ['Sem', 'Course', 'Title', 'Cr', 'Total', 'Grd', 'Pts'];

    // Table header row
    doc.font('Helvetica-Bold').fontSize(8.5);
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: colX[i+1] ? colX[i+1] - colX[i] - 4 : 80, continued: i < headers.length - 1 }));
    doc.moveDown(0.2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.2);

    // Rows
    doc.font('Helvetica').fontSize(8.5);
    for (const e of enrollments) {
      const g = e.grade;
      const rowY = doc.y;
      doc.text(e.semester || '—',          colX[0], rowY, { width: 55 });
      doc.text(e.course?.courseCode || '—', colX[1], rowY, { width: 175 });
      doc.text(e.course?.title || '—',      colX[2], rowY, { width: 55, lineBreak: false });
      doc.text(String(e.course?.credits || '—'), colX[3], rowY, { width: 55 });
      doc.text(g ? g.totalMarks?.toFixed(1) : '—',  colX[4], rowY, { width: 45 });
      doc.text(g ? g.letterGrade : '—',     colX[5], rowY, { width: 45 });
      doc.text(g ? String(g.cgpaPoints) : '—', colX[6], rowY, { width: 40 });
      doc.moveDown(0.5);
    }

    if (enrollments.length === 0) {
      doc.text('No enrollment records found.', { align: 'center' });
    }

    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── Semester GPA summary ──
    if (semesterGPAs.length > 0) {
      doc.font('Helvetica-Bold').fontSize(10).text('Semester GPA Summary', { underline: true });
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(9);
      for (const s of semesterGPAs) {
        doc.text(
          `${s.semester}  —  Sem GPA: ${parseFloat(s.semesterGPA).toFixed(2)}  |  CGPA: ${parseFloat(s.cumulativeGPA).toFixed(2)}  |  Credits Earned: ${s.creditsEarned}`
        );
      }
      doc.moveDown(0.5);
    }

    // ── Footer ──
    doc.font('Helvetica').fontSize(8).fillColor('gray')
      .text('This document is auto-generated by the BRACU Portal and is for reference only.', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('downloadGradeSheet:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  submitGrade, getMyGrades, getStudentGrades, getCourseGrades,
  whatIf, getCoursePolicy, setCoursePolicy, getScholarshipStatus,
  downloadGradeSheet,
};
