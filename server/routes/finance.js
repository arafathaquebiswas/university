const router = require('express').Router();

const {
  generateInvoice,
  generateSemesterInvoice,
  makePayment,
  markRecordPaid,
  getStudentFinancials,
  getMyFinancials,
  getAllFinancials,
  applyScholarship,
  getScholarships,
  getFacultyPayment,
} = require('../controllers/financeController');

const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/scholarships', authenticate, getScholarships);
router.get('/my', authenticate, authorize('student'), getMyFinancials);
router.get('/all', authenticate, authorize('admin', 'accounts_staff'), getAllFinancials);

router.get('/student/:studentId', authenticate, authorize('admin', 'accounts_staff'), getStudentFinancials);
router.get('/faculty/:facultyId', authenticate, authorize('admin', 'accounts_staff'), getFacultyPayment);

router.post('/generate-semester-invoice', authenticate, authorize('admin', 'accounts_staff'), generateSemesterInvoice);
router.post('/invoices', authenticate, authorize('admin', 'accounts_staff'), generateInvoice);

router.post('/pay', authenticate, authorize('student'), makePayment);

// accounts/admin manual payment update
router.put('/records/:recordId/mark-paid', authenticate, authorize('admin', 'accounts_staff'), markRecordPaid);

router.post('/scholarship/apply', authenticate, authorize('student'), applyScholarship);

module.exports = router;