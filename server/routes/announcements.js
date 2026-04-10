const router = require('express').Router();
const { createAnnouncement, getAnnouncements, getGlobalAnnouncements } = require('../controllers/announcementController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', authenticate, getAnnouncements);
router.get('/global', authenticate, getGlobalAnnouncements);
router.post('/', authenticate, authorize('admin', 'faculty'), createAnnouncement);

module.exports = router;
