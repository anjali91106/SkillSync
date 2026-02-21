const express = require('express');
const multer = require('multer');
const { analyzeResume, getUserAnalysis } = require('../controllers/resumeController');
const { validateResumeAnalysis, validateEmail, sanitizeInput } = require('../middleware/validation');
const { uploadLimiter, analysisLimiter } = require('../middleware/rateLimiter');
const { sanitizeFilename } = require('../middleware/security');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.docx'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      file.originalname = sanitizeFilename(file.originalname);
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

router.post('/analyze', 
  uploadLimiter,
  upload.single('resume'),
  sanitizeInput,
  validateResumeAnalysis,
  analyzeResume
);

router.get('/user/:email', 
  analysisLimiter,
  validateEmail,
  getUserAnalysis
);

module.exports = router;
