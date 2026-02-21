# 🎯 Complete Resume Analysis System Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Installation & Setup](#installation--setup)
3. [API Documentation](#api-documentation)
4. [Database Schema](#database-schema)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 System Overview

The **Complete Resume Analysis System** is a production-ready Node.js application that:

- ✅ **Parses resumes offline** (PDF/DOCX) without external APIs
- ✅ **Analyzes skill gaps** against job role requirements
- ✅ **Generates personalized learning roadmaps**
- ✅ **Stores data in MongoDB** with proper schema
- ✅ **Provides RESTful API** for all operations
- ✅ **Works completely offline** once deployed

### 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │────│   Express API   │────│   MongoDB DB    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Offline Parser │
                       │  Skill Analysis │
                       │  Roadmap Gen    │
                       └─────────────────┘
```

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 16+ 
- MongoDB Atlas or local MongoDB
- Git

### Step 1: Clone & Install

```bash
git clone <repository-url>
cd SkillSync/Backend
npm install
```

### Step 2: Environment Setup

Create `.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: APYHub API (if needed for external parsing)
# APYHUB_API_KEY=your_api_key_here
```

### Step 3: Start Server

```bash
# Development
npm start

# Production
NODE_ENV=production npm start
```

---

## 📡 API Documentation

### Base URL: `http://localhost:3000/api/resume`

### 📤 Upload Endpoints

#### POST `/upload`
Upload and parse a resume file.

**Request:**
```javascript
// Form Data
resume: File (PDF/DOCX, max 5MB)
name: String (optional)
email: String (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64a7b8c9d1e2f3g4h5i6j7k8",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "skills": ["JavaScript", "React", "Node.js"],
    "education": [...],
    "experience": [...],
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "skillCount": 15
  }
}
```

#### GET `/:id`
Retrieve a specific resume by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64a7b8c9d1e2f3g4h5i6j7k8",
    "name": "John Doe",
    "skills": ["JavaScript", "React"],
    // ... other fields
  }
}
```

#### GET `/email/:email`
Get all resumes for a specific email.

#### DELETE `/:id`
Delete a resume by ID.

#### GET `/stats`
Get upload statistics.

---

### 🔍 Analysis Endpoints

#### POST `/analyze`
Analyze a stored resume against a target role.

**Request:**
```json
{
  "resumeId": "64a7b8c9d1e2f3g4h5i6j7k8",
  "targetRole": "software_engineer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resumeInfo": {
      "id": "64a7b8c9d1e2f3g4h5i6j7k8",
      "name": "John Doe",
      "totalSkills": 15
    },
    "skillGapAnalysis": {
      "role": "Software Engineer",
      "matchPercentage": 75,
      "skillGapPercentage": 25,
      "matchedSkills": ["JavaScript", "React"],
      "missingSkills": ["Docker", "AWS"],
      "analysis": {
        "skillLevel": "Advanced",
        "readinessScore": 82
      }
    },
    "roadmap": {
      "role": "software_engineer",
      "missingSkills": ["Docker", "AWS"],
      "totalEstimatedDuration": "2 months",
      "roadmap": [
        {
          "skill": "Docker",
          "duration": "1-2 months",
          "priority": "High",
          "resources": [...],
          "steps": [...]
        }
      ]
    },
    "roleSuggestions": [
      {
        "role": "software_engineer",
        "roleName": "Software Engineer",
        "matchPercentage": 75
      }
    ]
  }
}
```

#### POST `/analyze-skills`
Analyze skills directly without storing resume.

**Request:**
```json
{
  "skills": ["JavaScript", "React", "Python"],
  "targetRole": "frontend_developer"
}
```

#### GET `/roles`
Get all available job roles.

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "software_engineer",
        "name": "Software Engineer",
        "requiredSkillsCount": 11,
        "preferredSkillsCount": 8
      }
    ],
    "count": 10
  }
}
```

---

### 🔧 Utility Endpoints

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "service": "Resume Analysis Service",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

## 🗄️ Database Schema

### Resume Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Optional user reference
  name: String,               // Required, max 100 chars
  email: String,              // Required, validated email
  phone: String,              // Optional, max 20 chars
  skills: [String],           // Array of skill names
  education: [Mixed],         // Education details
  experience: [Mixed],        // Experience details
  fileName: String,           // Original filename
  fileSize: Number,           // File size in bytes
  fileType: String,           // pdf, docx, or other
  uploadedAt: Date,           // Upload timestamp
  createdAt: Date,            // Document creation
  updatedAt: Date             // Last update
}
```

### Indexes

- `{ email: 1, uploadedAt: -1 }` - User resume queries
- `{ userId: 1, uploadedAt: -1 }` - User-specific queries
- `{ uploadedAt: -1 }` - Recent uploads

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment mode |
| `APYHUB_API_KEY` | No | - | External API key (optional) |

### Skills Configuration

**File:** `data/requiredSkills.json`

```json
{
  "software_engineer": {
    "name": "Software Engineer",
    "required_skills": ["javascript", "react", "nodejs"],
    "preferred_skills": ["docker", "aws", "testing"]
  }
}
```

**File:** `data/roadmapData.json`

```json
{
  "javascript": {
    "skill": "JavaScript",
    "level": "Beginner to Advanced",
    "duration": "3-6 months",
    "resources": [...],
    "steps": [...]
  }
}
```

---

## 🧪 Testing

### Run Complete System Test

```bash
# Start test server (without MongoDB)
node test-server-mongo.js

# Run complete test suite
node test-final.js
```

### Test Results Example

```
🚀 Testing Complete Resume Analysis System
==========================================

1️⃣ Testing Health Check...
✅ Health Check: OK

2️⃣ Testing Resume Upload...
✅ Resume Upload: SUCCESS
   Resume ID: resume_1
   Skills Extracted: 19
   Name: Anjali Soni

3️⃣ Testing Skill Gap Analysis...
✅ Skill Analysis: SUCCESS
   Target Role: Software Engineer
   Match Percentage: 82%
   Matched Skills: 9
   Missing Skills: 2
   Skill Level: Expert

4️⃣ Testing Available Roles...
✅ Available Roles: SUCCESS
   Total Roles: 10
```

### Individual Component Tests

```bash
# Test offline parser
node test-offline-parser.js

# Test API endpoints
node test-api-offline.js

# Test complete system
node test-complete-system.js
```

---

## 🚀 Deployment

### Production Setup

1. **Environment Setup**
```bash
export NODE_ENV=production
export PORT=3000
export MONGODB_URI=mongodb+srv://...
```

2. **Start Application**
```bash
npm start
```

3. **Process Manager (PM2)**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "resume-api"

# Monitor
pm2 monit
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  resume-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
    restart: unless-stopped
```

### Cloud Deployment

#### AWS Elastic Beanstalk
1. Create application
2. Upload code as ZIP
3. Configure environment variables
4. Deploy

#### Heroku
1. Create app: `heroku create`
2. Set config: `heroku config:set MONGODB_URI=...`
3. Deploy: `git push heroku main`

#### DigitalOcean App Platform
1. Create app
2. Connect repository
3. Configure build and run commands
4. Deploy

---

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
MongoServerError: bad auth
```
**Solution:** Check MongoDB credentials and IP whitelist

#### 2. File Upload Error
```
Error: Only PDF and DOCX files are allowed
```
**Solution:** Ensure file type is correct and under 5MB

#### 3. Skill Analysis Error
```
Role "xyz" not found in required skills data
```
**Solution:** Check available roles with GET `/api/resume/roles`

#### 4. Memory Issues
```
JavaScript heap out of memory
```
**Solution:** Increase Node.js memory limit
```bash
node --max-old-space-size=4096 server.js
```

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* npm start
```

### Health Checks

Monitor system health:
```bash
# API Health
curl http://localhost:3000/api/resume/health

# MongoDB Connection
curl http://localhost:3000/api/resume/stats
```

---

## 📊 Performance Optimization

### Database Optimization

1. **Indexes**: Ensure proper indexes are created
2. **Connection Pooling**: Configure MongoDB connection pool
3. **Caching**: Implement Redis for frequent queries

### Application Optimization

1. **File Processing**: Stream large files
2. **Rate Limiting**: Prevent abuse
3. **Compression**: Enable gzip compression

### Monitoring

1. **Logging**: Structured logging with Winston
2. **Metrics**: Track API response times
3. **Alerts**: Set up error monitoring

---

## 🔒 Security Considerations

### File Upload Security
- ✅ File type validation
- ✅ File size limits
- ✅ Content scanning
- ✅ Secure temporary storage

### API Security
- ✅ Rate limiting
- ✅ Input validation
- ✅ CORS configuration
- ✅ SQL injection prevention

### Data Protection
- ✅ PII data handling
- ✅ Encryption at rest
- ✅ Secure authentication
- ✅ Audit logging

---

## 📈 Scaling

### Horizontal Scaling
- Load balancer configuration
- Multiple app instances
- Database sharding
- CDN for static assets

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching layers
- Monitor performance metrics

---

## 🤝 Contributing

### Code Standards
- ESLint configuration
- Prettier formatting
- Unit tests required
- Documentation updates

### Development Workflow
1. Fork repository
2. Create feature branch
3. Write tests
4. Submit pull request
5. Code review

---

## 📞 Support

### Documentation
- API Reference
- Database Schema
- Configuration Guide
- Troubleshooting Guide

### Community
- GitHub Issues
- Stack Overflow
- Discord Community
- Email Support

---

**🎉 Your Complete Resume Analysis System is Ready for Production!**

This system provides a comprehensive, production-ready solution for resume parsing, skill analysis, and career roadmap generation - all working completely offline without external dependencies.
