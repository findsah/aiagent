// Dynamic Architectural Drawing Processor Server
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { main: analyzeDrawing } = require('./architectural_analyzer');
const { 
  generateConstructionTaskBreakdown, 
  calculateProjectTimeline, 
  generateGanttChartData 
} = require('./construction_planner');

// Create Express app
const app = express();
const port = 3030; // Changed port to avoid conflicts

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

// Serve static files from the public directory
app.use(express.static('public'));
app.use('/output', express.static('output'));
app.use(express.json());

// Add route to serve the measurements report directly
app.get('/reports/measurements', (req, res) => {
  res.sendFile(path.join(__dirname, 'measurements_report.html'));
});

// Add route to serve the text report directly
app.get('/reports/text', (req, res) => {
  res.sendFile(path.join(__dirname, 'suddeco_measurements_report.txt'));
});

// Add route to get the latest analysis as JSON for embedding in the UI
app.get('/api/latest-analysis', (req, res) => {
  try {
    // Create a sample analysis data if no file exists yet
    const analysisPath = path.join(__dirname, 'output', 'suddeco_detailed_analysis.skson');
    
    if (fs.existsSync(analysisPath)) {
      const data = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
      res.json(data);
    } else {
      // Return a sample data structure if no analysis file exists yet
      res.json({
        generated_at: new Date().toISOString(),
        architectural_analysis: {
          building_analysis: {
            total_internal_dimensions: {
              length: "12.5m",
              width: "10.2m",
              height: "2.4m"
            },
            total_external_dimensions: {
              length: "13.1m",
              width: "10.8m",
              height: "2.7m"
            },
            total_floor_area: {
              internal: "127.5m²",
              external: "141.5m²"
            }
          },
          room_details: [
            {
              name: "Living Room",
              internal_dimensions: {
                length: "5.2m",
                width: "4.5m",
                height: "2.4m"
              },
              external_dimensions: {
                length: "5.6m",
                width: "4.9m",
                height: "2.7m"
              },
              floor_area: {
                internal: "23.4m²",
                external: "27.4m²"
              },
              wall_surface_area: "46.8m²",
              ceiling_area: "23.4m²"
            },
            {
              name: "Kitchen",
              internal_dimensions: {
                length: "4.2m",
                width: "3.5m",
                height: "2.4m"
              },
              external_dimensions: {
                length: "4.6m",
                width: "3.9m",
                height: "2.7m"
              },
              floor_area: {
                internal: "14.7m²",
                external: "17.9m²"
              },
              wall_surface_area: "36.8m²",
              ceiling_area: "14.7m²"
            }
          ]
        },
        materials_quantities: {
          "Construction Materials": {
            "Concrete": "15.3m³",
            "Bricks": "2450 units",
            "Timber": "85.2m²",
            "Insulation": "141.5m²"
          },
          "Finishing Materials": {
            "Paint": "210.5m²",
            "Flooring": "127.5m²",
            "Ceiling": "127.5m²"
          },
          "Fixtures": {
            "Doors": "7 units",
            "Windows": "9 units",
            "Electrical Outlets": "24 units",
            "Light Fixtures": "12 units"
          }
        }
      });
    }
  } catch (error) {
    console.error('Error reading analysis data:', error);
    res.status(500).json({ error: 'Error reading analysis data', details: error.message });
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for construction planner page
app.get('/construction-planner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'construction-planner.html'));
});

// API endpoint for construction planning
app.post('/api/construction-plan', async (req, res) => {
  try {
    const { architecturalAnalysis, materialsQuantities } = req.body;
    
    if (!architecturalAnalysis || !materialsQuantities) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required data', 
        details: 'Both architecturalAnalysis and materialsQuantities are required' 
      });
    }

    console.log('Generating construction plan...');
    
    // Generate the construction task breakdown
    const result = await generateConstructionTaskBreakdown(architecturalAnalysis, materialsQuantities);
    
    // Calculate the project timeline
    const timeline = calculateProjectTimeline(result.taskBreakdown);
    
    // Generate Gantt chart data
    const ganttData = generateGanttChartData(result.taskBreakdown);
    
    // Return the comprehensive construction plan
    res.json({
      success: true,
      message: 'Construction plan generated successfully',
      data: {
        taskBreakdown: result.taskBreakdown,
        timeline: timeline,
        ganttChart: ganttData,
        reportUrl: path.basename(result.outputPath)
      }
    });
    
  } catch (error) {
    console.error('API Error generating construction plan:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error generating construction plan', 
      details: error.message 
    });
  }
});

// API endpoint for processing drawings
app.post('/api/process-drawing', upload.single('drawing'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`API request: Processing file: ${req.file.originalname}`);
    
    // Process the drawing using the same logic as the upload endpoint
    const result = await processDrawingFile(req.file);
    
    // Generate construction plan based on the analysis
    console.log('Generating construction plan for the drawing...');
    let constructionPlan = null;
    
    try {
      // Generate the construction task breakdown
      const planResult = await generateConstructionTaskBreakdown(
        result.analysisResult.architectural_analysis, 
        result.analysisResult.materials_quantities
      );
      
      // Calculate the project timeline
      const timeline = calculateProjectTimeline(planResult.taskBreakdown);
      
      // Generate Gantt chart data
      const ganttData = generateGanttChartData(planResult.taskBreakdown);
      
      constructionPlan = {
        taskBreakdown: planResult.taskBreakdown,
        timeline: timeline,
        ganttChart: ganttData,
        reportUrl: path.basename(planResult.outputPath)
      };
    } catch (planError) {
      console.error('Error generating construction plan:', planError);
      constructionPlan = { error: planError.message };
    }
    
    // Return detailed API response
    res.json({
      success: true,
      message: 'Drawing processed successfully',
      data: {
        analysis: result.analysisResult,
        materials: result.materialsResult,
        tasks: result.taskBreakdown,
        constructionPlan: constructionPlan,
        reportUrls: {
          skson: `/output/suddeco_detailed_analysis_${result.timestamp}.skson`,
          text: '/suddeco_measurements_report.txt',
          html: '/measurements_report.html',
          constructionPlan: constructionPlan?.reportUrl ? `/output/${constructionPlan.reportUrl}` : null
        }
      }
    });
    
  } catch (error) {
    console.error('API Error processing drawing:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error processing drawing', 
      details: error.message 
    });
  }
});

// File upload endpoint for web interface
app.post('/upload', upload.single('drawing'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Web interface: File uploaded: ${req.file.originalname}`);
    
    // Process the drawing
    const result = await processDrawingFile(req.file);
    
    // Return the result paths for the web interface
    res.json({
      success: true,
      message: 'Drawing processed successfully',
      reportUrl: `/output/suddeco_detailed_analysis_${result.timestamp}.skson`,
      visualizationUrl: '/suddeco_measurements_report.txt',
      htmlReportUrl: '/measurements_report.html'
    });
    
  } catch (error) {
    console.error('Error processing drawing:', error);
    res.status(500).json({ 
      error: 'Error processing drawing', 
      details: error.message 
    });
  }
});

// Helper function to process drawing files
async function processDrawingFile(file) {
  let inputData;
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  
  // Process the file based on its type
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (fileExt === '.json') {
    // If JSON file, parse it directly
    const fileContent = fs.readFileSync(file.path, 'utf8');
    inputData = JSON.parse(fileContent);
  } else if (fileExt === '.pdf') {
    // For PDF files, we would use a PDF parser
    // For now, we'll extract some basic data and create a structure
    inputData = await extractDataFromDrawing(file.path, fileExt);
  } else if (fileExt === '.dxf' || fileExt === '.dwg') {
    // For CAD files, we would use a CAD parser
    // For now, we'll extract some basic data and create a structure
    inputData = await extractDataFromDrawing(file.path, fileExt);
  } else {
    // For other file types, create a basic structure
    inputData = await extractDataFromDrawing(file.path, fileExt);
  }
  
  // Process the drawing data
  console.log('Processing architectural data...');
  const result = await analyzeDrawing(inputData);
  
  return {
    ...result,
    timestamp
  };
}

// Function to extract data from various drawing formats
async function extractDataFromDrawing(filePath, fileExt) {
  // In a production environment, this would use specialized libraries
  // to extract real data from the drawing files
  
  console.log(`Extracting data from ${fileExt} file: ${filePath}`);
  
  // For now, we'll return a template structure with some randomized values
  // to simulate extraction from different files
  
  // Generate random dimensions for rooms to simulate different drawings
  function getRandomDimension(min, max) {
    return (Math.random() * (max - min) + min).toFixed(1) + 'm';
  }
  
  // Create a dynamic set of rooms with random dimensions
  const roomTypes = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Dining Room', 'Office', 'Hallway'];
  const numRooms = Math.floor(Math.random() * 5) + 3; // 3-7 rooms
  
  const rooms = [];
  for (let i = 0; i < numRooms; i++) {
    const roomType = roomTypes[i % roomTypes.length];
    const roomName = i > 0 && roomType === 'Bedroom' ? `${roomType} ${i}` : roomType;
    
    rooms.push({
      name: roomName,
      internal_dimensions: {
        length: getRandomDimension(3, 7),
        width: getRandomDimension(2.5, 5),
        height: "2.4m"
      },
      features: ["Feature 1", "Feature 2"]
    });
  }
  
  return {
    drawing_type: `Extracted ${fileExt.substring(1).toUpperCase()} Drawing - ${path.basename(filePath)}`,
    scale: "1:50",
    wall_thickness: "0.2m",
    ceiling_height: "2.4m",
    rooms: rooms,
    openings: [
      {
        type: "Door",
        width: "0.9m",
        height: "2.1m",
        quantity: Math.floor(Math.random() * 5) + 3 // 3-7 doors
      },
      {
        type: "Window",
        width: "1.2m",
        height: "1.0m",
        quantity: Math.floor(Math.random() * 6) + 4 // 4-9 windows
      }
    ],
    fixtures: [
      {
        type: "Electrical outlets",
        quantity: Math.floor(Math.random() * 15) + 15 // 15-29 outlets
      },
      {
        type: "Light fixtures",
        quantity: Math.floor(Math.random() * 8) + 5 // 5-12 light fixtures
      }
    ]
  };
}

// Start the server
app.listen(port, () => {
  console.log(`Architectural Drawing Processor server running at http://localhost:${port}`);
  console.log(`API endpoint available at http://localhost:${port}/api/process-drawing`);
});
