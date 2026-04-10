const router = require('express').Router();
const {
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getPrograms, createProgram, updateProgram,
  createUser, createScholarship, updateScholarship,
  getAnalytics, assignFaculty,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const adminOnly = [authenticate, authorize('admin')];

router.get('/analytics', ...adminOnly, getAnalytics);
router.get('/departments', getDepartments);
router.post('/departments', ...adminOnly, createDepartment);
router.put('/departments/:id', ...adminOnly, updateDepartment);
router.delete('/departments/:id', ...adminOnly, deleteDepartment);
router.get('/programs', getPrograms);
router.post('/programs', ...adminOnly, createProgram);
router.put('/programs/:id', ...adminOnly, updateProgram);
router.post('/users', ...adminOnly, createUser);
router.post('/scholarships', ...adminOnly, createScholarship);
router.put('/scholarships/:id', ...adminOnly, updateScholarship);
router.post('/assign-faculty', ...adminOnly, assignFaculty);

module.exports = router;
