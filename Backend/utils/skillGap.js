const fs = require('fs');
const path = require('path');

/**
 * Skill Gap Analysis Utility
 * 
 * This module provides functionality to analyze skill gaps between
 * a user's current skills and the required skills for a target role.
 */

class SkillGapAnalyzer {
  constructor() {
    this.requiredSkillsPath = path.join(__dirname, '../data/requiredSkills.json');
    this.requiredSkills = this.loadRequiredSkills();
  }

  /**
   * Load required skills data from JSON file
   * @returns {Object} Required skills data for all roles
   */
  loadRequiredSkills() {
    try {
      const data = fs.readFileSync(this.requiredSkillsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading required skills data:', error.message);
      throw new Error('Failed to load required skills data');
    }
  }

  /**
   * Analyze skill gap between user skills and target role requirements
   * @param {Array<string>} userSkills - Array of user's current skills
   * @param {string} targetRole - Target job role
   * @returns {Object} Skill gap analysis result
   */
  analyzeSkillGap(userSkills, targetRole) {
    try {
      // Normalize user skills (lowercase, trim)
      const normalizedUserSkills = userSkills.map(skill => 
        skill.toLowerCase().trim()
      );

      // Get required skills for target role
      const roleData = this.getRoleData(targetRole);
      
      if (!roleData) {
        throw new Error(`Role "${targetRole}" not found in required skills data`);
      }

      const requiredSkills = roleData.required_skills.map(skill => 
        skill.toLowerCase().trim()
      );

      const preferredSkills = roleData.preferred_skills ? 
        roleData.preferred_skills.map(skill => skill.toLowerCase().trim()) : [];

      // Find matched skills
      const matchedSkills = normalizedUserSkills.filter(skill => 
        requiredSkills.includes(skill)
      );

      // Find missing required skills
      const missingSkills = requiredSkills.filter(skill => 
        !normalizedUserSkills.includes(skill)
      );

      // Find additional skills user has (bonus skills)
      const additionalSkills = normalizedUserSkills.filter(skill => 
        !requiredSkills.includes(skill)
      );

      // Calculate skill gap percentage
      const skillGapPercentage = this.calculateSkillGapPercentage(
        missingSkills.length, 
        requiredSkills.length
      );

      // Calculate match percentage
      const matchPercentage = this.calculateMatchPercentage(
        matchedSkills.length, 
        requiredSkills.length
      );

      // Find preferred skills user has
      const matchedPreferredSkills = normalizedUserSkills.filter(skill => 
        preferredSkills.includes(skill)
      );

      return {
        role: roleData.name,
        targetRole: targetRole,
        userSkills: userSkills,
        requiredSkills: roleData.required_skills,
        preferredSkills: roleData.preferred_skills || [],
        matchedSkills: this.capitalizeSkills(matchedSkills),
        missingSkills: this.capitalizeSkills(missingSkills),
        additionalSkills: this.capitalizeSkills(additionalSkills),
        matchedPreferredSkills: this.capitalizeSkills(matchedPreferredSkills),
        skillGapPercentage: Math.round(skillGapPercentage),
        matchPercentage: Math.round(matchPercentage),
        analysis: {
          totalRequiredSkills: requiredSkills.length,
          totalMatchedSkills: matchedSkills.length,
          totalMissingSkills: missingSkills.length,
          skillLevel: this.determineSkillLevel(matchPercentage),
          readinessScore: this.calculateReadinessScore(matchPercentage, matchedPreferredSkills.length)
        }
      };

    } catch (error) {
      console.error('Error analyzing skill gap:', error.message);
      throw new Error(`Skill gap analysis failed: ${error.message}`);
    }
  }

  /**
   * Get role data for a specific role
   * @param {string} targetRole - Target job role
   * @returns {Object|null} Role data or null if not found
   */
  getRoleData(targetRole) {
    // Normalize role name (lowercase, replace spaces with underscores)
    const normalizedRole = targetRole.toLowerCase().replace(/\s+/g, '_');
    
    // Try exact match first
    if (this.requiredSkills[normalizedRole]) {
      return this.requiredSkills[normalizedRole];
    }

    // Try partial match
    const roleKeys = Object.keys(this.requiredSkills);
    const matchedRole = roleKeys.find(key => 
      key.includes(normalizedRole) || normalizedRole.includes(key)
    );

    return matchedRole ? this.requiredSkills[matchedRole] : null;
  }

  /**
   * Calculate skill gap percentage
   * @param {number} missingCount - Number of missing skills
   * @param {number} requiredCount - Total required skills
   * @returns {number} Skill gap percentage
   */
  calculateSkillGapPercentage(missingCount, requiredCount) {
    if (requiredCount === 0) return 0;
    return (missingCount / requiredCount) * 100;
  }

  /**
   * Calculate match percentage
   * @param {number} matchedCount - Number of matched skills
   * @param {number} requiredCount - Total required skills
   * @returns {number} Match percentage
   */
  calculateMatchPercentage(matchedCount, requiredCount) {
    if (requiredCount === 0) return 0;
    return (matchedCount / requiredCount) * 100;
  }

  /**
   * Determine skill level based on match percentage
   * @param {number} matchPercentage - Match percentage
   * @returns {string} Skill level
   */
  determineSkillLevel(matchPercentage) {
    if (matchPercentage >= 80) return 'Expert';
    if (matchPercentage >= 60) return 'Advanced';
    if (matchPercentage >= 40) return 'Intermediate';
    if (matchPercentage >= 20) return 'Beginner';
    return 'Novice';
  }

  /**
   * Calculate readiness score for the role
   * @param {number} matchPercentage - Match percentage
   * @param {number} preferredSkillsCount - Number of preferred skills matched
   * @returns {number} Readiness score (0-100)
   */
  calculateReadinessScore(matchPercentage, preferredSkillsCount) {
    const baseScore = matchPercentage;
    const bonusScore = Math.min(preferredSkillsCount * 5, 20); // Max 20 points bonus
    return Math.min(baseScore + bonusScore, 100);
  }

  /**
   * Capitalize skills array for better display
   * @param {Array<string>} skills - Array of skills
   * @returns {Array<string>} Capitalized skills
   */
  capitalizeSkills(skills) {
    return skills.map(skill => 
      skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase()
    );
  }

  /**
   * Get all available roles
   * @returns {Array<Object>} List of available roles
   */
  getAvailableRoles() {
    return Object.keys(this.requiredSkills).map(key => ({
      id: key,
      name: this.requiredSkills[key].name,
      requiredSkillsCount: this.requiredSkills[key].required_skills.length,
      preferredSkillsCount: this.requiredSkills[key].preferred_skills ? 
        this.requiredSkills[key].preferred_skills.length : 0
    }));
  }

  /**
   * Get role suggestions based on user skills
   * @param {Array<string>} userSkills - User's current skills
   * @param {number} limit - Maximum number of suggestions
   * @returns {Array<Object>} Role suggestions
   */
  getRoleSuggestions(userSkills, limit = 5) {
    const normalizedUserSkills = userSkills.map(skill => 
      skill.toLowerCase().trim()
    );

    const roleMatches = Object.keys(this.requiredSkills).map(roleKey => {
      const roleData = this.requiredSkills[roleKey];
      const requiredSkills = roleData.required_skills.map(skill => 
        skill.toLowerCase().trim()
      );

      const matchedSkills = normalizedUserSkills.filter(skill => 
        requiredSkills.includes(skill)
      );

      const matchPercentage = this.calculateMatchPercentage(
        matchedSkills.length, 
        requiredSkills.length
      );

      return {
        role: roleKey,
        roleName: roleData.name,
        matchPercentage: Math.round(matchPercentage),
        matchedSkills: matchedSkills.length,
        totalRequiredSkills: requiredSkills.length
      };
    });

    // Sort by match percentage and return top suggestions
    return roleMatches
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, limit);
  }
}

module.exports = new SkillGapAnalyzer();
