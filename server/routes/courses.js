const router = require('express').Router();
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, getFacultyCourses } = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', authenticate, getCourses);
router.get('/faculty/:facultyId', authenticate, getFacultyCourses);
router.get('/:id', authenticate, getCourseById);
router.post('/', authenticate, authorize('admin', 'faculty'), createCourse);
router.put('/:id', authenticate, authorize('admin', 'faculty'), updateCourse);
router.delete('/:id', authenticate, authorize('admin'), deleteCourse);

module.exports = router;
