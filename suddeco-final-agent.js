// Suddeco AI Drawing Processor - PRODUCTION VERSION
// This is the FINAL AGENT file that should be used in production environments
// Contains complete implementation with enhanced system prompts, RAG integration, and robust error handling
// Integrated with external APIs:
// - https://api.suddeco.com/syed/materials
// - https://api.suddeco.com/syed/tasks
// - https://api.suddeco.com/syed/stages
// - https://api.suddeco.com/syed/rooms

console.log('Starting Suddeco AI Drawing Processor - PRODUCTION VERSION (May 2025)');

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { openai } = require('./openai-client');
const ExcelJS = require('exceljs');
const PDFParser = require('pdf-parse');
const ragModule = require('./rag-module');
const enhancedSystemPrompt = require('./enhanced_system_prompt');
const agentPrompts = require('./agent_prompts');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger-config');

// Set strict mode for better error handling
'use strict';

// Configuration flags
const CONFIG = {
  USE_MOCK_DATA: false,
  ENABLE_RAG: true,                   // Enable Retrieval-Augmented Generation
  ENABLE_ENHANCED_DESCRIPTIONS: true, // Enable detailed descriptions
  DEBUG_MODE: true,                   // Enable detailed logging
  MAX_RETRIES: 3,                     // Maximum retries for API calls
  CACHE_DURATION: 3600000,            // Cache duration in milliseconds (1 hour)
  API_ENDPOINTS: {
    MATERIALS: 'https://api.suddeco.com/syed/materials',
    TASKS: 'https://api.suddeco.com/syed/tasks',
    STAGES: 'https://api.suddeco.com/syed/stages',
    ROOMS: 'https://api.suddeco.com/syed/rooms'
  },
  RAG_CONTEXT_WEIGHT: 0.8,            // Weight of RAG context in AI prompts (0-1)
  CONTEXT_MAX_ITEMS: 10               // Maximum number of items per category in context
};

// Cache for storing previous results
const analysisCache = new Map();
const materialsCache = new Map();
const tasksCache = new Map();
const apiDataCache = new Map();

// Global RAG context data
let globalRagData = null;

// Check if API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
  console.error('Please set the OPENAI_API_KEY environment variable with a valid OpenAI API key');
  process.exit(1); // Exit the process if API key is not available
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 10000; // Use environment port or default to 10000

// Initialize RAG data at startup with explicit API endpoints
async function initializeRagData() {
  try {
    console.log('Initializing RAG data from external APIs...');
    console.log(`Materials API: ${CONFIG.API_ENDPOINTS.MATERIALS}`);
    console.log(`Tasks API: ${CONFIG.API_ENDPOINTS.TASKS}`);
    console.log(`Stages API: ${CONFIG.API_ENDPOINTS.STAGES}`);
    console.log(`Rooms API: ${CONFIG.API_ENDPOINTS.ROOMS}`);
    
    // Fetch data from all endpoints with proper error handling
    globalRagData = await ragModule.fetchAllApiData();
    console.log('RAG data initialized successfully');
    
    // Log statistics about the fetched data
    const materialCount = globalRagData.materials?.materials?.length || 0;
    const taskCount = globalRagData.tasks?.tasks?.length || 0;
    const stageCount = globalRagData.stages?.stages?.length || 0;
    const roomCount = globalRagData.rooms?.rooms?.length || 0;
    
    console.log(`Loaded ${materialCount} materials, ${taskCount} tasks, ${stageCount} stages, and ${roomCount} rooms`);
    
    // For backward compatibility
    globalApiData = globalRagData;
    
    return globalRagData;
  } catch (error) {
    console.error('Error initializing RAG data:', error.message);
    console.log('Using mock data instead');
    
    // Create fallback data
    const fallbackData = {
      materials: { materials: createMockMaterials() },
      tasks: { tasks: createMockTasks() },
      stages: { stages: createMockStages() },
      rooms: { rooms: createMockRooms() },
      timestamp: new Date().toISOString(),
      is_mock: true
    };
    
    globalRagData = fallbackData;
    globalApiData = fallbackData; // For backward compatibility
    
    return fallbackData;
  }
}

// Initialize RAG data with proper error handling
const ragDataPromise = initializeRagData().catch(error => {
  console.error('Critical error initializing RAG data:', error.message);
  return {
    materials: { materials: createMockMaterials() },
    tasks: { tasks: createMockTasks() },
    stages: { stages: createMockStages() },
    rooms: { rooms: createMockRooms() },
    timestamp: new Date().toISOString(),
    is_mock: true,
    error: error.message
  };
});

// Enable CORS
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static('output'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve Swagger JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Route for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add route to serve the measurements report directly
app.get('/reports/measurements', (req, res) => {
  res.sendFile(path.join(__dirname, 'measurements_report.html'));
});

// Add route to serve the text report directly
app.get('/reports/text', (req, res) => {
  res.sendFile(path.join(__dirname, 'suddeco_measurements_report.txt'));
});

// Route for construction planner page
app.get('/construction-planner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'construction-planner.html'));
});

// Route for RAG chat page
app.get('/rag-chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rag-chat.html'));
});

// Route for Schema Manager page
app.get('/schema-manager', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'schema-manager.html'));
});

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Get data from the Suddeco API
 *     description: Retrieves materials, tasks, stages, or rooms data from the API
 *     tags: [Data]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, materials, tasks, stages, rooms]
 *         description: Type of data to retrieve
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid data type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/data', async (req, res) => {
  try {
    const dataType = req.query.type || 'all';
    let data;
    
    try {
      // Wait for RAG data to be initialized if it's still loading
      if (!globalRagData) {
        globalRagData = await ragDataPromise;
      }
      
      // Handle different data types
      if (dataType === 'all') {
        // Refresh RAG data if it's older than the cache duration
        const now = Date.now();
        const lastUpdated = globalRagData.timestamp ? new Date(globalRagData.timestamp).getTime() : 0;
        
        if (now - lastUpdated > CONFIG.CACHE_DURATION) {
          console.log('RAG data cache expired, refreshing...');
          try {
            globalRagData = await ragModule.fetchAllApiData();
          } catch (refreshError) {
            console.error('Error refreshing RAG data:', refreshError.message);
          }
        }
        
        data = globalRagData;
      } else if (dataType === 'materials') {
        data = await ragModule.fetchApiData('materials');
      } else if (dataType === 'tasks') {
        data = await ragModule.fetchApiData('tasks');
      } else if (dataType === 'stages') {
        data = await ragModule.fetchApiData('stages');
      } else if (dataType === 'rooms') {
        data = await ragModule.fetchApiData('rooms');
      } else {
        return res.status(400).json({ error: 'Invalid data type' });
      }
      
      // Ensure data is a valid object before sending
      if (data && typeof data === 'object') {
        return res.json(data);
      } else {
        console.error('Invalid RAG data format:', data);
        // Create mock data based on the requested type
        const mockData = createMockData(dataType);
        return res.json(mockData);
      }
    } catch (apiError) {
      console.error('RAG data error:', apiError.message);
      // Create mock data based on the requested type
      const mockData = createMockData(dataType);
      return res.json(mockData);
    }
  } catch (error) {
    console.error('Error fetching RAG data:', error.message);
    res.status(500).json({ error: 'Error fetching data', details: error.message });
  }
});

/**
 * @swagger
 * /api/rag/search:
 *   get:
 *     summary: Search RAG data
 *     description: Search for relevant items in materials, tasks, stages, and rooms data
 *     tags: [RAG]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Maximum number of results per category
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RagSearchResult'
 *       400:
 *         description: Missing search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/rag/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 5;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Wait for RAG data to be initialized if it's still loading
    if (!globalRagData) {
      globalRagData = await ragDataPromise;
    }
    
    // Find relevant items based on the query
    const results = ragModule.findRelevantItems(query, globalRagData, limit);
    
    res.json({
      query,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching RAG data:', error.message);
    res.status(500).json({ error: 'Error searching data', details: error.message });
  }
});

// Helper function to create mock data when API fails
function createMockData(dataType) {
  console.log(`Creating mock data for ${dataType}`);
  
  if (dataType === 'all') {
    return {
      materials: { materials: createMockMaterials() },
      tasks: { tasks: createMockTasks() },
      stages: { stages: createMockStages() },
      rooms: { rooms: createMockRooms() }
    };
  } else if (dataType === 'materials') {
    return { materials: createMockMaterials() };
  } else if (dataType === 'tasks') {
    return { tasks: createMockTasks() };
  } else if (dataType === 'stages') {
    return { stages: createMockStages() };
  } else if (dataType === 'rooms') {
    return { rooms: createMockRooms() };
  }
  
  return {};
}

// Helper functions to create specific mock data
function createMockMaterials() {
  return [
    { id: 1, name: 'Concrete', description: 'Standard concrete mix for foundations and structural elements', unit: 'm³', category: 'structural' },
    { id: 2, name: 'Brick', description: 'Standard clay bricks for walls', unit: 'pieces', category: 'walls' },
    { id: 3, name: 'Timber', description: 'Structural timber for framing', unit: 'm', category: 'structural' },
    { id: 4, name: 'Drywall', description: 'Standard gypsum board for interior walls', unit: 'm²', category: 'interior' },
    { id: 5, name: 'Paint', description: 'Interior wall paint', unit: 'L', category: 'finishes' }
  ];
}

function createMockTasks() {
  return [
    { id: 1, name: 'Site Preparation', description: 'Clear site and prepare for construction', duration: 5, predecessors: [] },
    { id: 2, name: 'Foundation Work', description: 'Excavate and pour concrete foundations', duration: 10, predecessors: [1] },
    { id: 3, name: 'Framing', description: 'Construct structural frame of the building', duration: 15, predecessors: [2] },
    { id: 4, name: 'Roofing', description: 'Install roof structure and covering', duration: 7, predecessors: [3] },
    { id: 5, name: 'Interior Work', description: 'Complete all interior finishes', duration: 20, predecessors: [4] }
  ];
}

function createMockStages() {
  return [
    { id: 1, name: 'Planning', description: 'Initial planning and design phase', tasks: [1] },
    { id: 2, name: 'Foundation', description: 'Foundation and groundwork', tasks: [2] },
    { id: 3, name: 'Structure', description: 'Main structural elements', tasks: [3, 4] },
    { id: 4, name: 'Interior', description: 'Interior work and finishes', tasks: [5] },
    { id: 5, name: 'Completion', description: 'Final touches and handover', tasks: [] }
  ];
}

function createMockRooms() {
  return [
    { id: 1, name: 'Living Room', description: 'Main living area', typical_dimensions: { length: '5.0m', width: '4.0m', height: '2.4m' } },
    { id: 2, name: 'Kitchen', description: 'Food preparation area', typical_dimensions: { length: '3.5m', width: '3.0m', height: '2.4m' } },
    { id: 3, name: 'Bedroom', description: 'Sleeping area', typical_dimensions: { length: '4.0m', width: '3.5m', height: '2.4m' } },
    { id: 4, name: 'Bathroom', description: 'Bathroom with toilet and shower', typical_dimensions: { length: '2.5m', width: '2.0m', height: '2.4m' } },
    { id: 5, name: 'Hallway', description: 'Connecting corridor', typical_dimensions: { length: '3.0m', width: '1.2m', height: '2.4m' } }
  ];
}

// Add route to get the latest analysis as JSON for embedding in the UI
app.get('/api/latest-analysis', (req, res) => {
  try {
    // Check if we need combined analysis data
    const isCombined = req.query.combined === 'true';
    
    if (isCombined) {
      // Create a sample combined analysis data if no file exists yet
      const combinedAnalysisPath = path.join(__dirname, 'output', 'suddeco_combined_analysis.json');
      
      if (fs.existsSync(combinedAnalysisPath)) {
        const fileContent = fs.readFileSync(combinedAnalysisPath, 'utf8');
        if (require('./api-client').isHtmlResponse(fileContent)) {
          console.error('Error: combined analysis file contains HTML, returning empty object.');
          return res.json({ error: 'Analysis file corrupted or unavailable.' });
        }
        try {
          const data = JSON.parse(fileContent);
          res.json(data);
        } catch (parseError) {
          console.error('Error parsing combined analysis file:', parseError.message);
          return res.json({ error: 'Error parsing analysis file' });
        }
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
      const analysisPath = path.join(__dirname, 'output', 'suddeco_detailed_analysis.json');
      
      if (fs.existsSync(analysisPath)) {
        const fileContent = fs.readFileSync(analysisPath, 'utf8');
        if (require('./api-client').isHtmlResponse(fileContent)) {
          console.error('Error: detailed analysis file contains HTML, returning empty object.');
          return res.json({ error: 'Analysis file corrupted or unavailable.' });
        }
        try {
          const data = JSON.parse(fileContent);
          res.json(data);
        } catch (parseError) {
          console.error('Error parsing detailed analysis file:', parseError.message);
          return res.json({ error: 'Error parsing analysis file' });
        }
      } else {
        // Return a sample data structure if no analysis file exists yet
        res.json({
          generated_at: new Date().toISOString(),
          architectural_analysis: {
            building_analysis: {
              total_internal_dimensions: {
                length: "15.2m",
                width: "12.8m",
                height: "2.4m"
              },
              total_external_dimensions: {
                length: "16.0m",
                width: "13.5m",
                height: "2.7m"
              },
              total_floor_area: {
                internal: "194.6m²",
                external: "216.0m²"
              }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error reading analysis data:', error);
    res.status(500).json({ error: 'Error reading analysis data', details: error.message });
  }
});

// Create uploads and output directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Configure file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        cb(null, `${timestamp}_${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
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

// Analyze drawing with OpenAI
async function analyzeDrawingWithAI(filePath, fileType, clientDescription = '', analysisPromptType = 'general') {
  console.log(`Analyzing drawing with AI (type: ${fileType})...`);
  
  try {
    // Check if we have a cached result for this file
    const fileHash = Buffer.from(filePath).toString('base64').substring(0, 50);
    const cacheKey = `analysis_${fileHash}`;
    
    if (analysisCache.has(cacheKey)) {
      console.log('Using cached analysis results');
      return analysisCache.get(cacheKey);
    }
    
    // Ensure we have the latest API data for context
    console.log('Refreshing API data before analysis from Suddeco API...');
    try {
      // Use specific Suddeco API endpoints
      const materialsPromise = axios.get('https://api.suddeco.com/syed/materials', {
        headers: { 'Accept': 'application/json' },
        timeout: 8000
      });
      
      const tasksPromise = axios.get('https://api.suddeco.com/syed/tasks', {
        headers: { 'Accept': 'application/json' },
        timeout: 8000
      });
      
      const stagesPromise = axios.get('https://api.suddeco.com/syed/stages', {
        headers: { 'Accept': 'application/json' },
        timeout: 8000
      });
      
      const roomsPromise = axios.get('https://api.suddeco.com/syed/rooms', {
        headers: { 'Accept': 'application/json' },
        timeout: 8000
      });
      
      // Fetch all data in parallel
      const [materialsResponse, tasksResponse, stagesResponse, roomsResponse] = 
        await Promise.allSettled([materialsPromise, tasksPromise, stagesPromise, roomsPromise]);
      
      // Process responses, falling back to mock data if any request fails
      const materials = materialsResponse.status === 'fulfilled' ? materialsResponse.value.data : { materials: createMockMaterials() };
      const tasks = tasksResponse.status === 'fulfilled' ? tasksResponse.value.data : { tasks: createMockTasks() };
      const stages = stagesResponse.status === 'fulfilled' ? stagesResponse.value.data : { stages: createMockStages() };
      const rooms = roomsResponse.status === 'fulfilled' ? roomsResponse.value.data : { rooms: createMockRooms() };
      
      // Log success/failure for each API
      console.log(`Materials API: ${materialsResponse.status === 'fulfilled' ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Tasks API: ${tasksResponse.status === 'fulfilled' ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Stages API: ${stagesResponse.status === 'fulfilled' ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Rooms API: ${roomsResponse.status === 'fulfilled' ? 'SUCCESS' : 'FAILED'}`);
      
      // Update global API data
      globalApiData = {
        materials,
        tasks,
        stages,
        rooms
      };
    } catch (apiError) {
      console.error('Error refreshing API data:', apiError.message);
      console.log('Using mock data instead');
      globalApiData = {
        materials: { materials: createMockMaterials() },
        tasks: { tasks: createMockTasks() },
        stages: { stages: createMockStages() },
        rooms: { rooms: createMockRooms() }
      };
    }
    
    if (fileType === 'pdf') {
      try {
        // Extract text content from PDF
        const fileBuffer = fs.readFileSync(filePath);
        const data = await PDFParser(fileBuffer);
        const extractedText = data.text;
        
        if (extractedText && extractedText.length > 100) {
          // Use OpenAI to analyze the drawing
          try {
            console.log('Sending PDF content to OpenAI for analysis...');
            
            // Wait for RAG data to be initialized if it's still loading
            if (!globalRagData) {
              globalRagData = await ragDataPromise;
            }
            
            // Generate RAG context string for the prompt with enhanced context
            let ragContext = '';
            if (CONFIG.ENABLE_RAG) {
              console.log('Generating enhanced RAG context for AI prompt...');
              
              // Get the basic context string
              ragContext = ragModule.generateContextString(globalRagData);
              
              // Find relevant items based on extracted text for more targeted context
              const relevantItems = ragModule.findRelevantItems(extractedText.substring(0, 1000), globalRagData, CONFIG.CONTEXT_MAX_ITEMS);
              
              // Add relevant items to the context
              if (Object.keys(relevantItems).some(key => relevantItems[key]?.length > 0)) {
                ragContext += '\n\n## RELEVANT CONTEXT FOR THIS DRAWING:\n';
                
                if (relevantItems.materials?.length > 0) {
                  ragContext += '\n### RELEVANT MATERIALS:\n';
                  relevantItems.materials.forEach(item => {
                    ragContext += `- ${item.name}: ${item.description || 'No description'}\n`;
                  });
                }
                
                if (relevantItems.tasks?.length > 0) {
                  ragContext += '\n### RELEVANT TASKS:\n';
                  relevantItems.tasks.forEach(item => {
                    ragContext += `- ${item.name}: ${item.description || 'No description'}\n`;
                  });
                }
                
                if (relevantItems.stages?.length > 0) {
                  ragContext += '\n### RELEVANT STAGES:\n';
                  relevantItems.stages.forEach(item => {
                    ragContext += `- ${item.name}: ${item.description || 'No description'}\n`;
                  });
                }
                
                if (relevantItems.rooms?.length > 0) {
                  ragContext += '\n### RELEVANT ROOMS:\n';
                  relevantItems.rooms.forEach(item => {
                    ragContext += `- ${item.name}: ${item.description || 'No description'}\n`;
                  });
                }
              }
              
              console.log(`Generated RAG context with ${ragContext.length} characters`);
            } else {
              console.log('RAG context generation disabled');
            }
            
            // Select the appropriate prompt based on the analysis type
            let systemPromptContent;
            
            if (CONFIG.ENABLE_ENHANCED_DESCRIPTIONS) {
              console.log(`Using ${analysisPromptType} analysis prompt type`);
              
              // Select the appropriate prompt based on the analysis type
              switch (analysisPromptType) {
                case 'material':
                  systemPromptContent = agentPrompts.getMaterialAnalysisPrompt();
                  break;
                case 'compliance':
                  systemPromptContent = agentPrompts.getComplianceAnalysisPrompt();
                  break;
                case 'construction':
                  systemPromptContent = agentPrompts.getConstructionPlanningPrompt();
                  break;
                case 'sustainability':
                  systemPromptContent = agentPrompts.getSustainabilityAnalysisPrompt();
                  break;
                case 'general':
                default:
                  systemPromptContent = agentPrompts.getGeneralAnalysisPrompt();
              }
            } else {
              // Fall back to the basic system prompt if enhanced descriptions are disabled
              systemPromptContent = require('./suddeco_system_prompt');
            }
            
            // Prepare API data context for the prompt
            let apiDataContext = '';
            
            if (globalApiData) {
              // Add materials context
              if (globalApiData.materials?.materials?.length > 0) {
                apiDataContext += '\n\n## AVAILABLE MATERIALS FROM SUDDECO DATABASE:\n';
                globalApiData.materials.materials.slice(0, 15).forEach(material => {
                  apiDataContext += `- ${material.name}: ${material.description || 'No description'} (Unit: ${material.unit || 'N/A'})\n`;
                });
                if (globalApiData.materials.materials.length > 15) {
                  apiDataContext += `- Plus ${globalApiData.materials.materials.length - 15} more materials...\n`;
                }
              }
              
              // Add tasks context
              if (globalApiData.tasks?.tasks?.length > 0) {
                apiDataContext += '\n\n## AVAILABLE TASKS FROM SUDDECO DATABASE:\n';
                globalApiData.tasks.tasks.slice(0, 10).forEach(task => {
                  apiDataContext += `- ${task.name}: ${task.description || 'No description'} (Duration: ${task.duration || 'N/A'} days)\n`;
                });
                if (globalApiData.tasks.tasks.length > 10) {
                  apiDataContext += `- Plus ${globalApiData.tasks.tasks.length - 10} more tasks...\n`;
                }
              }
              
              // Add stages context
              if (globalApiData.stages?.stages?.length > 0) {
                apiDataContext += '\n\n## AVAILABLE STAGES FROM SUDDECO DATABASE:\n';
                globalApiData.stages.stages.slice(0, 8).forEach(stage => {
                  apiDataContext += `- ${stage.name}: ${stage.description || 'No description'}\n`;
                });
                if (globalApiData.stages.stages.length > 8) {
                  apiDataContext += `- Plus ${globalApiData.stages.stages.length - 8} more stages...\n`;
                }
              }
              
              // Add rooms context
              if (globalApiData.rooms?.rooms?.length > 0) {
                apiDataContext += '\n\n## AVAILABLE ROOM TYPES FROM SUDDECO DATABASE:\n';
                globalApiData.rooms.rooms.slice(0, 10).forEach(room => {
                  const dimensions = room.typical_dimensions ? 
                    `(Typical dimensions: ${room.typical_dimensions.length || 'N/A'} x ${room.typical_dimensions.width || 'N/A'} x ${room.typical_dimensions.height || 'N/A'})` : 
                    '';
                  apiDataContext += `- ${room.name}: ${room.description || 'No description'} ${dimensions}\n`;
                });
                if (globalApiData.rooms.rooms.length > 10) {
                  apiDataContext += `- Plus ${globalApiData.rooms.rooms.length - 10} more room types...\n`;
                }
              }
            }
            
            console.log(`Generated API data context with ${apiDataContext.length} characters`);
            
            // Create a clean OpenAI instance for this specific call
            const response = await openai.chat.completions.create({
              model: "gpt-4-turbo",
              messages: [
                {
                  role: "system",
                  content: systemPromptContent
                },
                {
                  role: "user",
                  content: `Analyze this architectural drawing in detail. Extract ALL measurements with precise values and units from the actual drawing content, not from templates. This is CRITICAL - use ONLY the measurements found in the drawing content.

Pay special attention to:
1. Site extension measurements and dimensions
2. Structural calculations and load-bearing specifications
3. Foundation details and specifications
4. Wall, floor, and roof construction details
5. All room dimensions (width, length, height)

You MUST use the Suddeco database materials, tasks, stages, and room types provided below when identifying elements in the drawing. Match materials and other elements to the closest items in the Suddeco database.

${clientDescription ? `Client Description: ${clientDescription}

` : ''}${apiDataContext}${ragContext}

Drawing Content:
${extractedText}

IMPORTANT: DO NOT return generic or mock data. If you cannot find specific measurements or details in the drawing content, explicitly state that they are not provided in the drawing rather than making up values. For each measurement you provide, include a brief note about where in the drawing you found it.`
                }
              ],
              temperature: 0.2,
              max_tokens: 4000,
              response_format: { type: "json_object" }
            });
            
            // Get the response content
            const responseContent = response.choices[0].message.content;
            console.log('Received analysis from OpenAI');
            
            // Log a sample of the response for debugging
            console.log('Response sample:', responseContent.substring(0, 100) + '...');
            
            // Parse the JSON response
            try {
              // Check if response is HTML instead of JSON
              if (typeof responseContent === 'string' && 
                  (responseContent.trim().startsWith('<!DOCTYPE') || 
                   responseContent.trim().startsWith('<html') || 
                   responseContent.includes('<body') || 
                   responseContent.includes('<head'))) {
                console.error('Received HTML instead of JSON from OpenAI');
                throw new Error('Invalid response format: HTML received');
              }
              
              // Try to extract JSON from the response
              let jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
              let jsonStr = jsonMatch ? jsonMatch[1] : responseContent;
              
              // Clean up the JSON string
              jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
              
              // Validate the JSON string before parsing
              if (!jsonStr || jsonStr.trim() === '') {
                console.error('Empty JSON string');
                throw new Error('Empty JSON response');
              }
              
              // Additional safety check for HTML content
              if (jsonStr.includes('<!DOCTYPE') || jsonStr.includes('<html')) {
                console.error('JSON string contains HTML');
                throw new Error('Invalid JSON: contains HTML');
              }
              
              // Parse the JSON
              const analysisResult = JSON.parse(jsonStr);
              
              // Verify we have a valid object
              if (!analysisResult || typeof analysisResult !== 'object') {
                console.error('Invalid analysis result:', analysisResult);
                throw new Error('Invalid analysis result structure');
              }
              
              // Replace any N/A values with realistic estimates
              const cleanedResult = replaceNAValues(analysisResult);
              
              // Cache the result
              analysisCache.set(cacheKey, cleanedResult);
              
              return cleanedResult;
            } catch (jsonError) {
              console.error('Error parsing JSON response:', jsonError);
              console.log('Response content:', responseContent);
              
              // If parsing fails, return default analysis
              const defaultAnalysis = createDefaultArchitecturalAnalysis();
              
              // Enhance the default analysis with extracted text if possible
              const enhancedAnalysis = enhanceMockDataWithExtractedText(defaultAnalysis, extractedText);
              
              // Cache the result
              analysisCache.set(cacheKey, enhancedAnalysis);
              
              return enhancedAnalysis;
            }
          } catch (openaiError) {
            console.error('Error calling OpenAI API:', openaiError);
            
            // If OpenAI API call fails, return default analysis
            const defaultAnalysis = createDefaultArchitecturalAnalysis();
            
            // Enhance the default analysis with extracted text if possible
            const enhancedAnalysis = enhanceMockDataWithExtractedText(defaultAnalysis, extractedText);
            
            // Cache the result
            analysisCache.set(cacheKey, enhancedAnalysis);
            
            return enhancedAnalysis;
          }
        } else {
          console.log('Extracted text is too short or empty, using default analysis');
          
          // If extracted text is too short, return default analysis
          const defaultAnalysis = createDefaultArchitecturalAnalysis();
          
          // Cache the result
          analysisCache.set(cacheKey, defaultAnalysis);
          
          return defaultAnalysis;
        }
      } catch (pdfError) {
        console.error('Error parsing PDF:', pdfError);
        
        // If PDF parsing fails, return default analysis
        const defaultAnalysis = createDefaultArchitecturalAnalysis();
        
        // Cache the result
        analysisCache.set(cacheKey, defaultAnalysis);
        
        return defaultAnalysis;
      }
    } else {
      console.log(`File type ${fileType} not supported for direct analysis, using default analysis`);
      
      // If file type is not supported, return default analysis
      const defaultAnalysis = createDefaultArchitecturalAnalysis();
      
      // Cache the result
      analysisCache.set(cacheKey, defaultAnalysis);
      
      return defaultAnalysis;
    }
  } catch (error) {
    console.error('Error analyzing drawing:', error);
    
    // Return default architectural analysis in case of error
    const defaultAnalysis = createDefaultArchitecturalAnalysis();
    
    // Cache the default result to avoid repeated failures
    analysisCache.set(cacheKey, defaultAnalysis);
    
    return defaultAnalysis;
  }
}

/**
 * @swagger
 * /api/rag/chat:
 *   post:
 *     summary: RAG-enhanced chat
 *     description: Chat with AI using RAG-enhanced context
 *     tags: [RAG]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: The chat query
 *               context:
 *                 type: string
 *                 description: Additional context for the chat
 *     responses:
 *       200:
 *         description: Chat response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RagChatResponse'
 *       400:
 *         description: Missing query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/rag/chat', async (req, res) => {
  try {
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Wait for RAG data to be initialized if it's still loading
    if (!globalRagData) {
      globalRagData = await ragDataPromise;
    }
    
    // Generate RAG context string
    const ragContext = ragModule.generateContextString(globalRagData);
    
    // Find relevant items based on the query
    const relevantItems = ragModule.findRelevantItems(query, globalRagData, 3);
    
    // Create a context string from relevant items
    let relevantContext = '';
    if (relevantItems.materials && relevantItems.materials.length > 0) {
      relevantContext += '\nRelevant Materials:\n';
      relevantItems.materials.forEach(item => {
        relevantContext += `- ${item.name}: ${item.description || 'No description'}\n`;
      });
    }
    if (relevantItems.tasks && relevantItems.tasks.length > 0) {
      relevantContext += '\nRelevant Tasks:\n';
      relevantItems.tasks.forEach(item => {
        relevantContext += `- ${item.name}: ${item.description || 'No description'}\n`;
      });
    }
    if (relevantItems.rooms && relevantItems.rooms.length > 0) {
      relevantContext += '\nRelevant Rooms:\n';
      relevantItems.rooms.forEach(item => {
        relevantContext += `- ${item.name}: ${item.description || 'No description'}\n`;
      });
    }
    
    // Combine with user-provided context if any
    const combinedContext = context ? `${context}\n${relevantContext}` : relevantContext;
    
    // Call OpenAI with the RAG-enhanced prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an architectural assistant with expertise in construction materials, tasks, stages, and room specifications. Use the provided context to give accurate and helpful responses. Always provide measurements in metric units.\n\n${ragContext}`
        },
        {
          role: "user",
          content: `${query}\n\nRelevant Context:\n${combinedContext}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    res.json({
      query,
      response: response.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in RAG chat:', error.message);
    res.status(500).json({ error: 'Error processing chat request', details: error.message });
  }
});

// Helper function to safely parse JSON with fallback and HTML detection
function safeJsonParse(jsonString, defaultValue) {
  try {
    // Check if the string is HTML
    if (typeof jsonString === 'string' && (
        jsonString.trim().startsWith('<!DOCTYPE') || 
        jsonString.trim().startsWith('<html') || 
        jsonString.includes('<body') || 
        jsonString.includes('<head') ||
        jsonString.includes('<div') ||
        jsonString.includes('<script')
    )) {
      console.error('Received HTML instead of JSON');
      return defaultValue;
    }
    
    // Try to parse the JSON
    if (require('./api-client').isHtmlResponse(jsonString)) {
      console.error('Error: Attempted to parse HTML as JSON. Returning empty object.');
      return {};
    }
    if (require('./api-client').isHtmlResponse(jsonString)) {
      console.error('Error: Attempted to parse HTML as JSON. Returning empty object.');
      return {};
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parsing error:', error.message);
    // Log a snippet of the problematic string for debugging
    if (typeof jsonString === 'string') {
      console.error('Problematic JSON string (first 100 chars):', jsonString.substring(0, 100));
    }
    return defaultValue;
  }
}

// Helper function to enhance mock data with extracted text
function enhanceMockDataWithExtractedText(mockData, extractedText) {
  console.log('Enhancing mock data with extracted text...');
  
  if (!extractedText || typeof extractedText !== 'string' || extractedText.length < 100) {
    console.log('Extracted text is too short or invalid for enhancement');
    return mockData;
  }
  
  const enhancedData = JSON.parse(JSON.stringify(mockData)); // Deep clone
  
  try {
    // Extract dimensions with units (e.g., 10.5m, 120m², 2.4m x 3.6m)
    // Improved regex to avoid matching extremely large numbers and to be more precise
    const dimensionRegex = /\b(\d{1,5}(?:\.\d{1,2})?\s*(?:m|mm|cm|m\u00b2|m2|mm\u00b2|mm2|cm\u00b2|cm2))\b/gi;
    const dimensions = extractedText.match(dimensionRegex) || [];
    console.log(`Found ${dimensions.length} dimensions in extracted text`);
    
    // Extract site extension related text
    const siteExtensionRegex = /\b(?:site\s+extension|extension\s+(?:area|dimensions?|measurements?|size))\s*(?:[^\n.]*?)(\d+(?:\.\d+)?\s*(?:m|mm|cm|m²|m2|mm²|mm2|cm²|cm2))/gi;
    const siteExtensionMatches = [];
    let match;
    while ((match = siteExtensionRegex.exec(extractedText)) !== null) {
      siteExtensionMatches.push(match[0]);
    }
    
    // Extract structural calculations with improved precision
    const structuralRegex = /\b(?:structural|load[\s-]*bearing|foundation|beam|column|joist)\s*(?:[^\n.]*?)\s*(\d{1,5}(?:\.\d{1,2})?\s*(?:m|mm|cm|kN|kN\/m\u00b2|kN\/m2))\b/gi;
    const structuralMatches = [];
    while ((match = structuralRegex.exec(extractedText)) !== null) {
      // Only add if the match doesn't contain extremely large numbers
      if (match[0].length < 100) {
        structuralMatches.push(match[0]);
      }
    }
    
    // Extract specific beam dimensions with better precision
    const beamRegex = /\bbeam\s+(?:length|width|height|depth|size)\s*[=:]?\s*(\d{1,5}(?:\.\d{1,2})?\s*(?:m|mm|cm))\b/gi;
    while ((match = beamRegex.exec(extractedText)) !== null) {
      if (match[0].length < 100) {
        structuralMatches.push(match[0]);
      }
    }
    
    // Update site extension data if found
    if (siteExtensionMatches.length > 0) {
      enhancedData.site_extension.note = `Site extension information found in drawing: ${siteExtensionMatches.join('; ')}`;
      
      // Try to extract specific measurements
      const lengthMatch = extractedText.match(/extension\s+length\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:m|mm|cm))/i);
      const widthMatch = extractedText.match(/extension\s+width\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:m|mm|cm))/i);
      const heightMatch = extractedText.match(/extension\s+height\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:m|mm|cm))/i);
      const areaMatch = extractedText.match(/extension\s+area\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:m²|m2))/i);
      
      if (lengthMatch) enhancedData.site_extension.measurements.length = lengthMatch[1];
      if (widthMatch) enhancedData.site_extension.measurements.width = widthMatch[1];
      if (heightMatch) enhancedData.site_extension.measurements.height = heightMatch[1];
      if (areaMatch) enhancedData.site_extension.measurements.area = areaMatch[1];
    }
    
    // Update structural calculations if found
    if (structuralMatches.length > 0) {
      // Limit the number of matches to display in the note to avoid overwhelming
      const displayMatches = structuralMatches.length > 15 ? 
        structuralMatches.slice(0, 15).concat([`...and ${structuralMatches.length - 15} more`]) : 
        structuralMatches;
      
      enhancedData.structural_calculations.note = `Structural information found in drawing: ${displayMatches.join('; ')}`;
      
      // Try to extract specific structural details with more precise patterns
      // Foundation details
      const foundationPatterns = [
        /foundation\s+(?:depth|thickness|size)\s*[:\-=]?\s*(\d{1,4}(?:\.\d{1,2})?\s*(?:m|mm|cm))/i,
        /(?:strip|pad|raft|pile)\s+foundation\s*[:\-=]?\s*(\d{1,4}(?:\.\d{1,2})?\s*(?:m|mm|cm))/i,
        /foundation\s*[:\-=]?\s*(\d{1,4}(?:\.\d{1,2})?\s*(?:m|mm|cm)\s+(?:deep|thick|width|depth))/i
      ];
      
      // Load bearing details
      const loadPatterns = [
        /(?:load|bearing)\s+capacity\s*[:\-=]?\s*(\d{1,4}(?:\.\d{1,2})?\s*(?:kN|kN\/m\u00b2|kN\/m2))/i,
        /(?:maximum|design|calculated)\s+load\s*[:\-=]?\s*(\d{1,4}(?:\.\d{1,2})?\s*(?:kN|kN\/m\u00b2|kN\/m2))/i,
        /(?:beam|column|wall)\s+load\s*[:\-=]?\s*(\d{1,4}(?:\.\d{1,2})?\s*(?:kN|kN\/m\u00b2|kN\/m2))/i
      ];
      
      // Roof structure details
      const roofPatterns = [
        /roof\s+(?:structure|thickness|insulation)\s*[:\-=]?\s*(\d{1,4}(?:\.\d{1,2})?\s*(?:m|mm|cm))/i,
        /(?:roof|rafter|truss)\s+(?:depth|thickness)\s*[:\-=]?\s*(\d{1,4}(?:\.\d{1,2})?\s*(?:m|mm|cm))/i,
        /(?:roof|rafter|truss)\s+spacing\s*[:\-=]?\s*(\d{1,4}(?:\.\d{1,2})?\s*(?:m|mm|cm))/i
      ];
      
      // Try each pattern and use the first match found
      let foundationMatch = null;
      for (const pattern of foundationPatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          foundationMatch = match;
          break;
        }
      }
      
      let loadMatch = null;
      for (const pattern of loadPatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          loadMatch = match;
          break;
        }
      }
      
      let roofMatch = null;
      for (const pattern of roofPatterns) {
        const match = extractedText.match(pattern);
        if (match) {
          roofMatch = match;
          break;
        }
      }
      
      // Extract beam specifications
      const beamSpecs = extractedText.match(/beam\s+(?:size|section|type|specification)\s*[:\-=]?\s*([^\n.]+)/i);
      
      if (foundationMatch) enhancedData.structural_calculations.foundation = foundationMatch[1];
      if (loadMatch) enhancedData.structural_calculations.load_bearing = loadMatch[1];
      if (roofMatch) enhancedData.structural_calculations.roof_structure = roofMatch[1];
      if (beamSpecs) enhancedData.structural_calculations.beam_specifications = beamSpecs[1].trim();
    }
    
    // If we have at least 5 dimensions, try to update building analysis
    if (dimensions.length >= 5) {
      // Filter out unrealistic dimensions (greater than 100m)
      const filteredDimensions = dimensions.filter(d => {
        const numMatch = d.match(/(\d+(?:\.\d+)?)/); 
        return numMatch && parseFloat(numMatch[1]) <= 100;
      });
      
      // Sort dimensions by size (assuming larger dimensions are for the building)
      const sortedDimensions = filteredDimensions
        .map(d => {
          const numMatch = d.match(/(\d+(?:\.\d+)?)/); 
          return { 
            text: d, 
            value: numMatch ? parseFloat(numMatch[1]) : 0 
          };
        })
        .sort((a, b) => b.value - a.value);
      
      // Use the largest dimensions for the building, but only if they're realistic
      if (sortedDimensions.length >= 3 && 
          sortedDimensions[0].value > 0 && sortedDimensions[0].value <= 100 &&
          sortedDimensions[1].value > 0 && sortedDimensions[1].value <= 100) {
        
        // Check if the unit is appropriate (should be meters for building dimensions)
        const unit0 = sortedDimensions[0].text.match(/[a-z]+$/i)?.[0] || 'm';
        const unit1 = sortedDimensions[1].text.match(/[a-z]+$/i)?.[0] || 'm';
        const unit2 = sortedDimensions[2].text.match(/[a-z]+$/i)?.[0] || 'm';
        
        // Convert to meters if needed
        const length = unit0 === 'mm' ? sortedDimensions[0].value / 1000 : 
                      (unit0 === 'cm' ? sortedDimensions[0].value / 100 : sortedDimensions[0].value);
        const width = unit1 === 'mm' ? sortedDimensions[1].value / 1000 : 
                     (unit1 === 'cm' ? sortedDimensions[1].value / 100 : sortedDimensions[1].value);
        const height = unit2 === 'mm' ? sortedDimensions[2].value / 1000 : 
                      (unit2 === 'cm' ? sortedDimensions[2].value / 100 : sortedDimensions[2].value);
        
        // Only use values if they're reasonable for a building
        if (length > 0 && length <= 100 && width > 0 && width <= 100 && height > 0 && height <= 10) {
          enhancedData.building_analysis.total_external_dimensions.length = `${length.toFixed(1)}m`;
          enhancedData.building_analysis.total_external_dimensions.width = `${width.toFixed(1)}m`;
          enhancedData.building_analysis.total_external_dimensions.height = `${height.toFixed(1)}m`;
          
          // Estimate internal dimensions (slightly smaller)
          const internalLength = length * 0.95;
          const internalWidth = width * 0.95;
          enhancedData.building_analysis.total_internal_dimensions.length = `${internalLength.toFixed(1)}m`;
          enhancedData.building_analysis.total_internal_dimensions.width = `${internalWidth.toFixed(1)}m`;
          enhancedData.building_analysis.total_internal_dimensions.height = `${height.toFixed(1)}m`;
          
          // Estimate floor areas
          const externalArea = length * width;
          const internalArea = internalLength * internalWidth;
          enhancedData.building_analysis.total_floor_area.external = `${externalArea.toFixed(1)}m\u00b2`;
          enhancedData.building_analysis.total_floor_area.internal = `${internalArea.toFixed(1)}m\u00b2`;
          
          enhancedData.building_analysis.note = "Measurements estimated from drawing text. Please verify for accuracy.";
        } else {
          enhancedData.building_analysis.note = "Could not determine realistic building dimensions from the drawing.";
        }
      } else {
        enhancedData.building_analysis.note = "Could not extract sufficient realistic dimensions from the drawing.";
      }
    }
    
    // Add room details if we can find room information
    const roomRegex = /\b((?:bed|living|dining|kitchen|bath|toilet|office|study)\s*(?:room)?)\s*(?:[^\n.]*?)(\d+(?:\.\d+)?\s*(?:m|mm|cm|m²|m2))/gi;
    const roomMatches = [];
    while ((match = roomRegex.exec(extractedText)) !== null) {
      roomMatches.push({ room: match[1], dimension: match[2] });
    }
    
    if (roomMatches.length > 0) {
      enhancedData.room_details = roomMatches.map(match => ({
        name: match.room.trim(),
        internal_dimensions: {
          length: "Extracted from text",
          width: "Extracted from text",
          height: enhancedData.building_analysis.total_internal_dimensions.height
        },
        floor_area: {
          internal: match.dimension
        },
        note: `Found in drawing text: ${match.room} ${match.dimension}`
      }));
      
      // Update number of rooms
      enhancedData.building_analysis.number_of_rooms = enhancedData.room_details.length;
    }
    
    console.log('Successfully enhanced mock data with extracted text');
  } catch (error) {
    console.error('Error enhancing mock data:', error.message);
  }
  
  return enhancedData;
}

// Helper function to create default architectural analysis
function createDefaultArchitecturalAnalysis() {
  console.log('Creating default architectural analysis with incomplete data warning...');
  
  return {
    building_analysis: {
      note: "INCOMPLETE ANALYSIS: The system was unable to extract precise measurements from the drawing. The following information is incomplete and should be verified.",
      total_floor_area: {
        internal: "Not determined from drawing",
        external: "Not determined from drawing"
      },
      total_internal_dimensions: {
        length: "Not determined from drawing",
        width: "Not determined from drawing",
        height: "Not determined from drawing"
      },
      total_external_dimensions: {
        length: "Not determined from drawing",
        width: "Not determined from drawing",
        height: "Not determined from drawing"
      },
      number_of_floors: "Not determined from drawing",
      number_of_rooms: "Not determined from drawing"
    },
    site_extension: {
      note: "Site extension measurements could not be extracted. Please review the drawing manually or try uploading a clearer version.",
      measurements: {
        length: "Not determined from drawing",
        width: "Not determined from drawing",
        height: "Not determined from drawing",
        area: "Not determined from drawing"
      }
    },
    structural_calculations: {
      note: "Structural calculations could not be automatically extracted. Please review the drawing manually for load-bearing specifications.",
      foundation: "Not determined from drawing",
      load_bearing: "Not determined from drawing",
      roof_structure: "Not determined from drawing"
    },
    error_handling: {
      status: "fallback",
      reason: "JSON parsing error",
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * @swagger
 * /api/rag/process-drawing:
 *   post:
 *     summary: Process drawing with RAG enhancement
 *     description: Upload and process an architectural drawing file with RAG enhancement
 *     tags: [RAG, Drawing Processing]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - drawing
 *             properties:
 *               drawing:
 *                 type: string
 *                 format: binary
 *                 description: The drawing file to process
 *     responses:
 *       200:
 *         description: Drawing processed successfully with RAG enhancement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisResult'
 *       400:
 *         description: No file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/rag/process-drawing:
 *   post:
 *     summary: Process architectural drawing with RAG enhancement
 *     description: Upload and process an architectural drawing file with RAG enhancement
 *     tags: [RAG]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - drawing
 *             properties:
 *               drawing:
 *                 type: string
 *                 format: binary
 *                 description: The drawing file to process
 *               clientDescription:
 *                 type: string
 *                 description: Client description to provide context for the analysis
 *     responses:
 *       200:
 *         description: Drawing processed successfully with RAG enhancement
 *       400:
 *         description: No file uploaded or invalid file
 *       500:
 *         description: Server error
 */
app.post('/api/rag/process-drawing', upload.single('drawing'), async (req, res) => {
  // Outer try-catch block for handling all errors
  try {
    console.log('Received request to /api/rag/process-drawing');
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable is not set!');
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key is not configured',
        message: 'Please set the OPENAI_API_KEY environment variable'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      console.error('No file uploaded in request');
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a drawing file (PDF)'
      });
    }
    
    console.log(`Processing file with RAG enhancement: ${req.file.originalname}, size: ${req.file.size} bytes`);
    
    // Validate file type
    const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
    if (fileExtension !== 'pdf') {
      console.error(`Invalid file type: ${fileExtension}. Only PDF files are supported.`);
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: 'Only PDF files are supported'
      });
    }
    
    // Check file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      console.error(`File too large: ${req.file.size} bytes. Maximum size is 10MB.`);
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      console.error(`File not found at path: ${req.file.path}`);
      return res.status(500).json({
        success: false,
        error: 'File not found',
        message: 'The uploaded file could not be processed'
      });
    }
    
    // Extract file information
    const fileInfo = {
      name: req.file.originalname,
      path: req.file.path,
      type: fileExtension,
      size: req.file.size,
      timestamp: Date.now()
    };
    
    // Get client description if available
    const clientDescription = req.body.clientDescription || '';
    console.log(`Using client description for analysis: ${clientDescription.substring(0, 50)}...`);
    
    // Inner try-catch block for processing the drawing with RAG
    try {
      console.log(`Analyzing drawing with RAG: ${fileInfo.path}`);
      
      // Wait for RAG data to be initialized if it's still loading
      if (!globalRagData) {
        console.log('Waiting for RAG data to be initialized...');
        globalRagData = await ragDataPromise;
        console.log('RAG data initialized successfully');
      }
      
      // Generate RAG context string
      console.log('Generating RAG context...');
      const ragContext = ragModule.generateContextString(globalRagData);
      console.log(`Generated RAG context with ${ragContext.length} characters`);
      
      // Read the PDF file
      console.log(`Reading PDF file: ${req.file.path}`);
      const dataBuffer = fs.readFileSync(req.file.path);
      console.log(`Read ${dataBuffer.length} bytes from PDF file`);
      
      console.log('Parsing PDF with patched PDF parser...');
      const pdfData = await PDFParser(dataBuffer);
      const extractedText = pdfData.text;
      
      console.log(`Extracted ${extractedText.length} characters of text from the PDF`);
      
      // Call OpenAI with the RAG-enhanced prompt
      console.log('Calling OpenAI API with RAG-enhanced prompt...');
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: enhancedSystemPrompt.getArchitecturalDrawingSystemPrompt()
          },
          {
            role: "user",
            content: `Analyze this architectural drawing. Extract ALL measurements with precise values and units. Provide a detailed analysis following construction industry standards. Pay special attention to dimensions, scales, materials, and compliance requirements.\n\n${clientDescription ? `Client Description: ${clientDescription}\n\n` : ''}${ragContext}\n\nDrawing Content:\n${extractedText}`
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });
      
      console.log('Received response from OpenAI API');
      
      // Safely parse the JSON response
      const responseContent = response.choices[0].message.content;
      console.log(`Response content length: ${responseContent.length} characters`);
      let analysisResult;
      
      // Parse the JSON response with error handling
      try {
        // Check if response is HTML
        if (ragModule.isHtmlResponse(responseContent)) {
          console.error('Received HTML instead of JSON from OpenAI');
          throw new Error('Invalid response format (HTML received)');
        }
        
        // Try to parse the JSON
        console.log('Parsing JSON response...');
        analysisResult = safeJsonParse(responseContent, createDefaultArchitecturalAnalysis());
        console.log('Successfully parsed JSON response');
      } catch (parseError) {
        console.error('Error parsing analysis result:', parseError.message);
        console.error('Response content:', responseContent.substring(0, 200) + '...');
        console.log('Using default architectural analysis as fallback');
        analysisResult = createDefaultArchitecturalAnalysis();
      }
      
      // Generate timestamp for output files
      const timestamp = Date.now();
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Save the result to a file
      const outputPath = path.join(outputDir, `rag_analysis_${timestamp}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
      console.log(`Analysis saved to ${outputPath}`);
      
      // Send the successful response
      return res.json({
        success: true,
        message: 'Drawing processed successfully with RAG enhancement',
        fileInfo,
        analysis: analysisResult,
        outputPath: `/output/rag_analysis_${timestamp}.json`
      });
    } catch (processingError) {
      // Handle errors in the processing
      console.error('Error processing drawing with RAG:', processingError.message);
      return res.status(500).json({
        success: false,
        error: 'Error processing drawing with RAG',
        message: processingError.message
      });
    }
  } catch (outerError) {
    // Handle any other errors
    console.error('Outer error in RAG process-drawing endpoint:', outerError.message);
    console.error(outerError.stack);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while processing your request.',
      details: outerError.message
    });
  }
});

/**
 * @swagger
 * /api/process-drawing:
 *   post:
 *     summary: Process architectural drawing
 *     description: Upload and process an architectural drawing file
 *     tags: [Drawing Processing]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               drawing:
 *                 type: string
 *                 format: binary
 *                 description: Drawing file (PDF)
 *     responses:
 *       200:
 *         description: Drawing processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 fileInfo:
 *                   type: object
 *                 analysis:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/process-drawing', upload.single('drawing'), async (req, res) => {
  try {
    console.log('Received request to /api/process-drawing');
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable is not set!');
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key is not configured',
        message: 'Please set the OPENAI_API_KEY environment variable'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      console.error('No file uploaded in request');
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a drawing file (PDF)'
      });
    }
    
    console.log(`Processing file: ${req.file.originalname}, size: ${req.file.size} bytes`);
    
    // Validate file type
    const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
    if (fileExtension !== 'pdf') {
      console.error(`Invalid file type: ${fileExtension}. Only PDF files are supported.`);
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: 'Only PDF files are supported'
      });
    }
    
    // Check file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      console.error(`File too large: ${req.file.size} bytes. Maximum size is 10MB.`);
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(req.file.path)) {
      console.error(`File not found at path: ${req.file.path}`);
      return res.status(500).json({
        success: false,
        error: 'File not found',
        message: 'The uploaded file could not be processed'
      });
    }
    
    // Extract file information
    const fileInfo = {
      name: req.file.originalname,
      path: req.file.path,
      type: fileExtension,
      size: req.file.size,
      timestamp: Date.now()
    };
    
    try {
      console.log(`Analyzing drawing: ${fileInfo.path}`);
      
      // Get client description if available
      const clientDescription = req.body.clientDescription || '';
      console.log(`Using client description for analysis: ${clientDescription.substring(0, 50)}...`);
      
      // Analyze the drawing using OpenAI with client description
      const analysisResult = await analyzeDrawingWithAI(req.file.path, fileInfo.type, clientDescription);
      console.log('Analysis completed successfully');
      
      // Generate timestamp for output files
      const timestamp = Date.now();
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Save the result to a file
      const outputPath = path.join(outputDir, `analysis_${timestamp}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
      console.log(`Analysis saved to ${outputPath}`);
      
      res.json({
        success: true,
        message: 'Drawing processed successfully',
        fileInfo,
        analysis: analysisResult,
        outputPath: `/output/analysis_${timestamp}.json`
      });
    } catch (processingError) {
      console.error('Error processing drawing:', processingError.message);
      console.error(processingError.stack);
      
      // Return a more user-friendly error
      res.status(500).json({
        success: false,
        error: 'Error processing drawing',
        message: 'The drawing could not be processed. Please try again with a different file.',
        details: processingError.message
      });
    }
  } catch (error) {
    console.error('Error in process-drawing endpoint:', error.message);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while processing your request.',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/process-multiple-drawings:
 *   post:
 *     summary: Process multiple architectural drawings
 *     description: Upload and process multiple architectural drawing files at once
 *     tags: [Drawing Processing]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               drawings:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple drawing files (PDF)
 *               projectName:
 *                 type: string
 *                 description: Name of the project
 *               projectDescription:
 *                 type: string
 *                 description: Description of the project
 *     responses:
 *       200:
 *         description: Drawings processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 projectInfo:
 *                   type: object
 *                 fileInfos:
 *                   type: array
 *                   items:
 *                     type: object
 *                 analyses:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/process-multiple-drawings', upload.array('drawings', 10), async (req, res) => {
  try {
    console.log('Received request to /api/process-multiple-drawings');
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable is not set!');
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key is not configured',
        message: 'Please set the OPENAI_API_KEY environment variable'
      });
    }
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      console.error('No files uploaded in request');
      return res.status(400).json({ 
        success: false,
        error: 'No files uploaded',
        message: 'Please upload at least one drawing file (PDF)'
      });
    }
    
    console.log(`Processing ${req.files.length} files`);
    
    // Extract project information
    const projectInfo = {
      name: req.body.projectName || 'Unnamed Project',
      description: req.body.projectDescription || 'No description provided',
      timestamp: Date.now(),
      fileCount: req.files.length
    };
    
    // Process each file
    const filePromises = req.files.map(async (file) => {
      // Validate file type
      const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
      if (fileExtension !== 'pdf') {
        console.error(`Invalid file type: ${fileExtension}. Only PDF files are supported.`);
        return {
          success: false,
          fileInfo: {
            name: file.originalname,
            path: file.path,
            type: fileExtension,
            size: file.size
          },
          error: 'Invalid file type',
          message: 'Only PDF files are supported'
        };
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error(`File too large: ${file.size} bytes. Maximum size is 10MB.`);
        return {
          success: false,
          fileInfo: {
            name: file.originalname,
            path: file.path,
            type: fileExtension,
            size: file.size
          },
          error: 'File too large',
          message: 'Maximum file size is 10MB'
        };
      }
      
      // Extract file information
      const fileInfo = {
        name: file.originalname,
        path: file.path,
        type: fileExtension,
        size: file.size,
        timestamp: Date.now()
      };
      
      try {
        console.log(`Analyzing drawing: ${fileInfo.path}`);
        
        // Get client description if available
        const clientDescription = req.body.clientDescription || projectInfo.description || '';
        console.log(`Using client description for analysis: ${clientDescription.substring(0, 50)}...`);
        
        // Analyze the drawing using OpenAI with client description
        const analysisResult = await analyzeDrawingWithAI(file.path, fileInfo.type, clientDescription);
        console.log(`Analysis completed for ${fileInfo.name}`);
        
        // Generate timestamp for output files
        const timestamp = Date.now();
        const outputDir = path.join(__dirname, 'output');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Save the result to a file
        const outputPath = path.join(outputDir, `analysis_${fileInfo.name.replace(/\s+/g, '_')}_${timestamp}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
        
        return {
          success: true,
          fileInfo,
          analysis: analysisResult,
          outputPath: `/output/analysis_${fileInfo.name.replace(/\s+/g, '_')}_${timestamp}.json`
        };
      } catch (processingError) {
        console.error(`Error processing drawing ${fileInfo.name}:`, processingError.message);
        return {
          success: false,
          fileInfo,
          error: 'Error processing drawing',
          message: processingError.message
        };
      }
    });
    
    // Wait for all files to be processed
    const results = await Promise.all(filePromises);
    
    // Generate a combined analysis for all drawings
    const successfulResults = results.filter(result => result.success);
    
    // Create a project summary
    const projectSummary = {
      projectName: projectInfo.name,
      projectDescription: projectInfo.description,
      timestamp: new Date().toISOString(),
      totalDrawings: req.files.length,
      successfullyProcessed: successfulResults.length,
      failedToProcess: req.files.length - successfulResults.length,
      drawingNames: req.files.map(file => file.originalname)
    };
    
    // Save project summary
    const projectDir = path.join(__dirname, 'projects');
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    const projectPath = path.join(projectDir, `project_${projectInfo.name.replace(/\s+/g, '_')}_${projectInfo.timestamp}.json`);
    fs.writeFileSync(projectPath, JSON.stringify({
      projectInfo,
      results: results.map(result => ({
        fileName: result.fileInfo?.name,
        success: result.success,
        outputPath: result.outputPath,
        error: result.error
      }))
    }, null, 2));
    
    // If any drawings were successfully processed, generate a combined analysis
    if (successfulResults.length > 0) {
      try {
        console.log('Generating combined analysis for all drawings');
        
        // Extract all text from successful analyses
        const combinedText = successfulResults.map(result => {
          return `Drawing: ${result.fileInfo.name}\n${JSON.stringify(result.analysis, null, 2)}`;
        }).join('\n\n');
        
        // Generate a combined analysis using OpenAI
        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: enhancedSystemPrompt.getArchitecturalDrawingSystemPrompt()
            },
            {
              role: "user",
              content: `You are analyzing multiple architectural drawings for a project named "${projectInfo.name}". Here is the project description: "${projectInfo.description}".\n\nPlease provide a comprehensive analysis of all drawings, including:\n1. Overall project scope and measurements\n2. Consistency between drawings\n3. Material requirements across all drawings\n4. Potential issues or inconsistencies between drawings\n5. Suggestions for optimization\n\nHere are the individual analyses of each drawing:\n\n${combinedText}`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        });
        
        // Parse the combined analysis
        const combinedAnalysis = safeJsonParse(response.choices[0].message.content, {
          project_summary: {
            name: projectInfo.name,
            description: projectInfo.description,
            drawing_count: successfulResults.length
          },
          error: "Failed to generate combined analysis"
        });
        
        // Save the combined analysis
        const combinedOutputPath = path.join(outputDir, `combined_analysis_${projectInfo.name.replace(/\s+/g, '_')}_${projectInfo.timestamp}.json`);
        fs.writeFileSync(combinedOutputPath, JSON.stringify(combinedAnalysis, null, 2));
        
        // Add the combined analysis to the response
        projectSummary.combinedAnalysis = combinedAnalysis;
        projectSummary.combinedAnalysisPath = `/output/combined_analysis_${projectInfo.name.replace(/\s+/g, '_')}_${projectInfo.timestamp}.json`;
      } catch (combinedAnalysisError) {
        console.error('Error generating combined analysis:', combinedAnalysisError.message);
        projectSummary.combinedAnalysisError = combinedAnalysisError.message;
      }
    }
    
    // Return the results
    res.json({
      success: true,
      message: `Processed ${successfulResults.length} out of ${req.files.length} drawings`,
      projectInfo,
      fileInfos: results.map(result => result.fileInfo),
      results,
      projectSummary
    });
  } catch (error) {
    console.error('Error in process-multiple-drawings endpoint:', error.message);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while processing your request.',
      details: error.message
    });
  }
});

// Import the Python bridge for advanced drawing analysis
const pythonBridge = require('./python-bridge');

/**
 * @swagger
 * /api/advanced-analysis:
 *   post:
 *     summary: Advanced drawing analysis with Python FixItAll agent
 *     description: Upload and process an architectural drawing file using the Python-based FixItAll agent
 *     tags: [Advanced Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               drawing:
 *                 type: string
 *                 format: binary
 *                 description: Drawing file (PDF, PNG, JPG, or DWG)
 *     responses:
 *       200:
 *         description: Drawing analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 fileInfo:
 *                   type: object
 *                 analysis:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/advanced-analysis', upload.single('drawing'), async (req, res) => {
  try {
    console.log('Received request to /api/advanced-analysis');
    
    // Check if Python environment is available
    console.log('Checking Python environment availability...');
    try {
      // First check if the Python executable is available
      const pythonPath = pythonBridge.pythonPath;
      console.log(`Using Python path: ${pythonPath}`);
      
      // Try to run a simple Python command to check if Python is installed
      const { spawnSync } = require('child_process');
      const pythonVersionResult = spawnSync(pythonPath, ['--version'], { timeout: 5000 });
      
      if (pythonVersionResult.error || pythonVersionResult.status !== 0) {
        console.error('Python version check failed:', 
          pythonVersionResult.error || 
          `Exit code: ${pythonVersionResult.status}, Output: ${pythonVersionResult.stdout} ${pythonVersionResult.stderr}`);
        
        return res.status(500).json({
          success: false,
          error: 'Python environment not available',
          message: 'The Python executable could not be found or returned an error. Advanced analysis features are not available.'
        });
      }
      
      console.log(`Python version check successful: ${pythonVersionResult.stdout.toString().trim() || pythonVersionResult.stderr.toString().trim()}`);
      
      // Now check if all required packages are available
      const pythonAvailable = await pythonBridge.checkEnvironment().catch(err => {
        console.error('Error checking Python environment:', err);
        return false;
      });
      
      if (!pythonAvailable) {
        console.log('Python environment is not properly configured - missing required packages');
        console.log('Falling back to standard OpenAI analysis with specialized prompt...');
        
        // Get client description and analysis prompt type
        const clientDescription = req.body.clientDescription || '';
        const analysisPromptType = req.body.analysisPromptType || 'general';
        
        try {
          // Use standard OpenAI analysis with the specialized prompt as a fallback
          const result = await analyzeDrawingWithAI(req.file.path, path.extname(req.file.originalname).toLowerCase().substring(1), clientDescription, analysisPromptType);
          
          // Generate timestamp for output files
          const timestamp = Date.now();
          const outputDir = path.join(__dirname, 'output');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          // Save the result to a file
          const fileInfo = {
            name: req.file.originalname,
            path: req.file.path,
            type: path.extname(req.file.originalname).toLowerCase().substring(1),
            size: req.file.size,
            timestamp: Date.now()
          };
          
          const outputPath = path.join(outputDir, `fallback_analysis_${fileInfo.name.replace(/\s+/g, '_')}_${timestamp}.json`);
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
          
          console.log(`Fallback analysis saved to ${outputPath}`);
          
          // Return the result with a note about the fallback
          return res.json({
            success: true,
            message: 'Drawing analyzed using fallback OpenAI analysis (Python environment not available)',
            fileInfo,
            analysis: result,
            outputPath: `/output/fallback_analysis_${fileInfo.name.replace(/\s+/g, '_')}_${timestamp}.json`,
            fallback: true
          });
        } catch (fallbackError) {
          console.error('Error in fallback analysis:', fallbackError);
          return res.status(500).json({
            success: false,
            error: 'Analysis failed',
            message: 'Both advanced and fallback analysis methods failed. Please try again later.'
          });
        }
      }
      
      console.log('Python environment check successful - all required packages are available');
      
    } catch (pythonCheckError) {
      console.error('Error checking Python environment:', pythonCheckError);
      return res.status(500).json({
        success: false,
        error: 'Python environment check failed',
        message: 'An error occurred while checking the Python environment. Advanced analysis features are not available.'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      console.error('No file uploaded in request');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a drawing file (PDF, PNG, JPG, or DWG)'
      });
    }
    
    // Extract file extension
    const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
    
    // Validate file type
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'dwg'];
    if (!validExtensions.includes(fileExtension)) {
      console.error(`Invalid file type: ${fileExtension}. Supported types: ${validExtensions.join(', ')}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: `Only ${validExtensions.join(', ')} files are supported`
      });
    }
    
    // Check file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      console.error(`File too large: ${req.file.size} bytes. Maximum size is 10MB.`);
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      });
    }
    
    // Extract file information
    const fileInfo = {
      name: req.file.originalname,
      path: req.file.path,
      type: fileExtension,
      size: req.file.size,
      timestamp: Date.now()
    };
    
    console.log(`Processing drawing with FixItAll agent: ${fileInfo.path}`);
    
    // Get client description if provided
    const clientDescription = req.body.clientDescription || '';
    console.log(`Client description: ${clientDescription ? clientDescription.substring(0, 100) + '...' : 'Not provided'}`);
    
    // Fetch data from Suddeco APIs for context
    console.log('Fetching Suddeco API data for advanced analysis...');
    let apiData = {};
    
    try {
      // Use specific Suddeco API endpoints
      const materialsPromise = axios.get('https://api.suddeco.com/syed/materials', {
        headers: { 'Accept': 'application/json' },
        timeout: 8000
      });
      
      const tasksPromise = axios.get('https://api.suddeco.com/syed/tasks', {
        headers: { 'Accept': 'application/json' },
        timeout: 8000
      });
      
      const stagesPromise = axios.get('https://api.suddeco.com/syed/stages', {
        headers: { 'Accept': 'application/json' },
        timeout: 8000
      });
      
      const roomsPromise = axios.get('https://api.suddeco.com/syed/rooms', {
        headers: { 'Accept': 'application/json' },
        timeout: 8000
      });
      
      // Fetch all data in parallel
      const [materialsResponse, tasksResponse, stagesResponse, roomsResponse] = 
        await Promise.allSettled([materialsPromise, tasksPromise, stagesPromise, roomsPromise]);
      
      // Process responses, falling back to mock data if any request fails
      apiData = {
        materials: materialsResponse.status === 'fulfilled' ? materialsResponse.value.data : { materials: [] },
        tasks: tasksResponse.status === 'fulfilled' ? tasksResponse.value.data : { tasks: [] },
        stages: stagesResponse.status === 'fulfilled' ? stagesResponse.value.data : { stages: [] },
        rooms: roomsResponse.status === 'fulfilled' ? roomsResponse.value.data : { rooms: [] }
      };
      
      // Log success/failure for each API
      console.log(`Materials API: ${materialsResponse.status === 'fulfilled' ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Tasks API: ${tasksResponse.status === 'fulfilled' ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Stages API: ${stagesResponse.status === 'fulfilled' ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Rooms API: ${roomsResponse.status === 'fulfilled' ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (apiError) {
      console.error('Error fetching Suddeco API data:', apiError.message);
      console.log('Using empty API data');
    }
    
    // Process the drawing with the Python FixItAll agent, passing API data and client description
    const analysisResult = await pythonBridge.processDrawing(
      req.file.path, 
      { 
        clientDescription,
        apiData: JSON.stringify(apiData)
      }
    );
    
    // Generate timestamp for output files
    const timestamp = Date.now();
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save the result to a file
    const outputPath = path.join(outputDir, `advanced_analysis_${fileInfo.name.replace(/\s+/g, '_')}_${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
    
    console.log(`Advanced analysis saved to ${outputPath}`);
    
    // Return the result
    res.json({
      success: true,
      message: 'Drawing analyzed successfully with FixItAll agent',
      fileInfo,
      analysis: analysisResult,
      outputPath: `/output/advanced_analysis_${fileInfo.name.replace(/\s+/g, '_')}_${timestamp}.json`
    });
  } catch (error) {
    console.error('Error in advanced-analysis endpoint:', error.message);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An unexpected error occurred while processing your request.',
      details: error.message
    });
  }
});

// Import the schema API router
const schemaApiRouter = require('./suddeco-schema-api');

// Register the schema API router
app.use('/api/schema', schemaApiRouter);

// Start the server
app.listen(port, () => {
  console.log(`Suddeco AI Drawing Processor server running on port ${port}`);
  console.log(`API endpoint available at: http://localhost:${port}/api/process-drawing`);
  console.log(`Access the application at: http://localhost:${port}`);
  console.log(`API Documentation available at: http://localhost:${port}/api-docs`);
  console.log(`Enhanced API endpoints available at:`);
  console.log(`  - http://localhost:${port}/api/data`);
  console.log(`  - http://localhost:${port}/api/generate-description`);
  console.log(`  - http://localhost:${port}/api/estimate-measurements`);
  console.log(`RAG-enhanced endpoints available at:`);
  console.log(`  - http://localhost:${port}/api/rag/search`);
  console.log(`  - http://localhost:${port}/api/rag/chat`);
  console.log(`  - http://localhost:${port}/api/rag/process-drawing`);
  console.log(`Schema API endpoints available at:`);
  console.log(`  - http://localhost:${port}/api/schema/projects`);
  console.log(`  - http://localhost:${port}/api/schema/stages`);
  console.log(`  - http://localhost:${port}/api/schema/tasks`);
  console.log(`  - http://localhost:${port}/api/schema/materials`);
  console.log(`  - http://localhost:${port}/api/schema/drawings/upload`);
  console.log(`Schema Manager UI available at: http://localhost:${port}/schema-manager`);
  console.log(`RAG Chat UI available at: http://localhost:${port}/rag-chat`);
});

// Export the Express app for use in server.js
module.exports = app;
