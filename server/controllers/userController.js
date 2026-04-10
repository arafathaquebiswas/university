const bcrypt = require('bcryptjs');
const { User, Student, Faculty, Admin, AccountsStaff, Department, Program } = require('../models');

// GET /api/users  (admin)
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'studentProfile', include: [{ association: 'major' }] },
        { association: 'facultyProfile' },
        { association: 'department' },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return res.json({ total: count, page: parseInt(page), users: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { association: 'studentProfile', include: [{ association: 'major' }] },
        { association: 'facultyProfile' },
        { association: 'staffProfile' },
        { association: 'department' },
      ],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Only admin can update others; own profile for self
    if (req.user.role !== 'admin' && req.user.userId !== parseInt(req.params.id))
      return res.status(403).json({ error: 'Forbidden' });

    const { username, deptId, isActive } = req.body;
    if (username) user.username = username;
    if (deptId !== undefined) user.deptId = deptId;
    if (isActive !== undefined && req.user.role === 'admin') user.isActive = isActive;

    if (req.body.password) {
      user.passwordHash = await bcrypt.hash(req.body.password, 12);
    }

    await user.save();
    const { passwordHash, ...safe } = user.toJSON();
    return res.json(safe);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/users/:id  (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ isActive: false });
    return res.json({ message: 'User deactivated' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
