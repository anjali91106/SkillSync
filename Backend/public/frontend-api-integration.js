// Frontend API Integration Module
// Step-by-step workflow with right-side navigation

class ResumeAnalysisAPI {
  constructor() {
    this.baseURL = 'https://skillsync-3-hgmq.onrender.com/api/resume';
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
    const uploadBtn = document.getElementById('upload-btn');
    
    if (uploadBtn) {
      const btnText = uploadBtn.querySelector('.btn-text');
      const btnLoading = uploadBtn.querySelector('.btn-loading');
      
      if (this.loading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        uploadBtn.disabled = true;
      } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        uploadBtn.disabled = false;
      }
    }
  }

  // Show error message
  showError(message) {
    this.error = message;
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      const errorText = errorElement.querySelector('.error-text');
      errorText.textContent = message;
      errorElement.style.display = 'flex';
    }
    this.hideLoading();
  }

  // Hide error message
  hideError() {
    this.error = null;
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  // Upload resume to backend
  async uploadResume(file, name, email, targetRole) {
    this.showLoading();
    this.hideError();

    console.log('🚀 Starting upload process...');
    console.log('📄 File:', file.name, file.type, file.size);
    console.log('📄 File MIME type:', file.type);
    console.log('📄 File extension:', file.name.split('.').pop());

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['pdf', 'docx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      this.showError(`Invalid file type: ${file.type}. Only PDF and DOCX files are allowed.`);
      return;
    }

    try {
      // Show user profile in navigation
      if (window.showUserProfile) {
        window.showUserProfile(name, email);
      }

      // Show analyzing section
      if (window.showAnalyzingSection) {
        window.showAnalyzingSection();
      }

      const formData = new FormData();
      formData.append('resume', file);
      formData.append('name', name);
      formData.append('email', email);

      console.log('📤 Sending request to:', `${this.baseURL}/upload`);
      console.log('📤 FormData entries:');
      for (let [key, value] of formData.entries()) {
        if (key === 'resume') {
          console.log(`  ${key}:`, value.name, value.type, value.size);
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        body: formData
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Upload failed:', errorData);
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Upload result:', result);
      
      if (result.success) {
        this.storeResumeData(result.data);
        console.log('📊 Resume data stored:', result.data);
        
        // Update stats
        if (window.updateStats) {
          window.updateStats(result.data.skills.length, null);
        }
        
        // Analyze with selected role or default to software_engineer
        const roleToAnalyze = targetRole || 'software_engineer';
        console.log('🎯 Analyzing for role:', roleToAnalyze);
        
        await this.analyzeResume(result.data.id, roleToAnalyze);
      } else {
        console.error('❌ Upload unsuccessful:', result);
        this.showError(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      this.showError(`Upload error: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  // Analyze resume against target role
  async analyzeResume(resumeId, targetRole) {
    this.showLoading();
    this.hideError();

    console.log('🔍 Starting analysis...');
    console.log('📋 Resume ID:', resumeId);
    console.log('🎯 Target Role:', targetRole);

    try {
      const requestBody = {
        resumeId: resumeId,
        targetRole: targetRole
      };
      
      console.log('📤 Analysis request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Analysis response status:', response.status);
      console.log('📥 Analysis response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Analysis failed:', errorData);
        throw new Error(errorData.error || `Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Analysis result:', result);
      console.log('📊 Analysis data structure:', Object.keys(result.data || {}));
      
      if (result.success) {
        console.log('📊 Displaying analysis results...');
        this.displayAnalysisResults(result.data);
        
        // Show results section
        if (window.showResultsSection) {
          window.showResultsSection();
        }
      } else {
        console.error('❌ Analysis unsuccessful:', result);
        this.showError(result.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('❌ Analysis error:', error);
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
    console.log('🎨 displayAnalysisResults called with data:', data);
    console.log('📊 Data structure:', Object.keys(data));
    
    const { skillGapAnalysis, roadmap, roleSuggestions } = data;
    
    console.log('📈 Skill Gap Analysis:', skillGapAnalysis);
    console.log('🗺️ Roadmap:', roadmap);
    console.log('💡 Role Suggestions:', roleSuggestions);
    
    // Update skill gap display
    this.updateSkillGapDisplay(skillGapAnalysis);
    
    // Update roadmap display
    this.updateRoadmapDisplay(roadmap);
    
    // Update role suggestions
    this.updateRoleSuggestions(roleSuggestions);
    
    // Update stats
    if (window.updateStats) {
      const totalSkills = skillGapAnalysis.matchedSkills.length + skillGapAnalysis.missingSkills.length;
      window.updateStats(totalSkills, skillGapAnalysis.matchPercentage);
    }
    
    // Store current analysis
    localStorage.setItem('currentAnalysis', JSON.stringify(data));
    console.log('💾 Analysis data stored in localStorage');
  }

  // Update skill gap display
  updateSkillGapDisplay(analysis) {
    console.log('📈 updateSkillGapDisplay called with:', analysis);
    
    const matchPercentage = analysis.matchPercentage || 0;
    const gapPercentage = analysis.skillGapPercentage || 100;
    const matchedSkills = analysis.matchedSkills || [];
    const missingSkills = analysis.missingSkills || [];

    console.log('📊 Match Percentage:', matchPercentage);
    console.log('📊 Gap Percentage:', gapPercentage);
    console.log('📊 Matched Skills:', matchedSkills);
    console.log('📊 Missing Skills:', missingSkills);

    // Update progress bars
    this.updateProgressBar('match-progress', matchPercentage);
    this.updateProgressBar('gap-progress', gapPercentage);

    // Update skills lists
    this.updateSkillsList('matched-skills', matchedSkills, 'matched');
    this.updateSkillsList('missing-skills', missingSkills, 'missing');

    // Update metrics
    this.updateMetrics(analysis);
    
    console.log('✅ Skill gap display updated');
  }

  // Update roadmap display
  updateRoadmapDisplay(roadmap) {
    if (!roadmap) return;

    const roadmapContainer = document.getElementById('roadmap-container');
    if (!roadmapContainer) return;

    const roadmapHTML = roadmap.roadmap.map((step, index) => `
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-3">
          <h4 class="text-lg font-semibold text-gray-800">Step ${index + 1}: ${step.skill}</h4>
          <div class="flex gap-2">
            <span class="priority px-2 py-1 text-xs font-medium rounded ${
              step.priority === 'High' ? 'bg-red-100 text-red-800' :
              step.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }">${step.priority} Priority</span>
            <span class="duration px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">${step.duration}</span>
          </div>
        </div>
        
        <div class="grid md:grid-cols-2 gap-4">
          <div class="resources">
            <h5 class="font-medium text-gray-700 mb-2">📚 Learning Resources:</h5>
            <div class="space-y-2">
              ${step.resources.map(resource => `
                <div class="resource">
                  <a href="${resource.url}" target="_blank" 
                     class="text-indigo-600 hover:text-indigo-800 text-sm underline flex items-center gap-1">
                    <i class="fas fa-external-link-alt text-xs"></i>
                    ${resource.title} (${resource.type})
                  </a>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="steps">
            <h5 class="font-medium text-gray-700 mb-2">📋 Learning Steps:</h5>
            <ol class="text-sm text-gray-600 space-y-1">
              ${step.steps.map(step => `<li class="flex items-start gap-2"><span class="text-indigo-600">•</span>${step}</li>`).join('')}
            </ol>
          </div>
        </div>
      </div>
    `).join('');

    roadmapContainer.innerHTML = roadmapHTML;

    // Update summary
    const durationElement = document.getElementById('total-duration');
    const stepsElement = document.getElementById('total-steps');
    
    if (durationElement) durationElement.textContent = roadmap.totalEstimatedDuration || 'N/A';
    if (stepsElement) stepsElement.textContent = roadmap.roadmap?.length || 0;
  }

  // Update role suggestions
  updateRoleSuggestions(suggestions) {
    if (!suggestions || !suggestions.length) return;

    const suggestionsContainer = document.getElementById('suggestions-container');
    if (!suggestionsContainer) return;

    const suggestionsHTML = suggestions.slice(0, 6).map((suggestion, index) => `
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
        <h4 class="font-semibold text-gray-800 mb-2">${index + 1}. ${suggestion.roleName}</h4>
        <div class="match-percentage text-lg font-bold text-indigo-600 mb-3">${suggestion.matchPercentage}% Match</div>
        <button onclick="api.analyzeResumeForRole('${suggestion.role}')" 
                class="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors text-sm font-medium">
          Analyze for ${suggestion.roleName}
        </button>
      </div>
    `).join('');

    suggestionsContainer.innerHTML = suggestionsHTML;
  }

  // Analyze for a different role
  async analyzeResumeForRole(targetRole) {
    const storedResume = localStorage.getItem('currentResume');
    if (storedResume) {
      const resumeData = JSON.parse(storedResume);
      
      // Show analyzing section again
      if (window.showAnalyzingSection) {
        window.showAnalyzingSection();
      }
      
      await this.analyzeResume(resumeData.id, targetRole);
    } else {
      this.showError('Please upload a resume first');
    }
  }

  // Update progress bar
  updateProgressBar(elementId, percentage) {
    console.log(`📊 updateProgressBar called: ${elementId} = ${percentage}%`);
    
    const progressBar = document.getElementById(elementId);
    if (progressBar) {
      const fillBar = progressBar.querySelector('.progress-fill');
      const percentageText = progressBar.querySelector('.percentage-text');
      
      if (fillBar && percentageText) {
        fillBar.style.width = `${percentage}%`;
        percentageText.textContent = `${percentage}%`;
        
        console.log(`📊 Updated ${elementId}: ${percentage}%`);
        
        // Update color based on percentage
        if (percentage >= 70) {
          fillBar.className = 'progress-fill h-full rounded-full high';
        } else if (percentage >= 40) {
          fillBar.className = 'progress-fill h-full rounded-full medium';
        } else {
          fillBar.className = 'progress-fill h-full rounded-full low';
        }
      } else {
        console.error(`❌ Progress bar elements not found for ${elementId}`);
      }
    } else {
      console.error(`❌ Progress bar container not found: ${elementId}`);
    }
  }

  // Update skills list
  updateSkillsList(elementId, skills, type) {
    const container = document.getElementById(elementId);
    if (!container) return;

    if (skills.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm">No skills found</p>';
      return;
    }

    const skillsHTML = skills.map(skill => `
      <span class="skill-tag ${type}">${skill}</span>
    `).join('');

    container.innerHTML = skillsHTML;
  }

  // Update metrics display
  updateMetrics(analysis) {
    const metrics = analysis.analysis || {};
    
    const elements = {
      'skill-level': metrics.skillLevel || 'Unknown',
      'readiness-score': Math.round(metrics.readinessScore || 0),
      'total-matched': metrics.totalMatchedSkills || 0,
      'total-missing': metrics.totalMissingSkills || 0
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  }

  // Initialize file upload
  initializeFileUpload() {
    const fileInput = document.getElementById('resume-upload');
    const nameInput = document.getElementById('user-name');
    const emailInput = document.getElementById('user-email');
    const roleSelect = document.getElementById('target-role');
    const uploadBtn = document.getElementById('upload-btn');

    if (fileInput && nameInput && emailInput && uploadBtn) {
      uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const targetRole = roleSelect.value;

        if (!file) {
          this.showError('Please select a resume file');
          return;
        }

        if (!name || !email) {
          this.showError('Please enter your name and email');
          return;
        }

        await this.uploadResume(file, name, email, targetRole);
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

  // Initialize application
  async init() {
    console.log('🚀 Initializing Frontend API Integration');
    
    // Initialize file upload
    this.initializeFileUpload();
    
    // Load available roles
    await this.getAvailableRoles();
    
    // Check for stored data
    const storedAnalysis = localStorage.getItem('currentAnalysis');
    const storedResume = localStorage.getItem('currentResume');
    
    if (storedAnalysis && storedResume) {
      const resumeData = JSON.parse(storedResume);
      const analysisData = JSON.parse(storedAnalysis);
      
      // Show user profile
      if (window.showUserProfile) {
        window.showUserProfile(resumeData.name, resumeData.email);
      }
      
      // Display results
      this.displayAnalysisResults(analysisData);
      
      // Show results section
      if (window.showResultsSection) {
        window.showResultsSection();
      }
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
