// Suddeco AI Drawing Processor - Server Entry Point
console.log('Starting Suddeco AI Drawing Processor - Server Entry Point');

// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Import the final agent module (this ensures Render uses the correct file)
const finalAgent = require('./suddeco-final-agent');

// Create Express app
const app = express();
const port = process.env.PORT || 10000;

// Create uploads and output directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for processing drawings
app.post('/api/process-drawing', upload.single('drawing'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No drawing file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase().substring(1);
    const description = req.body.description || '';
    
    console.log(`Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);
    console.log(`Analyzing drawing: ${filePath}`);
    
    if (description) {
      console.log(`Using client description for analysis: ${description.substring(0, 50)}...`);
    }
    
    // Analyze the drawing
    console.log('Analyzing drawing with AI (type: ' + fileType + ')...');
    const analysisResult = await finalAgent.analyzeDrawing(filePath, fileType, description);
    
    if (!analysisResult) {
      throw new Error('Analysis failed to produce a result');
    }
    
    console.log('Analysis completed successfully');
    
    // Generate materials quantities based on architectural analysis
    const materialsQuantities = await finalAgent.generateMaterialsQuantities(analysisResult);
    
    // Generate construction tasks based on architectural analysis and materials quantities
    const constructionTasks = await finalAgent.generateConstructionTasks(analysisResult, materialsQuantities);
    
    // Save analysis results to a JSON file
    const outputFilePath = path.join(outputDir, `analysis_${Date.now()}.json`);
    const outputData = {
      architecturalAnalysis: analysisResult,
      materialsQuantities,
      constructionTasks
    };
    
    fs.writeFileSync(outputFilePath, JSON.stringify(outputData, null, 2));
    console.log(`Analysis saved to ${outputFilePath}`);
    
    // Return the analysis results
    res.json({
      success: true,
      data: outputData,
      filePath: outputFilePath
    });
  } catch (error) {
    console.error('Error processing drawing:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing the drawing'
    });
  }
});

// API endpoint for getting the latest analysis
app.get('/api/latest-analysis', (req, res) => {
  try {
    // Get all JSON files in the output directory
    const files = fs.readdirSync(outputDir)
      .filter(file => file.startsWith('analysis_') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(outputDir, file),
        time: fs.statSync(path.join(outputDir, file)).mtime.getTime()
      }));
    
    // Sort files by modification time (newest first)
    files.sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'No analysis files found' });
    }
    
    // Read the latest analysis file
    const latestFile = files[0];
    const analysisData = JSON.parse(fs.readFileSync(latestFile.path, 'utf8'));
    
    // Return the latest analysis data
    res.json({
      success: true,
      data: analysisData,
      filePath: latestFile.path
    });
  } catch (error) {
    console.error('Error getting latest analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while getting the latest analysis'
    });
  }
});

// API endpoint for downloading an analysis file
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(outputDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while downloading the file'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Suddeco AI Drawing Processor server running at http://localhost:${port}`);
  console.log(`API endpoint available at http://localhost:${port}/api/process-drawing`);
});

// Export the finalAgent for Render to use
module.exports = finalAgent;
