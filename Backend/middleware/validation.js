const { body, param, validationResult } = require('express-validator');

const validateResumeUpload = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateResumeAnalysis = [
  body('resumeId')
    .trim()
    .notEmpty()
    .withMessage('Resume ID is required')
    .isMongoId()
    .withMessage('Invalid resume ID format'),
  
  body('targetRole')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Target role must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s_]+$/)
    .withMessage('Target role can only contain letters, spaces, and underscores'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateEmail = [
  param('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        details: errors.array()
      });
    }
    next();
  }
];

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

module.exports = {
  validateResumeUpload,
  validateResumeAnalysis,
  validateEmail,
  sanitizeInput
};
