// Debug Upload Test
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/resume';

async function debugUpload() {
  console.log('🔍 Debugging Resume Upload Process');
  console.log('==================================');

  try {
    // Test 1: Check if server is responding
    console.log('\n1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.status);

    // Test 2: Check if roles endpoint works
    console.log('\n2️⃣ Testing roles endpoint...');
    const rolesResponse = await axios.get(`${BASE_URL}/roles`);
    console.log('✅ Roles available:', rolesResponse.data.data.roles.length);

    // Test 3: Try upload with a simple text file
    console.log('\n3️⃣ Testing upload process...');
    
    // Create a simple test file
    const testContent = 'John Doe\njohn.doe@example.com\nSkills: JavaScript, React, Node.js, MongoDB';
    const testBuffer = Buffer.from(testContent);
    
    const formData = new FormData();
    formData.append('resume', testBuffer, {
      filename: 'test-resume.txt',
      contentType: 'text/plain'
    });
    formData.append('name', 'John Doe');
    formData.append('email', 'john.doe@example.com');

    console.log('📤 Sending upload request...');

    const uploadResponse = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 30000
    });

    console.log('✅ Upload successful!');
    console.log('📊 Response:', uploadResponse.data);

    if (uploadResponse.data.success) {
      const resumeId = uploadResponse.data.data.id;
      console.log('📋 Resume ID:', resumeId);

      // Test 4: Try analysis
      console.log('\n4️⃣ Testing analysis...');
      const analysisResponse = await axios.post(`${BASE_URL}/analyze`, {
        resumeId: resumeId,
        targetRole: 'software_engineer'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('✅ Analysis successful!');
      console.log('📊 Analysis response:', analysisResponse.data);
    }

    console.log('\n==================================');
    console.log('🎉 DEBUG COMPLETE!');
    console.log('✅ All endpoints working correctly');

  } catch (error) {
    console.error('❌ Debug error:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
      console.error('   Headers:', error.response.headers);
    } else {
      console.error('   Message:', error.message);
    }
  }
}

debugUpload();
