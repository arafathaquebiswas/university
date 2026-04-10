const router  = require('express').Router();
const { uploadMaterial, getCourseMaterials, downloadMaterial, deleteMaterial } = require('../controllers/materialController');
const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/roleCheck');
const { upload }       = require('../middleware/upload');

// Upload — faculty / admin only
router.post(
  '/',
  authenticate,
  authorize('faculty', 'admin'),
  upload.single('file'),
  (err, req, res, next) => {
    // Multer error handler (file type / size)
    if (err) return res.status(400).json({ error: err.message });
    next();
  },
  uploadMaterial,
);

// List materials for a course — any authenticated user
router.get('/course/:courseId', authenticate, getCourseMaterials);

// Download a file — any authenticated user
router.get('/download/:materialId', authenticate, downloadMaterial);

// Delete — faculty (own) or admin
router.delete('/:materialId', authenticate, authorize('faculty', 'admin'), deleteMaterial);

module.exports = router;
