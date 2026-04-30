const router = require('express').Router();
const { createAnnouncement, getAnnouncements, getGlobalAnnouncements, deleteAnnouncement, getMyCoursesAnnouncements } = require('../controllers/announcementController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', authenticate, getAnnouncements);
router.get('/global', authenticate, getGlobalAnnouncements);
router.get('/my-courses', authenticate, authorize('student'), getMyCoursesAnnouncements);
router.post('/', authenticate, authorize('admin', 'faculty'), createAnnouncement);
router.delete('/:id', authenticate, authorize('admin', 'faculty'), deleteAnnouncement);

module.exports = router;
