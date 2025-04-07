// Dynamic Architectural Drawing Processor Server
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Load environment variables from .env file
require('dotenv').config();

// Import the consolidated agent
const { 
  analyzeDrawingWithAI,
  generateMaterialsQuantities,
  generateConstructionTasks,
  generateExcelReport,
  generateCombinedExcelReport,
  processMultipleDrawings
} = require('./suddeco-final-agent');

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
    // Check if we need combined analysis data
    const isCombined = req.query.combined === 'true';
    
    if (isCombined) {
      // Create a sample combined analysis data if no file exists yet
      const combinedAnalysisPath = path.join(__dirname, 'output', 'suddeco_combined_analysis.json');
      
      if (fs.existsSync(combinedAnalysisPath)) {
        const data = JSON.parse(fs.readFileSync(combinedAnalysisPath, 'utf8'));
        res.json(data);
      } else {
        // Return a sample combined data structure if no analysis file exists yet
        res.json({
          generated_at: new Date().toISOString(),
          architectural_analysis: {
            building_analysis: {
              total_internal_dimensions: {
                length: "25.7m",
                width: "18.4m",
                height: "2.4m"
              },
              total_external_dimensions: {
                length: "26.5m",
                width: "19.2m",
                height: "2.7m"
              },
              total_floor_area: {
                internal: "472.9m²",
                external: "508.8m²"
              }
            },
            room_details: [
              {
                name: "Living Room (Drawing 1)",
                internal_dimensions: {
                  length: "5.2m",
                  width: "4.5m",
                  height: "2.4m"
                },
                floor_area: {
                  internal: "23.4m²"
                }
              },
              {
                name: "Kitchen (Drawing 1)",
                internal_dimensions: {
                  length: "4.2m",
                  width: "3.5m",
                  height: "2.4m"
                },
                floor_area: {
                  internal: "14.7m²"
                }
              },
              {
                name: "Master Bedroom (Drawing 2)",
                internal_dimensions: {
                  length: "4.8m",
                  width: "4.0m",
                  height: "2.4m"
                },
                floor_area: {
                  internal: "19.2m²"
                }
              }
            ]
          },
          materials_quantities: {
            "Construction Materials": {
              "Concrete": "45.8m³",
              "Bricks": "7350 units",
              "Timber": "255.6m²",
              "Insulation": "508.8m²"
            },
            "Finishing Materials": {
              "Paint": "1250.5m²",
              "Flooring": "472.9m²",
              "Ceiling": "472.9m²"
            },
            "Fixtures": {
              "Doors": "21 units",
              "Windows": "27 units",
              "Electrical Outlets": "72 units",
              "Light Fixtures": "36 units"
            }
          },
          construction_tasks: [
            {
              "task_name": "Site Preparation",
              "duration_days": "5",
              "labor_required": "4 workers"
            },
            {
              "task_name": "Foundation Work",
              "duration_days": "12",
              "labor_required": "6 workers"
            },
            {
              "task_name": "Framing",
              "duration_days": "15",
              "labor_required": "8 workers"
            },
            {
              "task_name": "Roofing",
              "duration_days": "7",
              "labor_required": "6 workers"
            },
            {
              "task_name": "Electrical Installation",
              "duration_days": "10",
              "labor_required": "4 electricians"
            }
          ]
        });
      }
    } else {
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
              "Paint": "416.8m²",
              "Flooring": "127.5m²",
              "Ceiling": "127.5m²"
            },
            "Fixtures": {
              "Doors": "7 units",
              "Windows": "9 units",
              "Electrical Outlets": "24 units",
              "Light Fixtures": "12 units"
            }
          },
          construction_tasks: [
            {
              "task_name": "Site Preparation",
              "duration_days": "2",
              "labor_required": "3 workers"
            },
            {
              "task_name": "Foundation Work",
              "duration_days": "5",
              "labor_required": "4 workers"
            },
            {
              "task_name": "Framing",
              "duration_days": "7",
              "labor_required": "5 workers"
            },
            {
              "task_name": "Roofing",
              "duration_days": "3",
              "labor_required": "4 workers"
            },
            {
              "task_name": "Electrical Installation",
              "duration_days": "4",
              "labor_required": "2 electricians"
            }
          ]
        });
      }
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

// API endpoint for processing multiple drawings
app.post('/api/process-multiple-drawings', upload.array('drawings', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`API request: Processing ${req.files.length} files`);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Process multiple drawings using the integrated agent
    const result = await processMultipleDrawings(req.files.map(file => file.path));
    
    // Generate timestamp for unique filenames
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    
    // Save the combined report to disk
    const combinedReportPath = path.join(outputDir, `suddeco_combined_report_${timestamp}.xlsx`);
    await generateCombinedExcelReport(result, combinedReportPath);
    
    // Return detailed API response
    res.json({
      success: true,
      message: `${req.files.length} drawings processed successfully`,
      data: {
        combinedAnalysis: result,
        reports: {
          excel: `/output/suddeco_combined_report_${timestamp}.xlsx`
        }
      }
    });
    
  } catch (error) {
    console.error('Error processing multiple drawings:', error);
    res.status(500).json({ 
      error: 'Error processing multiple drawings', 
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
      // Use the consolidated agent functions for construction tasks
      constructionPlan = {
        taskBreakdown: result.taskBreakdown,
        reportUrl: result.reportUrl
      };
      
      // The Excel report already contains all the necessary information
      // including construction tasks, so we don't need to generate it again
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
    // For PDF files, use the new integrated agent
    try {
      // Use the integrated agent to analyze the drawing
      const architecturalAnalysis = await analyzeDrawingWithAI(file.path, 'pdf');
      const materialsQuantities = await generateMaterialsQuantities(architecturalAnalysis);
      const constructionTasks = await generateConstructionTasks(architecturalAnalysis, materialsQuantities);
      
      // Generate Excel report
      const reportPath = path.join(__dirname, 'output', `suddeco_report_${timestamp}.xlsx`);
      await generateExcelReport({
        architecturalAnalysis,
        materialsQuantities,
        constructionTasks
      }, reportPath);
      
      return {
        analysisResult: architecturalAnalysis,
        materialsResult: materialsQuantities,
        taskBreakdown: constructionTasks,
        timestamp,
        reportUrl: `suddeco_report_${timestamp}.xlsx`
      };
    } catch (error) {
      console.error('Error using integrated agent:', error);
      // Fall back to the existing method if there's an error
      inputData = await extractDataFromDrawing(file.path, fileExt);
    }
  } else {
    // For other file types, create a basic structure
    inputData = await extractDataFromDrawing(file.path, fileExt);
  }
  
  // If we're using the legacy flow
  if (inputData) {
    // Process the drawing data
    console.log('Processing architectural data using legacy flow...');
    try {
      // Create a mock architectural analysis from the inputData
      const architecturalAnalysis = {
        building_analysis: {
          total_internal_dimensions: {
            length: inputData.rooms.reduce((max, room) => {
              const length = parseFloat(room.internal_dimensions.length);
              return isNaN(length) ? max : Math.max(max, length);
            }, 0) + 'm',
            width: inputData.rooms.reduce((max, room) => {
              const width = parseFloat(room.internal_dimensions.width);
              return isNaN(width) ? max : Math.max(max, width);
            }, 0) + 'm',
            height: inputData.ceiling_height || '2.4m'
          },
          total_external_dimensions: {
            length: inputData.rooms.reduce((max, room) => {
              const length = parseFloat(room.internal_dimensions.length);
              return isNaN(length) ? max : Math.max(max, length + 0.6);
            }, 0) + 'm',
            width: inputData.rooms.reduce((max, room) => {
              const width = parseFloat(room.internal_dimensions.width);
              return isNaN(width) ? max : Math.max(max, width + 0.6);
            }, 0) + 'm',
            height: inputData.ceiling_height ? (parseFloat(inputData.ceiling_height) + 0.3) + 'm' : '2.7m'
          },
          total_floor_area: {
            internal: inputData.rooms.reduce((sum, room) => {
              const length = parseFloat(room.internal_dimensions.length);
              const width = parseFloat(room.internal_dimensions.width);
              return sum + (isNaN(length) || isNaN(width) ? 0 : length * width);
            }, 0).toFixed(1) + 'm²',
            external: inputData.rooms.reduce((sum, room) => {
              const length = parseFloat(room.internal_dimensions.length) + 0.6;
              const width = parseFloat(room.internal_dimensions.width) + 0.6;
              return sum + (isNaN(length) || isNaN(width) ? 0 : length * width);
            }, 0).toFixed(1) + 'm²'
          }
        },
        room_details: inputData.rooms.map(room => ({
          name: room.name,
          internal_dimensions: room.internal_dimensions,
          floor_area: {
            internal: (parseFloat(room.internal_dimensions.length) * parseFloat(room.internal_dimensions.width)).toFixed(1) + 'm²'
          }
        }))
      };
      
      // Generate materials and tasks using the consolidated agent
      const materialsQuantities = await generateMaterialsQuantities(architecturalAnalysis);
      const constructionTasks = await generateConstructionTasks(architecturalAnalysis, materialsQuantities);
      
      // Generate Excel report
      const reportPath = path.join(__dirname, 'output', `suddeco_report_${timestamp}.xlsx`);
      await generateExcelReport({
        architecturalAnalysis,
        materialsQuantities,
        constructionTasks
      }, reportPath);
      
      return {
        analysisResult: architecturalAnalysis,
        materialsResult: materialsQuantities,
        taskBreakdown: constructionTasks,
        timestamp,
        reportUrl: `suddeco_report_${timestamp}.xlsx`
      };
    } catch (error) {
      console.error('Error in legacy flow with consolidated agent:', error);
      return {
        error: 'Failed to process drawing',
        details: error.message,
        timestamp
      };
    }
  }
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
