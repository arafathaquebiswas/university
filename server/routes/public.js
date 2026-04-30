/**
 * Public routes — NO authentication required.
 * Safe for guests, students, and any visitor.
 */
const router = require('express').Router();
const { Department, Program, Announcement } = require('../models');

// GET /api/public/departments — returns all departments + their programs
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [{
        model: Program,
        as: 'programs',
        attributes: ['progId', 'name', 'duration'],
      }],
      order: [
        ['name', 'ASC'],
        [{ model: Program, as: 'programs' }, 'name', 'ASC'],
      ],
    });
    return res.json(departments);
  } catch (err) {
    console.error('GET /public/departments:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/public/announcements — returns all global announcements (no auth required)
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.findAll({
      where: { isGlobal: true },
      include: [{ association: 'creator', attributes: ['username', 'role'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.json(announcements);
  } catch (err) {
    console.error('GET /public/announcements:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
