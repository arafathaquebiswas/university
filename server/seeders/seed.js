require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt  = require('bcryptjs');
const sequelize = require('../config/database');
require('../models');
const {
  Department, Program, User, Student, Faculty, Admin, AccountsStaff,
  Course, CourseGradingPolicy, Grade, Enrollment,
  AttendanceRecord, Scholarship, FinancialRecord,
  Announcement, Notification, SemesterGPA,
} = require('../models');
const { calculateGrade, calcGPA, checkScholarship } = require('../utils/gradingEngine');

const hash = p => bcrypt.hash(p, 12);

async function seed() {
  await sequelize.sync({ force: true });
  console.log('✓ DB synced');

  // ── Departments ─────────────────────────────────────────────────────────────
  const [cse, eee, bba] = await Department.bulkCreate([
    { name: 'Computer Science & Engineering', head: 'Prof. Dr. Sayed Mehedi Azim' },
    { name: 'Electrical & Electronic Engineering', head: 'Prof. Dr. K.N. Hasan' },
    { name: 'Business Administration', head: 'Prof. Dr. M.A. Islam' },
  ]);

  // ── Programs ─────────────────────────────────────────────────────────────────
  const [bscCSE, bscEEE] = await Program.bulkCreate([
    { name: 'B.Sc. in CSE', duration: 4, deptId: cse.deptId },
    { name: 'B.Sc. in EEE', duration: 4, deptId: eee.deptId },
  ]);

  // ── Admin user ───────────────────────────────────────────────────────────────
  const adminUser = await User.create({
    username: 'admin', email: 'admin@bracu.ac.bd',
    passwordHash: await hash('Admin@123'), role: 'admin', deptId: cse.deptId,
  });
  await Admin.create({ userId: adminUser.userId });

  // ── Faculty ──────────────────────────────────────────────────────────────────
  const [fu1, fu2, fu3] = await User.bulkCreate([
    { username: 'dr_hassan',  email: 'ext.dr.hassan_cse@g.bracu.ac.bd',  passwordHash: await hash('Fac@123'), role: 'faculty', deptId: cse.deptId },
    { username: 'dr_rahman',  email: 'ext.dr.rahman_eee@g.bracu.ac.bd',  passwordHash: await hash('Fac@123'), role: 'faculty', deptId: eee.deptId },
    { username: 'ms_sultana', email: 'ext.ms.sultana_cse@g.bracu.ac.bd', passwordHash: await hash('Fac@123'), role: 'faculty', deptId: cse.deptId },
  ]);
  const [fac1, fac2, fac3] = await Faculty.bulkCreate([
    { userId: fu1.userId, officeNumber: 'UB40502', specialization: 'Machine Learning', designation: 'Professor' },
    { userId: fu2.userId, officeNumber: 'UB40404', specialization: 'Power Systems',    designation: 'Assoc. Professor' },
    { userId: fu3.userId, officeNumber: 'UB40506', specialization: 'Software Engg.',   designation: 'Lecturer' },
  ]);

  // ── Students ─────────────────────────────────────────────────────────────────
  const [su1, su2, su3, su4] = await User.bulkCreate([
    { username: 'ali_khan',    email: 'ali.khan_20301001@g.bracu.ac.bd',    passwordHash: await hash('Stu@123'), role: 'student', deptId: cse.deptId },
    { username: 'sara_ahmed',  email: 'sara.ahmed_20301002@g.bracu.ac.bd',  passwordHash: await hash('Stu@123'), role: 'student', deptId: cse.deptId },
    { username: 'rahim_mia',   email: 'rahim.mia_20201003@g.bracu.ac.bd',   passwordHash: await hash('Stu@123'), role: 'student', deptId: eee.deptId },
    { username: 'nusrat_jahan',email: 'nusrat.jahan_21301004@g.bracu.ac.bd',passwordHash: await hash('Stu@123'), role: 'student', deptId: cse.deptId },
  ]);
  const [stu1, stu2, stu3, stu4] = await Student.bulkCreate([
    { userId: su1.userId, majorId: bscCSE.progId, enrollmentYear: 2020, studentCode: 'STU20200001' },
    { userId: su2.userId, majorId: bscCSE.progId, enrollmentYear: 2020, studentCode: 'STU20200002' },
    { userId: su3.userId, majorId: bscEEE.progId, enrollmentYear: 2020, studentCode: 'STU20200003' },
    { userId: su4.userId, majorId: bscCSE.progId, enrollmentYear: 2021, studentCode: 'STU20210004' },
  ]);

  // ── Accounts staff ───────────────────────────────────────────────────────────
  const accUser = await User.create({
    username: 'accounts_staff', email: 'accounts.john@g.bracu.ac.bd',
    passwordHash: await hash('Acc@123'), role: 'accounts_staff',
  });
  await AccountsStaff.create({ userId: accUser.userId, sector: 'accounts' });

  // ── Courses ──────────────────────────────────────────────────────────────────
  const [c1, c2, c3, c4, c5] = await Course.bulkCreate([
    { courseCode:'CSE101', title:'Introduction to Programming', credits:3, progId:bscCSE.progId, facultyId:fac1.facultyId, semester:'Spring 2026', maxCapacity:40 },
    { courseCode:'CSE201', title:'Data Structures & Algorithms', credits:3, progId:bscCSE.progId, facultyId:fac1.facultyId, semester:'Spring 2026', maxCapacity:35 },
    { courseCode:'CSE301', title:'Software Engineering',         credits:3, progId:bscCSE.progId, facultyId:fac3.facultyId, semester:'Spring 2026', maxCapacity:30 },
    { courseCode:'EEE201', title:'Circuit Analysis',             credits:3, progId:bscEEE.progId, facultyId:fac2.facultyId, semester:'Spring 2026', maxCapacity:30 },
    { courseCode:'CSE401', title:'Machine Learning',             credits:3, progId:bscCSE.progId, facultyId:fac1.facultyId, semester:'Spring 2026', maxCapacity:25 },
  ]);

  // ── Grading Policies ─────────────────────────────────────────────────────────
  // CSE101: has lab
  await CourseGradingPolicy.bulkCreate([
    { courseId:c1.courseId, quizWeight:0.20, midtermWeight:0.30, finalWeight:0.40, labWeight:0.10, quizMaxPerItem:10, totalQuizzesPlanned:4, hasLab:true  },
    { courseId:c2.courseId, quizWeight:0.20, midtermWeight:0.30, finalWeight:0.50, labWeight:0.00, quizMaxPerItem:10, totalQuizzesPlanned:4, hasLab:false },
    { courseId:c3.courseId, quizWeight:0.15, midtermWeight:0.35, finalWeight:0.50, labWeight:0.00, quizMaxPerItem:10, totalQuizzesPlanned:3, hasLab:false },
    { courseId:c4.courseId, quizWeight:0.20, midtermWeight:0.30, finalWeight:0.40, labWeight:0.10, quizMaxPerItem:10, totalQuizzesPlanned:4, hasLab:true  },
    { courseId:c5.courseId, quizWeight:0.20, midtermWeight:0.30, finalWeight:0.50, labWeight:0.00, quizMaxPerItem:10, totalQuizzesPlanned:4, hasLab:false },
  ]);

  // ── Scholarships ─────────────────────────────────────────────────────────────
  const [merit, need] = await Scholarship.bulkCreate([
    { name:'Merit Scholarship (50%)', criteria:'CGPA 3.90–3.94 — No F/Retake', amount:42500, minGPA:3.90, isActive:true },
    { name:'BRAC Need-Based',         criteria:'CGPA ≥ 3.00 — Financial need',  amount:20000, minGPA:3.00, isActive:true },
    { name:'Merit Scholarship (25%)', criteria:'CGPA 3.85–3.89 — No F/Retake', amount:21250, minGPA:3.85, isActive:true },
    { name:'Merit Scholarship (100%)',criteria:'CGPA 4.00 — No F/Retake',       amount:85000, minGPA:4.00, isActive:true },
  ]);

  // ── Helper: build + save grade ────────────────────────────────────────────────
  const makeGrade = async (enrollId, courseId, { quizScores, midtermScore, finalScore, labScore }) => {
    const policy = await CourseGradingPolicy.findOne({ where: { courseId } });
    const pObj = policy ? policy.toJSON() : {};
    const result = calculateGrade({ quizScores, midtermScore, finalScore, labScore }, pObj);
    return Grade.create({
      enrollId,
      quizScores,
      quizMaxPerItem:  pObj.quizMaxPerItem || 10,
      totalQuizzes:    quizScores.length,
      midtermScore,
      finalScore,
      labScore,
      hasLab:          pObj.hasLab || false,
      quizAverage:     result.quizDetails.average,
      droppedQuizIdx:  result.quizDetails.droppedIndex,
      totalMarks:      result.totalMarks,
      letterGrade:     result.letterGrade,
      cgpaPoints:      result.cgpaPoints,
      quizWeight:      pObj.quizWeight    || 0.20,
      midtermWeight:   pObj.midtermWeight || 0.30,
      finalWeight:     pObj.finalWeight   || 0.40,
      labWeight:       pObj.labWeight     || 0.10,
      isFinalized:     true,
    });
  };

  // ── Enrollments + Grades ──────────────────────────────────────────────────────
  // ali_khan: CSE101, CSE201, CSE401 (3 courses)
  const [e1, e2, e3] = await Enrollment.bulkCreate([
    { studentId:stu1.studentId, courseId:c1.courseId, semester:'Spring 2025', status:'completed', attendancePercentage:92.5 },
    { studentId:stu1.studentId, courseId:c2.courseId, semester:'Spring 2025', status:'completed', attendancePercentage:88.0 },
    { studentId:stu1.studentId, courseId:c5.courseId, semester:'Spring 2025', status:'active',    attendancePercentage:95.0 },
  ]);
  // CSE101: quizzes [9,8,7,10] → drop 7, lab present
  await makeGrade(e1.enrollId, c1.courseId, { quizScores:[9,8,7,10], midtermScore:75, finalScore:82, labScore:88 });
  // CSE201: quizzes [10,9,8,7] → drop 7
  await makeGrade(e2.enrollId, c2.courseId, { quizScores:[10,9,8,7], midtermScore:80, finalScore:88 });
  // CSE401: only midterm entered so far (in-progress)
  await Grade.create({
    enrollId:e3.enrollId, quizScores:[8,9,7], quizMaxPerItem:10, totalQuizzes:3,
    midtermScore:78, hasLab:false,
    quizAverage:90, droppedQuizIdx:2,
    quizWeight:0.20, midtermWeight:0.30, finalWeight:0.50, labWeight:0.00,
    isFinalized:false,
  });

  // sara_ahmed: CSE101, CSE301, CSE201
  const [e4, e5, e6] = await Enrollment.bulkCreate([
    { studentId:stu2.studentId, courseId:c1.courseId, semester:'Spring 2025', status:'completed', attendancePercentage:78.5 },
    { studentId:stu2.studentId, courseId:c3.courseId, semester:'Spring 2025', status:'completed', attendancePercentage:85.0 },
    { studentId:stu2.studentId, courseId:c2.courseId, semester:'Spring 2025', status:'active',    attendancePercentage:72.0 },
  ]);
  await makeGrade(e4.enrollId, c1.courseId, { quizScores:[7,8,6,9], midtermScore:70, finalScore:75, labScore:80 });
  await makeGrade(e5.enrollId, c3.courseId, { quizScores:[9,10,8],   midtermScore:82, finalScore:85 });

  // rahim_mia: EEE201
  const [e7] = await Enrollment.bulkCreate([
    { studentId:stu3.studentId, courseId:c4.courseId, semester:'Spring 2025', status:'completed', attendancePercentage:90.0 },
  ]);
  await makeGrade(e7.enrollId, c4.courseId, { quizScores:[8,7,9,10], midtermScore:65, finalScore:72, labScore:85 });

  // nusrat_jahan: high achiever → merit scholarship eligible
  const [e8, e9, e10] = await Enrollment.bulkCreate([
    { studentId:stu4.studentId, courseId:c1.courseId, semester:'Spring 2025', status:'completed', attendancePercentage:98.0 },
    { studentId:stu4.studentId, courseId:c2.courseId, semester:'Spring 2025', status:'completed', attendancePercentage:96.0 },
    { studentId:stu4.studentId, courseId:c5.courseId, semester:'Spring 2025', status:'completed', attendancePercentage:94.0 },
  ]);
  await makeGrade(e8.enrollId,  c1.courseId, { quizScores:[10,9,10,10], midtermScore:95, finalScore:97, labScore:98 });
  await makeGrade(e9.enrollId,  c2.courseId, { quizScores:[10,10,9,10], midtermScore:92, finalScore:96 });
  await makeGrade(e10.enrollId, c5.courseId, { quizScores:[9,10,10,9],  midtermScore:93, finalScore:95 });

  // ── Recalculate GPAs from grades ──────────────────────────────────────────────
  const computeAndSaveGPA = async (student, semId) => {
    const grades = await Grade.findAll({
      where: { isFinalized: true },
      include: [{ model: Enrollment, as: 'enrollment', where: { studentId: student.studentId, status:'completed' }, include: [{ model: Course, as: 'course' }] }],
    });
    if (!grades.length) return;
    const items = grades.map(g => ({ credits: g.enrollment.course.credits, cgpaPoints: g.cgpaPoints }));
    const gpa = calcGPA(items);
    const semCred = items.reduce((s,i) => s + i.credits, 0);
    await SemesterGPA.create({ studentId:student.studentId, semester:'Spring 2025', semesterGPA:gpa, creditsAttempted:semCred, creditsEarned:semCred, cumulativeGPA:gpa, totalCreditsEarned:semCred });
    await student.update({ currentGPA: gpa });
    return gpa;
  };
  await computeAndSaveGPA(stu1, 1);
  await computeAndSaveGPA(stu2, 2);
  await computeAndSaveGPA(stu3, 3);
  await computeAndSaveGPA(stu4, 4);

  // ── Attendance Records ────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 2*86400000).toISOString().split('T')[0];

  await AttendanceRecord.bulkCreate([
    // CSE101 – 3 sessions
    { studentId:stu1.studentId, courseId:c1.courseId, date:twoDaysAgo, status:'present', markedBy:fu1.userId },
    { studentId:stu1.studentId, courseId:c1.courseId, date:yesterday,  status:'present', markedBy:fu1.userId },
    { studentId:stu1.studentId, courseId:c1.courseId, date:today,      status:'present', markedBy:fu1.userId },
    { studentId:stu2.studentId, courseId:c1.courseId, date:twoDaysAgo, status:'present', markedBy:fu1.userId },
    { studentId:stu2.studentId, courseId:c1.courseId, date:yesterday,  status:'absent',  markedBy:fu1.userId },
    { studentId:stu2.studentId, courseId:c1.courseId, date:today,      status:'present', markedBy:fu1.userId },
    // CSE201
    { studentId:stu1.studentId, courseId:c2.courseId, date:yesterday, status:'present', markedBy:fu1.userId },
    { studentId:stu1.studentId, courseId:c2.courseId, date:today,     status:'present', markedBy:fu1.userId },
    // EEE201
    { studentId:stu3.studentId, courseId:c4.courseId, date:yesterday, status:'present', markedBy:fu2.userId },
    { studentId:stu3.studentId, courseId:c4.courseId, date:today,     status:'present', markedBy:fu2.userId },
    // sara – low attendance warning
    { studentId:stu2.studentId, courseId:c2.courseId, date:yesterday, status:'absent', markedBy:fu1.userId },
    { studentId:stu2.studentId, courseId:c2.courseId, date:today,     status:'absent', markedBy:fu1.userId },
  ]);

  // ── Financial Records ─────────────────────────────────────────────────────────
  // Fee rules: BDT 20,000 per course + BDT 10,000 semester registration fee
  const COURSE_FEE   = 20000;
  const SEMESTER_FEE = 10000;
  const DUE = '2025-01-15';

  // ali_khan: 3 courses (CSE101, CSE201, CSE401) → 70,000 — paid
  await FinancialRecord.bulkCreate([
    { studentId:stu1.studentId, amount:SEMESTER_FEE, type:'tuition', status:'paid', semester:'Spring 2025', dueDate:DUE, paymentDate:'2025-01-10', description:'Semester Registration Fee — Spring 2025' },
    { studentId:stu1.studentId, amount:COURSE_FEE,   type:'tuition', status:'paid', semester:'Spring 2025', dueDate:DUE, paymentDate:'2025-01-10', description:'Course Fee: Introduction to Programming (CSE101)' },
    { studentId:stu1.studentId, amount:COURSE_FEE,   type:'tuition', status:'paid', semester:'Spring 2025', dueDate:DUE, paymentDate:'2025-01-10', description:'Course Fee: Data Structures & Algorithms (CSE201)' },
    { studentId:stu1.studentId, amount:COURSE_FEE,   type:'tuition', status:'paid', semester:'Spring 2025', dueDate:DUE, paymentDate:'2025-01-10', description:'Course Fee: Machine Learning (CSE401)' },
  ]);

  // sara_ahmed: 3 courses (CSE101, CSE301, CSE201) → 70,000 — pending
  await FinancialRecord.bulkCreate([
    { studentId:stu2.studentId, amount:SEMESTER_FEE, type:'tuition', status:'pending', semester:'Spring 2025', dueDate:DUE, description:'Semester Registration Fee — Spring 2025' },
    { studentId:stu2.studentId, amount:COURSE_FEE,   type:'tuition', status:'pending', semester:'Spring 2025', dueDate:DUE, description:'Course Fee: Introduction to Programming (CSE101)' },
    { studentId:stu2.studentId, amount:COURSE_FEE,   type:'tuition', status:'pending', semester:'Spring 2025', dueDate:DUE, description:'Course Fee: Software Engineering (CSE301)' },
    { studentId:stu2.studentId, amount:COURSE_FEE,   type:'tuition', status:'pending', semester:'Spring 2025', dueDate:DUE, description:'Course Fee: Data Structures & Algorithms (CSE201)' },
  ]);

  // rahim_mia: 1 course (EEE201) → 30,000 — overdue
  await FinancialRecord.bulkCreate([
    { studentId:stu3.studentId, amount:SEMESTER_FEE, type:'tuition', status:'overdue', semester:'Spring 2025', dueDate:DUE, description:'Semester Registration Fee — Spring 2025' },
    { studentId:stu3.studentId, amount:COURSE_FEE,   type:'tuition', status:'overdue', semester:'Spring 2025', dueDate:DUE, description:'Course Fee: Circuit Analysis (EEE201)' },
  ]);

  // nusrat_jahan: 3 courses (CSE101, CSE201, CSE401) → 70,000 — paid + merit scholarship
  await FinancialRecord.bulkCreate([
    { studentId:stu4.studentId, amount:SEMESTER_FEE,        type:'tuition',     status:'paid', semester:'Spring 2025', dueDate:DUE, paymentDate:'2025-01-08', description:'Semester Registration Fee — Spring 2025' },
    { studentId:stu4.studentId, amount:COURSE_FEE,          type:'tuition',     status:'paid', semester:'Spring 2025', dueDate:DUE, paymentDate:'2025-01-08', description:'Course Fee: Introduction to Programming (CSE101)' },
    { studentId:stu4.studentId, amount:COURSE_FEE,          type:'tuition',     status:'paid', semester:'Spring 2025', dueDate:DUE, paymentDate:'2025-01-08', description:'Course Fee: Data Structures & Algorithms (CSE201)' },
    { studentId:stu4.studentId, amount:COURSE_FEE,          type:'tuition',     status:'paid', semester:'Spring 2025', dueDate:DUE, paymentDate:'2025-01-08', description:'Course Fee: Machine Learning (CSE401)' },
    { studentId:stu4.studentId, amount:merit.amount,        type:'scholarship', status:'paid', semester:'Spring 2025', scholarshipId:merit.scholarshipId, paymentDate:'2025-01-10', description:'Merit Scholarship 50%' },
  ]);

  // ── Announcements ─────────────────────────────────────────────────────────────
  await Announcement.bulkCreate([
    { title:'Welcome to Spring 2025', content:'Classes begin January 5, 2025. Check your timetable.', isGlobal:true, createdBy:adminUser.userId },
    { title:'CSE101 Assignment 1',    content:'Assignment 1 due Jan 30. Submit via portal.', courseId:c1.courseId, createdBy:fu1.userId },
    { title:'Mid-term Schedule',      content:'Mid-term exams: Feb 15–20, 2025.', isGlobal:true, createdBy:adminUser.userId },
    { title:'Quiz 4 Rescheduled',     content:'Quiz 4 for CSE201 rescheduled to next week.', courseId:c2.courseId, createdBy:fu1.userId },
  ]);

  // ── Notifications ─────────────────────────────────────────────────────────────
  await Notification.bulkCreate([
    { userId:su1.userId, type:'grade',       message:'Grade finalized for CSE101: B+ (81.8)', status:'unread' },
    { userId:su1.userId, type:'payment',     message:'Spring 2025 tuition paid. Thank you!',  status:'read'   },
    { userId:su2.userId, type:'attendance',  message:'⚠ Warning: Attendance in CSE201 is below 75%', status:'unread' },
    { userId:su2.userId, type:'payment',     message:'Spring 2025 fees BDT 70,000 are pending (3 courses × BDT 20,000 + BDT 10,000 semester fee). Due Jan 15.', status:'unread' },
    { userId:su4.userId, type:'payment',     message:'Merit Scholarship 50% applied — BDT 42,500 credited!', status:'unread' },
    { userId:su4.userId, type:'grade',       message:'Grade finalized for CSE101: A+ (97.2)', status:'unread' },
    { userId:su3.userId, type:'payment',     message:'⚠ Overdue: Spring 2025 fees BDT 30,000 are overdue (1 course × BDT 20,000 + BDT 10,000 semester fee).', status:'unread' },
  ]);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log('\n✅  Seed complete!\n');
  console.log('Credentials:');
  console.log('  Admin:    admin@bracu.ac.bd          / Admin@123');
  console.log('  Faculty:  ext.dr.hassan_cse@g.bracu.ac.bd / Fac@123');
  console.log('  Student:  ali.khan_20301001@g.bracu.ac.bd  / Stu@123');
  console.log('  Accounts: accounts.john@g.bracu.ac.bd      / Acc@123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
