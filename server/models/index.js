const Department          = require('./Department');
const Program             = require('./Program');
const User                = require('./User');
const Student             = require('./Student');
const Faculty             = require('./Faculty');
const Admin               = require('./Admin');
const AccountsStaff       = require('./AccountsStaff');
const Course              = require('./Course');
const CourseGradingPolicy = require('./CourseGradingPolicy');
const Grade               = require('./Grade');
const Enrollment          = require('./Enrollment');
const AttendanceRecord    = require('./AttendanceRecord');
const Scholarship         = require('./Scholarship');
const FinancialRecord     = require('./FinancialRecord');
const Announcement        = require('./Announcement');
const Notification        = require('./Notification');
const SemesterGPA         = require('./SemesterGPA');
const CourseMaterial      = require('./CourseMaterial');

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

module.exports = {
  Department, Program, User, Student, Faculty, Admin, AccountsStaff,
  Course, CourseGradingPolicy, Grade, Enrollment,
  AttendanceRecord, Scholarship, FinancialRecord,
  Announcement, Notification, SemesterGPA, CourseMaterial,
};
