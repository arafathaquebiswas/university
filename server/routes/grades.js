const router = require('express').Router();
const {
  submitGrade, getMyGrades, getStudentGrades, getCourseGrades,
  whatIf, getCoursePolicy, setCoursePolicy, getScholarshipStatus,
  downloadGradeSheet,
} = require('../controllers/gradeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/my',                   authenticate, authorize('student'), getMyGrades);
router.get('/student/:studentId',   authenticate, getStudentGrades);
router.get('/course/:courseId',     authenticate, authorize('faculty','admin'), getCourseGrades);
router.get('/policy/:courseId',     authenticate, getCoursePolicy);
router.get('/scholarship/:studentId', authenticate, getScholarshipStatus);
router.post('/',                    authenticate, authorize('faculty','admin'), submitGrade);
router.post('/whatif',              authenticate, whatIf);
router.put('/policy/:courseId',     authenticate, authorize('faculty','admin'), setCoursePolicy);
router.get('/gradesheet/pdf',       authenticate, authorize('student'), downloadGradeSheet);

module.exports = router;
