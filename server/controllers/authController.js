const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, Faculty, Admin, AccountsStaff, Program, Department } = require('../models');

// Email → role detection
const detectRole = (email) => {
  if (/^ext\.[a-zA-Z.]+_(cse|eee|mic|bio)@g\.bracu\.ac\.bd$/i.test(email)) return 'faculty';
  if (/^[a-zA-Z][a-zA-Z.]+_\d+@g\.bracu\.ac\.bd$/i.test(email)) return 'student';
  if (/^accounts\.[a-zA-Z.]+@g\.bracu\.ac\.bd$/i.test(email)) return 'accounts_staff';
  if (/^library\.[a-zA-Z.]+@g\.bracu\.ac\.bd$/i.test(email)) return 'library_staff';
  return null;
};

const generateToken = (user) =>
  jwt.sign(
    { userId: user.userId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password, majorId, officeNumber, specialization } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email and password are required' });

    const role = detectRole(email);
    if (!role)
      return res.status(400).json({
        error: 'Invalid university email. Use your official BRACU email address.',
      });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) return res.status(409).json({ error: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash, role });

    if (role === 'student') {
      const year = new Date().getFullYear();
      const code = `STU${year}${String(user.userId).padStart(4, '0')}`;
      await Student.create({ userId: user.userId, majorId: majorId || null, enrollmentYear: year, studentCode: code });
    } else if (role === 'faculty') {
      await Faculty.create({ userId: user.userId, officeNumber, specialization });
    } else if (role === 'accounts_staff') {
      await AccountsStaff.create({ userId: user.userId, sector: 'accounts' });
    } else if (role === 'library_staff') {
      await AccountsStaff.create({ userId: user.userId, sector: 'library' });
    }

    const token = generateToken(user);
    return res.status(201).json({ token, user: { userId: user.userId, username, email, role } });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    return res.json({
      token,
      user: { userId: user.userId, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'studentProfile', include: [{ association: 'major' }] },
        { association: 'facultyProfile' },
        { association: 'staffProfile' },
        { association: 'department' },
      ],
    });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, getMe };
