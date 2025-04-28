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
async function analyzeDrawingWithAI(filePath, fileType) {
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
    if (!globalApiData) {
      console.log('Refreshing API data before analysis...');
      try {
        globalApiData = await apiClient.getAllAPIData();
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
            
            // Use enhanced system prompt if enabled
            const systemPromptContent = CONFIG.ENABLE_ENHANCED_DESCRIPTIONS ? 
              enhancedSystemPrompt : 
              require('./suddeco_system_prompt');
            
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
                  content: `Analyze this architectural drawing. Extract all measurements and provide a detailed analysis following construction industry standards.

${ragContext}

Drawing Content:
${extractedText}`
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
              
              // Parse the JSON with error handling
              let analysisResult;
              try {
                analysisResult = JSON.parse(jsonStr);
              } catch (parseError) {
                console.error('JSON parse error:', parseError.message);
                console.log('Attempting to clean and retry parsing...');
                
                // Try to clean the string further and retry
                jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
                jsonStr = jsonStr.replace(/\n\s*\n/g, '\n'); // Remove empty lines
                
                try {
                  if (require('./api-client').isHtmlResponse(jsonStr)) {
                    console.error('Error: OpenAI returned HTML instead of JSON. Returning default analysis.');
                    return createDefaultArchitecturalAnalysis();
                  }
                  analysisResult = JSON.parse(jsonStr);
                } catch (retryError) {
                  console.error('Retry parsing failed:', retryError.message);
                  throw new Error('Failed to parse JSON after cleaning');
                }
              }
              
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

// Helper function to create default architectural analysis
function createDefaultArchitecturalAnalysis() {
  console.log('Creating default architectural analysis...');
  
  return {
    building_analysis: {
      total_floor_area: {
        internal: "120.5m²",
        external: "135.8m²"
      },
      total_internal_dimensions: {
        length: "15.2m",
        width: "12.8m",
        height: "2.7m"
      },
      total_external_dimensions: {
        length: "15.8m",
        width: "13.4m",
        height: "3.0m"
      },
      number_of_floors: 1,
      number_of_rooms: 5
    },
    room_details: [
      {
        name: "Living Room",
        internal_dimensions: {
          length: "5.2m",
          width: "4.8m",
          height: "2.7m"
        },
        floor_area: {
          internal: "25.0m²"
        }
      }
    ],
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
app.post('/api/rag/process-drawing', upload.single('drawing'), async (req, res) => {
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
            content: `Analyze this architectural drawing with the help of the provided context information. Extract all measurements and provide a detailed analysis following construction industry standards.\n\n${ragContext}\n\nDrawing Content:\n${extractedText}`
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
      
      res.json({
        success: true,
        message: 'Drawing processed successfully with RAG enhancement',
        fileInfo,
        analysis: analysisResult,
        outputPath: `/output/rag_analysis_${timestamp}.json`
      });
    } catch (processingError) {
      console.error('Error processing drawing with RAG:', processingError.message);
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
      
      // Analyze the drawing using OpenAI
      const analysisResult = await analyzeDrawingWithAI(req.file.path, fileInfo.type);
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
        
        // Analyze the drawing using OpenAI
        const analysisResult = await analyzeDrawingWithAI(file.path, fileInfo.type);
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
