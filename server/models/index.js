const Department             = require('./Department');
const Program                = require('./Program');
const User                   = require('./User');
const Student                = require('./Student');
const Faculty                = require('./Faculty');
const Admin                  = require('./Admin');
const AccountsStaff          = require('./AccountsStaff');
const Course                 = require('./Course');
const CourseGradingPolicy    = require('./CourseGradingPolicy');
const Grade                  = require('./Grade');
const Enrollment             = require('./Enrollment');
const AttendanceRecord       = require('./AttendanceRecord');
const Scholarship            = require('./Scholarship');
const FinancialRecord        = require('./FinancialRecord');
const Announcement           = require('./Announcement');
const Notification           = require('./Notification');
const SemesterGPA            = require('./SemesterGPA');
const CourseMaterial         = require('./CourseMaterial');
const ImportantDate          = require('./ImportantDate');
const Quiz                   = require('./Quiz');
const QuizSubmission         = require('./QuizSubmission');
const QuizQuestion           = require('./QuizQuestion');
const QuizAttempt            = require('./QuizAttempt');
const Timetable              = require('./Timetable');
const ScholarshipApplication = require('./ScholarshipApplication');
const InstallmentPlan        = require('./InstallmentPlan');
const Installment            = require('./Installment');
const AuditLog               = require('./AuditLog');

// ─── Department ↔ Program ─────────────────────────────────────────────────────
Department.hasMany(Program,  { foreignKey: 'deptId', as: 'programs' });
Program.belongsTo(Department,{ foreignKey: 'deptId', as: 'department' });

// ─── Department ↔ User ────────────────────────────────────────────────────────
Department.hasMany(User,  { foreignKey: 'deptId', as: 'users' });
User.belongsTo(Department,{ foreignKey: 'deptId', as: 'department' });

// ─── User ↔ profiles ─────────────────────────────────────────────────────────
User.hasOne(Student,      { foreignKey: 'userId', as: 'studentProfile' });
Student.belongsTo(User,   { foreignKey: 'userId', as: 'user' });

User.hasOne(Faculty,      { foreignKey: 'userId', as: 'facultyProfile' });
Faculty.belongsTo(User,   { foreignKey: 'userId', as: 'user' });

User.hasOne(Admin,        { foreignKey: 'userId', as: 'adminProfile' });
Admin.belongsTo(User,     { foreignKey: 'userId', as: 'user' });

User.hasOne(AccountsStaff,    { foreignKey: 'userId', as: 'staffProfile' });
AccountsStaff.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ─── Program ↔ Student (major) ────────────────────────────────────────────────
Program.hasMany(Student,  { foreignKey: 'majorId', as: 'students' });
Student.belongsTo(Program,{ foreignKey: 'majorId', as: 'major' });

// ─── Program ↔ Course ────────────────────────────────────────────────────────
Program.hasMany(Course,  { foreignKey: 'progId', as: 'courses' });
Course.belongsTo(Program,{ foreignKey: 'progId', as: 'program' });

// ─── Faculty ↔ Course ────────────────────────────────────────────────────────
Faculty.hasMany(Course,  { foreignKey: 'facultyId', as: 'courses' });
Course.belongsTo(Faculty,{ foreignKey: 'facultyId', as: 'faculty' });

// ─── Course ↔ GradingPolicy ──────────────────────────────────────────────────
Course.hasOne(CourseGradingPolicy,              { foreignKey: 'courseId', as: 'gradingPolicy' });
CourseGradingPolicy.belongsTo(Course,           { foreignKey: 'courseId', as: 'course' });

// ─── Enrollment ──────────────────────────────────────────────────────────────
Student.hasMany(Enrollment,   { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Course.hasMany(Enrollment,   { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// ─── Enrollment ↔ Grade (Grade owns the FK) ──────────────────────────────────
Enrollment.hasOne(Grade,  { foreignKey: 'enrollId', as: 'grade' });
Grade.belongsTo(Enrollment,{ foreignKey: 'enrollId', as: 'enrollment' });

// ─── AttendanceRecord ────────────────────────────────────────────────────────
Student.hasMany(AttendanceRecord,    { foreignKey: 'studentId', as: 'attendanceRecords' });
AttendanceRecord.belongsTo(Student,  { foreignKey: 'studentId', as: 'student' });

Course.hasMany(AttendanceRecord,    { foreignKey: 'courseId', as: 'attendanceRecords' });
AttendanceRecord.belongsTo(Course,  { foreignKey: 'courseId', as: 'course' });

// ─── FinancialRecord ─────────────────────────────────────────────────────────
Student.hasMany(FinancialRecord,     { foreignKey: 'studentId', as: 'financialRecords' });
FinancialRecord.belongsTo(Student,   { foreignKey: 'studentId', as: 'student' });

Scholarship.hasMany(FinancialRecord,  { foreignKey: 'scholarshipId', as: 'financialRecords' });
FinancialRecord.belongsTo(Scholarship,{ foreignKey: 'scholarshipId', as: 'scholarship' });

// ─── SemesterGPA ─────────────────────────────────────────────────────────────
Student.hasMany(SemesterGPA,  { foreignKey: 'studentId', as: 'semesterGPAs' });
SemesterGPA.belongsTo(Student,{ foreignKey: 'studentId', as: 'student' });

// ─── Announcement ────────────────────────────────────────────────────────────
Course.hasMany(Announcement,    { foreignKey: 'courseId',  as: 'announcements' });
Announcement.belongsTo(Course,  { foreignKey: 'courseId',  as: 'course' });

Department.hasMany(Announcement,   { foreignKey: 'deptId', as: 'announcements' });
Announcement.belongsTo(Department, { foreignKey: 'deptId', as: 'department' });

User.hasMany(Announcement,   { foreignKey: 'createdBy', as: 'announcements' });
Announcement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// ─── Notification ────────────────────────────────────────────────────────────
User.hasMany(Notification,   { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ─── CourseMaterial ───────────────────────────────────────────────────────────
Course.hasMany(CourseMaterial,    { foreignKey: 'courseId',   as: 'materials' });
CourseMaterial.belongsTo(Course,  { foreignKey: 'courseId',   as: 'course' });
User.hasMany(CourseMaterial,      { foreignKey: 'uploadedBy', as: 'uploadedMaterials' });
CourseMaterial.belongsTo(User,    { foreignKey: 'uploadedBy', as: 'uploader' });

// ─── Quiz ─────────────────────────────────────────────────────────────────────
Course.hasMany(Quiz,         { foreignKey: 'courseId', as: 'quizzes' });
Quiz.belongsTo(Course,       { foreignKey: 'courseId', as: 'course' });

Quiz.hasMany(QuizSubmission,        { foreignKey: 'quizId', as: 'submissions' });
QuizSubmission.belongsTo(Quiz,      { foreignKey: 'quizId', as: 'quiz' });

Student.hasMany(QuizSubmission,     { foreignKey: 'studentId', as: 'quizSubmissions' });
QuizSubmission.belongsTo(Student,   { foreignKey: 'studentId', as: 'student' });

Quiz.hasMany(QuizQuestion,          { foreignKey: 'quizId', as: 'questions' });
QuizQuestion.belongsTo(Quiz,        { foreignKey: 'quizId', as: 'quiz' });

Quiz.hasMany(QuizAttempt,           { foreignKey: 'quizId', as: 'attempts' });
QuizAttempt.belongsTo(Quiz,         { foreignKey: 'quizId', as: 'quiz' });

Student.hasMany(QuizAttempt,        { foreignKey: 'studentId', as: 'quizAttempts' });
QuizAttempt.belongsTo(Student,      { foreignKey: 'studentId', as: 'student' });

User.hasMany(QuizAttempt,           { foreignKey: 'gradedBy', as: 'gradedQuizAttempts' });
QuizAttempt.belongsTo(User,         { foreignKey: 'gradedBy', as: 'grader' });

// ─── Timetable ────────────────────────────────────────────────────────────────
Course.hasMany(Timetable,    { foreignKey: 'courseId', as: 'timetableSlots' });
Timetable.belongsTo(Course,  { foreignKey: 'courseId', as: 'course' });

// ─── ScholarshipApplication ───────────────────────────────────────────────────
Student.hasMany(ScholarshipApplication,      { foreignKey: 'studentId',    as: 'scholarshipApplications' });
ScholarshipApplication.belongsTo(Student,    { foreignKey: 'studentId',    as: 'student' });

Scholarship.hasMany(ScholarshipApplication,  { foreignKey: 'scholarshipId', as: 'applications' });
ScholarshipApplication.belongsTo(Scholarship,{ foreignKey: 'scholarshipId', as: 'scholarship' });

User.hasMany(ScholarshipApplication,         { foreignKey: 'reviewedBy', as: 'reviewedApplications' });
ScholarshipApplication.belongsTo(User,       { foreignKey: 'reviewedBy', as: 'reviewer' });

// ─── Student registration reviewer ───────────────────────────────────────────
User.hasMany(Student,    { foreignKey: 'reviewedBy', as: 'approvedStudents' });
Student.belongsTo(User,  { foreignKey: 'reviewedBy', as: 'approver' });

// ─── InstallmentPlan / Installment ────────────────────────────────────────────
Student.hasMany(InstallmentPlan,      { foreignKey: 'studentId', as: 'installmentPlans' });
InstallmentPlan.belongsTo(Student,    { foreignKey: 'studentId', as: 'student' });

User.hasMany(InstallmentPlan,         { foreignKey: 'createdBy', as: 'createdPlans' });
InstallmentPlan.belongsTo(User,       { foreignKey: 'createdBy', as: 'creator' });

InstallmentPlan.hasMany(Installment,  { foreignKey: 'planId', as: 'installments' });
Installment.belongsTo(InstallmentPlan,{ foreignKey: 'planId', as: 'plan' });

// ─── AuditLog ─────────────────────────────────────────────────────────────────
User.hasMany(AuditLog,   { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  Department, Program, User, Student, Faculty, Admin, AccountsStaff,
  Course, CourseGradingPolicy, Grade, Enrollment,
  AttendanceRecord, Scholarship, FinancialRecord,
  Announcement, Notification, SemesterGPA, CourseMaterial, ImportantDate,
  Quiz, QuizSubmission, QuizQuestion, QuizAttempt, Timetable, ScholarshipApplication,
  InstallmentPlan, Installment, AuditLog,
};
