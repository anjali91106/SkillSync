// Frontend API Integration Module
// Replaces static data with real backend API calls

class ResumeAnalysisAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/resume';
    this.loading = false;
    this.error = null;
  }

  // Show loading indicator
  showLoading() {
    this.loading = true;
    this.updateUI();
  }

  // Hide loading indicator
  hideLoading() {
    this.loading = false;
    this.updateUI();
  }

  // Update UI with loading state
  updateUI() {
    const loadingElement = document.getElementById('loading-indicator');
    const resultsElement = document.getElementById('results-container');
    
    if (loadingElement) {
      loadingElement.style.display = this.loading ? 'block' : 'none';
    }
    
    if (resultsElement) {
      resultsElement.style.opacity = this.loading ? '0.5' : '1';
    }
  }

  // Show error message
  showError(message) {
    this.error = message;
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      errorElement.className = 'error-message show';
    }
    this.hideLoading();
  }

  // Hide error message
  hideError() {
    this.error = null;
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.className = 'error-message';
    }
  }

  // Upload resume to backend
  async uploadResume(file, name, email) {
    this.showLoading();
    this.hideError();

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('name', name);
      formData.append('email', email);

      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.storeResumeData(result.data);
        this.analyzeResume(result.data.id, 'software_engineer');
      } else {
        this.showError(result.error || 'Upload failed');
      }

    } catch (error) {
      this.showError(`Upload error: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  // Analyze resume against target role
  async analyzeResume(resumeId, targetRole) {
    this.showLoading();
    this.hideError();

    try {
      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeId: resumeId,
          targetRole: targetRole
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.displayAnalysisResults(result.data);
      } else {
        this.showError(result.error || 'Analysis failed');
      }

    } catch (error) {
      this.showError(`Analysis error: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  // Store resume data in localStorage
  storeResumeData(resumeData) {
    localStorage.setItem('currentResume', JSON.stringify(resumeData));
    console.log('Resume data stored:', resumeData);
  }

  // Display analysis results
  displayAnalysisResults(data) {
    const { skillGapAnalysis, roadmap, roleSuggestions } = data;
    
    // Update skill gap display
    this.updateSkillGapDisplay(skillGapAnalysis);
    
    // Update roadmap display
    this.updateRoadmapDisplay(roadmap);
    
    // Update role suggestions
    this.updateRoleSuggestions(roleSuggestions);
    
    // Store current analysis
    localStorage.setItem('currentAnalysis', JSON.stringify(data));
  }

  // Update skill gap display
  updateSkillGapDisplay(analysis) {
    const matchPercentage = analysis.matchPercentage || 0;
    const gapPercentage = analysis.skillGapPercentage || 100;
    const matchedSkills = analysis.matchedSkills || [];
    const missingSkills = analysis.missingSkills || [];

    // Update progress bars
    this.updateProgressBar('match-progress', matchPercentage);
    this.updateProgressBar('gap-progress', gapPercentage);

    // Update skills lists
    this.updateSkillsList('matched-skills', matchedSkills, 'matched');
    this.updateSkillsList('missing-skills', missingSkills, 'missing');

    // Update metrics
    this.updateMetrics(analysis);
  }

  // Update roadmap display
  updateRoadmapDisplay(roadmap) {
    if (!roadmap) return;

    const roadmapContainer = document.getElementById('roadmap-container');
    if (!roadmapContainer) return;

    const roadmapHTML = roadmap.roadmap.map((step, index) => `
      <div class="roadmap-step ${step.priority.toLowerCase()}">
        <div class="step-header">
          <h4>Step ${index + 1}: ${step.skill}</h4>
          <span class="priority ${step.priority.toLowerCase()}">${step.priority} Priority</span>
          <span class="duration">${step.duration}</span>
        </div>
        <div class="step-content">
          <div class="resources">
            <h5>Learning Resources:</h5>
            ${step.resources.map(resource => `
              <div class="resource">
                <a href="${resource.url}" target="_blank">
                  ${resource.title} (${resource.type})
                </a>
              </div>
            `).join('')}
          </div>
          <div class="steps">
            <h5>Learning Steps:</h5>
            <ol>
              ${step.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>
        </div>
      </div>
    `).join('');

    roadmapContainer.innerHTML = roadmapHTML;

    // Update summary
    document.getElementById('total-duration').textContent = roadmap.totalEstimatedDuration;
    document.getElementById('total-steps').textContent = roadmap.roadmap.length;
  }

  // Update role suggestions
  updateRoleSuggestions(suggestions) {
    if (!suggestions) return;

    const suggestionsContainer = document.getElementById('suggestions-container');
    if (!suggestionsContainer) return;

    const suggestionsHTML = suggestions.slice(0, 5).map((suggestion, index) => `
      <div class="suggestion-item">
        <h4>${index + 1}. ${suggestion.roleName}</h4>
        <div class="match-percentage">${suggestion.matchPercentage}% Match</div>
        <button onclick="api.analyzeResume('${suggestion.resumeId || 'current'}', '${suggestion.role}')" 
                class="analyze-btn">
          Analyze for ${suggestion.roleName}
        </button>
      </div>
    `).join('');

    suggestionsContainer.innerHTML = suggestionsHTML;
  }

  // Update progress bar
  updateProgressBar(elementId, percentage) {
    const progressBar = document.getElementById(elementId);
    if (progressBar) {
      const fillBar = progressBar.querySelector('.progress-fill');
      const percentageText = progressBar.querySelector('.percentage-text');
      
      fillBar.style.width = `${percentage}%`;
      percentageText.textContent = `${percentage}%`;
      
      // Update color based on percentage
      if (percentage >= 70) {
        fillBar.className = 'progress-fill high';
      } else if (percentage >= 40) {
        fillBar.className = 'progress-fill medium';
      } else {
        fillBar.className = 'progress-fill low';
      }
    }
  }

  // Update skills list
  updateSkillsList(elementId, skills, type) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const skillsHTML = skills.map(skill => `
      <span class="skill-tag ${type}">${skill}</span>
    `).join('');

    container.innerHTML = skillsHTML;
  }

  // Update metrics display
  updateMetrics(analysis) {
    const metrics = analysis.analysis || {};
    
    document.getElementById('skill-level').textContent = metrics.skillLevel || 'Unknown';
    document.getElementById('readiness-score').textContent = metrics.readinessScore || 0;
    document.getElementById('total-matched').textContent = metrics.totalMatchedSkills || 0;
    document.getElementById('total-missing').textContent = metrics.totalMissingSkills || 0;
  }

  // Initialize file upload
  initializeFileUpload() {
    const fileInput = document.getElementById('resume-upload');
    const nameInput = document.getElementById('user-name');
    const emailInput = document.getElementById('user-email');
    const uploadBtn = document.getElementById('upload-btn');

    if (fileInput && nameInput && emailInput && uploadBtn) {
      uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (!file) {
          this.showError('Please select a resume file');
          return;
        }

        if (!name || !email) {
          this.showError('Please enter your name and email');
          return;
        }

        await this.uploadResume(file, name, email);
      });
    }
  }

  // Get available roles
  async getAvailableRoles() {
    try {
      const response = await fetch(`${this.baseURL}/roles`);
      const result = await response.json();
      
      if (result.success) {
        this.populateRoleDropdown(result.data.roles);
      }
    } catch (error) {
      console.error('Failed to get roles:', error);
    }
  }

  // Populate role dropdown
  populateRoleDropdown(roles) {
    const dropdown = document.getElementById('target-role');
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Select a role...</option>' +
      roles.map(role => `<option value="${role.id}">${role.name}</option>`).join('');
  }

  // Initialize the application
  async init() {
    console.log('🚀 Initializing Frontend API Integration');
    
    // Initialize file upload
    this.initializeFileUpload();
    
    // Load available roles
    await this.getAvailableRoles();
    
    // Check for stored data
    const storedAnalysis = localStorage.getItem('currentAnalysis');
    if (storedAnalysis) {
      const data = JSON.parse(storedAnalysis);
      this.displayAnalysisResults(data);
    }
    
    console.log('✅ Frontend API Integration Ready');
  }
}

// Create global API instance
const api = new ResumeAnalysisAPI();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  api.init();
});

// Export for global access
window.api = api;
