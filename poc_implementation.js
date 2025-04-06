// Suddeco AI Agent - POC Implementation
// This file demonstrates a basic Node.js implementation for the drawing processing agent

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');
const PDFParser = require('pdf-parse');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');

// Initialize Express app
const app = express();
const port = 3000;

// Configure OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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'
});

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and PNG files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload endpoint
app.post('/upload', upload.single('drawing'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    // Process the file based on its type
    let extractedData;
    if (fileExt === '.pdf') {
      extractedData = await processPdfDrawing(filePath);
    } else if (fileExt === '.png') {
      extractedData = await processPngDrawing(filePath);
    }

    // Generate project description
    const projectDescription = await generateProjectDescription(extractedData);
    
    // Identify stages, tasks, and materials
    const projectElements = await identifyProjectElements(extractedData);
    
    // Generate output files
    const outputFiles = await generateOutputFiles(extractedData, projectElements);
    
    res.json({
      success: true,
      fileName: req.file.originalname,
      projectDescription,
      measurements: extractedData.measurements,
      elements: projectElements,
      outputFiles
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process PDF drawing
async function processPdfDrawing(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await PDFParser(dataBuffer);
    
    // Extract text content from PDF
    const textContent = pdfData.text;
    
    // Use OpenAI to analyze the drawing
    const analysis = await analyzeDrawingWithAI(textContent, 'pdf');
    
    return {
      type: 'pdf',
      content: textContent,
      pageCount: pdfData.numpages,
      measurements: analysis.measurements,
      annotations: analysis.annotations,
      scale: analysis.scale
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF drawing');
  }
}

// Process PNG drawing
async function processPngDrawing(filePath) {
  try {
    // For PNG, we would normally use OCR to extract text
    // For this POC, we'll simulate by using OpenAI's vision capabilities
    
    // Convert image to base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Use OpenAI to analyze the drawing
    const analysis = await analyzeDrawingWithAI(base64Image, 'png');
    
    return {
      type: 'png',
      measurements: analysis.measurements,
      annotations: analysis.annotations,
      scale: analysis.scale
    };
  } catch (error) {
    console.error('Error processing PNG:', error);
    throw new Error('Failed to process PNG drawing');
  }
}

// Analyze drawing with OpenAI
async function analyzeDrawingWithAI(content, type) {
  try {
    let response;
    
    if (type === 'pdf') {
      // For PDF text content
      response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are an AI specialized in analyzing architectural drawings. Extract all measurements, room annotations, and determine the scale of the drawing. Provide the data in a structured JSON format."
          },
          {
            role: "user",
            content: `Analyze this architectural drawing text content and extract all measurements, annotations, and scale information: ${content}`
          }
        ],
        response_format: { type: "json_object" }
      });
    } else if (type === 'png') {
      // For PNG images
      response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "You are an AI specialized in analyzing architectural drawings. Extract all measurements, room annotations, and determine the scale of the drawing. Provide the data in a structured JSON format."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this architectural drawing and extract all measurements, annotations, and scale information:" },
              { type: "image_url", image_url: { url: `data:image/png;base64,${content}` } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });
    }
    
    // Parse the response
    const analysisResult = JSON.parse(response.choices[0].message.content);
    
    return {
      measurements: analysisResult.measurements || [],
      annotations: analysisResult.annotations || [],
      scale: analysisResult.scale || "1:100" // Default scale if not detected
    };
  } catch (error) {
    console.error('Error analyzing drawing with AI:', error);
    throw new Error('Failed to analyze drawing with AI');
  }
}

// Generate project description
async function generateProjectDescription(extractedData) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI specialized in architectural projects. Generate a comprehensive project description based on the extracted data from architectural drawings."
        },
        {
          role: "user",
          content: `Generate a project description based on these extracted measurements and annotations: ${JSON.stringify(extractedData)}`
        }
      ]
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating project description:', error);
    throw new Error('Failed to generate project description');
  }
}

// Identify project elements (stages, tasks, materials)
async function identifyProjectElements(extractedData) {
  try {
    // Load reference data from CSV files
    const tasks = await loadReferenceData('tasks.csv');
    const materials = await loadReferenceData('materials.csv');
    const stages = await loadReferenceData('stages.csv');
    
    // Use OpenAI to map extracted data to tasks, materials, and stages
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI specialized in construction project planning. Map the extracted data from architectural drawings to appropriate construction stages, tasks, and materials."
        },
        {
          role: "user",
          content: `Map these extracted measurements and annotations to appropriate construction stages, tasks, and materials: ${JSON.stringify(extractedData)}. Use the following reference data: Tasks: ${JSON.stringify(tasks)}, Materials: ${JSON.stringify(materials)}, Stages: ${JSON.stringify(stages)}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const elementsResult = JSON.parse(response.choices[0].message.content);
    
    return {
      stages: elementsResult.stages || [],
      tasks: elementsResult.tasks || [],
      materials: elementsResult.materials || []
    };
  } catch (error) {
    console.error('Error identifying project elements:', error);
    throw new Error('Failed to identify project elements');
  }
}

// Load reference data from CSV
async function loadReferenceData(fileName) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    // Check if file exists, if not return empty array
    if (!fs.existsSync(path.join(__dirname, 'data', fileName))) {
      return resolve([]);
    }
    
    fs.createReadStream(path.join(__dirname, 'data', fileName))
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Generate output files (CSV, JSON, Excel)
async function generateOutputFiles(extractedData, projectElements) {
  const outputDir = path.join(__dirname, 'outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = Date.now();
  const outputFiles = {
    csv: `measurements_${timestamp}.csv`,
    json: `project_data_${timestamp}.json`,
    excel: `project_report_${timestamp}.xlsx`
  };
  
  // Generate CSV
  await generateCsvOutput(
    path.join(outputDir, outputFiles.csv),
    extractedData.measurements
  );
  
  // Generate JSON
  await generateJsonOutput(
    path.join(outputDir, outputFiles.json),
    { extractedData, projectElements }
  );
  
  // Generate Excel
  await generateExcelOutput(
    path.join(outputDir, outputFiles.excel),
    extractedData,
    projectElements
  );
  
  return outputFiles;
}

// Generate CSV output
async function generateCsvOutput(filePath, measurements) {
  const csvWriter = createCsvWriter({
    path: filePath,
    header: [
      { id: 'room', title: 'Room' },
      { id: 'dimension', title: 'Dimension' },
      { id: 'value', title: 'Value' },
      { id: 'unit', title: 'Unit' },
      { id: 'area', title: 'Area (m²)' }
    ]
  });
  
  await csvWriter.writeRecords(measurements);
}

// Generate JSON output
async function generateJsonOutput(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Generate Excel output
async function generateExcelOutput(filePath, extractedData, projectElements) {
  const workbook = new ExcelJS.Workbook();
  
  // Measurements sheet
  const measurementsSheet = workbook.addWorksheet('Measurements');
  measurementsSheet.columns = [
    { header: 'Room', key: 'room' },
    { header: 'Dimension', key: 'dimension' },
    { header: 'Value', key: 'value' },
    { header: 'Unit', key: 'unit' },
    { header: 'Area (m²)', key: 'area' }
  ];
  measurementsSheet.addRows(extractedData.measurements);
  
  // Tasks sheet
  const tasksSheet = workbook.addWorksheet('Tasks');
  tasksSheet.columns = [
    { header: 'Task ID', key: 'id' },
    { header: 'Task Name', key: 'name' },
    { header: 'Stage', key: 'stage' },
    { header: 'Quantity', key: 'quantity' },
    { header: 'Unit', key: 'unit' },
    { header: 'Labor Hours', key: 'laborHours' },
    { header: 'Material Cost', key: 'materialCost' }
  ];
  tasksSheet.addRows(projectElements.tasks);
  
  // Materials sheet
  const materialsSheet = workbook.addWorksheet('Materials');
  materialsSheet.columns = [
    { header: 'Material ID', key: 'id' },
    { header: 'Material Name', key: 'name' },
    { header: 'Quantity', key: 'quantity' },
    { header: 'Unit', key: 'unit' },
    { header: 'Cost per Unit', key: 'costPerUnit' },
    { header: 'Total Cost', key: 'totalCost' }
  ];
  materialsSheet.addRows(projectElements.materials);
  
  // Project Summary sheet
  const summarySheet = workbook.addWorksheet('Project Summary');
  summarySheet.columns = [
    { header: 'Item', key: 'item' },
    { header: 'Value', key: 'value' }
  ];
  
  // Add summary data
  const summaryData = [
    { item: 'Project Scale', value: extractedData.scale },
    { item: 'Total Rooms', value: new Set(extractedData.measurements.map(m => m.room)).size },
    { item: 'Total Tasks', value: projectElements.tasks.length },
    { item: 'Total Materials', value: projectElements.materials.length },
    { item: 'Total Stages', value: projectElements.stages.length }
  ];
  summarySheet.addRows(summaryData);
  
  await workbook.xlsx.writeFile(filePath);
}

// Start the server
app.listen(port, () => {
  console.log(`Suddeco AI Agent POC server running at http://localhost:${port}`);
});
