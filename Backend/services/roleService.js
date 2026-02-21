const roleRequirements = {
  'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React'],
  'Backend Developer': ['Node.js', 'Express', 'MongoDB'],
  'Full Stack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
  'DevOps Engineer': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux'],
  'Data Scientist': ['Python', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy'],
  'Mobile Developer': ['React Native', 'JavaScript', 'Mobile UI', 'API Integration'],
  'UI/UX Designer': ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Design Systems']
};

const roadmapTemplates = {
  'HTML': ['Learn HTML basics', 'Master semantic HTML', 'Learn accessibility', 'Build responsive layouts'],
  'CSS': ['Learn CSS fundamentals', 'Master Flexbox and Grid', 'Learn animations', 'Study responsive design'],
  'JavaScript': ['Learn JS basics', 'Master ES6+ features', 'Learn DOM manipulation', 'Study async programming'],
  'React': ['Learn JSX', 'Master Hooks', 'Build 3 projects', 'Learn state management'],
  'Node.js': ['Learn Node basics', 'Master Express', 'Build REST APIs', 'Learn authentication'],
  'Express': ['Setup Express server', 'Learn middleware', 'Master routing', 'Build CRUD operations'],
  'MongoDB': ['Learn CRUD operations', 'Master Schema Design', 'Learn Aggregation', 'Study indexing'],
  'Docker': ['Learn Docker basics', 'Master Dockerfile', 'Learn Docker Compose', 'Build containerized apps'],
  'Kubernetes': ['Learn K8s basics', 'Master pods and services', 'Learn deployments', 'Study scaling'],
  'CI/CD': ['Learn Git workflows', 'Master Jenkins/GitHub Actions', 'Build pipelines', 'Learn deployment strategies'],
  'AWS': ['Learn AWS basics', 'Master EC2 and S3', 'Learn Lambda', 'Study cloud architecture'],
  'Python': ['Learn Python basics', 'Master data structures', 'Learn OOP', 'Study libraries'],
  'Machine Learning': ['Learn ML basics', 'Master algorithms', 'Build models', 'Study deployment'],
  'Statistics': ['Learn descriptive stats', 'Master probability', 'Study hypothesis testing', 'Learn regression'],
  'Pandas': ['Learn Pandas basics', 'Master data manipulation', 'Learn data cleaning', 'Study analysis'],
  'NumPy': ['Learn NumPy basics', 'Master arrays', 'Learn mathematical operations', 'Study performance'],
  'React Native': ['Learn RN basics', 'Master components', 'Build mobile apps', 'Learn navigation'],
  'Mobile UI': ['Learn mobile design principles', 'Master responsive design', 'Study gestures', 'Learn platform guidelines'],
  'API Integration': ['Learn REST APIs', 'Master async calls', 'Study authentication', 'Learn error handling'],
  'Figma': ['Learn Figma basics', 'Master components', 'Learn prototyping', 'Study design systems'],
  'Adobe XD': ['Learn XD basics', 'Master wireframing', 'Learn prototyping', 'Study collaboration'],
  'Prototyping': ['Learn prototyping principles', 'Master interactive prototypes', 'Study user testing', 'Learn iteration'],
  'User Research': ['Learn research methods', 'Master user interviews', 'Study analytics', 'Learn persona creation'],
  'Design Systems': ['Learn design principles', 'Master component libraries', 'Study documentation', 'Learn consistency'],
  'Linux': ['Learn Linux basics', 'Master command line', 'Learn shell scripting', 'Study system administration']
};

const calculateSkillGap = (extractedSkills, targetRole) => {
  const requiredSkills = roleRequirements[targetRole] || [];
  const missingSkills = requiredSkills.filter(skill => !extractedSkills.includes(skill));
  const matchedSkills = requiredSkills.filter(skill => extractedSkills.includes(skill));
  const matchPercentage = requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 100 : 0;
  
  return {
    missingSkills,
    matchedSkills,
    matchPercentage,
    requiredSkills
  };
};

const generateRoadmap = (skillGap) => {
  const roadmap = [];
  skillGap.forEach(skill => {
    if (roadmapTemplates[skill]) {
      roadmap.push(...roadmapTemplates[skill]);
    }
  });
  return roadmap;
};

const getSuggestedRoles = (matchPercentage, targetRole) => {
  const suggestions = [];
  
  if (matchPercentage > 70) {
    suggestions.push(targetRole);
  } else if (matchPercentage > 50) {
    suggestions.push(`Junior ${targetRole}`);
  } else {
    suggestions.push(`${targetRole} Intern`);
  }
  
  if (matchPercentage < 50) {
    suggestions.push('Entry Level Developer');
  }
  
  return suggestions;
};

module.exports = {
  roleRequirements,
  roadmapTemplates,
  calculateSkillGap,
  generateRoadmap,
  getSuggestedRoles
};
