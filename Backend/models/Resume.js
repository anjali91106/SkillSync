const mongoose = require('mongoose');

/**
 * Resume Schema for storing parsed resume data
 * 
 * This schema stores the structured data extracted from uploaded resumes,
 * including personal information, skills, education, and experience details.
 */
const resumeSchema = new mongoose.Schema({
  // Optional user ID for linking with user accounts
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 100,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  phone: {
    type: String,
    required: false,
    trim: true,
    maxlength: 20
  },
  
  // Skills Section
  skills: {
    type: [String],
    required: true,
    default: [],
    validate: {
      validator: function(skills) {
        return skills.length <= 100; // Limit to 100 skills
      },
      message: 'Skills array cannot exceed 100 items'
    }
  },
  
  // Education Section
  education: {
    type: [mongoose.Schema.Types.Mixed],
    required: false,
    default: []
  },
  
  // Experience Section
  experience: {
    type: [mongoose.Schema.Types.Mixed],
    required: false,
    default: []
  },
  
  // Metadata
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // File information
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'docx', 'other']
  }
}, {
  // Enable automatic timestamps
  timestamps: true,
  
  // Collection name
  collection: 'resumes'
});

// Indexes for better query performance
resumeSchema.index({ email: 1, uploadedAt: -1 });
resumeSchema.index({ userId: 1, uploadedAt: -1 });

// Virtual for formatted upload date
resumeSchema.virtual('formattedUploadDate').get(function() {
  return this.uploadedAt ? this.uploadedAt.toISOString().split('T')[0] : '';
});

// Pre-save middleware for data validation
resumeSchema.pre('save', function(next) {
  // Ensure skills are unique and properly formatted
  if (this.skills) {
    this.skills = [...new Set(this.skills.map(skill => skill.trim()))].filter(Boolean);
  }
  
  // Clean up phone number
  if (this.phone) {
    this.phone = this.phone.replace(/[^\d+\-().\s]/g, '');
  }
  
  next();
});

// Static method for finding resumes by email
resumeSchema.statics.findByEmail = function(email) {
  return this.find({ email: email.toLowerCase() }).sort({ uploadedAt: -1 });
};

// Static method for finding latest resume
resumeSchema.statics.findLatest = function(email = null) {
  const query = email ? { email: email.toLowerCase() } : {};
  return this.findOne(query).sort({ uploadedAt: -1 });
};

// Instance method for getting skill count
resumeSchema.methods.getSkillCount = function() {
  return this.skills ? this.skills.length : 0;
};

// Convert to JSON with virtuals
resumeSchema.set('toJSON', { virtuals: true });
resumeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Resume', resumeSchema);
