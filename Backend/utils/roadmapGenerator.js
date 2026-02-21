const fs = require('fs');
const path = require('path');

/**
 * Roadmap Generation Utility
 * 
 * This module provides functionality to generate personalized learning roadmaps
 * based on missing skills for a target role.
 */

class RoadmapGenerator {
  constructor() {
    this.roadmapDataPath = path.join(__dirname, '../data/roadmapData.json');
    this.roadmapData = this.loadRoadmapData();
  }

  /**
   * Load roadmap data from JSON file
   * @returns {Object} Roadmap data for all skills
   */
  loadRoadmapData() {
    try {
      const data = fs.readFileSync(this.roadmapDataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading roadmap data:', error.message);
      throw new Error('Failed to load roadmap data');
    }
  }

  /**
   * Generate roadmap for missing skills
   * @param {Array<string>} missingSkills - Array of missing skills
   * @param {string} targetRole - Target job role
   * @returns {Object} Structured roadmap
   */
  generateRoadmap(missingSkills, targetRole) {
    try {
      console.log(`🗺️ Generating roadmap for ${missingSkills.length} missing skills in ${targetRole}`);

      const roadmapSteps = [];
      const totalDuration = this.calculateTotalDuration(missingSkills);

      // Process each missing skill
      missingSkills.forEach((skill, index) => {
        const skillData = this.getSkillRoadmap(skill);
        
        if (skillData) {
          const roadmapStep = {
            step: index + 1,
            skill: skillData.skill,
            level: skillData.level,
            duration: skillData.duration,
            priority: this.determinePriority(skill, targetRole),
            resources: skillData.resources,
            steps: skillData.steps,
            estimatedCompletion: this.calculateCompletionTime(index, skillData.duration),
            difficulty: this.assessDifficulty(skillData.level)
          };
          
          roadmapSteps.push(roadmapStep);
        } else {
          // Fallback for skills without detailed roadmap data
          roadmapSteps.push(this.createFallbackRoadmapStep(skill, index + 1));
        }
      });

      // Sort by priority and logical learning order
      const sortedRoadmap = this.sortRoadmapByPriority(roadmapSteps);

      return {
        role: targetRole,
        missingSkills: missingSkills,
        totalSkills: missingSkills.length,
        totalEstimatedDuration: totalDuration,
        roadmap: sortedRoadmap,
        summary: {
          averageDifficulty: this.calculateAverageDifficulty(sortedRoadmap),
          recommendedStudyHours: this.calculateStudyHours(sortedRoadmap),
          milestones: this.generateMilestones(sortedRoadmap),
          tips: this.generateLearningTips(sortedRoadmap)
        }
      };

    } catch (error) {
      console.error('Error generating roadmap:', error.message);
      throw new Error(`Roadmap generation failed: ${error.message}`);
    }
  }

  /**
   * Get roadmap data for a specific skill
   * @param {string} skill - Skill name
   * @returns {Object|null} Skill roadmap data or null
   */
  getSkillRoadmap(skill) {
    const normalizedSkill = skill.toLowerCase().replace(/\s+/g, '');
    
    // Try exact match first
    if (this.roadmapData[normalizedSkill]) {
      return this.roadmapData[normalizedSkill];
    }

    // Try partial match
    const skillKeys = Object.keys(this.roadmapData);
    const matchedSkill = skillKeys.find(key => 
      key.includes(normalizedSkill) || normalizedSkill.includes(key)
    );

    return matchedSkill ? this.roadmapData[matchedSkill] : null;
  }

  /**
   * Determine priority for a skill based on role requirements
   * @param {string} skill - Skill name
   * @param {string} targetRole - Target job role
   * @returns {string} Priority level
   */
  determinePriority(skill, targetRole) {
    const coreSkills = {
      'software_engineer': ['javascript', 'react', 'nodejs', 'html', 'css'],
      'frontend_developer': ['html', 'css', 'javascript', 'react'],
      'backend_developer': ['nodejs', 'databases', 'apis', 'security'],
      'full_stack_developer': ['javascript', 'react', 'nodejs', 'databases'],
      'data_scientist': ['python', 'statistics', 'machine learning'],
      'devops_engineer': ['docker', 'kubernetes', 'aws', 'linux'],
      'mobile_developer': ['react native', 'mobile development'],
      'product_manager': ['product management', 'communication', 'leadership'],
      'ui_ux_designer': ['figma', 'user research', 'prototyping'],
      'qa_engineer': ['testing', 'quality assurance', 'automation']
    };

    const roleCoreSkills = coreSkills[targetRole] || [];
    const normalizedSkill = skill.toLowerCase();

    if (roleCoreSkills.includes(normalizedSkill)) {
      return 'High';
    }

    // Determine priority based on skill category
    const highPrioritySkills = ['javascript', 'python', 'react', 'nodejs', 'docker', 'aws'];
    const mediumPrioritySkills = ['typescript', 'mongodb', 'git', 'css', 'html'];

    if (highPrioritySkills.includes(normalizedSkill)) {
      return 'High';
    } else if (mediumPrioritySkills.includes(normalizedSkill)) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  /**
   * Calculate total estimated duration for all missing skills
   * @param {Array<string>} missingSkills - Array of missing skills
   * @returns {string} Total duration
   */
  calculateTotalDuration(missingSkills) {
    const durations = missingSkills.map(skill => {
      const skillData = this.getSkillRoadmap(skill);
      return skillData ? this.parseDuration(skillData.duration) : 30; // Default 30 days
    });

    const totalDays = durations.reduce((sum, duration) => sum + duration, 0);
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
   * Parse duration string to days
   * @param {string} duration - Duration string (e.g., "2-3 months")
   * @returns {number} Duration in days
   */
  parseDuration(duration) {
    if (duration.includes('month')) {
      const months = parseInt(duration) || 2;
      return months * 30;
    } else if (duration.includes('week')) {
      const weeks = parseInt(duration) || 1;
      return weeks * 7;
    } else if (duration.includes('day')) {
      return parseInt(duration) || 1;
    }
    return 30; // Default to 30 days
  }

  /**
   * Calculate completion time for a roadmap step
   * @param {number} stepIndex - Step index
   * @param {string} duration - Duration for this step
   * @returns {string} Estimated completion time
   */
  calculateCompletionTime(stepIndex, duration) {
    const days = this.parseDuration(duration);
    const totalDays = days * (stepIndex + 1);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + totalDays);
    
    return completionDate.toISOString().split('T')[0];
  }

  /**
   * Assess difficulty based on skill level
   * @param {string} level - Skill level
   * @returns {number} Difficulty score (1-10)
   */
  assessDifficulty(level) {
    const difficultyMap = {
      'Beginner': 3,
      'Intermediate': 6,
      'Advanced': 8,
      'Expert': 10
    };
    
    return difficultyMap[level] || 5;
  }

  /**
   * Create fallback roadmap step for skills without detailed data
   * @param {string} skill - Skill name
   * @param {number} step - Step number
   * @returns {Object} Fallback roadmap step
   */
  createFallbackRoadmapStep(skill, step) {
    return {
      step: step,
      skill: skill,
      level: 'Intermediate',
      duration: '1-2 months',
      priority: 'Medium',
      resources: [
        {
          type: 'search',
          title: `Learn ${skill}`,
          provider: 'Google Search',
          url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' tutorial')}`,
          difficulty: 'All Levels'
        }
      ],
      steps: [
        `Research ${skill} fundamentals`,
        `Find online courses or tutorials`,
        `Practice with hands-on projects`,
        `Build portfolio projects`
      ],
      estimatedCompletion: '',
      difficulty: 5
    };
  }

  /**
   * Sort roadmap steps by priority and logical order
   * @param {Array<Object>} roadmapSteps - Array of roadmap steps
   * @returns {Array<Object>} Sorted roadmap steps
   */
  sortRoadmapByPriority(roadmapSteps) {
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    
    return roadmapSteps.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by difficulty (easier first)
      return a.difficulty - b.difficulty;
    });
  }

  /**
   * Calculate average difficulty of roadmap
   * @param {Array<Object>} roadmapSteps - Array of roadmap steps
   * @returns {number} Average difficulty
   */
  calculateAverageDifficulty(roadmapSteps) {
    if (roadmapSteps.length === 0) return 0;
    
    const totalDifficulty = roadmapSteps.reduce((sum, step) => sum + step.difficulty, 0);
    return Math.round(totalDifficulty / roadmapSteps.length);
  }

  /**
   * Calculate recommended study hours
   * @param {Array<Object>} roadmapSteps - Array of roadmap steps
   * @returns {number} Total study hours
   */
  calculateStudyHours(roadmapSteps) {
    const totalDays = roadmapSteps.reduce((sum, step) => {
      return sum + this.parseDuration(step.duration);
    }, 0);
    
    // Assume 2 hours of study per day
    return totalDays * 2;
  }

  /**
   * Generate milestones for the roadmap
   * @param {Array<Object>} roadmapSteps - Array of roadmap steps
   * @returns {Array<Object>} Milestones
   */
  generateMilestones(roadmapSteps) {
    const milestones = [];
    const totalSteps = roadmapSteps.length;
    
    // Create milestones at 25%, 50%, 75%, and 100%
    const milestonePoints = [0.25, 0.5, 0.75, 1.0];
    
    milestonePoints.forEach(point => {
      const stepIndex = Math.floor(totalSteps * point);
      if (stepIndex < totalSteps) {
        const step = roadmapSteps[stepIndex];
        milestones.push({
          percentage: Math.round(point * 100),
          title: `${Math.round(point * 100)}% Complete`,
          description: `Complete ${step.skill} learning`,
          estimatedDate: step.estimatedCompletion
        });
      }
    });
    
    return milestones;
  }

  /**
   * Generate learning tips based on roadmap
   * @param {Array<Object>} roadmapSteps - Array of roadmap steps
   * @returns {Array<string>} Learning tips
   */
  generateLearningTips(roadmapSteps) {
    const tips = [
      'Create a consistent study schedule and stick to it',
      'Practice coding every day, even if it\'s just for 30 minutes',
      'Build projects as you learn to reinforce your understanding',
      'Join online communities related to your target role',
      'Don\'t be afraid to ask questions and seek help'
    ];

    if (roadmapSteps.length > 3) {
      tips.push('Focus on one skill at a time to avoid overwhelm');
    }

    const hasHighPriority = roadmapSteps.some(step => step.priority === 'High');
    if (hasHighPriority) {
      tips.push('Prioritize high-priority skills first for better job prospects');
    }

    return tips;
  }

  /**
   * Get all available skills with roadmap data
   * @returns {Array<string>} List of available skills
   */
  getAvailableSkills() {
    return Object.keys(this.roadmapData).map(skill => 
      this.roadmapData[skill].skill
    );
  }
}

module.exports = new RoadmapGenerator();
