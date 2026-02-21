const Resume = require('../models/Resume');
const offlineResumeParser = require('../services/offlineResumeParser');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Resume Upload Controller
 * 
 * Handles resume upload, parsing, and saving to MongoDB.
 * Uses offline resume parser to extract structured data.
 */

/**
 * Upload and parse resume
 * POST /api/resume/upload
 */
const uploadResume = asyncHandler(async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file uploaded',
        code: 'NO_FILE'
      });
    }

    console.log('📤 Processing resume upload:', req.file.originalname);

    // Parse resume using offline parser
    const parsedData = await offlineResumeParser.parseResume(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Determine file type
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 
                   req.file.mimetype.includes('word') ? 'docx' : 'other';

    // Create resume document
    const resumeData = {
      name: parsedData.name || 'Unknown',
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      skills: parsedData.skills || [],
      education: parsedData.education || [],
      experience: parsedData.experience || [],
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: fileType,
      uploadedAt: new Date()
    };

    // Add userId if provided (for authenticated users)
    if (req.body.userId) {
      resumeData.userId = req.body.userId;
    }

    // Save to MongoDB
    const savedResume = await Resume.create(resumeData);

    console.log('✅ Resume saved successfully:', savedResume._id);

    // Return success response with saved document
    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      data: {
        id: savedResume._id,
        name: savedResume.name,
        email: savedResume.email,
        phone: savedResume.phone,
        skills: savedResume.skills,
        education: savedResume.education,
        experience: savedResume.experience,
        uploadedAt: savedResume.uploadedAt,
        fileName: savedResume.fileName,
        fileSize: savedResume.fileSize,
        fileType: savedResume.fileType,
        skillCount: savedResume.getSkillCount()
      },
      metadata: {
        processingTime: Date.now() - req.startTime,
        parser: 'offline',
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('❌ Resume upload error:', error.message);
    
    // Handle specific errors
    if (error.message.includes('Unsupported file format')) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file format. Only PDF and DOCX files are supported.',
        code: 'UNSUPPORTED_FORMAT'
      });
    }

    if (error.message.includes('PDF parsing failed') || 
        error.message.includes('DOCX parsing failed')) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse resume file. Please ensure the file is not corrupted.',
        code: 'PARSING_FAILED'
      });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A resume with this email already exists.',
        code: 'DUPLICATE_EMAIL'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Failed to upload and parse resume',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get resume by ID
 * GET /api/resume/:id
 */
const getResumeById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID is required',
        code: 'MISSING_ID'
      });
    }

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
        code: 'NOT_FOUND'
      });
    }

    console.log('📄 Retrieved resume:', resume._id);

    res.json({
      success: true,
      data: {
        id: resume._id,
        name: resume.name,
        email: resume.email,
        phone: resume.phone,
        skills: resume.skills,
        education: resume.education,
        experience: resume.experience,
        uploadedAt: resume.uploadedAt,
        fileName: resume.fileName,
        fileSize: resume.fileSize,
        fileType: resume.fileType,
        skillCount: resume.getSkillCount(),
        formattedUploadDate: resume.formattedUploadDate
      }
    });

  } catch (error) {
    console.error('❌ Get resume error:', error.message);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume ID format',
        code: 'INVALID_ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resume',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get all resumes for a user (by email)
 * GET /api/resume/email/:email
 */
const getResumesByEmail = asyncHandler(async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    const resumes = await Resume.findByEmail(email);

    if (!resumes || resumes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No resumes found for this email',
        code: 'NOT_FOUND'
      });
    }

    console.log(`📄 Retrieved ${resumes.length} resumes for email:`, email);

    const formattedResumes = resumes.map(resume => ({
      id: resume._id,
      name: resume.name,
      email: resume.email,
      phone: resume.phone,
      skills: resume.skills,
      education: resume.education,
      experience: resume.experience,
      uploadedAt: resume.uploadedAt,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      fileType: resume.fileType,
      skillCount: resume.getSkillCount(),
      formattedUploadDate: resume.formattedUploadDate
    }));

    res.json({
      success: true,
      data: {
        resumes: formattedResumes,
        count: formattedResumes.length,
        email: email
      }
    });

  } catch (error) {
    console.error('❌ Get resumes by email error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve resumes',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Delete resume by ID
 * DELETE /api/resume/:id
 */
const deleteResume = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID is required',
        code: 'MISSING_ID'
      });
    }

    const resume = await Resume.findByIdAndDelete(id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
        code: 'NOT_FOUND'
      });
    }

    console.log('🗑️ Deleted resume:', resume._id);

    res.json({
      success: true,
      message: 'Resume deleted successfully',
      data: {
        id: resume._id,
        fileName: resume.fileName
      }
    });

  } catch (error) {
    console.error('❌ Delete resume error:', error.message);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume ID format',
        code: 'INVALID_ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete resume',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get upload statistics
 * GET /api/resume/stats
 */
const getUploadStats = asyncHandler(async (req, res) => {
  try {
    const totalResumes = await Resume.countDocuments();
    const recentResumes = await Resume.countDocuments({
      uploadedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    const fileTypeStats = await Resume.aggregate([
      { $group: { _id: '$fileType', count: { $sum: 1 } } }
    ]);

    const avgSkillsPerResume = await Resume.aggregate([
      { $project: { skillCount: { $size: '$skills' } } },
      { $group: { _id: null, avgSkills: { $avg: '$skillCount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalResumes,
        recentResumes,
        fileTypeStats: fileTypeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        averageSkillsPerResume: Math.round(avgSkillsPerResume[0]?.avgSkills || 0),
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Get stats error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = {
  uploadResume,
  getResumeById,
  getResumesByEmail,
  deleteResume,
  getUploadStats
};
