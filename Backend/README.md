# Resume Text Extractor

A hackathon-ready MVP that cleans raw resume text and structures it into JSON format. Supports text input, PDF upload, and OCR processing.

## Features

- **Text Processing**: Paste raw resume text directly
- **PDF Upload**: Extract text from PDF files
- **OCR Support**: Process images with OCR technology
- **Smart Cleaning**: Removes headers, footers, page numbers
- **Section Identification**: Automatically identifies Summary, Skills, Experience, Education, Projects
- **JSON Output**: Clean, structured data ready for analysis

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open browser to `http://localhost:3000`

## API Endpoints

### Process Text
```
POST /api/extract/text
Content-Type: application/json

{
  "resume_text": "raw resume text here..."
}
```

### Process PDF
```
POST /api/extract/pdf
Content-Type: multipart/form-data

resume: [PDF file]
```

### Process OCR
```
POST /api/extract/ocr
Content-Type: multipart/form-data

image: [Image file]
```

## Output Format
```json
{
  "summary": "Brief professional summary",
  "skills": ["JavaScript", "Node.js", "React"],
  "experience": ["Senior Developer at Company A (2020-2023)"],
  "education": ["BS Computer Science, University Name"],
  "projects": ["Project A - Description"]
}
```

## Technology Stack

- **Backend**: Node.js + Express
- **PDF Processing**: pdf-parse
- **OCR**: Tesseract.js
- **Frontend**: HTML + Tailwind CSS
- **File Upload**: Multer

## Development

Run in development mode:
```bash
npm run dev
```

## License

MIT
