// Suddeco Schema API Implementation
// This file implements the enhanced API endpoints for the Suddeco AI Drawing Processor
// Handling project data, elements, stages, tasks, and materials

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { openai } = require('./openai-client');
const ragModule = require('./rag-module');
const enhancedSystemPrompt = require('./enhanced_system_prompt');
const vectorDb = require('./vector-db');

// Configure file upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only PDF and PNG files
    if (file.mimetype === 'application/pdf' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and PNG files are allowed'));
    }
  }
});

// In-memory database for demo purposes
// In production, this would be replaced with a real database
const db = {
  projects: [],
  elements: [],
  projectRooms: [],
  nextIds: {
    project: 1,
    element: 1,
    projectRoom: 1
  }
};

// Generate a unique Suddeco ID
function generateSuddecoId(prefix, baseId) {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `suddeco_${prefix}_${baseId}_${timestamp}_${randomStr}`;
}

// Initialize vector database if environment variables are set
if (process.env.ASTRA_DB_TOKEN && process.env.ASTRA_DB_ENDPOINT) {
  vectorDb.initialize({
    enabled: true,
    astraToken: process.env.ASTRA_DB_TOKEN,
    astraEndpoint: process.env.ASTRA_DB_ENDPOINT,
    astraCollection: process.env.ASTRA_DB_COLLECTION || 'suddeco_drawings'
  });
  console.log('Vector database integration enabled');
} else {
  console.log('Vector database integration disabled (missing credentials)');
}

// Load mock data if available
try {
  if (fs.existsSync(path.join(__dirname, 'mock_data', 'db.json'))) {
    const dbData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mock_data', 'db.json'), 'utf8'));
    Object.assign(db, dbData);
    console.log('Loaded mock database data');
  }
} catch (error) {
  console.error('Error loading mock database:', error.message);
}

// Save database state periodically
setInterval(() => {
  try {
    if (!fs.existsSync(path.join(__dirname, 'mock_data'))) {
      fs.mkdirSync(path.join(__dirname, 'mock_data'), { recursive: true });
    }
    fs.writeFileSync(
      path.join(__dirname, 'mock_data', 'db.json'), 
      JSON.stringify(db, null, 2)
    );
    console.log('Database state saved');
  } catch (error) {
    console.error('Error saving database state:', error.message);
  }
}, 60000); // Save every minute

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve a list of all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: A list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
router.get('/projects', (req, res) => {
  res.json(db.projects);
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     description: Retrieve a project by its ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: A project object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 */
router.get('/projects/:id', (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = db.projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  // Enhance project with related data
  const enhancedProject = {
    ...project,
    Elements: db.elements.filter(e => e.projectId === projectId),
    ProjectRooms: db.projectRooms.filter(r => r.projectId === projectId)
  };
  
  res.json(enhancedProject);
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project with the provided data
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       201:
 *         description: The created project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid input
 */
router.post('/projects', (req, res) => {
  const projectData = req.body;
  
  // Validate required fields
  if (!projectData.name || !projectData.address) {
    return res.status(400).json({ error: 'Name and address are required' });
  }
  
  // Create new project with defaults for missing fields
  const numericId = db.nextIds.project++;
  const uniqueId = generateSuddecoId('proj', numericId);
  
  const newProject = {
    id: numericId,
    suddecoId: uniqueId,
    name: projectData.name,
    description: projectData.description || '',
    status: projectData.status || 'on_going',
    location: projectData.location || null,
    address: projectData.address,
    zipCode: projectData.zipCode || '',
    city: projectData.city || '',
    state: projectData.state || '',
    region: projectData.region || '',
    projectType: projectData.projectType || null,
    specification: projectData.specification || '',
    totalCost: projectData.totalCost || '0',
    startDate: projectData.startDate || new Date().toISOString(),
    endDate: projectData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    duration: projectData.duration || null,
    lat: projectData.lat || null,
    lng: projectData.lng || null,
    averageWorkers: projectData.averageWorkers || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdFrom: projectData.createdFrom || 'system@suddeco.com',
    createdFor: projectData.createdFor || 'client@example.com',
    updatedFrom: null,
    labourMargin: projectData.labourMargin || 0,
    materialMargin: projectData.materialMargin || 0
  };
  
  db.projects.push(newProject);
  
  res.status(201).json(newProject);
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     description: Update a project with the provided data
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     responses:
 *       200:
 *         description: The updated project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 */
router.put('/projects/:id', (req, res) => {
  const projectId = parseInt(req.params.id);
  const projectIndex = db.projects.findIndex(p => p.id === projectId);
  
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const projectData = req.body;
  const updatedProject = {
    ...db.projects[projectIndex],
    ...projectData,
    updatedAt: new Date().toISOString(),
    updatedFrom: projectData.updatedFrom || 'system@suddeco.com'
  };
  
  db.projects[projectIndex] = updatedProject;
  
  res.json(updatedProject);
});

/**
 * @swagger
 * /api/projects/{id}/elements:
 *   get:
 *     summary: Get elements for a project
 *     description: Retrieve all elements for a specific project
 *     tags: [Elements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: A list of elements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Element'
 *       404:
 *         description: Project not found
 */
router.get('/projects/:id/elements', (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = db.projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const elements = db.elements.filter(e => e.projectId === projectId);
  res.json(elements);
});

/**
 * @swagger
 * /api/projects/{id}/elements:
 *   post:
 *     summary: Create a new element for a project
 *     description: Create a new element for a specific project
 *     tags: [Elements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ElementInput'
 *     responses:
 *       201:
 *         description: The created element
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Element'
 *       404:
 *         description: Project not found
 */
router.post('/projects/:id/elements', (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = db.projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const elementData = req.body;
  
  // Validate required fields
  if (!elementData.roomId || !elementData.stageId || !elementData.taskId || !elementData.materialId) {
    return res.status(400).json({ error: 'roomId, stageId, taskId, and materialId are required' });
  }
  
  const elementNumericId = db.nextIds.element++;
  const elementUniqueId = generateSuddecoId('elem', elementNumericId);
  
  const newElement = {
    elementId: elementNumericId,
    suddecoId: elementUniqueId,
    projectId: projectId,
    roomId: elementData.roomId,
    stageId: elementData.stageId,
    taskId: elementData.taskId,
    materialId: elementData.materialId,
    qty: elementData.qty || 0,
    margin: elementData.margin || null,
    materialCost: elementData.materialCost || 0,
    labourCost: elementData.labourCost || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.elements.push(newElement);
  
  res.status(201).json(newElement);
});

/**
 * @swagger
 * /api/projects/{id}/rooms:
 *   get:
 *     summary: Get rooms for a project
 *     description: Retrieve all rooms for a specific project
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: A list of project rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectRoom'
 *       404:
 *         description: Project not found
 */
router.get('/projects/:id/rooms', (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = db.projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const rooms = db.projectRooms.filter(r => r.projectId === projectId);
  res.json(rooms);
});

/**
 * @swagger
 * /api/projects/{id}/rooms:
 *   post:
 *     summary: Create a new room for a project
 *     description: Create a new room for a specific project
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectRoomInput'
 *     responses:
 *       201:
 *         description: The created room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectRoom'
 *       404:
 *         description: Project not found
 */
router.post('/projects/:id/rooms', (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = db.projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const roomData = req.body;
  
  // Validate required fields
  if (!roomData.name || !roomData.roomId) {
    return res.status(400).json({ error: 'Name and roomId are required' });
  }
  
  const roomNumericId = db.nextIds.projectRoom++;
  const roomUniqueId = generateSuddecoId('room', roomNumericId);
  
  const newRoom = {
    id: roomNumericId,
    suddecoId: roomUniqueId,
    name: roomData.name,
    description: roomData.description || '',
    width: roomData.width || 0,
    height: roomData.height || 0,
    deepth: roomData.deepth || 0, // Note: "depth" is misspelled as "deepth" in the schema
    projectId: projectId,
    roomId: roomData.roomId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.projectRooms.push(newRoom);
  
  res.status(201).json(newRoom);
});

/**
 * @swagger
 * /api/drawings/upload:
 *   post:
 *     summary: Upload and analyze a drawing
 *     description: Upload an architectural drawing for analysis
 *     tags: [Drawings]
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
 *               projectId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Drawing analysis results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 analysis:
 *                   type: object
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/drawings/upload', upload.single('drawing'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No drawing file uploaded' });
    }
    
    // Check if projectId is provided
    const projectId = req.body.projectId ? parseInt(req.body.projectId) : null;
    if (projectId) {
      const project = db.projects.find(p => p.id === projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }
    
    // Get file info
    const fileInfo = {
      filename: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      type: path.extname(req.file.originalname).toLowerCase().substring(1)
    };
    
    console.log(`Processing drawing: ${fileInfo.filename} (${fileInfo.size} bytes)`);
    
    // Load RAG data for context
    let globalRagData;
    try {
      globalRagData = await ragModule.fetchAllApiData();
    } catch (error) {
      console.error('Error fetching RAG data:', error.message);
      globalRagData = {
        materials: { materials: [] },
        tasks: { tasks: [] },
        stages: { stages: [] },
        rooms: { rooms: [] }
      };
    }
    
    // Generate RAG context
    const ragContext = ragModule.generateContextString(globalRagData);
    
    // Extract text from the file
    let extractedText = '';
    if (fileInfo.type === 'pdf') {
      const PDFParser = require('pdf-parse');
      const fileBuffer = fs.readFileSync(req.file.path);
      const data = await PDFParser(fileBuffer);
      extractedText = data.text;
    } else if (fileInfo.type === 'png') {
      extractedText = `[PNG Image - text extraction not supported]`;
    }
    
    // Call OpenAI with RAG-enhanced prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: enhancedSystemPrompt
        },
        {
          role: "user",
          content: `Analyze this architectural drawing with the help of the provided context information. Extract all measurements, identify rooms, stages, tasks, and materials following construction industry standards. Provide a detailed analysis with quantities.\n\n${ragContext}\n\nDrawing Content:\n${extractedText}`
        }
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });
    
    // Safely parse the JSON response
    const responseContent = response.choices[0].message.content;
    let analysisResult;
    
    try {
      // Check if response is HTML
      if (ragModule.isHtmlResponse && ragModule.isHtmlResponse(responseContent)) {
        console.error('Received HTML instead of JSON from OpenAI');
        throw new Error('Invalid response format (HTML received)');
      }
      
      // Try to parse the JSON
      analysisResult = ragModule.safeJsonParse(responseContent, {});
    } catch (parseError) {
      console.error('Error parsing analysis result:', parseError.message);
      console.error('Response content:', responseContent.substring(0, 200) + '...');
      analysisResult = {};
    }
    
    // Generate timestamp for output files
    const timestamp = Date.now();
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save the result to a file
    const outputPath = path.join(outputDir, `drawing_analysis_${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
    
    // Store in vector database if enabled
    let vectorDbId = null;
    try {
      vectorDbId = await vectorDb.storeDrawingAnalysis(fileInfo, analysisResult);
      if (vectorDbId) {
        console.log(`Drawing analysis stored in vector database with ID: ${vectorDbId}`);
      }
    } catch (vectorDbError) {
      console.error('Error storing in vector database:', vectorDbError.message);
    }
    
    // If projectId is provided, create project elements and rooms based on analysis
    if (projectId && analysisResult.rooms) {
      // Create rooms
      for (const room of analysisResult.rooms) {
        const roomNumericId = db.nextIds.projectRoom++;
        const roomUniqueId = generateSuddecoId('room', roomNumericId);
        
        const newRoom = {
          id: roomNumericId,
          suddecoId: roomUniqueId,
          name: room.name,
          description: room.description || '',
          width: room.width || 0,
          height: room.height || 0,
          deepth: room.depth || 0,
          projectId: projectId,
          roomId: room.roomId || 1, // Default room ID if not provided
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        db.projectRooms.push(newRoom);
      }
      
      // Create elements
      if (analysisResult.elements) {
        for (const element of analysisResult.elements) {
          const elementNumericId = db.nextIds.element++;
          const elementUniqueId = generateSuddecoId('elem', elementNumericId);
          
          const newElement = {
            elementId: elementNumericId,
            suddecoId: elementUniqueId,
            projectId: projectId,
            roomId: element.roomId || 1,
            stageId: element.stageId || 1,
            taskId: element.taskId || 1,
            materialId: element.materialId || 1,
            qty: element.quantity || 0,
            margin: element.margin || null,
            materialCost: element.materialCost || 0,
            labourCost: element.labourCost || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          db.elements.push(newElement);
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Drawing processed successfully',
      fileInfo,
      analysis: analysisResult,
      outputPath: `/output/drawing_analysis_${timestamp}.json`,
      vectorDbId: vectorDbId
    });
  } catch (error) {
    console.error('Error processing drawing:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error processing drawing',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/stages:
 *   get:
 *     summary: Get all stages
 *     description: Retrieve a list of all construction stages
 *     tags: [Stages]
 *     responses:
 *       200:
 *         description: A list of stages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stage'
 */
router.get('/stages', async (req, res) => {
  try {
    // Get stages from RAG module
    const ragData = await ragModule.fetchApiData('stages');
    
    // Format the response to match the expected schema
    const stages = ragData.stages || [];
    
    // Add missing fields if necessary
    const formattedStages = stages.map(stage => ({
      id: stage.id || stage.stageId || 0,
      stageId: stage.stageId || stage.id || 0,
      stage: stage.stage || stage.name || 'Unknown Stage',
      priority: stage.priority || 0,
      createdAt: stage.createdAt || null,
      updatedAt: stage.updatedAt || null
    }));
    
    res.json(formattedStages);
  } catch (error) {
    console.error('Error fetching stages:', error.message);
    res.status(500).json({ error: 'Error fetching stages', details: error.message });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve a list of all construction tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: A list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.get('/tasks', async (req, res) => {
  try {
    // Get tasks from RAG module
    const ragData = await ragModule.fetchApiData('tasks');
    
    // Format the response to match the expected schema
    const tasks = ragData.tasks || [];
    
    // Add missing fields if necessary
    const formattedTasks = tasks.map(task => ({
      id: task.id || task.taskId || 0,
      taskId: task.taskId || task.id || 0,
      task: task.task || task.name || 'Unknown Task',
      roomArea: task.roomArea || [],
      unitId: task.unitId || 0,
      unit: task.unit || 'unit',
      unitPlural: task.unitPlural || 'units',
      ratio: task.ratio || '1:1',
      action: task.action || '',
      elementId: task.elementId || 0,
      stage: task.stage || '',
      stageId: task.stageId || 0,
      cssElementId: task.cssElementId || 0,
      cssElement: task.cssElement || '',
      type: task.type || '',
      otherStage: task.otherStage || false,
      displayName: task.displayName || task.task || 'Unknown Task'
    }));
    
    res.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ error: 'Error fetching tasks', details: error.message });
  }
});

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: Get all materials
 *     description: Retrieve a list of all construction materials
 *     tags: [Materials]
 *     responses:
 *       200:
 *         description: A list of materials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/materials', async (req, res) => {
  try {
    // Get materials from RAG module
    const ragData = await ragModule.fetchApiData('materials');
    
    // Format the response to match the expected schema
    const materials = ragData.materials || [];
    
    // Add missing fields if necessary
    const formattedMaterials = materials.map(material => ({
      id: material.id || material.materialId || 0,
      supplier: material.supplier || '',
      sku: material.sku || '',
      name: material.name || 'Unknown Material',
      price: material.price || '0',
      category1: material.category1 || '',
      category2: material.category2 || '',
      category3: material.category3 || '',
      category4: material.category4 || '',
      category5: material.category5 || null,
      photo_url: material.photo_url || '',
      photo_url2: material.photo_url2 || null,
      product_url: material.product_url || '',
      unit: material.unit || 'unit',
      time_per_unit: material.time_per_unit || '',
      labour_type: material.labour_type || '',
      scope: material.scope || '',
      area: material.area || null,
      margin: material.margin || null,
      email: material.email || '',
      materialId: material.materialId || material.id || 0,
      createdAt: material.createdAt || null,
      updatedAt: material.updatedAt || null
    }));
    
    res.json(formattedMaterials);
  } catch (error) {
    console.error('Error fetching materials:', error.message);
    res.status(500).json({ error: 'Error fetching materials', details: error.message });
  }
});

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all room types
 *     description: Retrieve a list of all room types
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: A list of room types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
router.get('/rooms', async (req, res) => {
  try {
    // Get rooms from RAG module
    const ragData = await ragModule.fetchApiData('rooms');
    
    // Format the response to match the expected schema
    const rooms = ragData.rooms || [];
    
    // Add missing fields if necessary
    const formattedRooms = rooms.map(room => ({
      id: room.id || room.roomId || 0,
      scopeId: room.scopeId || 0,
      name: room.name || 'Unknown Room',
      type: room.type || '',
      icon: room.icon || '',
      description: room.description || '',
      popularity: room.popularity || 0,
      createdAt: room.createdAt || new Date().toISOString(),
      updatedAt: room.updatedAt || new Date().toISOString()
    }));
    
    res.json(formattedRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error.message);
    res.status(500).json({ error: 'Error fetching rooms', details: error.message });
  }
});

/**
 * @swagger
 * /api/materials/search:
 *   get:
 *     summary: Search for materials
 *     description: Search for materials based on task ID and query
 *     tags: [Materials]
 *     parameters:
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: integer
 *         description: Task ID to filter materials
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: A list of materials
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/drawings/search:
 *   get:
 *     summary: Search for similar drawings
 *     description: Search for drawings with similar characteristics using vector similarity
 *     tags: [Drawings]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query describing the drawing characteristics
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: A list of similar drawings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 query:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.get('/materials/search', async (req, res) => {
  try {
    const taskId = req.query.taskId ? parseInt(req.query.taskId) : null;
    const query = req.query.q || '';
    
    // Get materials from RAG module
    const ragData = await ragModule.fetchApiData('materials');
    let materials = ragData.materials || [];
    
    // Filter by task ID if provided
    if (taskId) {
      materials = materials.filter(m => {
        // This is a simplistic approach - in a real system, you'd have a proper mapping
        // between tasks and materials
        return m.taskId === taskId || m.scope === 'all';
      });
    }
    
    // Filter by search query if provided
    if (query) {
      const lowerQuery = query.toLowerCase();
      materials = materials.filter(m => {
        return (
          m.name.toLowerCase().includes(lowerQuery) ||
          m.category1.toLowerCase().includes(lowerQuery) ||
          m.category2.toLowerCase().includes(lowerQuery) ||
          m.supplier.toLowerCase().includes(lowerQuery)
        );
      });
    }
    
    res.json(materials);
  } catch (error) {
    console.error('Error searching materials:', error.message);
    res.status(500).json({ error: 'Error searching materials', details: error.message });
  }
});

/**
 * @swagger
 * /api/tasks/search:
 *   get:
 *     summary: Search for tasks
 *     description: Search for tasks based on stage ID and query
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: stageId
 *         schema:
 *           type: integer
 *         description: Stage ID to filter tasks
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: A list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.get('/tasks/search', async (req, res) => {
  try {
    const stageId = req.query.stageId ? parseInt(req.query.stageId) : null;
    const query = req.query.q || '';
    
    // Get tasks from RAG module
    const ragData = await ragModule.fetchApiData('tasks');
    let tasks = ragData.tasks || [];
    
    // Filter by stage ID if provided
    if (stageId) {
      tasks = tasks.filter(t => t.stageId === stageId);
    }
    
    // Filter by search query if provided
    if (query) {
      const lowerQuery = query.toLowerCase();
      tasks = tasks.filter(t => {
        return (
          t.task.toLowerCase().includes(lowerQuery) ||
          t.displayName.toLowerCase().includes(lowerQuery) ||
          t.stage.toLowerCase().includes(lowerQuery)
        );
      });
    }
    
    res.json(tasks);
  } catch (error) {
    console.error('Error searching tasks:', error.message);
    res.status(500).json({ error: 'Error searching tasks', details: error.message });
  }
});

/**
 * Search for similar drawings using vector database
 */
router.get('/drawings/search', async (req, res) => {
  try {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 5;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query is required' 
      });
    }
    
    // Search for similar drawings using vector database
    const results = await vectorDb.searchSimilarDrawings(query, limit);
    
    res.json({
      success: true,
      query,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching for similar drawings:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Error searching for drawings', 
      details: error.message 
    });
  }
});

module.exports = router;
