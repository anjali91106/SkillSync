const Resume = require('../models/Resume');
const skillGapAnalyzer = require('../utils/skillGap');
const roadmapGenerator = require('../utils/roadmapGenerator');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Resume Analysis Controller
 * 
 * Handles skill gap analysis and roadmap generation for uploaded resumes.
 * Works with previously uploaded and parsed resumes.
 */

/**
 * Analyze resume skills against target role requirements
 * POST /api/resume/analyze
 */
const analyzeResume = asyncHandler(async (req, res) => {
  try {
    const { resumeId, targetRole } = req.body;

    // Validate input
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID is required',
        code: 'MISSING_RESUME_ID'
      });
    }

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        error: 'Target role is required',
        code: 'MISSING_TARGET_ROLE'
      });
    }

    console.log(`🔍 Analyzing resume ${resumeId} for role: ${targetRole}`);

    // Find resume in database
    const resume = await Resume.findById(resumeId);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
        code: 'RESUME_NOT_FOUND'
      });
    }

    console.log(`📋 Found resume with ${resume.skills.length} skills`);

    // Perform skill gap analysis
    const skillGapAnalysis = skillGapAnalyzer.analyzeSkillGap(
      resume.skills,
      targetRole
    );

    console.log(`📊 Skill gap analysis completed: ${skillGapAnalysis.matchPercentage}% match`);

    // Generate roadmap for missing skills
    let roadmap = null;
    if (skillGapAnalysis.missingSkills.length > 0) {
      roadmap = roadmapGenerator.generateRoadmap(
        skillGapAnalysis.missingSkills,
        targetRole
      );
      console.log(`🗺️ Generated roadmap with ${roadmap.roadmap.length} steps`);
    }

    // Get role suggestions based on current skills
    const roleSuggestions = skillGapAnalyzer.getRoleSuggestions(
      resume.skills,
      5
    );

    // Calculate comprehensive analysis metrics
    const analysisMetrics = calculateAnalysisMetrics(
      skillGapAnalysis,
      resume,
      targetRole
    );

    // Return comprehensive analysis result
    res.json({
      success: true,
      message: 'Resume analysis completed successfully',
      data: {
        resumeInfo: {
          id: resume._id,
          name: resume.name,
          email: resume.email,
          uploadedAt: resume.uploadedAt,
          totalSkills: resume.skills.length
        },
        skillGapAnalysis: {
          role: skillGapAnalysis.role,
          targetRole: skillGapAnalysis.targetRole,
          matchPercentage: skillGapAnalysis.matchPercentage,
          skillGapPercentage: skillGapAnalysis.skillGapPercentage,
          matchedSkills: skillGapAnalysis.matchedSkills,
          missingSkills: skillGapAnalysis.missingSkills,
          additionalSkills: skillGapAnalysis.additionalSkills,
          matchedPreferredSkills: skillGapAnalysis.matchedPreferredSkills,
          analysis: skillGapAnalysis.analysis
        },
        roadmap: roadmap,
        roleSuggestions: roleSuggestions,
        metrics: analysisMetrics,
        recommendations: generateRecommendations(
          skillGapAnalysis,
          roadmap,
          roleSuggestions
        )
      },
      metadata: {
        analysisTime: Date.now() - req.startTime,
        version: '1.0.0',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Resume analysis error:', error.message);
    
    // Handle specific errors
    if (error.message.includes('not found in required skills data')) {
      return res.status(400).json({
        success: false,
        error: 'Target role not recognized. Please check available roles.',
        code: 'INVALID_ROLE',
        availableRoles: skillGapAnalyzer.getAvailableRoles()
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid resume ID format',
        code: 'INVALID_ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze resume',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Quick analysis without resume ID (analyze skills directly)
 * POST /api/resume/analyze-skills
 */
const analyzeSkills = asyncHandler(async (req, res) => {
  try {
    const { skills, targetRole } = req.body;

    // Validate input
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        error: 'Skills array is required',
        code: 'MISSING_SKILLS'
      });
    }

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        error: 'Target role is required',
        code: 'MISSING_TARGET_ROLE'
      });
    }

    console.log(`🔍 Analyzing ${skills.length} skills for role: ${targetRole}`);

    // Perform skill gap analysis
    const skillGapAnalysis = skillGapAnalyzer.analyzeSkillGap(skills, targetRole);

    // Generate roadmap for missing skills
    let roadmap = null;
    if (skillGapAnalysis.missingSkills.length > 0) {
      roadmap = roadmapGenerator.generateRoadmap(
        skillGapAnalysis.missingSkills,
        targetRole
      );
    }

    // Get role suggestions
    const roleSuggestions = skillGapAnalyzer.getRoleSuggestions(skills, 5);

    res.json({
      success: true,
      message: 'Skills analysis completed successfully',
      data: {
        skillGapAnalysis,
        roadmap,
        roleSuggestions
      },
      metadata: {
        analysisTime: Date.now() - req.startTime,
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('❌ Skills analysis error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze skills',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get available roles
 * GET /api/resume/roles
 */
const getAvailableRoles = asyncHandler(async (req, res) => {
  try {
    const roles = skillGapAnalyzer.getAvailableRoles();
    
    res.json({
      success: true,
      data: {
        roles,
        count: roles.length,
        categories: groupRolesByCategory(roles)
      },
      metadata: {
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('❌ Get roles error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available roles',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Calculate comprehensive analysis metrics
 * @param {Object} skillGapAnalysis - Skill gap analysis result
 * @param {Object} resume - Resume document
 * @param {string} targetRole - Target role
 * @returns {Object} Analysis metrics
 */
function calculateAnalysisMetrics(skillGapAnalysis, resume, targetRole) {
  const totalSkills = resume.skills.length;
  const matchedSkills = skillGapAnalysis.matchedSkills.length;
  const missingSkills = skillGapAnalysis.missingSkills.length;
  const additionalSkills = skillGapAnalysis.additionalSkills.length;

  return {
    skillCoverage: {
      totalSkills,
      relevantSkills: matchedSkills + missingSkills,
      coveragePercentage: Math.round(((matchedSkills + missingSkills) / totalSkills) * 100)
    },
    readinessScore: skillGapAnalysis.analysis.readinessScore,
    skillLevel: skillGapAnalysis.analysis.skillLevel,
    learningComplexity: calculateLearningComplexity(skillGapAnalysis.missingSkills),
    timeToJobReady: estimateTimeToJobReady(skillGapAnalysis.missingSkills),
    marketDemand: assessMarketDemand(targetRole),
    competitiveAdvantage: assessCompetitiveAdvantage(
      skillGapAnalysis.additionalSkills,
      targetRole
    )
  };
}

/**
 * Calculate learning complexity for missing skills
 * @param {Array<string>} missingSkills - Array of missing skills
 * @returns {Object} Learning complexity metrics
 */
function calculateLearningComplexity(missingSkills) {
  const complexityMap = {
    'javascript': 3, 'python': 3, 'java': 4, 'c++': 5,
    'react': 4, 'nodejs': 3, 'docker': 4, 'kubernetes': 5,
    'aws': 5, 'mongodb': 3, 'sql': 3, 'git': 2
  };

  const totalComplexity = missingSkills.reduce((sum, skill) => {
    const normalizedSkill = skill.toLowerCase();
    return sum + (complexityMap[normalizedSkill] || 3);
  }, 0);

  const averageComplexity = missingSkills.length > 0 ? 
    totalComplexity / missingSkills.length : 0;

  return {
    totalComplexity,
    averageComplexity: Math.round(averageComplexity),
    level: averageComplexity <= 2 ? 'Low' :
           averageComplexity <= 3 ? 'Medium' :
           averageComplexity <= 4 ? 'High' : 'Very High'
  };
}

/**
 * Estimate time to become job ready
 * @param {Array<string>} missingSkills - Array of missing skills
 * @returns {string} Estimated time
 */
function estimateTimeToJobReady(missingSkills) {
  const daysPerSkill = 30; // Average 30 days per skill
  const totalDays = missingSkills.length * daysPerSkill;
  
  const months = Math.floor(totalDays / 30);
  const remainingDays = totalDays % 30;

  if (months > 0 && remainingDays > 0) {
    return `${months} months ${remainingDays} days`;
  } else if (months > 0) {
    return `${months} months`;
  } else {
    return `${remainingDays} days`;
  }
}

/**
 * Assess market demand for target role
 * @param {string} targetRole - Target role
 * @returns {Object} Market demand assessment
 */
function assessMarketDemand(targetRole) {
  const demandMap = {
    'software_engineer': { level: 'High', growth: '+15%', competition: 'High' },
    'frontend_developer': { level: 'High', growth: '+12%', competition: 'Medium' },
    'backend_developer': { level: 'High', growth: '+14%', competition: 'Medium' },
    'full_stack_developer': { level: 'Very High', growth: '+18%', competition: 'High' },
    'data_scientist': { level: 'Very High', growth: '+25%', competition: 'Medium' },
    'devops_engineer': { level: 'High', growth: '+20%', competition: 'Low' },
    'mobile_developer': { level: 'High', growth: '+16%', competition: 'Medium' },
    'product_manager': { level: 'Medium', growth: '+10%', competition: 'High' },
    'ui_ux_designer': { level: 'Medium', growth: '+8%', competition: 'High' },
    'qa_engineer': { level: 'Medium', growth: '+6%', competition: 'Low' }
  };

  const normalizedRole = targetRole.toLowerCase().replace(/\s+/g, '_');
  return demandMap[normalizedRole] || { 
    level: 'Unknown', 
    growth: 'N/A', 
    competition: 'Unknown' 
  };
}

/**
 * Assess competitive advantage
 * @param {Array<string>} additionalSkills - Additional skills user has
 * @param {string} targetRole - Target role
 * @returns {Object} Competitive advantage assessment
 */
function assessCompetitiveAdvantage(additionalSkills, targetRole) {
  const highValueSkills = [
    'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'machine learning', 'artificial intelligence', 'blockchain',
    'react', 'vue', 'angular', 'typescript',
    'leadership', 'project management', 'agile', 'scrum'
  ];

  const valuableSkills = additionalSkills.filter(skill => 
    highValueSkills.includes(skill.toLowerCase())
  );

  const advantageScore = (valuableSkills.length / Math.max(additionalSkills.length, 1)) * 100;

  return {
    score: Math.round(advantageScore),
    level: advantageScore >= 50 ? 'High' :
           advantageScore >= 30 ? 'Medium' : 'Low',
    valuableSkills,
    totalAdditionalSkills: additionalSkills.length
  };
}

/**
 * Generate personalized recommendations
 * @param {Object} skillGapAnalysis - Skill gap analysis
 * @param {Object} roadmap - Generated roadmap
 * @param {Array} roleSuggestions - Role suggestions
 * @returns {Array} Recommendations
 */
function generateRecommendations(skillGapAnalysis, roadmap, roleSuggestions) {
  const recommendations = [];

  // Skill gap recommendations
  if (skillGapAnalysis.matchPercentage < 50) {
    recommendations.push({
      type: 'skill_gap',
      priority: 'High',
      title: 'Focus on Core Skills',
      description: `You're missing ${skillGapAnalysis.missingSkills.length} essential skills for this role. Prioritize learning these first.`,
      action: 'Follow the generated roadmap and focus on high-priority skills.'
    });
  }

  // Roadmap recommendations
  if (roadmap && roadmap.totalEstimatedDuration.includes('month')) {
    recommendations.push({
      type: 'learning_strategy',
      priority: 'Medium',
      title: 'Create a Learning Schedule',
      description: 'Your learning journey will take several months. Create a consistent study schedule.',
      action: 'Dedicate 10-15 hours per week and track your progress.'
    });
  }

  // Role suggestions recommendations
  if (roleSuggestions.length > 0 && roleSuggestions[0].matchPercentage > skillGapAnalysis.matchPercentage) {
    recommendations.push({
      type: 'career_suggestion',
      priority: 'Medium',
      title: 'Consider Alternative Roles',
      description: `You might be a better fit for ${roleSuggestions[0].roleName} (${roleSuggestions[0].matchPercentage}% match).`,
      action: 'Explore roles that better match your current skill set.'
    });
  }

  // Additional skills recommendations
  if (skillGapAnalysis.additionalSkills.length > 2) {
    recommendations.push({
      type: 'competitive_advantage',
      priority: 'Low',
      title: 'Leverage Your Unique Skills',
      description: `You have ${skillGapAnalysis.additionalSkills.length} skills that set you apart from other candidates.`,
      action: 'Highlight these unique skills in your resume and interviews.'
    });
  }

  return recommendations;
}

/**
 * Group roles by category
 * @param {Array} roles - Array of roles
 * @returns {Object} Grouped roles
 */
function groupRolesByCategory(roles) {
  const categories = {
    'Development': ['software_engineer', 'frontend_developer', 'backend_developer', 'full_stack_developer', 'mobile_developer'],
    'Data & Analytics': ['data_scientist'],
    'DevOps & Infrastructure': ['devops_engineer'],
    'Product & Design': ['product_manager', 'ui_ux_designer'],
    'Quality & Testing': ['qa_engineer']
  };

  const grouped = {};
  Object.keys(categories).forEach(category => {
    grouped[category] = roles.filter(role => 
      categories[category].includes(role.id)
    );
  });

  return grouped;
}

module.exports = {
  analyzeResume,
  analyzeSkills,
  getAvailableRoles
};
