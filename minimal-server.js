require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create Express app
const app = express();
const port = process.env.PORT || 3030;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept PDF, DXF, DWG, and JSON files
    const filetypes = /pdf|dxf|dwg|json/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only architectural drawing files (PDF, DXF, DWG) and JSON data are allowed!'));
    }
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Suddeco AI Drawing Processor is running' });
});

// Simple file upload endpoint
app.post('/api/upload', upload.single('drawing'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`File uploaded: ${req.file.originalname}`);
    
    // Create a simple report file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(outputDir, `report_${timestamp}.txt`);
    
    fs.writeFileSync(reportPath, `
      Suddeco AI Drawing Processor Report
      ----------------------------------
      File: ${req.file.originalname}
      Size: ${req.file.size} bytes
      Uploaded: ${new Date().toLocaleString()}
      
      This is a placeholder report. In the full application, this would contain
      detailed measurements and analysis of the architectural drawing.
    `);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      reportUrl: `/output/${path.basename(reportPath)}`
    });
    
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: 'Error processing upload', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Suddeco AI Drawing Processor running on http://localhost:${port}`);
});
