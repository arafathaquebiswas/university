const router = require('express').Router();
const {
  getDepartments, createDepartment, updateDepartment, deleteDepartment, mergeDepartment,
  getPrograms, createProgram, updateProgram,
  createUser, createScholarship, updateScholarship,
  getAnalytics, assignFaculty,
  createImportantDate, getImportantDates, updateImportantDate, deleteImportantDate,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const adminOnly = [authenticate, authorize('admin')];

router.get('/analytics', ...adminOnly, getAnalytics);
router.get('/departments', getDepartments);
router.post('/departments', ...adminOnly, createDepartment);
router.put('/departments/:id', ...adminOnly, updateDepartment);
router.delete('/departments/:id', ...adminOnly, deleteDepartment);
router.get('/programs', authenticate, getPrograms);
router.post('/programs', ...adminOnly, createProgram);
router.put('/programs/:id', ...adminOnly, updateProgram);
router.post('/users', ...adminOnly, createUser);
router.post('/scholarships', ...adminOnly, createScholarship);
router.put('/scholarships/:id', ...adminOnly, updateScholarship);
router.post('/assign-faculty', ...adminOnly, assignFaculty);
router.post('/departments/merge', ...adminOnly, mergeDepartment);

// Important dates — public read, admin write
router.get('/dates', getImportantDates);
router.post('/dates', ...adminOnly, createImportantDate);
router.put('/dates/:id', ...adminOnly, updateImportantDate);
router.delete('/dates/:id', ...adminOnly, deleteImportantDate);

module.exports = router;
