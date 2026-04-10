const bcrypt = require('bcryptjs');
const { Department, Program, User, Student, Faculty, Admin, AccountsStaff, Course, Enrollment, Scholarship, sequelize } = require('../models');
const db = require('../config/database');

// ─── Departments ─────────────────────────────────────────────────────────────
const getDepartments = async (req, res) => {
  try {
    const depts = await Department.findAll({ include: [{ association: 'programs' }] });
    return res.json(depts);
  } catch (err) { return res.status(500).json({ error: 'Server error' }); }
};

const createDepartment = async (req, res) => {
  try {
    const { name, head } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const dept = await Department.create({ name, head });
    return res.status(201).json(dept);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Department already exists' });
    return res.status(500).json({ error: 'Server error' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    await dept.update(req.body);
    return res.json(dept);
  } catch (err) { return res.status(500).json({ error: 'Server error' }); }
};

const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    const programCount = await Program.count({ where: { deptId: req.params.id } });
    if (programCount > 0) {
      return res.status(400).json({
        error: 'Department has programs — choose a merge target first',
        programsExist: true,
        programCount,
      });
    }

    await dept.destroy();
    return res.json({ message: 'Department deleted' });
  } catch (err) { return res.status(500).json({ error: 'Server error' }); }
};

const mergeDepartment = async (req, res) => {
  const t = await db.transaction();
  try {
    const { fromId, toId } = req.body;
    if (!fromId || !toId) return res.status(400).json({ error: 'fromId and toId are required' });
    if (String(fromId) === String(toId)) return res.status(400).json({ error: 'Cannot merge a department into itself' });

    const [from, to] = await Promise.all([
      Department.findByPk(fromId),
      Department.findByPk(toId),
    ]);
    if (!from) return res.status(404).json({ error: 'Source department not found' });
    if (!to)   return res.status(404).json({ error: 'Target department not found' });

    // Move programs and users to target department atomically
    await Program.update({ deptId: toId }, { where: { deptId: fromId }, transaction: t });
    await User.update(   { deptId: toId }, { where: { deptId: fromId }, transaction: t });
    await from.destroy({ transaction: t });
    await t.commit();

    return res.json({ message: `All programs moved to "${to.name}" and source department deleted` });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── Programs ─────────────────────────────────────────────────────────────────
const getPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll({ include: [{ association: 'department' }] });
    return res.json(programs);
  } catch (err) { return res.status(500).json({ error: 'Server error' }); }
};

const createProgram = async (req, res) => {
  try {
    const { name, duration, deptId } = req.body;
    if (!name || !duration || !deptId) return res.status(400).json({ error: 'name, duration and deptId are required' });
    const prog = await Program.create({ name, duration, deptId });
    return res.status(201).json(prog);
  } catch (err) { return res.status(500).json({ error: 'Server error' }); }
};

const updateProgram = async (req, res) => {
  try {
    const prog = await Program.findByPk(req.params.id);
    if (!prog) return res.status(404).json({ error: 'Program not found' });
    await prog.update(req.body);
    return res.json(prog);
  } catch (err) { return res.status(500).json({ error: 'Server error' }); }
};

// ─── Admin creates users ──────────────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { username, email, password, role, deptId, majorId, specialization, officeNumber } = req.body;
    if (!username || !email || !password || !role)
      return res.status(400).json({ error: 'username, email, password and role are required' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash, role, deptId });

    if (role === 'student') {
      const year = new Date().getFullYear();
      await Student.create({ userId: user.userId, majorId, enrollmentYear: year, studentCode: `STU${year}${String(user.userId).padStart(4, '0')}` });
    } else if (role === 'faculty') {
      await Faculty.create({ userId: user.userId, specialization, officeNumber });
    } else if (role === 'admin') {
      await Admin.create({ userId: user.userId });
    } else if (role === 'accounts_staff') {
      await AccountsStaff.create({ userId: user.userId, sector: 'accounts' });
    } else if (role === 'library_staff') {
      await AccountsStaff.create({ userId: user.userId, sector: 'library' });
    }

    const { passwordHash: _, ...safe } = user.toJSON();
    return res.status(201).json(safe);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Email or username already exists' });
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── Scholarship CRUD ─────────────────────────────────────────────────────────
const createScholarship = async (req, res) => {
  try {
    const s = await Scholarship.create(req.body);
    return res.status(201).json(s);
  } catch (err) { return res.status(500).json({ error: 'Server error' }); }
};

const updateScholarship = async (req, res) => {
  try {
    const s = await Scholarship.findByPk(req.params.id);
    if (!s) return res.status(404).json({ error: 'Scholarship not found' });
    await s.update(req.body);
    return res.json(s);
  } catch (err) { return res.status(500).json({ error: 'Server error' }); }
};

// ─── Analytics dashboard ──────────────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const [totalStudents, totalFaculty, totalCourses, activeEnrollments, totalDepartments] = await Promise.all([
      Student.count(),
      Faculty.count(),
      Course.count({ where: { isActive: true } }),
      Enrollment.count({ where: { status: 'active' } }),
      Department.count(),
    ]);

    // Department distribution
    const depts = await Department.findAll({
      include: [{ association: 'programs', include: [{ association: 'students' }] }],
    });

    return res.json({
      overview: { totalStudents, totalFaculty, totalCourses, activeEnrollments, totalDepartments },
      departments: depts.map(d => ({
        name: d.name,
        programCount: d.programs.length,
        studentCount: d.programs.reduce((s, p) => s + p.students.length, 0),
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// ─── Assign faculty to course ─────────────────────────────────────────────────
const assignFaculty = async (req, res) => {
  try {
    const { courseId, facultyId } = req.body;
    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    await course.update({ facultyId });
    return res.json(course);
  } catch (err) { return res.status(500).json({ error: 'Server error' }); }
};

module.exports = {
  getDepartments, createDepartment, updateDepartment, deleteDepartment, mergeDepartment,
  getPrograms, createProgram, updateProgram,
  createUser, createScholarship, updateScholarship,
  getAnalytics, assignFaculty,
};
