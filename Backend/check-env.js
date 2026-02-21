require('dotenv').config();
console.log('🔑 APYHub API Key:', process.env.APYHUB_API_KEY ? 'Present' : 'Missing');
console.log('📊 MongoDB URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
console.log('🚀 Port:', process.env.PORT || '3000');

if (process.env.APYHUB_API_KEY) {
  console.log('API Key length:', process.env.APYHUB_API_KEY.length);
  console.log('API Key starts with:', process.env.APYHUB_API_KEY.substring(0, 10) + '...');
}
