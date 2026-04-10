const router = require('express').Router();
const { markAttendance, getCourseAttendance, getStudentAttendance, getMyAttendance } = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.post('/', authenticate, authorize('faculty', 'admin'), markAttendance);
router.get('/my', authenticate, authorize('student'), getMyAttendance);
router.get('/course/:courseId', authenticate, authorize('faculty', 'admin'), getCourseAttendance);
router.get('/student/:studentId', authenticate, getStudentAttendance);

module.exports = router;
