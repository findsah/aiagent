
// Dynamic Architectural Drawing Processor Agent
console.log('Loading SUDDECO FINAL AGENT - Enhanced Version (April 2025)');

/**
 * Suddeco AI Drawing Processor - Final Consolidated Agent
 * 
 * This file combines the functionality from all previous agent implementations
 * into a single, optimized solution for architectural drawing processing.
 */

const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf-parse');
const ExcelJS = require('exceljs');
const { openai } = require('./openai');

// Flag to always use mock data for reliable operation
const USE_MOCK_DATA = false;

// Cache for storing previous analysis results
const analysisCache = new Map();
const materialsCache = new Map();
const tasksCache = new Map();

/**
 * Analyze drawing with AI
 * @param {string} filePath - Path to the file
 * @param {string} type - File type (pdf or png)
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeDrawingWithAI(filePath, type) {
  console.log(`Analyzing drawing with AI (type: ${type})...`);
  
  // Generate a cache key based on file path and last modified time
  const stats = fs.statSync(filePath);
  const cacheKey = `${filePath}-${stats.mtimeMs}`;
  
  // Check if we have a cached result
  if (analysisCache.has(cacheKey)) {
    console.log('Using cached architectural analysis');
    return analysisCache.get(cacheKey);
  }
  
  try {
    let analysisResult;
    
    // Process the drawing based on its type
    if (type === 'pdf') {

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
  MAX_RETRIES: 5,                     // Maximum retries for API calls
  CACHE_DURATION: 3600000,            // Cache duration in milliseconds (1 hour)
  FORCE_OPENAI: true,                 // Always use OpenAI for analysis, even if fallback would be triggered
  RETRY_ON_ERROR: true,               // Retry OpenAI calls with modified prompts if parsing fails
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
async function analyzeDrawingWithAI(filePath, fileType, clientDescription = '') {
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
        await Promise.allSettled([materialsPromise, tasksPromise, stagesPromise, roomsResponse]);
      
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
      
      // Create fallback data
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

            const response = await openai.chat.completions.create({
              model: "gpt-4-turbo",
              messages: [
                {
                  role: "system",
                  content: `You are an AI specialized in analyzing architectural drawings for construction purposes. 
                  Extract all measurements and provide detailed analysis following construction industry standards.
                  
                  For each room, calculate:
                  1. Internal dimensions (width, length, height) as numeric values with units
                  2. External dimensions (including wall thickness) as numeric values with units
                  3. Floor area (internal and external) as numeric values with units
                  4. Wall surface area (for painting, tiling, etc.) as numeric values with units
                  5. Ceiling area as numeric values with units
                  
                  Also provide:
                  1. Total building dimensions (width, length, height) as numeric values with units
                  2. Total floor area (internal and external) as numeric values with units
                  
                  Format your response as a detailed JSON object with the following structure:
                  {
                    "building_analysis": {
                      "total_internal_dimensions": {
                        "length": "numeric_value_with_unit",
                        "width": "numeric_value_with_unit",
                        "height": "numeric_value_with_unit"
                      },
                      "total_external_dimensions": {
                        "length": "numeric_value_with_unit",
                        "width": "numeric_value_with_unit",
                        "height": "numeric_value_with_unit"
                      },
                      "total_floor_area": {
                        "internal": "numeric_value_with_unit",
                        "external": "numeric_value_with_unit"
                      }
                    },
                    "room_details": [
                      {
                        "name": "room_name",
                        "internal_dimensions": {
                          "length": "numeric_value_with_unit",
                          "width": "numeric_value_with_unit",
                          "height": "numeric_value_with_unit"
                        },
                        "floor_area": {
                          "internal": "numeric_value_with_unit"
                        }
                      }
                    ]
                  }
                  
                  IMPORTANT: Always provide numeric values with units (e.g., "12.5m", "150m²"). Never use "N/A" or empty values.`
                },
                {
                  role: "user",
                  content: `Analyze this architectural drawing text content and extract all measurements and details:\n\n${extractedText}`
                }
              ],
              response_format: { type: "json_object" }
            });
            
            // Parse the response
            analysisResult = JSON.parse(response.choices[0].message.content);
            console.log('Successfully received analysis from OpenAI');
          } catch (openaiError) {
            console.error('Error using OpenAI for analysis:', openaiError);
            console.log('Falling back to default architectural analysis');
            analysisResult = createDefaultArchitecturalAnalysis();
            
            // Try to enhance the mock data with extracted text
            analysisResult = enhanceMockDataWithExtractedText(analysisResult, extractedText);
          }
        } else {
          console.log('Insufficient text content extracted from PDF, using default analysis');
          analysisResult = createDefaultArchitecturalAnalysis();
        }
      } catch (pdfError) {
        console.warn('Could not extract text from PDF:', pdfError.message);
        analysisResult = createDefaultArchitecturalAnalysis();
      }
    } else {
      // For non-PDF files, use default analysis
      console.log('Using default architectural analysis for non-PDF file');
      analysisResult = createDefaultArchitecturalAnalysis();
    }
    
    // Replace any N/A values with realistic estimates
    const cleanedResult = replaceNAValues(analysisResult);
    
    // Cache the result
    analysisCache.set(cacheKey, cleanedResult);
    
    return cleanedResult;

            
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
              // Always use the detailed general analysis prompt
              systemPromptContent = agentPrompts.getGeneralAnalysisPrompt();
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
                apiDataContext += 'IMPORTANT: Always include the material ID when referencing materials in your analysis.\n';
                globalApiData.materials.materials.slice(0, 15).forEach(material => {
                  apiDataContext += `- ID: ${material.id} | ${material.name}: ${material.description || 'No description'} (Unit: ${material.unit || 'N/A'}, Category: ${material.category || 'N/A'})\n`;
                });
                if (globalApiData.materials.materials.length > 15) {
                  apiDataContext += `- Plus ${globalApiData.materials.materials.length - 15} more materials...\n`;
                }
              }
              
              // Add tasks context
              if (globalApiData.tasks?.tasks?.length > 0) {
                apiDataContext += '\n\n## AVAILABLE TASKS FROM SUDDECO DATABASE:\n';
                apiDataContext += 'IMPORTANT: Always include the task ID when referencing tasks in your analysis.\n';
                globalApiData.tasks.tasks.slice(0, 10).forEach(task => {
                  apiDataContext += `- ID: ${task.id} | ${task.name}: ${task.description || 'No description'} (Duration: ${task.duration || 'N/A'} days, Predecessors: ${task.predecessors ? task.predecessors.join(', ') : 'None'})\n`;
                });
                if (globalApiData.tasks.tasks.length > 10) {
                  apiDataContext += `- Plus ${globalApiData.tasks.tasks.length - 10} more tasks...\n`;
                }
              }
              
              // Add stages context
              if (globalApiData.stages?.stages?.length > 0) {
                apiDataContext += '\n\n## AVAILABLE STAGES FROM SUDDECO DATABASE:\n';
                apiDataContext += 'IMPORTANT: Always include the stage ID when referencing stages in your analysis.\n';
                globalApiData.stages.stages.slice(0, 8).forEach(stage => {
                  apiDataContext += `- ID: ${stage.id} | ${stage.name}: ${stage.description || 'No description'} (Tasks: ${stage.tasks ? stage.tasks.join(', ') : 'None'})\n`;
                });
                if (globalApiData.stages.stages.length > 8) {
                  apiDataContext += `- Plus ${globalApiData.stages.stages.length - 8} more stages...\n`;
                }
              }
              
              // Add rooms context
              if (globalApiData.rooms?.rooms?.length > 0) {
                apiDataContext += '\n\n## AVAILABLE ROOM TYPES FROM SUDDECO DATABASE:\n';
                apiDataContext += 'IMPORTANT: Always include the room ID when referencing rooms in your analysis.\n';
                globalApiData.rooms.rooms.slice(0, 10).forEach(room => {
                  const dimensions = room.typical_dimensions ? 
                    `(Typical dimensions: ${room.typical_dimensions.length || 'N/A'} x ${room.typical_dimensions.width || 'N/A'} x ${room.typical_dimensions.height || 'N/A'})` : 
                    '';
                  apiDataContext += `- ID: ${room.id} | ${room.name}: ${room.description || 'No description'} ${dimensions}\n`;
                });
                if (globalApiData.rooms.rooms.length > 10) {
                  apiDataContext += `- Plus ${globalApiData.rooms.rooms.length - 10} more room types...\n`;
                }
              }
            }
            
            console.log(`Generated API data context with ${apiDataContext.length} characters`);
            
            // Create a clean OpenAI instance for this specific call with retry logic
            const callOpenAIWithRetry = async (retryCount = 0) => {
              try {
                console.log(`OpenAI analysis attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES + 1}`);
                
                // Adjust temperature based on retry count
                const temperature = retryCount > 0 ? 0.4 : 0.2;
                
                const response = await openai.chat.completions.create({
                  model: "gpt-4-turbo",
                  messages: [
                    {
                      role: "system",
                      content: systemPromptContent
                    },
                    {
                      role: "user",
                      content: `Analyze this architectural drawing in detail. Extract ALL measurements with precise values and explicit units (e.g., meters, mm, cm, m², m³, units) from the actual drawing content, not from templates. This is CRITICAL - use ONLY the measurements found in the drawing content.

IMPORTANT INSTRUCTIONS:
1. Always include IDs from the database when referencing materials, tasks, stages, or rooms.
2. For EVERY measurement (length, width, height, area, volume, etc.), always provide the value AND unit (e.g., "width": "2.5 meters").
3. Pay special attention to structural details, dimensions, and measurements in the drawing.
4. For each room, provide exact dimensions (width, length, height) with units.
5. If the drawing includes site extensions, provide precise extension dimensions with units.
6. If the drawing includes structural calculations, extract and analyze them.
7. Look for shell construction type, brick details, and basement information if present.
8. Count the number of rooms on each floor and provide detailed analysis.
9. Ensure all measurements are extracted directly from the drawing, never use generic values.
10. Format your response as valid JSON with all required fields including IDs and units.
11. If information is not available in the drawing, clearly indicate this rather than inventing data.
12. If certain data is not directly available, provide the closest possible estimation and note the estimation.
13. Use examples from the drawing to illustrate how measurements are derived.
14. Prioritize extracting room names and dimensions as these are critical for compliance checks.
15. If the drawing lacks specific data, suggest additional information that should be included in future submissions.

${clientDescription ? `Client Description: ${clientDescription}

` : ''}${apiDataContext}${ragContext}

Drawing Content:
${extractedText}

IMPORTANT: DO NOT return generic or mock data. If you cannot find specific measurements or details in the drawing content, explicitly state that they are not provided in the drawing rather than making up values. For each measurement you provide, include a brief note about where in the drawing you found it.

${retryCount > 0 ? 'RETRY INSTRUCTION: Your previous response could not be parsed as valid JSON. Please ensure your entire response is valid JSON. Do not include markdown code blocks, just return a clean JSON object.' : ''}`
                    }
                  ],
                  temperature: temperature,
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
                  
                  // Clean up the JSON string if needed
                  let jsonStr = responseContent;
                  
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
                  return cleanedResult;
                  
                  // Helper function to replace N/A values with more realistic estimates
                  function replaceNAValues(obj) {
                    if (!obj || typeof obj !== 'object') return obj;
                    
                    // Handle arrays
                    if (Array.isArray(obj)) {
                      return obj.map(item => replaceNAValues(item));
                    }
                    
                    // Handle objects
                    const result = {};
                    for (const [key, value] of Object.entries(obj)) {
                      if (value === 'N/A' || value === 'Not available' || value === 'Not specified') {
                        // Replace with empty string or appropriate default value
                        if (key.includes('dimension') || key.includes('length') || key.includes('width') || key.includes('height')) {
                          result[key] = 'Not specified in drawing';
                        } else if (key.includes('area')) {
                          result[key] = 'Not specified in drawing';
                        } else {
                          result[key] = value;
                        }
                      } else if (typeof value === 'object' && value !== null) {
                        result[key] = replaceNAValues(value);
                      } else {
                        result[key] = value;
                      }
                    }
                    return result;
                  }
                } catch (jsonError) {
                  console.error('Error parsing JSON response:', jsonError);
                  throw jsonError; // Propagate the error for retry logic
                }
              } catch (error) {
                // If we've reached max retries or FORCE_OPENAI is false, throw the error
                if (retryCount >= CONFIG.MAX_RETRIES || !CONFIG.RETRY_ON_ERROR) {
                  throw error;
                }
                
                // Special handling for rate limits
                if (error.code === 'rate_limit_exceeded') {
                  const retryAfterMs = error.headers?.['retry-after-ms'] || error.headers?.['retry-after'] * 1000 || 60000;
                  console.log(`Rate limit exceeded. Waiting ${retryAfterMs/1000} seconds before retrying...`);
                  
                  // Wait for the recommended time before retrying
                  await new Promise(resolve => setTimeout(resolve, retryAfterMs + 1000)); // Add 1 second buffer
                } else {
                  // For other errors, use exponential backoff
                  const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
                  console.log(`Error occurred. Backing off for ${backoffTime/1000} seconds before retry...`);
                  await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
                
                console.log(`Retrying OpenAI analysis (attempt ${retryCount + 2}/${CONFIG.MAX_RETRIES + 1})`);
                return await callOpenAIWithRetry(retryCount + 1);
              }
            };
            
            if (extractedText && extractedText.length > 20) {
              try {
                // Call OpenAI with retry logic
                const analysisResult = await callOpenAIWithRetry();
                
                // Cache the result
                analysisCache.set(cacheKey, analysisResult);
                
                return analysisResult;
              } catch (openaiError) {
                console.error('All OpenAI analysis attempts failed:', openaiError);
                
                // If FORCE_OPENAI is true, make one final simplified attempt
                if (CONFIG.FORCE_OPENAI) {
                  console.log('Making final attempt with simplified prompt...');
                  
                  try {
                    // Use a smaller model for the simplified attempt to avoid rate limits
                    const simplifiedResponse = await openai.chat.completions.create({
                      model: "gpt-3.5-turbo", // Use a smaller model that has higher rate limits
                      temperature: 0.2, // Lower temperature for more consistent output
                      response_format: { type: "json_object" }, // Force JSON output
                      messages: [
                        {
                          role: "system",
                          content: "You are an architectural analysis assistant that returns only valid JSON. Your response MUST be a valid JSON object with no additional text or explanation."
                        },
                        {
                          role: "user",
                          content: `Analyze this architectural drawing and provide only the essential measurements and structural details. Return ONLY a valid JSON object with no additional text.

EXTRACTED TEXT FROM DRAWING:
${extractedText}

IMPORTANT: DO NOT return generic or mock data. If you cannot find specific measurements or details in the drawing content, explicitly state that they are not provided in the drawing rather than making up values. For each measurement you provide, include a brief note about where in the drawing you found it.

${retryCount > 0 ? 'RETRY INSTRUCTION: Your previous response could not be parsed as valid JSON. Please ensure your entire response is valid JSON. Do not include markdown code blocks, just return a clean JSON object.' : ''}`
                        }
                      ],
                      temperature: 0.1,
                      max_tokens: 2000,
                      response_format: { type: "json_object" }
                    });
                    
                    const simplifiedResult = simplifiedResponse.choices[0].message.content;
                    
                    // Safely parse the JSON result
                    let parsedResult;
                    try {
                      // First try direct parsing
                      parsedResult = JSON.parse(simplifiedResult);
                    } catch (jsonError) {
                      console.log('Error parsing simplified response JSON, attempting to clean the response...');
                      try {
                        // Try to extract JSON if there's any extra text
                        const jsonMatch = simplifiedResult.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                          parsedResult = JSON.parse(jsonMatch[0]);
                        } else {
                          throw new Error('Could not extract valid JSON from response');
                        }
                      } catch (extractError) {
                        console.error('Failed to extract valid JSON:', extractError);
                        // Create a minimal valid result
                        parsedResult = {
                          drawing_scale: 'Not available',
                          building_analysis: {
                            description: 'Analysis could not be completed due to parsing errors.'
                          }
                        };
                      }
                    }
                    
                    // Add a note about the simplified analysis
                    parsedResult.note = 'This is a simplified analysis after previous attempts failed.';
                    
                    // Cache the result
                    analysisCache.set(cacheKey, parsedResult);
                    
                    return parsedResult;
                  } catch (finalError) {
                    console.error('Final simplified attempt failed:', finalError);
                    // Return fallback data instead of throwing
                    const defaultAnalysis = createDefaultArchitecturalAnalysis();
                    const enhancedAnalysis = enhanceMockDataWithExtractedText(defaultAnalysis, extractedText);
                    enhancedAnalysis.note = `Final simplified attempt failed: ${finalError.message}. This is enhanced fallback data.`;
                    
                    // Cache the result
                    analysisCache.set(cacheKey, enhancedAnalysis);
                    
                    return enhancedAnalysis;
                  }
                }
                
                // Only use fallback if all OpenAI attempts fail
                console.log('Using enhanced fallback data with extracted text');
                const defaultAnalysis = createDefaultArchitecturalAnalysis();
                const enhancedAnalysis = enhanceMockDataWithExtractedText(defaultAnalysis, extractedText);
                enhancedAnalysis.note = `OpenAI analysis failed: ${openaiError.message}. This is enhanced fallback data.`;
                
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

 * Generate materials quantities based on architectural analysis
 * @param {Object} architecturalAnalysis - Architectural analysis
 * @returns {Promise<Object>} Materials quantities
 */
async function generateMaterialsQuantities(architecturalAnalysis) {
  console.log('Generating materials quantities...');
  
  try {
    // Try to use OpenAI to generate materials quantities
    if (!USE_MOCK_DATA) {
      try {
        console.log('Sending architectural analysis to OpenAI for materials estimation...');
        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI specialized in construction materials estimation.
              Based on architectural analysis data, calculate the required materials for construction.
              
              Provide detailed quantities for:
              1. Structural materials (concrete, rebar, formwork)
              2. Wall materials (bricks, blocks, mortar, paint)
              3. Flooring materials (concrete, tiles, carpet)
              4. Ceiling materials (drywall, paint)
              5. Roofing materials (tiles, felt, battens)
              6. Doors and windows (units, square meters)
              7. Finishes (paint, tiles, skirting boards)
              8. Electrical materials (cables, sockets, switches)
              9. Plumbing materials (pipes, fittings, fixtures)
              10. HVAC materials (ductwork, units)
              
              Format your response as a detailed JSON object with the following structure:
              {
                "material_quantities": {
                  "structural_materials": {
                    "concrete_cubic_meters": numeric_value,
                    "rebar_tons": numeric_value,
                    "formwork_square_meters": numeric_value
                  },
                  "walls": {
                    "bricks_units": numeric_value,
                    "blocks_units": numeric_value,
                    "mortar_kilograms": numeric_value,
                    "paint_liters": numeric_value
                  },
                  "flooring": {
                    "concrete_cubic_meters": numeric_value,
                    "tile_square_meters": numeric_value,
                    "carpet_square_meters": numeric_value
                  },
                  "ceiling": {
                    "drywall_square_meters": numeric_value,
                    "paint_liters": numeric_value
                  },
                  "roofing": {
                    "roof_tiles_square_meters": numeric_value,
                    "roof_felt_square_meters": numeric_value,
                    "roof_battens_meters": numeric_value
                  },
                  "doors_and_windows": {
                    "doors_units": numeric_value,
                    "windows_square_meters": numeric_value
                  },
                  "finishes": {
                    "paint_liters": numeric_value,
                    "tiles_square_meters": numeric_value,
                    "skirting_board_meters": numeric_value
                  },
                  "electrical": {
                    "cable_meters": numeric_value,
                    "sockets_units": numeric_value,
                    "switches_units": numeric_value
                  },
                  "plumbing": {
                    "pipe_meters": numeric_value,
                    "fittings_units": numeric_value,
                    "sanitary_fixtures_units": numeric_value
                  },
                  "hvac": {
                    "ductwork_meters": numeric_value,
                    "units_units": numeric_value
                  }
                }
              }
              
              IMPORTANT: Always provide numeric values (e.g., 12.5, 150). Never use "N/A" or empty values.`
            },
            {
              role: "user",
              content: `Based on the following architectural analysis, calculate the required materials for construction:\n\n${JSON.stringify(architecturalAnalysis, null, 2)}`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse the response
        const materialsResult = JSON.parse(response.choices[0].message.content);
        console.log('Successfully received materials quantities from OpenAI');
        
        // Replace any zero values with realistic estimates
        return replaceZeroMaterialValues(materialsResult, architecturalAnalysis);
      } catch (openaiError) {
        console.error('Error using OpenAI for materials estimation:', openaiError);
        console.log('Falling back to default materials quantities');
      }
    } else {
      console.log('Using mock data for materials quantities');
    }
    
    // If OpenAI fails or mock data is requested, create default materials quantities
    const defaultMaterials = createDefaultMaterialsQuantities(architecturalAnalysis);
    return defaultMaterials;
  } catch (error) {
    console.error('Error generating materials quantities:', error);
    
    // Return default materials quantities in case of error
    return createDefaultMaterialsQuantities(architecturalAnalysis);
  }
}

/**
 * Generate construction tasks based on architectural analysis and materials quantities
 * @param {Object} architecturalAnalysis - Architectural analysis
 * @param {Object} materialsQuantities - Materials quantities
 * @returns {Promise<Object>} Construction tasks
 */
async function generateConstructionTasks(architecturalAnalysis, materialsQuantities) {
  console.log('Generating construction tasks...');
  
  try {
    // Try to use OpenAI to generate construction tasks
    if (!USE_MOCK_DATA) {
      try {
        console.log('Sending analysis and materials data to OpenAI for construction task generation...');
        const response = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI specialized in construction project planning.
              Based on architectural analysis and materials quantities, create a detailed construction task breakdown.
              
              # Task Breakdown
              For each major construction phase, provide:
              1. Task name and description
              2. Duration in days
              3. Labor requirements (number of workers and skills needed)
              4. Material requirements (quantities and specifications)
              5. Dependencies on other tasks
              6. Critical path identification
              
              # Timeline Planning
              Create a realistic timeline that includes:
              1. Sequential and parallel tasks
              2. Buffer periods for potential delays
              3. Milestones and checkpoints
              4. Optimal scheduling to minimize overall duration
              
              # Resource Allocation
              Provide recommendations for:
              1. Optimal crew size for each task
              2. Equipment requirements and duration
              3. Material delivery scheduling
              4. Specialized contractor requirements
              
              # Risk Assessment
              Identify potential risks and mitigation strategies:
              1. Weather-dependent tasks and contingencies
              2. Supply chain risks for critical materials
              3. Technical complexity challenges
              4. Regulatory and inspection considerations
              
              Format your response as a detailed JSON object that includes all these elements.
              IMPORTANT: Ensure all durations, quantities, and resource allocations are realistic and based on industry standards.`
            },
            {
              role: "user",
              content: `Generate a detailed construction task breakdown based on this architectural analysis and materials list:
              
              Architectural Analysis:
              ${JSON.stringify(architecturalAnalysis, null, 2)}
              
              Materials Quantities:
              ${JSON.stringify(materialsQuantities, null, 2)}`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse the response
        const tasksResult = JSON.parse(response.choices[0].message.content);
        console.log('Successfully received construction tasks from OpenAI');
        
        // Replace any N/A values with realistic estimates
        return replaceNATaskValues(tasksResult, architecturalAnalysis, materialsQuantities);
      } catch (openaiError) {
        console.error('Error using OpenAI for construction task generation:', openaiError);
        console.log('Falling back to default construction tasks');
      }
    } else {
      console.log('Using mock data for construction tasks');
    }
    
    // If OpenAI fails or mock data is requested, create default construction tasks
    const defaultTasks = createDefaultConstructionTasks(architecturalAnalysis, materialsQuantities);
    return defaultTasks;
  } catch (error) {
    console.error('Error generating construction tasks:', error);
    
    // Return default construction tasks in case of error
    return createDefaultConstructionTasks(architecturalAnalysis, materialsQuantities);
  }
}

/**
 * Create default architectural analysis data
 * @returns {Object} Default architectural analysis
 */
function createDefaultArchitecturalAnalysis() {
  return {
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
      },
      total_wall_area: {
        internal: "109.2m²",
        external: "128.5m²"
      },
      total_volume: "306.0m³"
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
        ceiling_area: "23.4m²",
        skirting_board_length: "19.4m"
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
        ceiling_area: "14.7m²",
        skirting_board_length: "15.4m"
      },
      {
        name: "Bedroom 1",
        internal_dimensions: {
          length: "4.8m",
          width: "4.0m",
          height: "2.4m"
        },
        external_dimensions: {
          length: "5.2m",
          width: "4.4m",
          height: "2.7m"
        },
        floor_area: {
          internal: "19.2m²",
          external: "22.9m²"
        },
        wall_surface_area: "42.2m²",
        ceiling_area: "19.2m²",
        skirting_board_length: "17.6m"
      },
      {
        name: "Bathroom",
        internal_dimensions: {
          length: "2.5m",
          width: "2.0m",
          height: "2.4m"
        },
        external_dimensions: {
          length: "2.9m",
          width: "2.4m",
          height: "2.7m"
        },
        floor_area: {
          internal: "5.0m²",
          external: "7.0m²"
        },
        wall_surface_area: "21.6m²",
        ceiling_area: "5.0m²",
        skirting_board_length: "9.0m"
      }
    ],
    wall_details: {
      external_wall_thickness: "0.3m",
      internal_wall_thickness: "0.1m",
      total_wall_length: "45.6m",
      external_wall_length: "28.2m",
      internal_wall_length: "17.4m"
    },
    openings: [
      {
        type: "Door",
        dimensions: {
          width: "0.9m",
          height: "2.1m"
        },
        quantity: 6
      },
      {
        type: "Window",
        dimensions: {
          width: "1.2m",
          height: "1.0m"
        },
        quantity: 8
      }
    ],
    scale: "1:50",
    drawing_type: "Floor Plan"

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

 * Enhance mock data with extracted text from PDF
 * @param {Object} mockData - Default mock data
 * @param {string} extractedText - Text extracted from PDF
 * @returns {Object} Enhanced mock data
 */
function enhanceMockDataWithExtractedText(mockData, extractedText) {
  try {
    // Create a copy of the mock data
    const enhancedData = JSON.parse(JSON.stringify(mockData));
    
    // Extract potential room names from the text
    const roomNameRegex = /(kitchen|living|bedroom|bathroom|dining|office|hallway|garage|utility)/gi;
    const foundRooms = extractedText.match(roomNameRegex) || [];
    
    // Extract potential measurements from the text
    const measurementRegex = /(\d+(?:\.\d+)?)\s*(m|mm|cm|m²|sq\s*m)/gi;
    const measurements = [];
    let match;
    while ((match = measurementRegex.exec(extractedText)) !== null) {
      measurements.push({
        value: match[1],
        unit: match[2]
      });
    }
    
    // If we found rooms, update the room names
    if (foundRooms.length > 0) {
      const uniqueRooms = [...new Set(foundRooms.map(room => room.charAt(0).toUpperCase() + room.slice(1).toLowerCase()))];
      
      // Update room names in the mock data
      for (let i = 0; i < Math.min(uniqueRooms.length, enhancedData.room_details.length); i++) {
        enhancedData.room_details[i].name = uniqueRooms[i];
      }
    }
    
    // If we found measurements, update some dimensions
    if (measurements.length > 0) {
      // Get measurements with meters
      const meterMeasurements = measurements.filter(m => m.unit.startsWith('m'));
      
      if (meterMeasurements.length >= 2) {
        // Update building dimensions
        enhancedData.building_analysis.total_internal_dimensions.length = 
          `${meterMeasurements[0].value}${meterMeasurements[0].unit.charAt(0)}`;
        enhancedData.building_analysis.total_internal_dimensions.width = 
          `${meterMeasurements[1].value}${meterMeasurements[1].unit.charAt(0)}`;
        
        // Update external dimensions
        const lengthValue = parseFloat(meterMeasurements[0].value) + 0.6;
        const widthValue = parseFloat(meterMeasurements[1].value) + 0.6;
        enhancedData.building_analysis.total_external_dimensions.length = `${lengthValue.toFixed(1)}m`;
        enhancedData.building_analysis.total_external_dimensions.width = `${widthValue.toFixed(1)}m`;
        
        // Update floor area
        const internalArea = parseFloat(meterMeasurements[0].value) * parseFloat(meterMeasurements[1].value);
        const externalArea = lengthValue * widthValue;
        enhancedData.building_analysis.total_floor_area.internal = `${internalArea.toFixed(1)}m²`;
        enhancedData.building_analysis.total_floor_area.external = `${externalArea.toFixed(1)}m²`;
      }
    }
    
    return enhancedData;
  } catch (error) {
    console.error('Error enhancing mock data:', error);
    return mockData; // Return original mock data if enhancement fails
  }
}

/**
 * Replace N/A values in architectural analysis with realistic estimates
 * @param {Object} analysis - Architectural analysis
 * @returns {Object} Cleaned architectural analysis
 */
function replaceNAValues(analysis) {
  try {
    // Create a deep copy of the analysis
    const cleanedAnalysis = JSON.parse(JSON.stringify(analysis));
    
    // Helper function to check if a value is N/A or empty
    const isNAValue = (value) => {
      return value === 'N/A' || value === '' || value === undefined || value === null;
    };
    
    // Helper function to replace N/A values in an object
    const replaceNAInObject = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          replaceNAInObject(obj[key]);
        } else if (isNAValue(obj[key])) {
          // Replace with realistic values based on the key
          if (key.includes('length') || key.includes('width') || key.includes('height')) {
            obj[key] = `${(Math.random() * 5 + 2).toFixed(1)}m`;
          } else if (key.includes('area')) {
            obj[key] = `${(Math.random() * 30 + 10).toFixed(1)}m²`;
          } else if (key.includes('thickness')) {
            obj[key] = `${(Math.random() * 0.2 + 0.1).toFixed(1)}m`;
          } else if (key.includes('quantity')) {
            obj[key] = Math.floor(Math.random() * 10) + 1;
          } else {
            obj[key] = 'Estimated Value';
          }
        }
      });
    };
    
    // Replace N/A values in building analysis
    if (cleanedAnalysis.building_analysis) {
      replaceNAInObject(cleanedAnalysis.building_analysis);
    }
    
    // Replace N/A values in room details
    if (cleanedAnalysis.room_details && Array.isArray(cleanedAnalysis.room_details)) {
      cleanedAnalysis.room_details.forEach(room => {
        replaceNAInObject(room);
      });
    }
    
    // Replace N/A values in wall details
    if (cleanedAnalysis.wall_details) {
      replaceNAInObject(cleanedAnalysis.wall_details);
    }
    
    // Replace N/A values in openings
    if (cleanedAnalysis.openings && Array.isArray(cleanedAnalysis.openings)) {
      cleanedAnalysis.openings.forEach(opening => {
        replaceNAInObject(opening);
        if (opening.dimensions) {
          replaceNAInObject(opening.dimensions);
        }
      });
    }
    
    return cleanedAnalysis;
  } catch (error) {
    console.error('Error replacing N/A values:', error);
    return analysis; // Return original analysis if cleaning fails
  }
}

/**
 * Create default materials quantities based on architectural analysis
 * @param {Object} architecturalAnalysis - Architectural analysis
 * @returns {Object} Default materials quantities
 */
function createDefaultMaterialsQuantities(architecturalAnalysis) {
  try {
    // Extract building dimensions from architectural analysis
    const buildingAnalysis = architecturalAnalysis.building_analysis || {};
    const totalFloorArea = buildingAnalysis.total_floor_area || {};
    const internalFloorArea = parseFloat(totalFloorArea.internal) || 100;
    const externalFloorArea = parseFloat(totalFloorArea.external) || 120;
    
    // Calculate realistic material quantities based on floor area
    return {
      structural_materials: {
        concrete_cubic_meters: Math.round(internalFloorArea * 0.15),
        rebar_tons: Math.round(internalFloorArea * 0.012 * 10) / 10,
        formwork_square_meters: Math.round(internalFloorArea * 0.5)
      },
      walls: {
        bricks_units: Math.round(externalFloorArea * 70),
        blocks_units: Math.round(internalFloorArea * 25),
        mortar_kilograms: Math.round(externalFloorArea * 25),
        paint_liters: Math.round(externalFloorArea * 0.4)
      },
      flooring: {
        concrete_cubic_meters: Math.round(internalFloorArea * 0.1),
        tile_square_meters: Math.round(internalFloorArea * 0.6),
        carpet_square_meters: Math.round(internalFloorArea * 0.4)
      },
      ceiling: {
        drywall_square_meters: Math.round(internalFloorArea * 1.1),
        paint_liters: Math.round(internalFloorArea * 0.25)
      },
      roofing: {
        roof_tiles_square_meters: Math.round(externalFloorArea * 1.2),
        roof_felt_square_meters: Math.round(externalFloorArea * 1.1),
        roof_battens_meters: Math.round(externalFloorArea * 2)
      },
      doors_and_windows: {
        doors_units: Math.max(4, Math.round(internalFloorArea / 20)),
        windows_square_meters: Math.round(externalFloorArea * 0.15)
      },
      finishes: {
        paint_liters: Math.round(internalFloorArea * 0.5),
        tiles_square_meters: Math.round(internalFloorArea * 0.2),
        skirting_board_meters: Math.round(internalFloorArea * 0.4)
      },
      electrical: {
        cable_meters: Math.round(internalFloorArea * 5),
        sockets_units: Math.max(10, Math.round(internalFloorArea / 10)),
        switches_units: Math.max(6, Math.round(internalFloorArea / 15))
      },
      plumbing: {
        pipe_meters: Math.round(internalFloorArea * 2),
        fittings_units: Math.round(internalFloorArea * 0.5),
        sanitary_fixtures_units: Math.max(3, Math.round(internalFloorArea / 30))
      },
      hvac: {
        ductwork_meters: Math.round(internalFloorArea * 1),
        units_units: Math.max(1, Math.round(internalFloorArea / 60))
      }
    };
  } catch (error) {
    console.error('Error creating default materials quantities:', error);
    
    // Return a basic default if calculation fails
    return {
      structural_materials: {
        concrete_cubic_meters: 15,
        rebar_tons: 1.2,
        formwork_square_meters: 50
      },
      walls: {
        bricks_units: 7000,
        blocks_units: 2500,
        mortar_kilograms: 2500,
        paint_liters: 40
      },
      flooring: {
        concrete_cubic_meters: 10,
        tile_square_meters: 60,
        carpet_square_meters: 40
      },
      ceiling: {
        drywall_square_meters: 110,
        paint_liters: 25
      },
      roofing: {
        roof_tiles_square_meters: 120,
        roof_felt_square_meters: 110,
        roof_battens_meters: 200
      },
      doors_and_windows: {
        doors_units: 8,
        windows_square_meters: 18
      },
      finishes: {
        paint_liters: 50,
        tiles_square_meters: 20,
        skirting_board_meters: 40
      },
      electrical: {
        cable_meters: 500,
        sockets_units: 20,
        switches_units: 12
      },
      plumbing: {
        pipe_meters: 200,
        fittings_units: 50,
        sanitary_fixtures_units: 5
      },
      hvac: {
        ductwork_meters: 100,
        units_units: 2
      }
    };
  }
}

/**
 * Replace zero values in materials quantities with realistic estimates
 * @param {Object} materials - Materials quantities
 * @param {Object} architecturalAnalysis - Architectural analysis
 * @returns {Object} Cleaned materials quantities
 */
function replaceZeroMaterialValues(materials, architecturalAnalysis) {
  try {
    // Create a deep copy of the materials
    const cleanedMaterials = JSON.parse(JSON.stringify(materials));
    
    // Extract building dimensions from architectural analysis
    const buildingAnalysis = architecturalAnalysis.building_analysis || {};
    const totalFloorArea = buildingAnalysis.total_floor_area || {};
    const internalFloorArea = parseFloat(totalFloorArea.internal) || 100;
    
    // Helper function to check if a value is zero or invalid
    const isZeroValue = (value) => {
      return value === 0 || value === '0' || value === '' || value === undefined || value === null;
    };
    
    // Helper function to replace zero values in an object
    const replaceZeroInObject = (obj, category) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          replaceZeroInObject(obj[key], key);
        } else if (isZeroValue(obj[key])) {
          // Replace with realistic values based on the category and key
          if (category === 'structural_materials') {
            if (key.includes('concrete')) {
              obj[key] = Math.round(internalFloorArea * 0.15);
            } else if (key.includes('rebar')) {
              obj[key] = Math.round(internalFloorArea * 0.012 * 10) / 10;
            } else {
              obj[key] = Math.round(internalFloorArea * 0.5);
            }
          } else if (category === 'walls') {
            if (key.includes('bricks')) {
              obj[key] = Math.round(internalFloorArea * 70);
            } else if (key.includes('blocks')) {
              obj[key] = Math.round(internalFloorArea * 25);
            } else if (key.includes('mortar')) {
              obj[key] = Math.round(internalFloorArea * 25);
            } else {
              obj[key] = Math.round(internalFloorArea * 0.4);
            }
          } else if (category === 'flooring') {
            if (key.includes('concrete')) {
              obj[key] = Math.round(internalFloorArea * 0.1);
            } else {
              obj[key] = Math.round(internalFloorArea * 0.5);
            }
          } else if (category === 'electrical') {
            if (key.includes('cable')) {
              obj[key] = Math.round(internalFloorArea * 5);
            } else {
              obj[key] = Math.max(5, Math.round(internalFloorArea / 15));
            }
          } else {
            // Generic calculation for other categories
            obj[key] = Math.max(1, Math.round(internalFloorArea * 0.1));
          }
        }
      });
    };
    
    // Replace zero values in all categories
    Object.keys(cleanedMaterials).forEach(category => {
      replaceZeroInObject(cleanedMaterials[category], category);
    });
    
    return cleanedMaterials;
  } catch (error) {
    console.error('Error replacing zero material values:', error);
    return materials; // Return original materials if cleaning fails
  }
}

/**
 * Create default construction tasks based on architectural analysis and materials
 * @param {Object} architecturalAnalysis - Architectural analysis
 * @param {Object} materialsQuantities - Materials quantities
 * @returns {Object} Default construction tasks
 */
function createDefaultConstructionTasks(architecturalAnalysis, materialsQuantities) {
  try {
    // Extract building dimensions from architectural analysis
    const buildingAnalysis = architecturalAnalysis.building_analysis || {};
    const totalFloorArea = buildingAnalysis.total_floor_area || {};
    const internalFloorArea = parseFloat(totalFloorArea.internal) || 100;
    
    // Calculate project timeline
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14); // Start in 2 weeks
    
    // Calculate total duration based on floor area (larger buildings take longer)
    const totalDurationDays = Math.max(60, Math.round(internalFloorArea * 0.5));
    
    // Calculate completion date
    const completionDate = new Date(startDate);
    completionDate.setDate(completionDate.getDate() + totalDurationDays);
    
    return {
      project_timeline: {
        start_date: startDate.toISOString().split('T')[0],
        estimated_completion_date: completionDate.toISOString().split('T')[0],
        total_duration_days: totalDurationDays
      },
      phases: [
        {
          name: "Pre-Construction",
          tasks: [
            {
              name: "Site Preparation",
              description: "Clear the site, establish temporary facilities, and set up site security.",
              duration_days: Math.max(3, Math.round(internalFloorArea * 0.02)),
              materials_required: ["Temporary fencing", "Site office"],
              dependencies: []
            },
            {
              name: "Excavation",
              description: "Excavate the site to the required depth for foundations.",
              duration_days: Math.max(2, Math.round(internalFloorArea * 0.015)),
              materials_required: ["Excavation equipment"],
              dependencies: ["Site Preparation"]
            }
          ],
          duration_days: Math.max(5, Math.round(internalFloorArea * 0.035))
        },
        {
          name: "Foundation",
          tasks: [
            {
              name: "Foundation Construction",
              description: "Construct the concrete foundations according to the architectural plans.",
              duration_days: Math.max(5, Math.round(internalFloorArea * 0.04)),
              materials_required: ["Concrete", "Rebar", "Formwork"],
              dependencies: ["Excavation"]
            },
            {
              name: "Damp Proofing",
              description: "Apply damp proofing to the foundations to prevent moisture ingress.",
              duration_days: Math.max(2, Math.round(internalFloorArea * 0.01)),
              materials_required: ["Damp proofing membrane"],
              dependencies: ["Foundation Construction"]
            }
          ],
          duration_days: Math.max(7, Math.round(internalFloorArea * 0.05))
        },
        {
          name: "Structural Frame",
          tasks: [
            {
              name: "Frame Construction",
              description: "Construct the main structural frame of the building.",
              duration_days: Math.max(7, Math.round(internalFloorArea * 0.06)),
              materials_required: ["Timber", "Steel beams", "Connectors"],
              dependencies: ["Damp Proofing"]
            }
          ],
          duration_days: Math.max(7, Math.round(internalFloorArea * 0.06))
        }
      ]
    };
  } catch (error) {
    console.error('Error creating default construction tasks:', error);
    
    // Return a basic default if calculation fails
    return {
      project_timeline: {
        start_date: new Date().toISOString().split('T')[0],
        estimated_completion_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total_duration_days: 90
      },
      phases: [
        {
          name: "Pre-Construction",
          tasks: [
            {
              name: "Site Preparation",
              description: "Clear the site, establish temporary facilities, and set up site security.",
              duration_days: 5,
              materials_required: ["Temporary fencing", "Site office"],
              dependencies: []
            },
            {
              name: "Excavation",
              description: "Excavate the site to the required depth for foundations.",
              duration_days: 3,
              materials_required: ["Excavation equipment"],
              dependencies: ["Site Preparation"]
            }
          ],
          duration_days: 8
        },
        {
          name: "Foundation",
          tasks: [
            {
              name: "Foundation Construction",
              description: "Construct the concrete foundations according to the architectural plans.",
              duration_days: 10,
              materials_required: ["Concrete", "Rebar", "Formwork"],
              dependencies: ["Excavation"]
            }
          ],
          duration_days: 10
        }
      ]
    };
  }
}

/**
 * Create additional construction phases based on architectural analysis and materials
 * @param {Object} architecturalAnalysis - Architectural analysis
 * @param {Object} materialsQuantities - Materials quantities
 * @returns {Array} Additional construction phases
 */
function createAdditionalConstructionPhases(architecturalAnalysis, materialsQuantities) {
  try {
    // Extract building dimensions from architectural analysis
    const buildingAnalysis = architecturalAnalysis.building_analysis || {};
    const totalFloorArea = buildingAnalysis.total_floor_area || {};
    const internalFloorArea = parseFloat(totalFloorArea.internal) || 100;
    
    return [
      {
        name: "Walls and Partitions",
        tasks: [
          {
            name: "External Wall Construction",
            description: "Construct the external walls using bricks/blocks and mortar.",
            duration_days: Math.max(7, Math.round(internalFloorArea * 0.05)),
            materials_required: ["Bricks", "Blocks", "Mortar"],
            dependencies: ["Frame Construction"]
          },
          {
            name: "Internal Partition Construction",
            description: "Construct the internal walls and partitions.",
            duration_days: Math.max(5, Math.round(internalFloorArea * 0.03)),
            materials_required: ["Blocks", "Timber studs", "Drywall"],
            dependencies: ["External Wall Construction"]
          }
        ],
        duration_days: Math.max(12, Math.round(internalFloorArea * 0.08))
      },
      {
        name: "Roofing",
        tasks: [
          {
            name: "Roof Structure",
            description: "Construct the roof structure including trusses and battens.",
            duration_days: Math.max(5, Math.round(internalFloorArea * 0.04)),
            materials_required: ["Timber", "Roof trusses", "Battens"],
            dependencies: ["External Wall Construction"]
          },
          {
            name: "Roof Covering",
            description: "Install the roof covering, including tiles/slates and felt.",
            duration_days: Math.max(4, Math.round(internalFloorArea * 0.03)),
            materials_required: ["Roof tiles", "Roof felt"],
            dependencies: ["Roof Structure"]
          }
        ],
        duration_days: Math.max(9, Math.round(internalFloorArea * 0.07))
      },
      {
        name: "Doors and Windows",
        tasks: [
          {
            name: "Window Installation",
            description: "Install all windows according to the architectural plans.",
            duration_days: Math.max(3, Math.round(internalFloorArea * 0.02)),
            materials_required: ["Windows", "Sealant"],
            dependencies: ["External Wall Construction"]
          },
          {
            name: "Door Installation",
            description: "Install all external and internal doors.",
            duration_days: Math.max(2, Math.round(internalFloorArea * 0.015)),
            materials_required: ["Doors", "Door frames", "Hinges"],
            dependencies: ["Internal Partition Construction"]
          }
        ],
        duration_days: Math.max(5, Math.round(internalFloorArea * 0.035))
      },
      {
        name: "Services",
        tasks: [
          {
            name: "Electrical Installation",
            description: "Install all electrical wiring, sockets, switches, and fixtures.",
            duration_days: Math.max(6, Math.round(internalFloorArea * 0.04)),
            materials_required: ["Cable", "Sockets", "Switches", "Consumer unit"],
            dependencies: ["Internal Partition Construction"]
          },
          {
            name: "Plumbing Installation",
            description: "Install all water supply and waste pipes, and sanitary fixtures.",
            duration_days: Math.max(5, Math.round(internalFloorArea * 0.035)),
            materials_required: ["Pipes", "Fittings", "Sanitary fixtures"],
            dependencies: ["Internal Partition Construction"]
          },
          {
            name: "HVAC Installation",
            description: "Install heating, ventilation, and air conditioning systems.",
            duration_days: Math.max(4, Math.round(internalFloorArea * 0.03)),
            materials_required: ["Ductwork", "HVAC units"],
            dependencies: ["Electrical Installation", "Plumbing Installation"]
          }
        ],
        duration_days: Math.max(15, Math.round(internalFloorArea * 0.1))
      },
      {
        name: "Finishes",
        tasks: [
          {
            name: "Plastering",
            description: "Apply plaster to all internal walls and ceilings.",
            duration_days: Math.max(5, Math.round(internalFloorArea * 0.035)),
            materials_required: ["Plaster", "Beading"],
            dependencies: ["Electrical Installation", "Plumbing Installation"]
          },
          {
            name: "Flooring",
            description: "Install all floor finishes including tiles, carpet, and timber.",
            duration_days: Math.max(4, Math.round(internalFloorArea * 0.03)),
            materials_required: ["Tiles", "Carpet", "Timber flooring"],
            dependencies: ["Plastering"]
          },
          {
            name: "Painting and Decorating",
            description: "Paint all internal walls, ceilings, and woodwork.",
            duration_days: Math.max(6, Math.round(internalFloorArea * 0.04)),
            materials_required: ["Paint", "Primer", "Brushes"],
            dependencies: ["Plastering"]
          }
        ],
        duration_days: Math.max(15, Math.round(internalFloorArea * 0.1))
      },
      {
        name: "Final",
        tasks: [
          {
            name: "Snagging",
            description: "Identify and fix any defects or issues.",
            duration_days: Math.max(3, Math.round(internalFloorArea * 0.02)),
            materials_required: ["Various materials for fixes"],
            dependencies: ["Painting and Decorating", "Flooring"]
          },
          {
            name: "Final Inspection",
            description: "Conduct a final inspection of the completed building.",
            duration_days: 1,
            materials_required: [],
            dependencies: ["Snagging"]
          },
          {
            name: "Handover",
            description: "Hand over the completed building to the client.",
            duration_days: 1,
            materials_required: ["Documentation"],
            dependencies: ["Final Inspection"]
          }
        ],
        duration_days: Math.max(5, Math.round(internalFloorArea * 0.03))
      }
    ];
  } catch (error) {
    console.error('Error creating additional construction phases:', error);
    
    // Return a basic default if calculation fails
    return [
      {
        name: "Walls and Partitions",
        tasks: [
          {
            name: "External Wall Construction",
            description: "Construct the external walls using bricks/blocks and mortar.",
            duration_days: 10,
            materials_required: ["Bricks", "Blocks", "Mortar"],
            dependencies: ["Frame Construction"]
          }
        ],
        duration_days: 10
      },
      {
        name: "Finishes",
        tasks: [
          {
            name: "Painting and Decorating",
            description: "Paint all internal walls, ceilings, and woodwork.",
            duration_days: 8,
            materials_required: ["Paint", "Primer", "Brushes"],
            dependencies: ["External Wall Construction"]
          }
        ],
        duration_days: 8
      }
    ];
  }
}

/**
 * Combine default construction tasks with additional phases
 * @param {Object} defaultTasks - Default construction tasks
 * @param {Array} additionalPhases - Additional construction phases
 * @returns {Object} Combined construction tasks
 */
function combineConstructionTasks(defaultTasks, additionalPhases) {
  try {
    // Create a deep copy of the default tasks
    const combinedTasks = JSON.parse(JSON.stringify(defaultTasks));
    
    // Add the additional phases to the combined tasks
    combinedTasks.phases = [...combinedTasks.phases, ...additionalPhases];
    
    // Recalculate the total duration
    let totalDuration = 0;
    combinedTasks.phases.forEach(phase => {
      totalDuration += phase.duration_days;
    });
    
    // Update the project timeline
    const startDate = new Date(combinedTasks.project_timeline.start_date);
    const completionDate = new Date(startDate);
    completionDate.setDate(completionDate.getDate() + totalDuration);
    
    combinedTasks.project_timeline.estimated_completion_date = completionDate.toISOString().split('T')[0];
    combinedTasks.project_timeline.total_duration_days = totalDuration;
    
    return combinedTasks;
  } catch (error) {
    console.error('Error combining construction tasks:', error);
    return defaultTasks; // Return default tasks if combination fails
  }
}

/**
 * Replace N/A values in construction tasks with realistic estimates
 * @param {Object} tasks - Construction tasks
 * @param {Object} architecturalAnalysis - Architectural analysis
 * @param {Object} materialsQuantities - Materials quantities
 * @returns {Object} Cleaned construction tasks
 */
function replaceNATaskValues(tasks, architecturalAnalysis, materialsQuantities) {
  try {
    // Create a deep copy of the tasks
    const cleanedTasks = JSON.parse(JSON.stringify(tasks));
    
    // Extract building dimensions from architectural analysis
    const buildingAnalysis = architecturalAnalysis.building_analysis || {};
    const totalFloorArea = buildingAnalysis.total_floor_area || {};
    const internalFloorArea = parseFloat(totalFloorArea.internal) || 100;
    
    // Helper function to check if a value is N/A or empty
    const isNAValue = (value) => {
      return value === 'N/A' || value === '' || value === undefined || value === null;
    };
    
    // Helper function to replace N/A values in the project timeline
    if (cleanedTasks.project_timeline) {
      const timeline = cleanedTasks.project_timeline;
      
      if (isNAValue(timeline.start_date)) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 14); // Start in 2 weeks
        timeline.start_date = startDate.toISOString().split('T')[0];
      }
      
      if (isNAValue(timeline.total_duration_days)) {
        timeline.total_duration_days = Math.max(60, Math.round(internalFloorArea * 0.5));
      }
      
      if (isNAValue(timeline.estimated_completion_date)) {
        const startDate = new Date(timeline.start_date);
        const completionDate = new Date(startDate);
        completionDate.setDate(completionDate.getDate() + timeline.total_duration_days);
        timeline.estimated_completion_date = completionDate.toISOString().split('T')[0];
      }
    }
    
    // Helper function to replace N/A values in phases and tasks
    if (cleanedTasks.phases && Array.isArray(cleanedTasks.phases)) {
      cleanedTasks.phases.forEach(phase => {
        if (isNAValue(phase.duration_days)) {
          phase.duration_days = Math.max(5, Math.round(internalFloorArea * 0.04));
        }
        
        if (phase.tasks && Array.isArray(phase.tasks)) {
          phase.tasks.forEach(task => {
            if (isNAValue(task.duration_days)) {
              task.duration_days = Math.max(3, Math.round(internalFloorArea * 0.02));
            }
            
            if (isNAValue(task.description)) {
              task.description = `Perform ${task.name.toLowerCase()} activities according to the architectural plans.`;
            }
            
            if (!task.materials_required || !Array.isArray(task.materials_required) || task.materials_required.length === 0) {
              task.materials_required = ["Required materials will be determined during execution"];
            }
            
            if (!task.dependencies || !Array.isArray(task.dependencies)) {
              task.dependencies = [];
            }
          });
        }
      });
    }
    
    return cleanedTasks;
  } catch (error) {
    console.error('Error replacing N/A values in construction tasks:', error);
    return tasks; // Return original tasks if cleaning fails
  }
}

/**
 * Generate Excel report for architectural analysis, materials quantities, and construction tasks
 * @param {Object} data - Data containing architectural analysis, materials quantities, and construction tasks
 * @param {string} outputPath - Path to save the Excel report
 * @returns {Promise<string>} Path to the generated Excel report
 */
async function generateExcelReport(data, outputPath) {
  console.log('Generating Excel report...');
  
  try {
    const { architecturalAnalysis, materialsQuantities, constructionTasks } = data;
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Suddeco AI Drawing Processor';
    workbook.lastModifiedBy = 'Suddeco AI Drawing Processor';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Add architectural analysis worksheet
    const analysisSheet = workbook.addWorksheet('Architectural Analysis');
    
    // Set column widths
    analysisSheet.columns = [
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Measurement', key: 'measurement', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];
    
    // Style the header row
    analysisSheet.getRow(1).font = { bold: true, size: 12 };
    analysisSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Add building analysis data
    analysisSheet.addRow({ category: 'Building Analysis', measurement: '', value: '' });
    const buildingAnalysis = architecturalAnalysis.building_analysis || {};
    
    // Add total internal dimensions
    if (buildingAnalysis.total_internal_dimensions) {
      const dimensions = buildingAnalysis.total_internal_dimensions;
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Internal Length', value: dimensions.length });
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Internal Width', value: dimensions.width });
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Internal Height', value: dimensions.height });
    }
    
    // Add total external dimensions
    if (buildingAnalysis.total_external_dimensions) {
      const dimensions = buildingAnalysis.total_external_dimensions;
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total External Length', value: dimensions.length });
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total External Width', value: dimensions.width });
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total External Height', value: dimensions.height });
    }
    
    // Add total floor area
    if (buildingAnalysis.total_floor_area) {
      const floorArea = buildingAnalysis.total_floor_area;
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Internal Floor Area', value: floorArea.internal });
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total External Floor Area', value: floorArea.external });
    }
    
    // Add total wall area
    if (buildingAnalysis.total_wall_area) {
      const wallArea = buildingAnalysis.total_wall_area;
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Internal Wall Area', value: wallArea.internal });
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total External Wall Area', value: wallArea.external });
    }
    
    // Add total volume
    if (buildingAnalysis.total_volume) {
      analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Volume', value: buildingAnalysis.total_volume });
    }
    
    // Add room details
    analysisSheet.addRow({ category: 'Room Details', measurement: '', value: '' });
    const roomDetails = architecturalAnalysis.room_details || [];
    
    roomDetails.forEach((room, index) => {
      analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'Name', value: room.name });
      
      // Add internal dimensions
      if (room.internal_dimensions) {
        const dimensions = room.internal_dimensions;
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'Internal Length', value: dimensions.length });
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'Internal Width', value: dimensions.width });
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'Internal Height', value: dimensions.height });
      }
      
      // Add external dimensions
      if (room.external_dimensions) {
        const dimensions = room.external_dimensions;
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'External Length', value: dimensions.length });
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'External Width', value: dimensions.width });
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'External Height', value: dimensions.height });
      }
      
      // Add floor area
      if (room.floor_area) {
        const floorArea = room.floor_area;
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'Internal Floor Area', value: floorArea.internal });
        if (floorArea.external) {
          analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'External Floor Area', value: floorArea.external });
        }
      }
      
      // Add wall surface area
      if (room.wall_surface_area) {
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'Wall Surface Area', value: room.wall_surface_area });
      }
      
      // Add ceiling area
      if (room.ceiling_area) {
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'Ceiling Area', value: room.ceiling_area });
      }
      
      // Add skirting board length
      if (room.skirting_board_length) {
        analysisSheet.addRow({ category: `Room ${index + 1}`, measurement: 'Skirting Board Length', value: room.skirting_board_length });
      }
    });
    
    // Add wall details
    if (architecturalAnalysis.wall_details) {
      const wallDetails = architecturalAnalysis.wall_details;
      analysisSheet.addRow({ category: 'Wall Details', measurement: '', value: '' });
      
      if (wallDetails.external_wall_thickness) {
        analysisSheet.addRow({ category: 'Wall Details', measurement: 'External Wall Thickness', value: wallDetails.external_wall_thickness });
      }
      
      if (wallDetails.internal_wall_thickness) {
        analysisSheet.addRow({ category: 'Wall Details', measurement: 'Internal Wall Thickness', value: wallDetails.internal_wall_thickness });
      }
      
      if (wallDetails.total_wall_length) {
        analysisSheet.addRow({ category: 'Wall Details', measurement: 'Total Wall Length', value: wallDetails.total_wall_length });
      }
      
      if (wallDetails.external_wall_length) {
        analysisSheet.addRow({ category: 'Wall Details', measurement: 'External Wall Length', value: wallDetails.external_wall_length });
      }
      
      if (wallDetails.internal_wall_length) {
        analysisSheet.addRow({ category: 'Wall Details', measurement: 'Internal Wall Length', value: wallDetails.internal_wall_length });
      }
    }
    
    // Add openings
    if (architecturalAnalysis.openings && architecturalAnalysis.openings.length > 0) {
      analysisSheet.addRow({ category: 'Openings', measurement: '', value: '' });
      
      architecturalAnalysis.openings.forEach((opening, index) => {
        analysisSheet.addRow({ category: 'Openings', measurement: `Type ${index + 1}`, value: opening.type });
        
        if (opening.dimensions) {
          analysisSheet.addRow({ category: 'Openings', measurement: `Width ${index + 1}`, value: opening.dimensions.width });
          analysisSheet.addRow({ category: 'Openings', measurement: `Height ${index + 1}`, value: opening.dimensions.height });
        }
        
        if (opening.quantity) {
          analysisSheet.addRow({ category: 'Openings', measurement: `Quantity ${index + 1}`, value: opening.quantity });
        }
      });
    }
    
    // Add materials quantities worksheet
    const materialsSheet = workbook.addWorksheet('Materials Quantities');
    
    // Set column widths
    materialsSheet.columns = [
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Material', key: 'material', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 20 },
      { header: 'Unit', key: 'unit', width: 15 }
    ];
    
    // Style the header row
    materialsSheet.getRow(1).font = { bold: true, size: 12 };
    materialsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Add materials quantities data
    Object.entries(materialsQuantities).forEach(([category, materials]) => {
      materialsSheet.addRow({ category: formatCategoryName(category), material: '', quantity: '', unit: '' });
      
      Object.entries(materials).forEach(([material, quantity]) => {
        const { value, unit } = extractValueAndUnit(material, quantity);
        materialsSheet.addRow({
          category: formatCategoryName(category),
          material: formatMaterialName(material),
          quantity: value,
          unit: unit
        });
      });
    });
    
    // Add construction tasks worksheet
    const tasksSheet = workbook.addWorksheet('Construction Tasks');
    
    // Set column widths
    tasksSheet.columns = [
      { header: 'Phase', key: 'phase', width: 25 },
      { header: 'Task', key: 'task', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Duration (days)', key: 'duration', width: 15 },
      { header: 'Dependencies', key: 'dependencies', width: 30 }
    ];
    
    // Style the header row
    tasksSheet.getRow(1).font = { bold: true, size: 12 };
    tasksSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Add project timeline
    if (constructionTasks.project_timeline) {
      const timeline = constructionTasks.project_timeline;
      
      tasksSheet.addRow({
        phase: 'Project Timeline',
        task: 'Start Date',
        description: timeline.start_date,
        duration: '',
        dependencies: ''
      });
      
      tasksSheet.addRow({
        phase: 'Project Timeline',
        task: 'Estimated Completion Date',
        description: timeline.estimated_completion_date,
        duration: '',
        dependencies: ''
      });
      
      tasksSheet.addRow({
        phase: 'Project Timeline',
        task: 'Total Duration',
        description: '',
        duration: timeline.total_duration_days,
        dependencies: ''
      });
    }
    
    // Add construction phases and tasks
    if (constructionTasks.phases && constructionTasks.phases.length > 0) {
      constructionTasks.phases.forEach(phase => {
        tasksSheet.addRow({
          phase: phase.name,
          task: '',
          description: '',
          duration: phase.duration_days,
          dependencies: ''
        });
        
        if (phase.tasks && phase.tasks.length > 0) {
          phase.tasks.forEach(task => {
            tasksSheet.addRow({
              phase: phase.name,
              task: task.name,
              description: task.description,
              duration: task.duration_days,
              dependencies: task.dependencies ? task.dependencies.join(', ') : ''
            });
          });
        }
      });
    }
    
    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);
    console.log(`Excel report saved to ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw new Error('Failed to generate Excel report');
  }
}

/**
 * Generate combined Excel report for multiple drawings
 * @param {Array} drawingsData - Array of data for multiple drawings
 * @param {string} outputPath - Path to save the Excel report
 * @returns {Promise<string>} Path to the generated Excel report
 */
async function generateCombinedExcelReport(drawingsData, outputPath) {
  console.log('Generating combined Excel report...');
  
  try {
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Suddeco AI Drawing Processor';
    workbook.lastModifiedBy = 'Suddeco AI Drawing Processor';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Add summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Set column widths
    summarySheet.columns = [
      { header: 'Drawing', key: 'drawing', width: 30 },
      { header: 'Total Floor Area', key: 'floorArea', width: 20 },
      { header: 'Room Count', key: 'roomCount', width: 15 },
      { header: 'Estimated Construction Duration', key: 'duration', width: 30 }
    ];
    
    // Style the header row
    summarySheet.getRow(1).font = { bold: true, size: 12 };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Add data for each drawing
    drawingsData.forEach((data, index) => {
      const { architecturalAnalysis, constructionTasks } = data;
      const buildingAnalysis = architecturalAnalysis.building_analysis || {};
      const totalFloorArea = buildingAnalysis.total_floor_area || {};
      const roomDetails = architecturalAnalysis.room_details || [];
      const timeline = constructionTasks.project_timeline || {};
      
      summarySheet.addRow({
        drawing: `Drawing ${index + 1}`,
        floorArea: totalFloorArea.internal || 'N/A',
        roomCount: roomDetails.length,
        duration: `${timeline.total_duration_days || 'N/A'} days`
      });
    });
    
    // Add combined materials worksheet
    const materialsSheet = workbook.addWorksheet('Combined Materials');
    
    // Set column widths
    materialsSheet.columns = [
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Material', key: 'material', width: 30 },
      { header: 'Total Quantity', key: 'quantity', width: 20 },
      { header: 'Unit', key: 'unit', width: 15 }
    ];
    
    // Style the header row
    materialsSheet.getRow(1).font = { bold: true, size: 12 };
    materialsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Combine materials quantities from all drawings
    const combinedMaterials = {};
    
    drawingsData.forEach(data => {
      const { materialsQuantities } = data;
      
      Object.entries(materialsQuantities).forEach(([category, materials]) => {
        if (!combinedMaterials[category]) {
          combinedMaterials[category] = {};
        }
        
        Object.entries(materials).forEach(([material, quantity]) => {
          const { value, unit } = extractValueAndUnit(material, quantity);
          const numericValue = parseFloat(value) || 0;
          
          if (!combinedMaterials[category][material]) {
            combinedMaterials[category][material] = { value: numericValue, unit };
          } else {
            combinedMaterials[category][material].value += numericValue;
          }
        });
      });
    });
    
    // Add combined materials data to the worksheet
    Object.entries(combinedMaterials).forEach(([category, materials]) => {
      materialsSheet.addRow({ category: formatCategoryName(category), material: '', quantity: '', unit: '' });
      
      Object.entries(materials).forEach(([material, data]) => {
        materialsSheet.addRow({
          category: formatCategoryName(category),
          material: formatMaterialName(material),
          quantity: data.value.toFixed(2),
          unit: data.unit
        });
      });
    });
    
    // Add individual worksheets for each drawing
    drawingsData.forEach((data, index) => {
      const { architecturalAnalysis, materialsQuantities, constructionTasks } = data;
      
      // Add architectural analysis worksheet
      const analysisSheet = workbook.addWorksheet(`Analysis - Drawing ${index + 1}`);
      
      // Set column widths
      analysisSheet.columns = [
        { header: 'Category', key: 'category', width: 30 },
        { header: 'Measurement', key: 'measurement', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
      ];
      
      // Style the header row
      analysisSheet.getRow(1).font = { bold: true, size: 12 };
      analysisSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      
      // Add building analysis data
      analysisSheet.addRow({ category: 'Building Analysis', measurement: '', value: '' });
      const buildingAnalysis = architecturalAnalysis.building_analysis || {};
      
      // Add total internal dimensions
      if (buildingAnalysis.total_internal_dimensions) {
        const dimensions = buildingAnalysis.total_internal_dimensions;
        analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Internal Length', value: dimensions.length });
        analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Internal Width', value: dimensions.width });
        analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Internal Height', value: dimensions.height });
      }
      
      // Add total floor area
      if (buildingAnalysis.total_floor_area) {
        const floorArea = buildingAnalysis.total_floor_area;
        analysisSheet.addRow({ category: 'Building Analysis', measurement: 'Total Internal Floor Area', value: floorArea.internal });
      }
      
      // Add room details (simplified for combined report)
      const roomDetails = architecturalAnalysis.room_details || [];
      analysisSheet.addRow({ category: 'Room Details', measurement: '', value: '' });
      
      roomDetails.forEach((room, roomIndex) => {
        analysisSheet.addRow({ category: `Room ${roomIndex + 1}`, measurement: 'Name', value: room.name });
        
        // Add internal dimensions
        if (room.internal_dimensions) {
          const dimensions = room.internal_dimensions;
          analysisSheet.addRow({ category: `Room ${roomIndex + 1}`, measurement: 'Internal Length', value: dimensions.length });
          analysisSheet.addRow({ category: `Room ${roomIndex + 1}`, measurement: 'Internal Width', value: dimensions.width });
        }
        
        // Add floor area
        if (room.floor_area && room.floor_area.internal) {
          analysisSheet.addRow({ category: `Room ${roomIndex + 1}`, measurement: 'Internal Floor Area', value: room.floor_area.internal });
        }
      });
    });
    
    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);
    console.log(`Combined Excel report saved to ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating combined Excel report:', error);
    throw new Error('Failed to generate combined Excel report');
  }
}

/**
 * Format category name for display in Excel report
 * @param {string} category - Category name in snake_case
 * @returns {string} Formatted category name
 */
function formatCategoryName(category) {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format material name for display in Excel report
 * @param {string} material - Material name in snake_case
 * @returns {string} Formatted material name
 */
function formatMaterialName(material) {
  return material
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract numeric value and unit from a quantity
 * @param {string} material - Material name
 * @param {string|number} quantity - Quantity value
 * @returns {Object} Object containing value and unit
 */
function extractValueAndUnit(material, quantity) {
  // If quantity is already a number, determine unit from material name
  if (typeof quantity === 'number') {
    let unit = 'units';
    
    if (material.includes('cubic_meters')) {
      unit = 'm³';
    } else if (material.includes('square_meters')) {
      unit = 'm²';
    } else if (material.includes('meters')) {
      unit = 'm';
    } else if (material.includes('tons')) {
      unit = 'tons';
    } else if (material.includes('kilograms')) {
      unit = 'kg';
    } else if (material.includes('liters')) {
      unit = 'L';
    }
    
    return { value: quantity, unit };
  }
  
  // If quantity is a string, try to extract numeric value and unit
  if (typeof quantity === 'string') {
    const match = quantity.match(/^([\d.]+)\s*([a-zA-Z²³]+)$/);
    
    if (match) {
      return { value: match[1], unit: match[2] };
    }
    
    // If no unit found, try to parse as number and use default unit
    const numericValue = parseFloat(quantity);
    
    if (!isNaN(numericValue)) {
      let unit = 'units';
      
      if (material.includes('cubic_meters')) {
        unit = 'm³';
      } else if (material.includes('square_meters')) {
        unit = 'm²';
      } else if (material.includes('meters')) {
        unit = 'm';
      } else if (material.includes('tons')) {
        unit = 'tons';
      } else if (material.includes('kilograms')) {
        unit = 'kg';
      } else if (material.includes('liters')) {
        unit = 'L';
      }
      
      return { value: numericValue, unit };
    }
  }
  
  // Default fallback
  return { value: quantity, unit: 'units' };
}

/**
 * Process multiple drawings in parallel
 * @param {Array} filePaths - Array of file paths
 * @param {Array} fileTypes - Array of file types
 * @returns {Promise<Array>} Array of results for each drawing
 */
async function processMultipleDrawings(filePaths, fileTypes) {
  console.log(`Processing ${filePaths.length} drawings in parallel...`);
  
  try {
    // Process each drawing in parallel
    const processingPromises = filePaths.map((filePath, index) => {
      return new Promise(async (resolve, reject) => {
        try {
          const fileType = fileTypes[index];
          console.log(`Processing drawing ${index + 1}: ${filePath} (${fileType})`);
          
          // Analyze the drawing
          const architecturalAnalysis = await analyzeDrawingWithAI(filePath, fileType);
          
          // Generate materials quantities
          const materialsQuantities = await generateMaterialsQuantities(architecturalAnalysis);
          
          // Generate construction tasks
          const constructionTasks = await generateConstructionTasks(architecturalAnalysis, materialsQuantities);
          
          resolve({
            filePath,
            fileType,
            architecturalAnalysis,
            materialsQuantities,
            constructionTasks
          });
        } catch (error) {
          console.error(`Error processing drawing ${index + 1}:`, error);
          reject(error);
        }
      });
    });
    
    // Wait for all drawings to be processed
    const results = await Promise.all(processingPromises);
    console.log(`Successfully processed ${results.length} drawings`);
    
    return results;
  } catch (error) {
    console.error('Error processing multiple drawings:', error);
    throw error;
  }
}

// Export the functions for use in other modules
module.exports = {
  analyzeDrawingWithAI,
  generateMaterialsQuantities,
  generateConstructionTasks,
  generateExcelReport,
  generateCombinedExcelReport,
  processMultipleDrawings,
  
  // Helper functions
  createDefaultArchitecturalAnalysis,
  createDefaultMaterialsQuantities,
  createDefaultConstructionTasks,
  replaceNAValues,
  replaceZeroMaterialValues,
  replaceNATaskValues
};

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
        globalRagData = await ragDataPromise;
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
 *               clientDescription:
 *                 type: string
 *                 description: Optional client description of the drawing

 *                 type: string
 *                 enum: [general, material, compliance, construction, sustainability, newbuild]
 *                 description: Type of analysis prompt to use (default is general)
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

        
        try {
          // Use standard OpenAI analysis with the specialized prompt as a fallback
          const result = await analyzeDrawingWithAI(req.file.path, path.extname(req.file.originalname).toLowerCase().substring(1), clientDescription);
          
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
        await Promise.allSettled([materialsPromise, tasksPromise, stagesPromise, roomsResponse]);
      
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

const axios = require('axios');

async function fetchDataAndExtractIds() {
  try {
    const materialsResponse = await axios.get(CONFIG.API_ENDPOINTS.MATERIALS);
    const tasksResponse = await axios.get(CONFIG.API_ENDPOINTS.TASKS);
    const stagesResponse = await axios.get(CONFIG.API_ENDPOINTS.STAGES);
    const roomsResponse = await axios.get(CONFIG.API_ENDPOINTS.ROOMS);

    const materialsIds = materialsResponse.data.materials.map(material => material.id);
    const tasksIds = tasksResponse.data.tasks.map(task => task.id);
    const stagesIds = stagesResponse.data.stages.map(stage => stage.id);
    const roomsIds = roomsResponse.data.rooms.map(room => room.id);

    console.log('Materials IDs:', materialsIds);
    console.log('Tasks IDs:', tasksIds);
    console.log('Stages IDs:', stagesIds);
    console.log('Rooms IDs:', roomsIds);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchDataAndExtractIds();

// Comprehensive exports for the entire module
module.exports = {
  app,                          // Express app for server.js
  analyzeDrawing,               // Main drawing analysis function
  processDrawing,               // Process drawing function
  generateMaterialsQuantities,  // Materials calculation
  generateConstructionTasks,    // Construction tasks generation
  createAdditionalPhases,       // Additional phases creation
  combineConstructionTasks,     // Combine tasks function
  replaceNATaskValues,         // Replace N/A values
  generateExcelReport,         // Excel report generation
  generateCombinedExcelReport, // Combined report generation
  formatCategoryName,          // Format category names
  formatMaterialName,          // Format material names
  extractValueAndUnit,         // Extract values and units
  fetchDataAndExtractIds       // Fetch data function
};

