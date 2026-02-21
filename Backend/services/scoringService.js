class ScoringService {
  calculateResumeScore(matchPercentage, resumeData) {
    let score = Math.round(matchPercentage / 10);

    if (resumeData.resumeTextLength < 500) {
      score -= 2;
    }

    if (!resumeData.certifications || resumeData.certifications.length === 0) {
      score -= 1;
    }

    if (!resumeData.experience || resumeData.experience.length === 0) {
      score -= 2;
    }

    if (resumeData.extractedSkills && resumeData.extractedSkills.length > 10) {
      score += 1;
    }

    if (resumeData.education && resumeData.education.length > 0) {
      score += 1;
    }

    score = Math.max(1, Math.min(10, score));

    return score;
  }
}

module.exports = new ScoringService();
