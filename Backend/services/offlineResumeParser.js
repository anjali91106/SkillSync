const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class OfflineResumeParser {
  constructor() {
    this.skillsDictionary = this.loadSkillsDictionary();
  }

  loadSkillsDictionary() {
    return {
      // Programming Languages
      programming: [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab',
        'html', 'css', 'sass', 'less', 'stylus'
      ],
      // Frameworks & Libraries
      frameworks: [
        'react', 'vue', 'angular', 'nodejs', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'nextjs', 'nuxtjs', 'gatsby',
        'jquery', 'bootstrap', 'tailwind', 'material ui', 'ant design', 'chakra ui', 'redux', 'mobx', 'vuex', 'ngrx'
      ],
      // Databases
      databases: [
        'mysql', 'postgresql', 'mongodb', 'sqlite', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'supabase',
        'oracle', 'sql server', 'mariadb', 'neo4j', 'influxdb'
      ],
      // Cloud & DevOps
      cloud: [
        'aws', 'azure', 'google cloud', 'gcp', 'heroku', 'vercel', 'netlify', 'digitalocean', 'docker', 'kubernetes', 'jenkins',
        'gitlab', 'github actions', 'terraform', 'ansible', 'puppet', 'chef', 'nginx', 'apache', 'linux', 'ubuntu', 'windows server'
      ],
      // Tools & Technologies
      tools: [
        'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack', 'trello', 'asana', 'figma', 'sketch', 'adobe xd',
        'photoshop', 'illustrator', 'vs code', 'intellij', 'eclipse', 'postman', 'swagger', 'insomnia', 'webpack', 'babel', 'eslint'
      ],
      // Soft Skills
      softSkills: [
        'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking', 'time management', 'project management',
        'agile', 'scrum', 'kanban', 'collaboration', 'creativity', 'innovation', 'analytical skills', 'attention to detail'
      ]
    };
  }

  async parseResume(fileBuffer, originalName, mimeType) {
    try {
      console.log('\n🚀 Starting offline resume parsing...');
      console.log('📁 File name:', originalName);
      console.log('📊 File size:', fileBuffer.length, 'bytes');

      // Extract text based on file type
      let text = '';
      if (mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
        text = await this.extractFromPDF(fileBuffer);
      } else if (mimeType.includes('word') || originalName.toLowerCase().endsWith('.docx')) {
        text = await this.extractFromDocx(fileBuffer);
      } else {
        throw new Error('Unsupported file format. Only PDF and DOCX are supported.');
      }

      console.log('📝 Extracted text length:', text.length, 'characters');

      // Parse the extracted text
      const parsedData = this.extractStructuredData(text);
      
      console.log('✅ Resume parsing completed successfully');
      return parsedData;

    } catch (error) {
      console.error('❌ Resume parsing error:', error.message);
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  async extractFromPDF(buffer) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  async extractFromDocx(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  extractStructuredData(text) {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    
    return {
      name: this.extractName(cleanedText),
      email: this.extractEmail(cleanedText),
      phone: this.extractPhone(cleanedText),
      skills: this.extractSkills(cleanedText),
      education: this.extractEducation(cleanedText),
      experience: this.extractExperience(cleanedText)
    };
  }

  extractName(text) {
    // Try multiple patterns for name extraction
    const patterns = [
      // Name at the beginning of resume
      /^([A-Z][a-z]+ [A-Z][a-z]+)/m,
      // Name with middle initial
      /^([A-Z][a-z]+ [A-Z]\.?[A-Z]? [A-Z][a-z]+)/m,
      // Name with multiple words
      /^([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})/m
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && !this.isCommonWord(match[1])) {
        return match[1].trim();
      }
    }

    return '';
  }

  extractEmail(text) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const match = text.match(emailPattern);
    return match ? match[0].toLowerCase() : '';
  }

  extractPhone(text) {
    // Multiple phone number patterns
    const patterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,  // 123-456-7890, 123.456.7890
      /\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/g,  // (123) 456-7890
      /\b\d{10}\b/g,  // 1234567890
      /\+\d{1,3}\s?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g  // +1 123-456-7890
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].replace(/[^\d+\-().\s]/g, '');
      }
    }

    return '';
  }

  extractSkills(text) {
    const foundSkills = new Set();
    const lowerText = text.toLowerCase();

    // Check all skill categories
    Object.values(this.skillsDictionary).forEach(category => {
      category.forEach(skill => {
        if (lowerText.includes(skill.toLowerCase())) {
          foundSkills.add(this.formatSkill(skill));
        }
      });
    });

    // Also look for explicit skills section
    const skillsSection = this.extractSection(text, ['skills', 'technical skills', 'technologies', 'tech stack']);
    if (skillsSection) {
      const sectionSkills = this.extractSkillsFromSection(skillsSection);
      sectionSkills.forEach(skill => foundSkills.add(skill));
    }

    return Array.from(foundSkills).sort();
  }

  extractSkillsFromSection(sectionText) {
    const skills = [];
    const lines = sectionText.split(/[,\n•·]/);
    
    lines.forEach(line => {
      const cleaned = line.trim().replace(/^[:\-\s]+/, '');
      if (cleaned.length > 0 && cleaned.length < 50) {
        skills.push(cleaned);
      }
    });

    return skills;
  }

  extractEducation(text) {
    const educationSection = this.extractSection(text, ['education', 'academic', 'university', 'college', 'degree']);
    if (!educationSection) return [];

    const education = [];
    const lines = educationSection.split('\n');
    
    lines.forEach(line => {
      if (this.looksLikeEducation(line.trim())) {
        education.push(line.trim());
      }
    });

    return education;
  }

  extractExperience(text) {
    const experienceSection = this.extractSection(text, [
      'experience', 'work experience', 'employment', 'professional experience', 'career', 'job history'
    ]);
    if (!experienceSection) return [];

    const experience = [];
    const lines = experienceSection.split('\n');
    
    let currentJob = '';
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.looksLikeJobTitle(trimmed)) {
        if (currentJob) experience.push(currentJob);
        currentJob = trimmed;
      } else if (currentJob && trimmed.length > 0) {
        currentJob += ' ' + trimmed;
      }
    });
    
    if (currentJob) experience.push(currentJob);

    return experience;
  }

  extractSection(text, sectionKeywords) {
    const lines = text.split('\n');
    let startIndex = -1;
    let endIndex = lines.length;

    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (sectionKeywords.some(keyword => line.includes(keyword))) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) return '';

    // Find section end (next major section)
    const majorSections = ['skills', 'experience', 'education', 'projects', 'certification', 'awards', 'summary', 'objective'];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (majorSections.some(section => line.includes(section) && !sectionKeywords.some(keyword => line.includes(keyword)))) {
        endIndex = i;
        break;
      }
    }

    return lines.slice(startIndex + 1, endIndex).join('\n').trim();
  }

  looksLikeEducation(text) {
    const educationKeywords = [
      'bachelor', 'master', 'phd', 'doctorate', 'degree', 'university', 'college', 'institute',
      'school of', 'department of', 'faculty of', 'graduated', 'gpa', 'cum laude'
    ];
    
    const lowerText = text.toLowerCase();
    return educationKeywords.some(keyword => lowerText.includes(keyword)) ||
           /\d{4}\s*-\s*\d{4}/.test(text) || // Date range
           /\b\d{4}\b/.test(text); // Year
  }

  looksLikeJobTitle(text) {
    const jobTitleIndicators = [
      'engineer', 'developer', 'manager', 'director', 'analyst', 'specialist', 'consultant',
      'coordinator', 'administrator', 'assistant', 'lead', 'senior', 'junior', 'intern', 'trainee'
    ];
    
    const lowerText = text.toLowerCase();
    return jobTitleIndicators.some(indicator => lowerText.includes(indicator)) ||
           /^[A-Z][a-z]+ [A-Z][a-z]+/.test(text); // Capitalized words
  }

  formatSkill(skill) {
    return skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
  }

  isCommonWord(word) {
    const commonWords = [
      'resume', 'curriculum vitae', 'cv', 'profile', 'summary', 'objective', 'experience', 'education',
      'skills', 'contact', 'email', 'phone', 'address', 'page', 'references'
    ];
    
    return commonWords.includes(word.toLowerCase());
  }
}

module.exports = new OfflineResumeParser();
