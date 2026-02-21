// App JavaScript - UI Controllers
// Moved from inline to separate file to avoid CSP violations

// File selection handling
function handleFileSelect(input) {
    const file = input.files[0];
    if (file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileInfo').classList.remove('hidden');
    }
}

function removeFile() {
    document.getElementById('resume-upload').value = '';
    document.getElementById('fileInfo').classList.add('hidden');
}

// Navigation handlers
document.getElementById('nav-upload').addEventListener('click', () => {
    showUploadSection();
});

document.getElementById('nav-results').addEventListener('click', () => {
    showResultsSection();
});

document.getElementById('nav-new-analysis').addEventListener('click', () => {
    resetToUpload();
});

// Add community button event listener
document.getElementById('nav-community').addEventListener('click', () => {
    window.location.href = 'community.html';
});

// Add industry insights button event listener
document.getElementById('nav-industry').addEventListener('click', () => {
    window.location.href = 'industry_insights.html';
});

function showUploadSection() {
    document.getElementById('upload-section').style.display = 'block';
    document.getElementById('analyzing-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    
    document.getElementById('nav-upload').className = 'w-full text-left px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition-colors';
    document.getElementById('nav-results').className = 'w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors';
}

function showAnalyzingSection() {
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('analyzing-section').style.display = 'block';
    document.getElementById('results-section').style.display = 'none';
}

function showResultsSection() {
    console.log('🎨 showResultsSection called');
    document.getElementById('upload-section').style.display = 'none';
    document.getElementById('analyzing-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    
    document.getElementById('nav-upload').className = 'w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors';
    document.getElementById('nav-results').className = 'w-full text-left px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition-colors';
    
    console.log('✅ Results section should now be visible');
}

function resetToUpload() {
    // Reset form
    document.getElementById('upload-form').reset();
    document.getElementById('fileInfo').classList.add('hidden');
    
    // Hide user profile
    document.getElementById('user-profile').style.display = 'none';
    document.getElementById('nav-results').style.display = 'none';
    document.getElementById('nav-new-analysis').style.display = 'none';
    
    // Show upload section
    showUploadSection();
}

function showUserProfile(name, email) {
    document.getElementById('user-profile').style.display = 'block';
    document.getElementById('user-display-name').textContent = name;
    document.getElementById('user-display-email').textContent = email;
    document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
    
    document.getElementById('nav-results').style.display = 'block';
    document.getElementById('nav-new-analysis').style.display = 'block';
}

function updateStats(skillsCount, matchPercentage) {
    document.getElementById('skillsFound').textContent = skillsCount || '-';
    document.getElementById('matchScore').textContent = matchPercentage ? matchPercentage + '%' : '-';
}

// Make functions globally available
window.showUserProfile = showUserProfile;
window.updateStats = updateStats;
window.showAnalyzingSection = showAnalyzingSection;
window.showResultsSection = showResultsSection;
