const express = require('express');
const multer = require('multer');
const { 
  uploadResume, 
  getResumeById, 
  getResumesByEmail, 
  deleteResume, 
  getUploadStats 
} = require('../controllers/resumeUploadController');
const { 
  analyzeResume, 
  analyzeSkills, 
  getAvailableRoles 
} = require('../controllers/resumeAnalyzeController');
const { validateResumeUpload, validateResumeAnalysis, validateEmail, sanitizeInput } = require('../middleware/validation');
const { uploadLimiter, analysisLimiter } = require('../middleware/rateLimiter');
const { sanitizeFilename } = require('../middleware/security');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
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

// Middleware to add start time for performance tracking
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// ========================================
// UPLOAD ROUTES
// ========================================

/**
 * POST /api/resume/upload
 * Upload and parse a new resume
 */
router.post('/upload', 
  uploadLimiter,
  sanitizeInput,
  validateResumeUpload,
  upload.single('resume'),
  uploadResume
);

/**
 * GET /api/resume/health
 * Health check for resume service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Resume Analysis Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * GET /api/resume/:id
 * Get a specific resume by ID
 */
router.get('/:id', 
  getResumeById
);

/**
 * GET /api/resume/email/:email
 * Get all resumes for a specific email
 */
router.get('/email/:email', 
  validateEmail,
  getResumesByEmail
);

/**
 * DELETE /api/resume/:id
 * Delete a specific resume by ID
 */
router.delete('/:id', 
  deleteResume
);

/**
 * GET /api/resume/stats
 * Get upload statistics
 */
router.get('/stats', 
  getUploadStats
);

// ========================================
// ANALYSIS ROUTES
// ========================================

/**
 * POST /api/resume/analyze
 * Analyze a stored resume against a target role
 */
router.post('/analyze', 
  analysisLimiter,
  sanitizeInput,
  validateResumeAnalysis,
  analyzeResume
);

/**
 * POST /api/resume/analyze-skills
 * Analyze skills directly without storing resume
 */
router.post('/analyze-skills', 
  analysisLimiter,
  sanitizeInput,
  analyzeSkills
);

/**
 * GET /api/resume/roles
 * Get all available job roles
 */
router.get('/roles', 
  getAvailableRoles
);

// ========================================
// UTILITY ROUTES
// ========================================

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Resume routes error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Maximum size is 5MB.',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      error: 'Too many files. Only one file allowed.',
      code: 'TOO_MANY_FILES'
    });
  }

  if (error.message.includes('Only PDF and DOCX files are allowed')) {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Pass to main error handler
  next(error);
});

module.exports = router;
