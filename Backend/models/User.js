const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  extractedSkills: [{
    type: String
  }],
  certifications: [{
    type: String
  }],
  education: [{
    type: String
  }],
  experience: [{
    type: String
  }],
  targetRole: {
    type: String
  },
  skillGap: [{
    type: String
  }],
  matchPercentage: {
    type: Number,
    default: 0
  },
  roadmap: [{
    type: String
  }],
  resumeScore: {
    type: Number,
    default: 0
  },
  suggestedRoles: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
