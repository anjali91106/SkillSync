const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

class ResumeExtractor {
  constructor() {
    this.sectionPatterns = {
      summary: [/summary/i, /objective/i, /profile/i, /about/i],
      skills: [/skills/i, /technical skills/i, /competencies/i, /technologies/i],
      experience: [/experience/i, /work experience/i, /employment/i, /professional experience/i],
      education: [/education/i, /academic/i, /qualification/i, /degree/i],
      projects: [/projects/i, /portfolio/i, /work samples/i]
    };
  }

  cleanText(text) {
    return text
      .replace(/\f/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/^\s+|\s+$/gm, '')
      .replace(/Page\s+\d+|^\d+$/gm, '')
      .replace(/http[s]?:\/\/[^\s]+/g, '')
      .trim();
  }

  identifySection(line) {
    for (const [section, patterns] of Object.entries(this.sectionPatterns)) {
      if (patterns.some(pattern => pattern.test(line))) {
        return section;
      }
    }
    return null;
  }

  extractSections(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const sections = {
      summary: '',
      skills: [],
      experience: [],
      education: [],
      projects: []
    };

    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      const section = this.identifySection(line);
      
      if (section) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = this.parseSectionContent(currentSection, currentContent);
        }
        currentSection = section;
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line.trim());
      }
    }

    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = this.parseSectionContent(currentSection, currentContent);
    }

    return sections;
  }

  parseSectionContent(section, content) {
    const text = content.join(' ').trim();
    
    switch (section) {
      case 'summary':
        return text;
      case 'skills':
        return this.extractSkills(text);
      case 'experience':
      case 'education':
      case 'projects':
        return this.extractListItems(text);
      default:
        return text;
    }
  }

  extractSkills(text) {
    const skills = text
      .split(/[,;•\n]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
    return [...new Set(skills)];
  }

  extractListItems(text) {
    const items = text
      .split(/\n(?=[A-Z0-9•\-\*])/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    return items;
  }

  async processResume(text) {
    const cleanedText = this.cleanText(text);
    const structuredData = this.extractSections(cleanedText);
    
    return {
      summary: structuredData.summary || '',
      skills: structuredData.skills || [],
      experience: structuredData.experience || [],
      education: structuredData.education || [],
      projects: structuredData.projects || []
    };
  }
}

class JobRoleAnalyzer {
  constructor() {
    this.roleSkillMap = {
      'frontend developer': {
        core: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
        secondary: ['TypeScript', 'Vue.js', 'Angular', 'Tailwind CSS', 'Bootstrap', 'Webpack', 'REST APIs'],
        levels: {
          beginner: ['HTML', 'CSS', 'JavaScript', 'Git'],
          intermediate: ['React', 'TypeScript', 'REST APIs', 'Tailwind CSS'],
          advanced: ['Webpack', 'Vue.js', 'Angular', 'Bootstrap']
        }
      },
      'backend developer': {
        core: ['Node.js', 'Express', 'Database fundamentals', 'API design', 'Git'],
        secondary: ['Python', 'Java', 'SQL', 'NoSQL', 'Docker', 'AWS', 'Authentication'],
        levels: {
          beginner: ['Git', 'Database fundamentals', 'API design'],
          intermediate: ['Node.js', 'Express', 'SQL', 'Authentication'],
          advanced: ['Python', 'Java', 'NoSQL', 'Docker', 'AWS']
        }
      },
      'full stack developer': {
        core: ['JavaScript', 'React', 'Node.js', 'Express', 'Database', 'Git'],
        secondary: ['TypeScript', 'Python', 'SQL', 'NoSQL', 'Docker', 'AWS', 'REST APIs', 'HTML', 'CSS'],
        levels: {
          beginner: ['HTML', 'CSS', 'JavaScript', 'Git', 'Database fundamentals'],
          intermediate: ['React', 'Node.js', 'Express', 'SQL', 'REST APIs'],
          advanced: ['TypeScript', 'Python', 'NoSQL', 'Docker', 'AWS']
        }
      },
      'data scientist': {
        core: ['Python', 'Machine Learning', 'Statistics', 'Data Analysis', 'SQL'],
        secondary: ['R', 'TensorFlow', 'PyTorch', 'Data Visualization', 'Big Data', 'Deep Learning'],
        levels: {
          beginner: ['Python', 'Statistics', 'Data Analysis', 'SQL'],
          intermediate: ['Machine Learning', 'Data Visualization', 'R'],
          advanced: ['TensorFlow', 'PyTorch', 'Big Data', 'Deep Learning']
        }
      },
      'devops engineer': {
        core: ['Linux', 'Docker', 'CI/CD', 'Cloud platforms', 'Scripting'],
        secondary: ['Kubernetes', 'Terraform', 'Monitoring', 'Security', 'Networking', 'AWS/Azure/GCP'],
        levels: {
          beginner: ['Linux', 'Scripting', 'Cloud platforms'],
          intermediate: ['Docker', 'CI/CD', 'Monitoring'],
          advanced: ['Kubernetes', 'Terraform', 'Security', 'Networking']
        }
      },
      'mobile developer': {
        core: ['JavaScript', 'React Native', 'Mobile UI/UX', 'Git'],
        secondary: ['Swift', 'Kotlin', 'Flutter', 'iOS', 'Android', 'APIs', 'Firebase'],
        levels: {
          beginner: ['JavaScript', 'Mobile UI/UX', 'Git'],
          intermediate: ['React Native', 'APIs', 'Firebase'],
          advanced: ['Swift', 'Kotlin', 'Flutter', 'iOS', 'Android']
        }
      }
    };
  }

  normalizeRole(role) {
    return role.toLowerCase().trim();
  }

  getRoleSkills(role) {
    const normalizedRole = this.normalizeRole(role);
    
    for (const [key, skills] of Object.entries(this.roleSkillMap)) {
      if (normalizedRole.includes(key) || key.includes(normalizedRole)) {
        return {
          core_skills: skills.core,
          secondary_skills: skills.secondary,
          skill_levels: skills.levels
        };
      }
    }

    return this.getDefaultSkills();
  }

  getDefaultSkills() {
    return {
      core_skills: ['JavaScript', 'Git', 'Problem Solving', 'Communication'],
      secondary_skills: ['HTML', 'CSS', 'Basic Database', 'APIs'],
      skill_levels: {
        beginner: ['Git', 'Communication', 'Problem Solving'],
        intermediate: ['JavaScript', 'HTML', 'CSS', 'Basic Database'],
        advanced: ['APIs']
      }
    };
  }

  analyzeRole(jobRole) {
    if (!jobRole || typeof jobRole !== 'string') {
      throw new Error('Valid job role is required');
    }

    return this.getRoleSkills(jobRole);
  }
}

class SkillGapAnalyzer {
  constructor() {
    this.skillSynonyms = {
      'javascript': ['js', 'javascript', 'ecmascript'],
      'typescript': ['ts', 'typescript'],
      'react': ['reactjs', 'react.js', 'react'],
      'node.js': ['nodejs', 'node.js', 'node'],
      'python': ['py', 'python'],
      'java': ['java', 'jvm'],
      'sql': ['sql', 'structured query language'],
      'git': ['git', 'version control', 'vcs'],
      'docker': ['docker', 'containerization'],
      'aws': ['aws', 'amazon web services', 'amazon'],
      'css': ['css', 'cascading style sheets'],
      'html': ['html', 'hypertext markup language']
    };
  }

  normalizeSkill(skill) {
    const normalized = skill.toLowerCase().trim();
    
    for (const [canonical, synonyms] of Object.entries(this.skillSynonyms)) {
      if (synonyms.some(syn => normalized.includes(syn) || syn.includes(normalized))) {
        return canonical;
      }
    }
    
    return normalized;
  }

  normalizeSkills(skills) {
    return skills.map(skill => this.normalizeSkill(skill));
  }

  findMatches(candidateSkills, requiredSkills) {
    const normalizedCandidate = this.normalizeSkills(candidateSkills);
    const normalizedRequired = this.normalizeSkills(requiredSkills);
    
    const exactMatches = [];
    const partialMatches = [];
    
    normalizedRequired.forEach(required => {
      const exactMatch = normalizedCandidate.find(candidate => candidate === required);
      if (exactMatch) {
        exactMatches.push(required);
      } else {
        const partialMatch = normalizedCandidate.find(candidate => 
          candidate.includes(required) || required.includes(candidate) ||
          this.calculateSimilarity(candidate, required) > 0.7
        );
        if (partialMatch) {
          partialMatches.push({
            required: required,
            candidate: partialMatch,
            similarity: this.calculateSimilarity(partialMatch, required)
          });
        }
      }
    });
    
    return { exactMatches, partialMatches };
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  calculateReadinessScore(matched, missing, partial, totalRequired) {
    if (totalRequired === 0) return 0;
    
    const exactWeight = 1.0;
    const partialWeight = 0.5;
    
    const weightedScore = (matched.length * exactWeight + 
                          partial.length * partialWeight) / totalRequired;
    
    return Math.round(Math.min(100, weightedScore * 100));
  }

  analyzeSkillGap(candidateSkills, roleRequirements) {
    if (!candidateSkills || !roleRequirements) {
      throw new Error('Both candidate skills and role requirements are required');
    }

    const allRequiredSkills = [
      ...roleRequirements.core_skills || [],
      ...roleRequirements.secondary_skills || []
    ];

    const { exactMatches, partialMatches } = this.findMatches(candidateSkills, allRequiredSkills);
    
    const matched = [...new Set(exactMatches)];
    const missing = allRequiredSkills.filter(skill => 
      !matched.includes(skill) && !partialMatches.some(pm => pm.required === skill)
    );
    const partial = partialMatches.map(pm => pm.required);

    const readinessScore = this.calculateReadinessScore(
      matched, missing, partial, allRequiredSkills.length
    );

    return {
      matched,
      missing,
      partial,
      readiness_score: readinessScore
    };
  }
}

class LearningRoadmapGenerator {
  constructor() {
    this.skillLearningPaths = {
      // Frontend skills
      'html': { difficulty: 1, time: '1 week', resources: ['MDN Web Docs', 'freeCodeCamp'], prerequisites: [] },
      'css': { difficulty: 2, time: '1-2 weeks', resources: ['CSS Tricks', 'Flexbox Froggy'], prerequisites: ['html'] },
      'javascript': { difficulty: 3, time: '2-3 weeks', resources: ['JavaScript.info', 'Eloquent JavaScript'], prerequisites: ['html', 'css'] },
      'react': { difficulty: 4, time: '2-3 weeks', resources: ['React Docs', 'React Tutorial'], prerequisites: ['javascript'] },
      'typescript': { difficulty: 3, time: '1-2 weeks', resources: ['TypeScript Handbook', 'TS Playground'], prerequisites: ['javascript'] },
      'vue.js': { difficulty: 4, time: '2-3 weeks', resources: ['Vue.js Guide', 'Vue Mastery'], prerequisites: ['javascript'] },
      'angular': { difficulty: 5, time: '3-4 weeks', resources: ['Angular Docs', 'Angular University'], prerequisites: ['javascript', 'typescript'] },
      'tailwind css': { difficulty: 2, time: '1 week', resources: ['Tailwind Docs', 'Tailwind CSS Course'], prerequisites: ['css'] },
      'bootstrap': { difficulty: 2, time: '1 week', resources: ['Bootstrap Docs', 'Bootstrap Examples'], prerequisites: ['css'] },
      'webpack': { difficulty: 4, time: '2 weeks', resources: ['Webpack Docs', 'Webpack Academy'], prerequisites: ['javascript'] },
      
      // Backend skills
      'node.js': { difficulty: 4, time: '2-3 weeks', resources: ['Node.js Docs', 'NodeBestPractices'], prerequisites: ['javascript'] },
      'express': { difficulty: 3, time: '1-2 weeks', resources: ['Express.js Guide', 'REST API Tutorial'], prerequisites: ['node.js'] },
      'python': { difficulty: 3, time: '2-3 weeks', resources: ['Python Docs', 'Real Python'], prerequisites: [] },
      'java': { difficulty: 4, time: '3-4 weeks', resources: ['Oracle Java Docs', 'Baeldung'], prerequisites: [] },
      'sql': { difficulty: 2, time: '1-2 weeks', resources: ['SQL Bolt', 'Mode Analytics SQL'], prerequisites: [] },
      'nosql': { difficulty: 3, time: '2 weeks', resources: ['MongoDB University', 'NoSQL Guide'], prerequisites: ['javascript'] },
      'database fundamentals': { difficulty: 2, time: '1-2 weeks', resources: ['Database Design', 'SQL Tutorial'], prerequisites: [] },
      'api design': { difficulty: 3, time: '1-2 weeks', resources: ['REST API Guide', 'API Design Checklist'], prerequisites: ['javascript'] },
      'authentication': { difficulty: 4, time: '1-2 weeks', resources: ['Auth0 Docs', 'JWT Guide'], prerequisites: ['api design'] },
      
      // DevOps skills
      'docker': { difficulty: 3, time: '1-2 weeks', resources: ['Docker Docs', 'Docker Tutorial'], prerequisites: ['linux'] },
      'kubernetes': { difficulty: 5, time: '3-4 weeks', resources: ['K8s Docs', 'Kubernetes Tutorial'], prerequisites: ['docker'] },
      'ci/cd': { difficulty: 4, time: '2 weeks', resources: ['GitHub Actions', 'Jenkins Tutorial'], prerequisites: ['git', 'docker'] },
      'terraform': { difficulty: 4, time: '2-3 weeks', resources: ['Terraform Docs', 'Terraform Tutorial'], prerequisites: ['cloud platforms'] },
      'linux': { difficulty: 2, time: '1-2 weeks', resources: ['Linux Journey', 'Command Line Tutorial'], prerequisites: [] },
      'cloud platforms': { difficulty: 4, time: '2-3 weeks', resources: ['AWS/Azure/GCP Docs', 'Cloud Tutorial'], prerequisites: ['linux'] },
      'monitoring': { difficulty: 3, time: '1-2 weeks', resources: ['Prometheus Docs', 'Grafana Tutorial'], prerequisites: ['docker'] },
      'security': { difficulty: 5, time: '2-3 weeks', resources: ['OWASP Guide', 'Security Tutorial'], prerequisites: ['linux', 'networking'] },
      'networking': { difficulty: 3, time: '2 weeks', resources: ['Networking Basics', 'TCP/IP Guide'], prerequisites: [] },
      'scripting': { difficulty: 2, time: '1 week', resources: ['Bash Scripting', 'PowerShell Tutorial'], prerequisites: ['linux'] },
      
      // Data Science skills
      'machine learning': { difficulty: 5, time: '4-6 weeks', resources: ['Coursera ML', 'Scikit-learn Docs'], prerequisites: ['python', 'statistics'] },
      'statistics': { difficulty: 3, time: '2-3 weeks', resources: ['Khan Academy Stats', 'Statistics Tutorial'], prerequisites: [] },
      'data analysis': { difficulty: 3, time: '2-3 weeks', resources: ['Pandas Docs', 'Data Analysis Tutorial'], prerequisites: ['python'] },
      'r': { difficulty: 3, time: '2-3 weeks', resources: ['R Documentation', 'R for Data Science'], prerequisites: ['statistics'] },
      'tensorflow': { difficulty: 5, time: '3-4 weeks', resources: ['TensorFlow Docs', 'TF Tutorial'], prerequisites: ['python', 'machine learning'] },
      'pytorch': { difficulty: 5, time: '3-4 weeks', resources: ['PyTorch Docs', 'PyTorch Tutorial'], prerequisites: ['python', 'machine learning'] },
      'data visualization': { difficulty: 3, time: '1-2 weeks', resources: ['Matplotlib Docs', 'D3.js Guide'], prerequisites: ['python'] },
      'big data': { difficulty: 5, time: '3-4 weeks', resources: ['Hadoop Docs', 'Spark Tutorial'], prerequisites: ['python', 'data analysis'] },
      'deep learning': { difficulty: 6, time: '4-6 weeks', resources: ['Deep Learning Book', 'Fast.ai'], prerequisites: ['machine learning', 'tensorflow'] },
      
      // Mobile skills
      'react native': { difficulty: 4, time: '2-3 weeks', resources: ['React Native Docs', 'RN Tutorial'], prerequisites: ['react', 'javascript'] },
      'swift': { difficulty: 4, time: '3-4 weeks', resources: ['Swift Docs', 'Hacking with Swift'], prerequisites: [] },
      'kotlin': { difficulty: 4, time: '3-4 weeks', resources: ['Kotlin Docs', 'Kotlin Tutorial'], prerequisites: [] },
      'flutter': { difficulty: 4, time: '2-3 weeks', resources: ['Flutter Docs', 'Flutter Tutorial'], prerequisites: [] },
      'ios': { difficulty: 5, time: '3-4 weeks', resources: ['Apple Developer Docs', 'iOS Tutorial'], prerequisites: ['swift'] },
      'android': { difficulty: 5, time: '3-4 weeks', resources: ['Android Docs', 'Android Tutorial'], prerequisites: ['kotlin'] },
      'mobile ui/ux': { difficulty: 3, time: '1-2 weeks', resources: ['Mobile Design Guide', 'UI/UX Tutorial'], prerequisites: [] },
      'apis': { difficulty: 3, time: '1-2 weeks', resources: ['REST API Guide', 'API Tutorial'], prerequisites: ['javascript'] },
      'firebase': { difficulty: 3, time: '1-2 weeks', resources: ['Firebase Docs', 'Firebase Tutorial'], prerequisites: ['javascript'] },
      
      // General skills
      'git': { difficulty: 1, time: '1 week', resources: ['Git Pro Book', 'GitHub Tutorial'], prerequisites: [] },
      'problem solving': { difficulty: 2, time: '2 weeks', resources: ['LeetCode', 'HackerRank'], prerequisites: [] },
      'communication': { difficulty: 1, time: '1 week', resources: ['Communication Skills Guide', 'Public Speaking'], prerequisites: [] }
    };
  }

    normalizeSkillName(skill) {
    const normalized = skill.toLowerCase().trim();
    const skillMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'reactjs': 'react',
      'react.js': 'react',
      'nodejs': 'node.js',
      'node': 'node.js',
      'aws': 'cloud platforms',
      'amazon web services': 'cloud platforms',
      'azure': 'cloud platforms',
      'gcp': 'cloud platforms',
      'version control': 'git',
      'vcs': 'git',
      'containerization': 'docker',
      'k8s': 'kubernetes',
      'ml': 'machine learning',
      'ai': 'machine learning',
      'data science': 'data analysis',
      'mobile development': 'mobile ui/ux',
      'app development': 'mobile ui/ux'
    };
    
    return skillMap[normalized] || normalized;
  }

  sortSkillsByDifficulty(skills) {
    return skills.map(skill => {
      const normalizedSkill = this.normalizeSkillName(skill);
      const skillInfo = this.skillLearningPaths[normalizedSkill] || { 
        difficulty: 3, 
        time: '2 weeks', 
        resources: ['Online Documentation', 'Tutorial Videos'], 
        prerequisites: [] 
      };
      return { skill: normalizedSkill, ...skillInfo };
    }).sort((a, b) => {
      // First sort by prerequisites, then by difficulty
      if (a.prerequisites.length === 0 && b.prerequisites.length > 0) return -1;
      if (a.prerequisites.length > 0 && b.prerequisites.length === 0) return 1;
      return a.difficulty - b.difficulty;
    });
  }

  groupSkillsIntoWeeks(sortedSkills) {
    const weeks = [];
    let currentWeek = 1;
    let currentWeekSkills = [];
    let currentWeekDifficulty = 0;

    for (const skillObj of sortedSkills) {
      // Check if adding this skill would exceed the weekly limits
      const wouldExceedSkills = currentWeekSkills.length >= 3;
      const wouldExceedDifficulty = currentWeekDifficulty + skillObj.difficulty > 8;
      
      if (wouldExceedSkills || wouldExceedDifficulty) {
        if (currentWeekSkills.length > 0) {
          weeks.push({
            week: currentWeek,
            focus: currentWeekSkills.map(s => s.skill),
            outcome: this.generateWeekOutcome(currentWeekSkills)
          });
          currentWeek++;
          currentWeekSkills = [];
          currentWeekDifficulty = 0;
        }
      }
      
      currentWeekSkills.push(skillObj);
      currentWeekDifficulty += skillObj.difficulty;
      
      // Stop if we've reached 8 weeks
      if (currentWeek > 8) break;
    }

    // Add the last week if it has skills
    if (currentWeekSkills.length > 0 && currentWeek <= 8) {
      weeks.push({
        week: currentWeek,
        focus: currentWeekSkills.map(s => s.skill),
        outcome: this.generateWeekOutcome(currentWeekSkills)
      });
    }

    return weeks;
  }

  generateWeekOutcome(skills) {
    const skillNames = skills.map(s => s.skill).join(', ');
    const outcomes = [
      `Master ${skillNames} through hands-on projects`,
      `Build practical applications with ${skillNames}`,
      `Implement real-world solutions using ${skillNames}`,
      `Develop proficiency in ${skillNames} with exercises`,
      `Create portfolio projects showcasing ${skillNames}`
    ];
    
    return outcomes[Math.floor(Math.random() * outcomes.length)];
  }

  generateRoadmap(missingSkills) {
    if (!missingSkills || !Array.isArray(missingSkills)) {
      throw new Error('Missing skills array is required');
    }

    const normalizedSkills = missingSkills.map(skill => this.normalizeSkillName(skill));
    const uniqueSkills = [...new Set(normalizedSkills)];
    
    if (uniqueSkills.length === 0) {
      return {
        roadmap: [{
          week: 1,
          focus: [],
          outcome: "No missing skills identified. Continue practicing current skills!"
        }]
      };
    }

    const sortedSkills = this.sortSkillsByDifficulty(uniqueSkills);
    const weeks = this.groupSkillsIntoWeeks(sortedSkills);

    return {
      roadmap: weeks,
      total_weeks: weeks.length,
      estimated_completion: `${weeks.length} weeks`,
      next_step: weeks.length > 0 ? `Start with Week 1: ${weeks[0].focus.join(', ')}` : 'No learning needed'
    };
  }
}

class ResourceRecommender {
  constructor() {
    this.skillResources = {
      // Frontend skills
      'html': [
        { title: 'MDN Web Docs - HTML', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', type: 'documentation', level: 'beginner' },
        { title: 'freeCodeCamp - Responsive Web Design', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', type: 'course', level: 'beginner' }
      ],
      'css': [
        { title: 'CSS Tricks - Complete Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'tutorial', level: 'beginner' },
        { title: 'Flexbox Froggy - Interactive Game', url: 'https://flexboxfroggy.com/', type: 'practice', level: 'beginner' }
      ],
      'javascript': [
        { title: 'JavaScript.info - Modern Tutorial', url: 'https://javascript.info/', type: 'tutorial', level: 'beginner' },
        { title: 'Traversy Media - JavaScript Crash Course', url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c', type: 'video', level: 'beginner' }
      ],
      'react': [
        { title: 'React Documentation - Tutorial', url: 'https://react.dev/learn', type: 'documentation', level: 'beginner' },
        { title: 'The Net Ninja - React Course', url: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9gZD-Tvwfod2gaISzfRGu9S', type: 'video', level: 'beginner' }
      ],
      'typescript': [
        { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', type: 'documentation', level: 'beginner' },
        { title: 'TypeScript Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=BwuLxPH8IDs', type: 'video', level: 'beginner' }
      ],
      'vue.js': [
        { title: 'Vue.js Official Guide', url: 'https://vuejs.org/guide/introduction.html', type: 'documentation', level: 'beginner' },
        { title: 'Vue Mastery - Free Vue 3 Course', url: 'https://www.vuemastery.com/courses/', type: 'course', level: 'beginner' }
      ],
      'angular': [
        { title: 'Angular Documentation - Getting Started', url: 'https://angular.io/guide/setup-local', type: 'documentation', level: 'beginner' },
        { title: 'Angular Crash Course', url: 'https://www.youtube.com/watch?v=2OHbjig_X5k', type: 'video', level: 'beginner' }
      ],
      'tailwind css': [
        { title: 'Tailwind CSS Documentation', url: 'https://tailwindcss.com/docs/installation', type: 'documentation', level: 'beginner' },
        { title: 'Tailwind CSS - Full Course', url: 'https://www.youtube.com/watch?v=UB1O30fR-EE', type: 'video', level: 'beginner' }
      ],
      'bootstrap': [
        { title: 'Bootstrap Documentation', url: 'https://getbootstrap.com/docs/', type: 'documentation', level: 'beginner' },
        { title: 'Bootstrap 5 Crash Course', url: 'https://www.youtube.com/watch?v=-qfEOE4vtxE', type: 'video', level: 'beginner' }
      ],
      'webpack': [
        { title: 'Webpack Documentation', url: 'https://webpack.js.org/concepts/', type: 'documentation', level: 'intermediate' },
        { title: 'Webpack Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=IZGNcSuwMz8', type: 'video', level: 'intermediate' }
      ],
      
      // Backend skills
      'node.js': [
        { title: 'Node.js Documentation', url: 'https://nodejs.org/en/docs/', type: 'documentation', level: 'beginner' },
        { title: 'Node.js Crash Course', url: 'https://www.youtube.com/watch?v=TlB_eWDSMt4', type: 'video', level: 'beginner' }
      ],
      'express': [
        { title: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'documentation', level: 'beginner' },
        { title: 'Express.js Tutorial', url: 'https://www.youtube.com/watch?v=L72fhGm1tfE', type: 'video', level: 'beginner' }
      ],
      'python': [
        { title: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'documentation', level: 'beginner' },
        { title: 'Corey Schafer - Python Tutorials', url: 'https://www.youtube.com/playlist?list=PL-osiE80TeTskodN1iz_rB_k1x2n21d1s', type: 'video', level: 'beginner' }
      ],
      'java': [
        { title: 'Oracle Java Tutorials', url: 'https://docs.oracle.com/javase/tutorial/', type: 'documentation', level: 'beginner' },
        { title: 'Java Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=eIrMbAQSU34', type: 'video', level: 'beginner' }
      ],
      'sql': [
        { title: 'SQL Bolt - Interactive SQL Tutorial', url: 'https://sqlbolt.com/', type: 'practice', level: 'beginner' },
        { title: 'SQL Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', type: 'video', level: 'beginner' }
      ],
      'nosql': [
        { title: 'MongoDB University - Free Courses', url: 'https://university.mongodb.com/', type: 'course', level: 'beginner' },
        { title: 'NoSQL Database Tutorial', url: 'https://www.youtube.com/watch?v=E-1x4UK2H88', type: 'video', level: 'beginner' }
      ],
      'database fundamentals': [
        { title: 'Database Design Tutorial', url: 'https://www.guru99.com/database-design.html', type: 'tutorial', level: 'beginner' },
        { title: 'SQL for Data Analysis', url: 'https://www.mode.com/sql-tutorial/', type: 'practice', level: 'beginner' }
      ],
      'api design': [
        { title: 'REST API Design Guide', url: 'https://restfulapi.net/', type: 'documentation', level: 'beginner' },
        { title: 'API Design Best Practices', url: 'https://www.youtube.com/watch?v=SLpUKAGnm-g', type: 'video', level: 'beginner' }
      ],
      'authentication': [
        { title: 'Auth0 Documentation', url: 'https://auth0.com/docs/', type: 'documentation', level: 'intermediate' },
        { title: 'JWT Tutorial', url: 'https://www.youtube.com/watch?v=7Q17ubqLfaM', type: 'video', level: 'intermediate' }
      ],
      
      // DevOps skills
      'docker': [
        { title: 'Docker Documentation - Get Started', url: 'https://docs.docker.com/get-started/', type: 'documentation', level: 'beginner' },
        { title: 'Docker Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=3c-iBn73dDE', type: 'video', level: 'beginner' }
      ],
      'kubernetes': [
        { title: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/tutorials/', type: 'documentation', level: 'intermediate' },
        { title: 'Kubernetes Crash Course', url: 'https://www.youtube.com/watch?v=X48VuDVv0do', type: 'video', level: 'intermediate' }
      ],
      'ci/cd': [
        { title: 'GitHub Actions Documentation', url: 'https://docs.github.com/en/actions', type: 'documentation', level: 'beginner' },
        { title: 'CI/CD Pipeline Tutorial', url: 'https://www.youtube.com/watch?v=scEDHsr3APg', type: 'video', level: 'beginner' }
      ],
      'terraform': [
        { title: 'Terraform Tutorials', url: 'https://learn.hashicorp.com/terraform', type: 'tutorial', level: 'beginner' },
        { title: 'Terraform Full Course', url: 'https://www.youtube.com/watch?v=SLc_cZxKhVU', type: 'video', level: 'beginner' }
      ],
      'linux': [
        { title: 'Linux Journey - Interactive Tutorial', url: 'https://linuxjourney.com/', type: 'practice', level: 'beginner' },
        { title: 'Linux Command Line Tutorial', url: 'https://www.youtube.com/watch?v=ROjZy2WpEA0', type: 'video', level: 'beginner' }
      ],
      'cloud platforms': [
        { title: 'AWS Free Tier Tutorial', url: 'https://aws.amazon.com/free/', type: 'course', level: 'beginner' },
        { title: 'Cloud Computing Basics', url: 'https://www.youtube.com/watch?v=M5r7K6129Qc', type: 'video', level: 'beginner' }
      ],
      'monitoring': [
        { title: 'Prometheus Documentation', url: 'https://prometheus.io/docs/introduction/overview/', type: 'documentation', level: 'intermediate' },
        { title: 'Grafana Tutorial', url: 'https://www.youtube.com/watch?v=3sJz2x1sGWU', type: 'video', level: 'intermediate' }
      ],
      'security': [
        { title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/', type: 'documentation', level: 'intermediate' },
        { title: 'Web Security Fundamentals', url: 'https://www.youtube.com/watch?v=6oW-3ZpU-pw', type: 'video', level: 'beginner' }
      ],
      'networking': [
        { title: 'Computer Networking Basics', url: 'https://www.youtube.com/watch?v=IPvY0Xe1RvM', type: 'video', level: 'beginner' },
        { title: 'TCP/IP Explained', url: 'https://www.youtube.com/watch?v=VYcUDd4S3qg', type: 'video', level: 'beginner' }
      ],
      'scripting': [
        { title: 'Bash Scripting Tutorial', url: 'https://www.youtube.com/watch?v=hwrnmQumtPc', type: 'video', level: 'beginner' },
        { title: 'Shell Scripting Guide', url: 'https://www.shellscript.sh/', type: 'documentation', level: 'beginner' }
      ],
      
      // Data Science skills
      'machine learning': [
        { title: 'Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', type: 'course', level: 'intermediate' },
        { title: 'Machine Learning Tutorial', url: 'https://www.youtube.com/watch?v=GwIo3gDZCVQ', type: 'video', level: 'beginner' }
      ],
      'statistics': [
        { title: 'Khan Academy - Statistics', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', level: 'beginner' },
        { title: 'Statistics Explained', url: 'https://www.youtube.com/watch?v=ohd-8Z0bE4E', type: 'video', level: 'beginner' }
      ],
      'data analysis': [
        { title: 'Pandas Documentation', url: 'https://pandas.pydata.org/docs/', type: 'documentation', level: 'beginner' },
        { title: 'Data Analysis with Python', url: 'https://www.youtube.com/watch?v/r-uOLxNrNk8', type: 'video', level: 'beginner' }
      ],
      'r': [
        { title: 'R for Data Science', url: 'https://r4ds.had.co.nz/', type: 'tutorial', level: 'beginner' },
        { title: 'R Programming Tutorial', url: 'https://www.youtube.com/watch?v=XYF3a_2xB9U', type: 'video', level: 'beginner' }
      ],
      'tensorflow': [
        { title: 'TensorFlow Tutorials', url: 'https://www.tensorflow.org/tutorials', type: 'tutorial', level: 'intermediate' },
        { title: 'TensorFlow Course', url: 'https://www.youtube.com/watch?v/tPYj3fFJGjk', type: 'video', level: 'intermediate' }
      ],
      'pytorch': [
        { title: 'PyTorch Tutorials', url: 'https://pytorch.org/tutorials/', type: 'tutorial', level: 'intermediate' },
        { title: 'PyTorch Tutorial', url: 'https://www.youtube.com/watch?v=9zhrxE5PQgY', type: 'video', level: 'intermediate' }
      ],
      'data visualization': [
        { title: 'Matplotlib Documentation', url: 'https://matplotlib.org/stable/tutorials/index.html', type: 'documentation', level: 'beginner' },
        { title: 'Data Visualization Tutorial', url: 'https://www.youtube.com/watch?v=DAQNHzOcO5A', type: 'video', level: 'beginner' }
      ],
      'big data': [
        { title: 'Hadoop Tutorial', url: 'https://www.tutorialspoint.com/hadoop/', type: 'tutorial', level: 'intermediate' },
        { title: 'Big Data Explained', url: 'https://www.youtube.com/watch?v=CblmiTlk2ek', type: 'video', level: 'beginner' }
      ],
      'deep learning': [
        { title: 'Deep Learning Book', url: 'https://www.deeplearningbook.org/', type: 'documentation', level: 'advanced' },
        { title: 'Deep Learning Tutorial', url: 'https://www.youtube.com/watch?v=aircAruvnKk', type: 'video', level: 'intermediate' }
      ],
      
      // Mobile skills
      'react native': [
        { title: 'React Native Documentation', url: 'https://reactnative.dev/docs/getting-started', type: 'documentation', level: 'beginner' },
        { title: 'React Native Tutorial', url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc', type: 'video', level: 'beginner' }
      ],
      'swift': [
        { title: 'Swift Documentation', url: 'https://docs.swift.org/swift-book/', type: 'documentation', level: 'beginner' },
        { title: 'Swift Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=XOkp-3E5A1E', type: 'video', level: 'beginner' }
      ],
      'kotlin': [
        { title: 'Kotlin Documentation', url: 'https://kotlinlang.org/docs/home.html', type: 'documentation', level: 'beginner' },
        { title: 'Kotlin Tutorial', url: 'https://www.youtube.com/watch?v=EExSSotojVI', type: 'video', level: 'beginner' }
      ],
      'flutter': [
        { title: 'Flutter Documentation', url: 'https://flutter.dev/docs', type: 'documentation', level: 'beginner' },
        { title: 'Flutter Crash Course', url: 'https://www.youtube.com/watch?v=1ukSR1GRtMU', type: 'video', level: 'beginner' }
      ],
      'ios': [
        { title: 'Apple Developer Documentation', url: 'https://developer.apple.com/documentation/', type: 'documentation', level: 'intermediate' },
        { title: 'iOS Development Tutorial', url: 'https://www.youtube.com/watch?v=6aFmUP2yH3E', type: 'video', level: 'beginner' }
      ],
      'android': [
        { title: 'Android Developer Documentation', url: 'https://developer.android.com/docs', type: 'documentation', level: 'beginner' },
        { title: 'Android Development Tutorial', url: 'https://www.youtube.com/watch?v=fis26HvvDII', type: 'video', level: 'beginner' }
      ],
      'mobile ui/ux': [
        { title: 'Mobile Design Principles', url: 'https://www.youtube.com/watch?v=O2A2_2xV7Us', type: 'video', level: 'beginner' },
        { title: 'UI/UX Design Tutorial', url: 'https://www.youtube.com/watch?v=5aX2r-3s9yE', type: 'video', level: 'beginner' }
      ],
      'apis': [
        { title: 'REST API Tutorial', url: 'https://www.youtube.com/watch?v=GZvSYJDk-us', type: 'video', level: 'beginner' },
        { title: 'API Integration Guide', url: 'https://www.freecodecamp.org/news/rest-api-design-best-practices/', type: 'tutorial', level: 'beginner' }
      ],
      'firebase': [
        { title: 'Firebase Documentation', url: 'https://firebase.google.com/docs', type: 'documentation', level: 'beginner' },
        { title: 'Firebase Tutorial', url: 'https://www.youtube.com/watch?v=gpO3aY9pcS4', type: 'video', level: 'beginner' }
      ],
      
      // General skills
      'git': [
        { title: 'Git Pro Book', url: 'https://git-scm.com/book/en/v2', type: 'documentation', level: 'beginner' },
        { title: 'Git Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', type: 'video', level: 'beginner' }
      ],
      'problem solving': [
        { title: 'LeetCode - Practice Problems', url: 'https://leetcode.com/', type: 'practice', level: 'beginner' },
        { title: 'Problem Solving Techniques', url: 'https://www.youtube.com/watch?v=AZ4CH7gSH30', type: 'video', level: 'beginner' }
      ],
      'communication': [
        { title: 'Communication Skills Guide', url: 'https://www.mindtools.com/CommSkll/CommunicationIntro.htm', type: 'tutorial', level: 'beginner' },
        { title: 'Public Speaking Tutorial', url: 'https://www.youtube.com/watch?v=HAnw168huqA', type: 'video', level: 'beginner' }
      ]
    };
  }

   normalizeSkillName(skill) {
    const normalized = skill.toLowerCase().trim();
    const skillMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'reactjs': 'react',
      'react.js': 'react',
      'nodejs': 'node.js',
      'node': 'node.js',
      'aws': 'cloud platforms',
      'amazon web services': 'cloud platforms',
      'azure': 'cloud platforms',
      'gcp': 'cloud platforms',
      'version control': 'git',
      'vcs': 'git',
      'containerization': 'docker',
      'k8s': 'kubernetes',
      'ml': 'machine learning',
      'ai': 'machine learning',
      'data science': 'data analysis',
      'mobile development': 'mobile ui/ux',
      'app development': 'mobile ui/ux'
    };
    
    return skillMap[normalized] || normalized;
  }

  getResourcesForSkills(skills) {
    if (!skills || !Array.isArray(skills)) {
      throw new Error('Skills array is required');
    }

    const resources = [];
    const processedSkills = new Set();

    skills.forEach(skill => {
      const normalizedSkill = this.normalizeSkillName(skill);
      
      if (!processedSkills.has(normalizedSkill)) {
        processedSkills.add(normalizedSkill);
        
        const skillResources = this.skillResources[normalizedSkill];
        if (skillResources && skillResources.length > 0) {
          // Return 1-2 resources per skill, preferring beginner-friendly and free content
          const selectedResources = skillResources
            .filter(resource => resource.level === 'beginner' || resource.level === 'intermediate')
            .slice(0, 2)
            .map(resource => ({
              title: resource.title,
              url: resource.url,
              type: resource.type,
              level: resource.level
            }));

          if (selectedResources.length > 0) {
            resources.push({
              skill: normalizedSkill,
              links: selectedResources
            });
          }
        } else {
          // Fallback for unknown skills
          resources.push({
            skill: normalizedSkill,
            links: [
              {
                title: `${normalizedSkill} - Search Tutorials`,
                url: `https://www.google.com/search?q=${normalizedSkill}+tutorial+for+beginners`,
                type: 'search',
                level: 'beginner'
              },
              {
                title: `${normalizedSkill} - YouTube Tutorial`,
                url: `https://www.youtube.com/results?search_query=${normalizedSkill}+tutorial+for+beginners`,
                type: 'video',
                level: 'beginner'
              }
            ]
          });
        }
      }
    });

    return {
      resources,
      total_skills: resources.length,
      total_resources: resources.reduce((sum, r) => sum + r.links.length, 0)
    };
  }
}

class JobSuggester {
  constructor() {
    this.jobSkillRequirements = {
      'Frontend Developer': {
        core: ['html', 'css', 'javascript'],
        preferred: ['react', 'vue.js', 'angular', 'typescript', 'tailwind css'],
        bonus: ['webpack', 'bootstrap', 'git'],
        growth: ['Senior Frontend Developer', 'Frontend Architect', 'UI/UX Engineer', 'Full Stack Developer']
      },
      'Backend Developer': {
        core: ['node.js', 'python', 'java', 'sql'],
        preferred: ['express', 'django', 'spring', 'nosql', 'api design'],
        bonus: ['docker', 'git', 'authentication', 'database fundamentals'],
        growth: ['Senior Backend Developer', 'Backend Architect', 'DevOps Engineer', 'Full Stack Developer']
      },
      'Full Stack Developer': {
        core: ['javascript', 'html', 'css', 'node.js'],
        preferred: ['react', 'express', 'sql', 'git', 'api design'],
        bonus: ['typescript', 'docker', 'python', 'nosql'],
        growth: ['Senior Full Stack Developer', 'Technical Lead', 'Solutions Architect', 'Engineering Manager']
      },
      'Data Scientist': {
        core: ['python', 'statistics', 'data analysis'],
        preferred: ['machine learning', 'r', 'sql', 'data visualization'],
        bonus: ['tensorflow', 'pytorch', 'big data', 'deep learning'],
        growth: ['Senior Data Scientist', 'ML Engineer', 'Data Science Manager', 'Research Scientist']
      },
      'DevOps Engineer': {
        core: ['linux', 'docker', 'git'],
        preferred: ['kubernetes', 'ci/cd', 'cloud platforms', 'monitoring'],
        bonus: ['terraform', 'security', 'networking', 'scripting'],
        growth: ['Senior DevOps Engineer', 'DevOps Architect', 'SRE Manager', 'Cloud Architect']
      },
      'Mobile Developer': {
        core: ['javascript', 'mobile ui/ux'],
        preferred: ['react native', 'swift', 'kotlin', 'flutter'],
        bonus: ['ios', 'android', 'apis', 'firebase'],
        growth: ['Senior Mobile Developer', 'Mobile Architect', 'Engineering Manager', 'Product Manager']
      },
      'UI/UX Designer': {
        core: ['mobile ui/ux'],
        preferred: ['css', 'javascript', 'communication'],
        bonus: ['html', 'react', 'problem solving'],
        growth: ['Senior UI/UX Designer', 'Design Lead', 'Product Designer', 'Design Manager']
      },
      'QA Engineer': {
        core: ['problem solving', 'communication'],
        preferred: ['javascript', 'python', 'sql', 'apis'],
        bonus: ['git', 'automation', 'testing frameworks'],
        growth: ['Senior QA Engineer', 'QA Lead', 'Test Architect', 'DevOps Engineer']
      },
      'Technical Writer': {
        core: ['communication'],
        preferred: ['javascript', 'apis', 'documentation'],
        bonus: ['git', 'problem solving', 'technical skills'],
        growth: ['Senior Technical Writer', 'Documentation Lead', 'Developer Advocate', 'Product Manager']
      },
      'Junior Developer': {
        core: ['javascript', 'html', 'css', 'git'],
        preferred: ['problem solving', 'communication'],
        bonus: ['react', 'node.js', 'python'],
        growth: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer']
      }
    };

    this.skillSynonyms = {
      'js': 'javascript',
      'ts': 'typescript',
      'reactjs': 'react',
      'react.js': 'react',
      'nodejs': 'node.js',
      'node': 'node.js',
      'aws': 'cloud platforms',
      'amazon web services': 'cloud platforms',
      'azure': 'cloud platforms',
      'gcp': 'cloud platforms',
      'version control': 'git',
      'vcs': 'git',
      'containerization': 'docker',
      'k8s': 'kubernetes',
      'ml': 'machine learning',
      'ai': 'machine learning',
      'data science': 'data analysis',
      'mobile development': 'mobile ui/ux',
      'app development': 'mobile ui/ux'
    };
  }

  normalizeSkill(skill) {
    const normalized = skill.toLowerCase().trim();
    return this.skillSynonyms[normalized] || normalized;
  }

  normalizeSkills(skills) {
    return skills.map(skill => this.normalizeSkill(skill));
  }

  calculateJobMatch(candidateSkills, jobRequirements) {
    const normalizedSkills = this.normalizeSkills(candidateSkills);
    const skillSet = new Set(normalizedSkills);

    const coreMatches = jobRequirements.core.filter(skill => skillSet.has(skill)).length;
    const preferredMatches = jobRequirements.preferred.filter(skill => skillSet.has(skill)).length;
    const bonusMatches = jobRequirements.bonus.filter(skill => skillSet.has(skill)).length;

    const coreScore = (coreMatches / jobRequirements.core.length) * 50;
    const preferredScore = (preferredMatches / jobRequirements.preferred.length) * 30;
    const bonusScore = (bonusMatches / jobRequirements.bonus.length) * 20;

    const totalScore = coreScore + preferredScore + bonusScore;
    const matchedSkills = [
      ...jobRequirements.core.filter(skill => skillSet.has(skill)),
      ...jobRequirements.preferred.filter(skill => skillSet.has(skill)),
      ...jobRequirements.bonus.filter(skill => skillSet.has(skill))
    ];

    return {
      score: totalScore,
      coreMatches,
      preferredMatches,
      bonusMatches,
      matchedSkills,
      totalMatches: matchedSkills.length
    };
  }

  generateReason(jobTitle, matchData, candidateSkills) {
    const { score, coreMatches, preferredMatches, matchedSkills } = matchData;
    
    let reason = `Strong match with ${score.toFixed(1)}% compatibility. `;
    
    if (coreMatches > 0) {
      reason += `Has core skills: ${coreMatches > 0 ? matchedSkills.slice(0, coreMatches).join(', ') : ''}. `;
    }
    
    if (preferredMatches > 0) {
      reason += `Also knows preferred technologies: ${matchedSkills.slice(coreMatches, coreMatches + preferredMatches).join(', ')}. `;
    }
    
    if (score >= 70) {
      reason += `Excellent fit for this role with strong foundational knowledge.`;
    } else if (score >= 50) {
      reason += `Good fit with room to grow in preferred technologies.`;
    } else {
      reason += `Potential fit with focus on core skill development.`;
    }
    
    return reason;
  }

  suggestJobs(candidateSkills) {
    if (!candidateSkills || !Array.isArray(candidateSkills)) {
      throw new Error('Candidate skills array is required');
    }

    const normalizedSkills = this.normalizeSkills(candidateSkills);
    const jobMatches = [];

    for (const [jobTitle, requirements] of Object.entries(this.jobSkillRequirements)) {
      const matchData = this.calculateJobMatch(normalizedSkills, requirements);
      
      if (matchData.score > 20) { // Only include jobs with at least 20% match
        jobMatches.push({
          title: jobTitle,
          score: matchData.score,
          reason: this.generateReason(jobTitle, matchData, normalizedSkills),
          matchedSkills: matchData.matchedSkills,
          growth: requirements.growth
        });
      }
    }

    // Sort by score and take top 5
    jobMatches.sort((a, b) => b.score - a.score);
    const topMatches = jobMatches.slice(0, 5);

    return {
      job_suggestions: topMatches.map(job => ({
        title: job.title,
        reason: job.reason
      })),
      total_candidates: jobMatches.length,
      top_score: topMatches.length > 0 ? topMatches[0].score : 0,
      growth_opportunities: topMatches.length > 0 ? topMatches[0].growth : []
    };
  }
}

const extractor = new ResumeExtractor();
const roleAnalyzer = new JobRoleAnalyzer();
const skillGapAnalyzer = new SkillGapAnalyzer();
const roadmapGenerator = new LearningRoadmapGenerator();
const resourceRecommender = new ResourceRecommender();
const jobSuggester = new JobSuggester();

app.post('/api/extract/text', async (req, res) => {
  try {
    const { resume_text } = req.body;
    
    if (!resume_text) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    const result = await extractor.processResume(resume_text);
    res.json(result);
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ error: 'Failed to process resume text' });
  }
});

app.post('/api/extract/pdf', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const result = await extractor.processResume(pdfData.text);
    res.json(result);
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

app.post('/api/extract/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
    const result = await extractor.processResume(text);
    res.json(result);
  } catch (error) {
    console.error('Error processing OCR:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

app.post('/api/analyze/role', async (req, res) => {
  try {
    const { job_role } = req.body;
    
    if (!job_role) {
      return res.status(400).json({ error: 'Job role is required' });
    }

    const result = roleAnalyzer.analyzeRole(job_role);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing role:', error);
    res.status(500).json({ error: 'Failed to analyze job role' });
  }
});

app.post('/api/analyze/skill-gap', async (req, res) => {
  try {
    const { candidate_skills_json, role_skills_json } = req.body;
    
    if (!candidate_skills_json || !role_skills_json) {
      return res.status(400).json({ error: 'Both candidate skills and role requirements are required' });
    }

    let candidateSkills, roleRequirements;
    
    try {
      candidateSkills = typeof candidate_skills_json === 'string' 
        ? JSON.parse(candidate_skills_json) 
        : candidate_skills_json;
      roleRequirements = typeof role_skills_json === 'string' 
        ? JSON.parse(role_skills_json) 
        : role_skills_json;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    const result = skillGapAnalyzer.analyzeSkillGap(candidateSkills, roleRequirements);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing skill gap:', error);
    res.status(500).json({ error: 'Failed to analyze skill gap' });
  }
});

app.post('/api/generate/roadmap', async (req, res) => {
  try {
    const { missing_skills_array } = req.body;
    
    if (!missing_skills_array) {
      return res.status(400).json({ error: 'Missing skills array is required' });
    }

    let missingSkills;
    
    try {
      missingSkills = typeof missing_skills_array === 'string' 
        ? JSON.parse(missing_skills_array) 
        : missing_skills_array;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    if (!Array.isArray(missingSkills)) {
      return res.status(400).json({ error: 'Missing skills must be an array' });
    }

    const result = roadmapGenerator.generateRoadmap(missingSkills);
    res.json(result);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ error: 'Failed to generate learning roadmap' });
  }
});

app.post('/api/recommend/resources', async (req, res) => {
  try {
    const { skills_array } = req.body;
    
    if (!skills_array) {
      return res.status(400).json({ error: 'Skills array is required' });
    }

    let skills;
    
    try {
      skills = typeof skills_array === 'string' 
        ? JSON.parse(skills_array) 
        : skills_array;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array' });
    }

    const result = resourceRecommender.getResourcesForSkills(skills);
    res.json(result);
  } catch (error) {
    console.error('Error recommending resources:', error);
    res.status(500).json({ error: 'Failed to recommend resources' });
  }
});

app.post('/api/suggest/jobs', async (req, res) => {
  try {
    const { candidate_skills_json } = req.body;
    
    if (!candidate_skills_json) {
      return res.status(400).json({ error: 'Candidate skills are required' });
    }

    let candidateSkills;
    
    try {
      candidateSkills = typeof candidate_skills_json === 'string' 
        ? JSON.parse(candidate_skills_json) 
        : candidate_skills_json;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    if (!Array.isArray(candidateSkills)) {
      return res.status(400).json({ error: 'Candidate skills must be an array' });
    }

    const result = jobSuggester.suggestJobs(candidateSkills);
    res.json(result);
  } catch (error) {
    console.error('Error suggesting jobs:', error);
    res.status(500).json({ error: 'Failed to suggest jobs' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Resume Text Extractor running on port ${PORT}`);
});
