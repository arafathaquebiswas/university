const router = require('express').Router();
const {
  generateInvoice, generateSemesterInvoice, makePayment, getStudentFinancials, getMyFinancials, getAllFinancials, applyScholarship, getScholarships,
} = require('../controllers/financeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/scholarships', authenticate, getScholarships);
router.get('/my', authenticate, authorize('student'), getMyFinancials);
router.get('/all', authenticate, authorize('admin', 'accounts_staff'), getAllFinancials);
router.get('/student/:studentId', authenticate, authorize('admin', 'accounts_staff'), getStudentFinancials);
router.post('/generate-semester-invoice', authenticate, authorize('admin', 'accounts_staff'), generateSemesterInvoice);
router.post('/invoices', authenticate, authorize('admin', 'accounts_staff'), generateInvoice);
router.post('/pay', authenticate, authorize('student'), makePayment);
router.post('/scholarship/apply', authenticate, authorize('student'), applyScholarship);

module.exports = router;
