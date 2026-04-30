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
      order: [['semester', 'DESC'], ['createdAt', 'ASC']],
    });

    // Compute semester GPA summary dynamically from finalized grades
    const semMap = {};
    for (const e of enrollments) {
      if (!e.grade?.isFinalized) continue;
      const sem = e.semester;
      if (!semMap[sem]) semMap[sem] = { creditsAttempted: 0, weightedPoints: 0, creditsEarned: 0 };
      const credits = e.course?.credits || 3;
      semMap[sem].creditsAttempted += credits;
      semMap[sem].weightedPoints   += (e.grade.cgpaPoints || 0) * credits;
      if (e.grade.letterGrade !== 'F') semMap[sem].creditsEarned += credits;
    }
    let cumPts = 0, cumCr = 0;
    const semesterGPAs = Object.keys(semMap).sort().map(sem => {
      const { creditsAttempted, weightedPoints, creditsEarned } = semMap[sem];
      const semesterGPA = creditsAttempted > 0 ? weightedPoints / creditsAttempted : 0;
      cumPts += weightedPoints;
      cumCr  += creditsAttempted;
      return {
        semester:        sem,
        semesterGPA,
        cumulativeGPA:   cumCr > 0 ? cumPts / cumCr : 0,
        creditsAttempted,
        creditsEarned,
      };
    }).reverse();

    // ── PDF setup ──────────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 0, size: 'A4', info: {
      Title: 'BRACU Official Academic Grade Sheet',
      Author: 'BRACU Academic Portal',
    }});
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gradesheet_${student.studentCode || student.studentId}.pdf"`);
    doc.pipe(res);

    // Layout constants
    const PAGE_W = 595.28;
    const PH    = 841.89;
    const L = 50, R = PAGE_W - 50, W = R - L;   // L=50 R=545.28 W=495.28
    let y = 0;

    // ── Footer helper (drawn on every page) ───────────────────────────────────
    const drawFooter = () => {
      doc.moveTo(L, PH - 36).lineTo(R, PH - 36)
         .strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
         .text(
           'This document is auto-generated by the BRACU Academic Portal and is for official reference only.',
           L, PH - 28, { width: W, align: 'center' }
         );
    };
    doc.on('pageAdded', () => { drawFooter(); });

    // ── Blue header band ───────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 85).fill('#1e3a8a');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(22)
       .text('BRAC University', 0, 16, { width: PAGE_W, align: 'center' });
    doc.font('Helvetica').fontSize(11)
       .text('Official Academic Grade Sheet', 0, 46, { width: PAGE_W, align: 'center' });
    // gold accent line
    doc.rect(0, 79, PAGE_W, 4).fill('#f59e0b');
    y = 98;

    // ── Student info card ──────────────────────────────────────────────────────
    doc.rect(L, y, W, 88).fill('#eff6ff');
    doc.rect(L, y, 4, 88).fill('#1e3a8a');   // left accent bar

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e40af')
       .text('STUDENT INFORMATION', L + 12, y + 7);
    doc.moveTo(L + 12, y + 17).lineTo(R - 10, y + 17)
       .strokeColor('#bfdbfe').lineWidth(0.5).stroke();

    const C2X = L + W / 2 + 5;
    const infoRows = [
      ['Name',        student.user?.username  || '—', 'Student ID',     student.studentCode || String(student.studentId)],
      ['Email',       student.user?.email     || '—', 'Enroll Year',    String(student.enrollmentYear || '—')],
      ['Acad. Status',(student.academicStatus || 'good_standing').split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
                                                       'CGPA',           `${parseFloat(student.currentGPA || 0).toFixed(2)} / 4.00`],
      ['Generated',   new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), '', ''],
    ];

    infoRows.forEach(([l1, v1, l2, v2], i) => {
      const ry = y + 22 + i * 15;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text(l1 + ':', L + 12, ry, { width: 82 });
      doc.font('Helvetica').fontSize(8).fillColor('#0f172a').text(v1, L + 96, ry, { width: C2X - L - 100 });
      if (l2) {
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text(l2 + ':', C2X, ry, { width: 82 });
        doc.font('Helvetica').fontSize(8).fillColor('#0f172a').text(v2, C2X + 84, ry, { width: R - C2X - 84 });
      }
    });
    y += 100;

    // ── Course Grades table ────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e3a8a')
       .text('COURSE GRADES', L, y);
    y += 14;

    // Column definitions — total width = 495
    const COLS = [
      { x: L,    w: 82,  label: 'Semester',    align: 'left'   },
      { x: 132,  w: 54,  label: 'Code',        align: 'left'   },
      { x: 186,  w: 183, label: 'Course Title', align: 'left'   },
      { x: 369,  w: 28,  label: 'Cr',          align: 'center' },
      { x: 397,  w: 50,  label: 'Total',       align: 'center' },
      { x: 447,  w: 40,  label: 'Grade',       align: 'center' },
      { x: 487,  w: 58,  label: 'GPA Pts',     align: 'center' },
    ];

    const drawTableRow = (cols, data, opts = {}) => {
      const { bg = null, textColor = '#0f172a', bold = false, fs = 8.5 } = opts;
      const font = bold ? 'Helvetica-Bold' : 'Helvetica';

      // Calculate row height from tallest cell
      const heights = data.map((txt, i) =>
        doc.font(font).fontSize(fs).heightOfString(String(txt ?? '—'), { width: cols[i].w - 8 })
      );
      const rowH = Math.max(...heights) + 12;

      // Page break guard
      if (y + rowH > PH - 50) {
        doc.addPage();
        y = 50;
        // Redraw header on new page
        drawTableRow(cols, cols.map(c => c.label), { bg: '#1e3a8a', textColor: 'white', bold: true, fs });
      }

      // Background fill
      if (bg) doc.rect(L, y, W, rowH).fill(bg);

      // Horizontal bottom border
      doc.moveTo(L, y + rowH).lineTo(R, y + rowH)
         .strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      // Vertical column separators
      cols.slice(1).forEach(c => {
        doc.moveTo(c.x, y).lineTo(c.x, y + rowH)
           .strokeColor('#e2e8f0').lineWidth(0.3).stroke();
      });

      // Cell text
      doc.font(font).fontSize(fs).fillColor(textColor);
      data.forEach((txt, i) => {
        doc.text(String(txt ?? '—'), cols[i].x + 4, y + 6, {
          width: cols[i].w - 8,
          align: cols[i].align || 'left',
          lineBreak: true,
        });
      });

      y += rowH;
    };

    // Header
    drawTableRow(COLS, COLS.map(c => c.label), { bg: '#1e3a8a', textColor: 'white', bold: true });

    // Data rows
    enrollments.forEach((e, idx) => {
      const g = e.grade;
      drawTableRow(COLS, [
        e.semester                               || '—',
        e.course?.courseCode                     || '—',
        e.course?.title                          || '—',
        e.course?.credits                        ?? '—',
        g?.totalMarks  != null ? g.totalMarks.toFixed(1)  : '—',
        g?.letterGrade                           || '—',
        g?.cgpaPoints  != null ? g.cgpaPoints.toFixed(2)  : '—',
      ], { bg: idx % 2 === 0 ? '#f8fafc' : 'white' });
    });

    if (enrollments.length === 0) {
      drawTableRow(COLS, ['No enrollment records found.', '', '', '', '', '', '']);
    }

    y += 18;

    // ── Semester GPA Summary table ─────────────────────────────────────────────
    if (semesterGPAs.length > 0) {
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e3a8a')
         .text('SEMESTER GPA SUMMARY', L, y);
      y += 14;

      const GCOLS = [
        { x: L,    w: 118, label: 'Semester',           align: 'left'   },
        { x: 168,  w: 80,  label: 'Semester GPA',       align: 'center' },
        { x: 248,  w: 80,  label: 'Cumulative GPA',     align: 'center' },
        { x: 328,  w: 110, label: 'Credits Attempted',  align: 'center' },
        { x: 438,  w: 107, label: 'Credits Earned',     align: 'center' },
      ];

      drawTableRow(GCOLS, GCOLS.map(c => c.label), { bg: '#1e3a8a', textColor: 'white', bold: true });
      semesterGPAs.forEach((s, i) => {
        drawTableRow(GCOLS, [
          s.semester,
          parseFloat(s.semesterGPA).toFixed(2),
          parseFloat(s.cumulativeGPA).toFixed(2),
          String(s.creditsAttempted),
          String(s.creditsEarned),
        ], { bg: i % 2 === 0 ? '#f8fafc' : 'white' });
      });
    }

    drawFooter();
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
