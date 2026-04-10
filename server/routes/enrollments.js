const router = require('express').Router();
const { enroll, drop, getStudentEnrollments, getCourseEnrollments, getMyEnrollments } = require('../controllers/enrollmentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', authenticate, authorize('student'), enroll);
router.get('/my', authenticate, authorize('student'), getMyEnrollments);
router.get('/student/:studentId', authenticate, getStudentEnrollments);
router.get('/course/:courseId', authenticate, authorize('admin', 'faculty'), getCourseEnrollments);
router.delete('/:id', authenticate, drop);

module.exports = router;
