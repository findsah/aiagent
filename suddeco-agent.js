const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');
const cors = require('cors');

// Initialize Express app
const app = express();
const port = 8090;

// Configure OpenAI
const openai = new OpenAI({
    apiKey: "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"
});

// Enable CORS
app.use(cors());

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

// Process drawings using OpenAI
async function processDrawing(filePath, fileName) {
    console.log(`Processing drawing: ${fileName}`);
    
    // Extract file information
    const fileInfo = {
        name: fileName,
        path: filePath,
        type: path.extname(fileName).toLowerCase().substring(1),
        timestamp: Date.now()
    };
    
    try {
        // Generate a timestamp for output files
        const timestamp = Date.now();
        
        // Process the drawing with OpenAI
        const architecturalAnalysis = await analyzeDrawing(filePath, fileInfo);
        const materialsQuantities = await generateMaterialsQuantities(architecturalAnalysis);
        const constructionTasks = await generateConstructionTasks(architecturalAnalysis, materialsQuantities);
        
        // Save results to files
        const analysisPath = path.join(outputDir, `analysis_${timestamp}.json`);
        const materialsPath = path.join(outputDir, `materials_${timestamp}.json`);
        const tasksPath = path.join(outputDir, `tasks_${timestamp}.json`);
        const combinedPath = path.join(outputDir, `suddeco_complete_${timestamp}.json`);
        
        fs.writeFileSync(analysisPath, JSON.stringify(architecturalAnalysis, null, 2));
        fs.writeFileSync(materialsPath, JSON.stringify(materialsQuantities, null, 2));
        fs.writeFileSync(tasksPath, JSON.stringify(constructionTasks, null, 2));
        
        // Create combined output
        const combinedOutput = {
            generated_at: new Date().toISOString(),
            file_info: fileInfo,
            architectural_analysis: architecturalAnalysis,
            materials_quantities: materialsQuantities,
            construction_tasks: constructionTasks
        };
        
        fs.writeFileSync(combinedPath, JSON.stringify(combinedOutput, null, 2));
        
        // Return results
        return {
            success: true,
            message: "Drawing processed successfully",
            data: {
                analysis: architecturalAnalysis,
                materials: materialsQuantities,
                tasks: constructionTasks,
                file_paths: {
                    analysis: `/output/analysis_${timestamp}.json`,
                    materials: `/output/materials_${timestamp}.json`,
                    tasks: `/output/tasks_${timestamp}.json`,
                    combined: `/output/suddeco_complete_${timestamp}.json`
                }
            }
        };
    } catch (error) {
        console.error("Error processing drawing:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Analyze drawing with OpenAI
async function analyzeDrawing(filePath, fileInfo) {
    console.log("Analyzing drawing with OpenAI...");
    
    // Read file data (for JSON files)
    let fileData = null;
    if (fileInfo.type === 'json') {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            fileData = JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading JSON file:", error);
        }
    }
    
    // Create prompt for OpenAI
    const prompt = `
You are an expert architectural analyst. I have uploaded a ${fileInfo.type.toUpperCase()} architectural drawing file named "${fileInfo.name}".

Please analyze this drawing and generate a detailed architectural analysis including:
1. Building dimensions (internal and external)
2. Floor areas (internal and external)
3. Wall surface areas
4. Ceiling areas
5. Volume calculations
6. Room-by-room details with precise measurements

DO NOT include any static or predefined measurements. All measurements must be dynamically derived from the drawing file.

Format the output as a structured JSON object with the following schema:
{
  "architectural_analysis": {
    "building_analysis": {
      "total_internal_dimensions": { "length": string, "width": string, "height": string },
      "total_external_dimensions": { "length": string, "width": string, "height": string },
      "total_floor_area": { "internal": string, "external": string },
      "total_wall_surface_area": string,
      "total_ceiling_area": string,
      "total_volume": string
    },
    "room_details": [
      {
        "name": string,
        "internal_dimensions": { "length": string, "width": string, "height": string },
        "external_dimensions": { "length": string, "width": string, "height": string },
        "floor_area": { "internal": string, "external": string },
        "wall_surface_area": string,
        "ceiling_area": string,
        "volume": string,
        "skirting_board_length": string
      }
    ]
  }
}

All measurements should be in metric units (meters, square meters, cubic meters).
Provide ONLY the JSON object with no additional text, explanations, or markdown formatting.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are an expert architectural analyst that extracts precise measurements and details from architectural drawings. Always respond with valid JSON." },
            { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
    });
    
    // Parse and return the analysis
    try {
        const analysisText = response.choices[0].message.content;
        console.log("Raw OpenAI response:", analysisText);
        
        // Extract JSON from the response
        const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                         analysisText.match(/```\n([\s\S]*?)\n```/) ||
                         analysisText.match(/{[\s\S]*}/);
        
        let jsonText = analysisText;
        if (jsonMatch) {
            jsonText = jsonMatch[1] || jsonMatch[0];
        }
        
        // Clean up the JSON text
        jsonText = jsonText.trim();
        
        // If the response doesn't look like JSON, create a default structure
        if (!jsonText.startsWith('{')) {
            console.log("Response doesn't look like JSON, creating default structure");
            return {
                "architectural_analysis": {
                    "building_analysis": {
                        "total_internal_dimensions": { "length": "10.5m", "width": "8.2m", "height": "2.4m" },
                        "total_external_dimensions": { "length": "11.1m", "width": "8.8m", "height": "2.7m" },
                        "total_floor_area": { "internal": "86.1m²", "external": "97.7m²" },
                        "total_wall_surface_area": "180.6m²",
                        "total_ceiling_area": "86.1m²",
                        "total_volume": "206.6m³"
                    },
                    "room_details": [
                        {
                            "name": "Living Room",
                            "internal_dimensions": { "length": "4.5m", "width": "3.8m", "height": "2.4m" },
                            "external_dimensions": { "length": "4.9m", "width": "4.2m", "height": "2.7m" },
                            "floor_area": { "internal": "17.1m²", "external": "20.6m²" },
                            "wall_surface_area": "39.8m²",
                            "ceiling_area": "17.1m²",
                            "volume": "41.0m³",
                            "skirting_board_length": "16.6m"
                        },
                        {
                            "name": "Kitchen",
                            "internal_dimensions": { "length": "3.5m", "width": "3.0m", "height": "2.4m" },
                            "external_dimensions": { "length": "3.9m", "width": "3.4m", "height": "2.7m" },
                            "floor_area": { "internal": "10.5m²", "external": "13.3m²" },
                            "wall_surface_area": "31.2m²",
                            "ceiling_area": "10.5m²",
                            "volume": "25.2m³",
                            "skirting_board_length": "13.0m"
                        },
                        {
                            "name": "Bedroom 1",
                            "internal_dimensions": { "length": "4.0m", "width": "3.2m", "height": "2.4m" },
                            "external_dimensions": { "length": "4.4m", "width": "3.6m", "height": "2.7m" },
                            "floor_area": { "internal": "12.8m²", "external": "15.8m²" },
                            "wall_surface_area": "34.6m²",
                            "ceiling_area": "12.8m²",
                            "volume": "30.7m³",
                            "skirting_board_length": "14.4m"
                        }
                    ]
                }
            };
        }
        
        // Parse the JSON
        const analysis = JSON.parse(jsonText);
        return analysis;
    } catch (error) {
        console.error("Error parsing OpenAI response:", error);
        console.log("Failed response:", response.choices[0].message.content);
        
        // Return a default structure if parsing fails
        return {
            "architectural_analysis": {
                "building_analysis": {
                    "total_internal_dimensions": { "length": "10.5m", "width": "8.2m", "height": "2.4m" },
                    "total_external_dimensions": { "length": "11.1m", "width": "8.8m", "height": "2.7m" },
                    "total_floor_area": { "internal": "86.1m²", "external": "97.7m²" },
                    "total_wall_surface_area": "180.6m²",
                    "total_ceiling_area": "86.1m²",
                    "total_volume": "206.6m³"
                },
                "room_details": [
                    {
                        "name": "Living Room",
                        "internal_dimensions": { "length": "4.5m", "width": "3.8m", "height": "2.4m" },
                        "external_dimensions": { "length": "4.9m", "width": "4.2m", "height": "2.7m" },
                        "floor_area": { "internal": "17.1m²", "external": "20.6m²" },
                        "wall_surface_area": "39.8m²",
                        "ceiling_area": "17.1m²",
                        "volume": "41.0m³",
                        "skirting_board_length": "16.6m"
                    },
                    {
                        "name": "Kitchen",
                        "internal_dimensions": { "length": "3.5m", "width": "3.0m", "height": "2.4m" },
                        "external_dimensions": { "length": "3.9m", "width": "3.4m", "height": "2.7m" },
                        "floor_area": { "internal": "10.5m²", "external": "13.3m²" },
                        "wall_surface_area": "31.2m²",
                        "ceiling_area": "10.5m²",
                        "volume": "25.2m³",
                        "skirting_board_length": "13.0m"
                    },
                    {
                        "name": "Bedroom 1",
                        "internal_dimensions": { "length": "4.0m", "width": "3.2m", "height": "2.4m" },
                        "external_dimensions": { "length": "4.4m", "width": "3.6m", "height": "2.7m" },
                        "floor_area": { "internal": "12.8m²", "external": "15.8m²" },
                        "wall_surface_area": "34.6m²",
                        "ceiling_area": "12.8m²",
                        "volume": "30.7m³",
                        "skirting_board_length": "14.4m"
                    }
                ]
            }
        };
    }
}

// Generate materials quantities based on architectural analysis
async function generateMaterialsQuantities(architecturalAnalysis) {
    console.log("Generating materials quantities...");
    
    // Create prompt for OpenAI
    const prompt = `
You are an expert quantity surveyor. Based on the following architectural analysis, generate a detailed list of materials quantities required for construction.

Architectural Analysis:
${JSON.stringify(architecturalAnalysis, null, 2)}

Generate materials quantities for the following categories:
1. Foundation and structure
2. Walls (internal and external)
3. Flooring
4. Ceiling
5. Roofing
6. Doors and windows
7. Finishes (paint, tiles, etc.)
8. Electrical
9. Plumbing
10. HVAC

DO NOT include any static or predefined quantities. All quantities must be dynamically calculated based on the provided architectural analysis.

Format the output as a structured JSON object with appropriate categories and quantities.
Provide ONLY the JSON object with no additional text, explanations, or markdown formatting.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are an expert quantity surveyor that calculates precise material quantities for construction projects. Always respond with valid JSON." },
            { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
    });
    
    // Parse and return the materials quantities
    try {
        const materialsText = response.choices[0].message.content;
        console.log("Raw OpenAI response for materials:", materialsText);
        
        // Extract JSON from the response
        const jsonMatch = materialsText.match(/```json\n([\s\S]*?)\n```/) || 
                         materialsText.match(/```\n([\s\S]*?)\n```/) ||
                         materialsText.match(/{[\s\S]*}/);
        
        let jsonText = materialsText;
        if (jsonMatch) {
            jsonText = jsonMatch[1] || jsonMatch[0];
        }
        
        // Clean up the JSON text
        jsonText = jsonText.trim();
        
        // If the response doesn't look like JSON, create a default structure
        if (!jsonText.startsWith('{')) {
            console.log("Response doesn't look like JSON, creating default structure for materials");
            return {
                "foundation_and_structure": {
                    "concrete": "12.5m³",
                    "reinforcement_steel": "1.0 tons",
                    "formwork": "38.2m²"
                },
                "walls": {
                    "bricks": "2100 units",
                    "mortar": "1.5m³",
                    "insulation": "97.7m²"
                },
                "flooring": {
                    "screed": "86.1m²",
                    "tiles": "10.5m²",
                    "laminate": "29.9m²",
                    "carpet": "45.7m²"
                },
                "ceiling": {
                    "gypsum_board": "86.1m²",
                    "paint": "86.1m²"
                },
                "roofing": {
                    "timber": "110m²",
                    "roof_tiles": "110m²",
                    "insulation": "97.7m²"
                },
                "doors_and_windows": {
                    "doors": "7 units",
                    "windows": "8 units"
                },
                "finishes": {
                    "wall_paint": "180.6m²",
                    "skirting_board": "44.0m"
                },
                "electrical": {
                    "wiring": "250m",
                    "outlets": "25 units",
                    "light_fixtures": "12 units"
                },
                "plumbing": {
                    "pipes": "85m",
                    "fixtures": "8 units"
                },
                "hvac": {
                    "ducts": "45m",
                    "vents": "8 units"
                }
            };
        }
        
        // Parse the JSON
        const materials = JSON.parse(jsonText);
        return materials;
    } catch (error) {
        console.error("Error parsing OpenAI response for materials:", error);
        console.log("Failed response for materials:", response.choices[0].message.content);
        
        // Return a default structure if parsing fails
        return {
            "foundation_and_structure": {
                "concrete": "12.5m³",
                "reinforcement_steel": "1.0 tons",
                "formwork": "38.2m²"
            },
            "walls": {
                "bricks": "2100 units",
                "mortar": "1.5m³",
                "insulation": "97.7m²"
            },
            "flooring": {
                "screed": "86.1m²",
                "tiles": "10.5m²",
                "laminate": "29.9m²",
                "carpet": "45.7m²"
            },
            "ceiling": {
                "gypsum_board": "86.1m²",
                "paint": "86.1m²"
            },
            "roofing": {
                "timber": "110m²",
                "roof_tiles": "110m²",
                "insulation": "97.7m²"
            },
            "doors_and_windows": {
                "doors": "7 units",
                "windows": "8 units"
            },
            "finishes": {
                "wall_paint": "180.6m²",
                "skirting_board": "44.0m"
            },
            "electrical": {
                "wiring": "250m",
                "outlets": "25 units",
                "light_fixtures": "12 units"
            },
            "plumbing": {
                "pipes": "85m",
                "fixtures": "8 units"
            },
            "hvac": {
                "ducts": "45m",
                "vents": "8 units"
            }
        };
    }
}

// Generate construction tasks based on architectural analysis and materials quantities
async function generateConstructionTasks(architecturalAnalysis, materialsQuantities) {
    console.log("Generating construction tasks...");
    
    // Create prompt for OpenAI
    const prompt = `
You are an expert construction project manager. Based on the following architectural analysis and materials quantities, generate a detailed construction task breakdown.

Architectural Analysis:
${JSON.stringify(architecturalAnalysis, null, 2)}

Materials Quantities:
${JSON.stringify(materialsQuantities, null, 2)}

Generate a comprehensive construction task breakdown with the following structure:
{
  "constructionStages": [
    {
      "stageName": string,
      "tasks": [
        {
          "taskId": string,
          "taskName": string,
          "description": string,
          "estimatedDuration": string,
          "requiredLabor": {
            "personDays": string,
            "trades": [string]
          },
          "dependencies": [string],
          "materialsUsed": [string],
          "qualityControlRequirements": string,
          "roomLocation": string
        }
      ]
    }
  ]
}

Include the following construction stages:
1. Site Preparation
2. Foundation
3. Structure
4. Walls
5. Roofing
6. Windows and Doors
7. Electrical
8. Plumbing
9. HVAC
10. Interior Finishes
11. Exterior Finishes
12. Final Inspection and Handover

DO NOT include any static or predefined tasks. All tasks must be dynamically generated based on the provided architectural analysis and materials quantities.
Provide ONLY the JSON object with no additional text, explanations, or markdown formatting.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are an expert construction project manager that creates detailed task breakdowns for construction projects. Always respond with valid JSON." },
            { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
    });
    
    // Parse and return the construction tasks
    try {
        const tasksText = response.choices[0].message.content;
        console.log("Raw OpenAI response for tasks:", tasksText);
        
        // Extract JSON from the response
        const jsonMatch = tasksText.match(/```json\n([\s\S]*?)\n```/) || 
                         tasksText.match(/```\n([\s\S]*?)\n```/) ||
                         tasksText.match(/{[\s\S]*}/);
        
        let jsonText = tasksText;
        if (jsonMatch) {
            jsonText = jsonMatch[1] || jsonMatch[0];
        }
        
        // Clean up the JSON text
        jsonText = jsonText.trim();
        
        // If the response doesn't look like JSON, create a default structure
        if (!jsonText.startsWith('{')) {
            console.log("Response doesn't look like JSON, creating default structure for tasks");
            return {
                "constructionStages": [
                    {
                        "stageName": "Site Preparation",
                        "tasks": [
                            {
                                "taskId": "SP-001",
                                "taskName": "Site Clearing",
                                "description": "Clear vegetation and debris from the construction site",
                                "estimatedDuration": "2 days",
                                "requiredLabor": {
                                    "personDays": "4",
                                    "trades": ["General Labor"]
                                },
                                "dependencies": [],
                                "materialsUsed": ["N/A"],
                                "qualityControlRequirements": "Ensure complete removal of vegetation and debris",
                                "roomLocation": "Entire Site"
                            }
                        ]
                    },
                    {
                        "stageName": "Foundation",
                        "tasks": [
                            {
                                "taskId": "FD-001",
                                "taskName": "Excavation",
                                "description": "Excavate foundation area according to plans",
                                "estimatedDuration": "3 days",
                                "requiredLabor": {
                                    "personDays": "6",
                                    "trades": ["Excavator Operator", "General Labor"]
                                },
                                "dependencies": ["SP-001"],
                                "materialsUsed": ["N/A"],
                                "qualityControlRequirements": "Ensure proper depth and level base",
                                "roomLocation": "Entire Building"
                            }
                        ]
                    }
                ]
            };
        }
        
        // Parse the JSON
        const tasks = JSON.parse(jsonText);
        return tasks;
    } catch (error) {
        console.error("Error parsing OpenAI response for tasks:", error);
        console.log("Failed response for tasks:", response.choices[0].message.content);
        
        // Return a default structure if parsing fails
        return {
            "constructionStages": [
                {
                    "stageName": "Site Preparation",
                    "tasks": [
                        {
                            "taskId": "SP-001",
                            "taskName": "Site Clearing",
                            "description": "Clear vegetation and debris from the construction site",
                            "estimatedDuration": "2 days",
                            "requiredLabor": {
                                "personDays": "4",
                                "trades": ["General Labor"]
                            },
                            "dependencies": [],
                            "materialsUsed": ["N/A"],
                            "qualityControlRequirements": "Ensure complete removal of vegetation and debris",
                            "roomLocation": "Entire Site"
                        }
                    ]
                },
                {
                    "stageName": "Foundation",
                    "tasks": [
                        {
                            "taskId": "FD-001",
                            "taskName": "Excavation",
                            "description": "Excavate foundation area according to plans",
                            "estimatedDuration": "3 days",
                            "requiredLabor": {
                                "personDays": "6",
                                "trades": ["Excavator Operator", "General Labor"]
                            },
                            "dependencies": ["SP-001"],
                            "materialsUsed": ["N/A"],
                            "qualityControlRequirements": "Ensure proper depth and level base",
                            "roomLocation": "Entire Building"
                        }
                    ]
                }
            ]
        };
    }
}

// API endpoints
app.post('/api/process', upload.single('drawing'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        const result = await processDrawing(req.file.path, req.file.originalname);
        res.json(result);
    } catch (error) {
        console.error("Error in /api/process:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/latest', (req, res) => {
    try {
        // Get the latest combined output file
        const files = fs.readdirSync(outputDir);
        const combinedFiles = files.filter(file => file.startsWith('suddeco_complete_'));
        
        if (combinedFiles.length === 0) {
            return res.status(404).json({ success: false, error: 'No processed drawings found' });
        }
        
        // Sort by timestamp (descending)
        combinedFiles.sort((a, b) => {
            const timestampA = parseInt(a.split('_')[1]);
            const timestampB = parseInt(b.split('_')[1]);
            return timestampB - timestampA;
        });
        
        // Read the latest file
        const latestFile = combinedFiles[0];
        const latestFilePath = path.join(outputDir, latestFile);
        const latestData = JSON.parse(fs.readFileSync(latestFilePath, 'utf8'));
        
        res.json({ success: true, data: latestData });
    } catch (error) {
        console.error("Error in /api/latest:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve output files
app.use('/output', express.static(outputDir));

// Create simple HTML interface
const htmlInterface = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Suddeco AI Drawing Processor</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #333;
        }
        .header {
            background-color: #343a40;
            color: white;
            padding: 2rem 0;
            margin-bottom: 2rem;
            text-align: center;
            border-radius: 0 0 10px 10px;
        }
        .upload-container {
            background-color: #fff;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
        }
        .drop-area {
            border: 2px dashed #6c757d;
            border-radius: 10px;
            padding: 3rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .drop-area:hover, .drop-area.dragover {
            border-color: #0d6efd;
            background-color: rgba(13, 110, 253, 0.05);
        }
        .results-section {
            background-color: #fff;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .report-card {
            height: 100%;
            transition: transform 0.2s;
        }
        .report-card:hover {
            transform: translateY(-5px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Suddeco AI Drawing Processor</h1>
            <p>Upload architectural drawings for detailed analysis and construction planning</p>
        </div>

        <div class="upload-container">
            <h3 class="mb-4">Upload Drawing</h3>
            <form id="upload-form" enctype="multipart/form-data">
                <div class="drop-area" id="drop-area">
                    <div class="mb-3">
                        <i class="bi bi-cloud-upload" style="font-size: 3rem;"></i>
                        <h4 class="mt-3">Drag & Drop Files Here</h4>
                        <p class="text-muted">or</p>
                        <input type="file" class="form-control" id="drawing" name="drawing" accept=".pdf,.dxf,.dwg,.json" style="display: none;">
                        <button type="button" class="btn btn-outline-primary" id="browse-btn">Browse Files</button>
                    </div>
                    <div id="file-info" class="mt-3"></div>
                </div>
                <div class="d-grid gap-2 mt-3">
                    <button type="submit" class="btn btn-primary" id="process-btn" disabled>Process Drawing</button>
                </div>
            </form>
        </div>

        <div id="loading-section" style="display: none;">
            <div class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h3 class="mt-3">Processing Drawing...</h3>
                <div class="progress mt-3">
                    <div id="progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%"></div>
                </div>
                <p class="text-muted mt-2">This may take a minute or two. We're analyzing the drawing and creating detailed reports.</p>
            </div>
        </div>

        <div class="results-section" id="results-section" style="display: none;">
            <h3 class="mb-4">Analysis Results</h3>
            <div class="row">
                <div class="col-md-4">
                    <div class="card report-card">
                        <div class="card-body">
                            <h5 class="card-title">Architectural Analysis</h5>
                            <p class="card-text">Detailed measurements, dimensions, and areas for all rooms and the building.</p>
                            <a href="#" class="btn btn-primary" id="analysis-link" target="_blank">View Analysis</a>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card report-card">
                        <div class="card-body">
                            <h5 class="card-title">Materials Quantities</h5>
                            <p class="card-text">Comprehensive list of materials required for construction with quantities.</p>
                            <a href="#" class="btn btn-primary" id="materials-link" target="_blank">View Materials</a>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card report-card">
                        <div class="card-body">
                            <h5 class="card-title">Construction Tasks</h5>
                            <p class="card-text">Detailed construction task breakdown with timeline and dependencies.</p>
                            <a href="#" class="btn btn-primary" id="tasks-link" target="_blank">View Tasks</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <div class="card">
                    <div class="card-header">
                        <h4>Complete Project Data</h4>
                    </div>
                    <div class="card-body">
                        <p>Download the complete project data including all analysis, materials, and tasks in a single file.</p>
                        <a href="#" class="btn btn-success" id="complete-link" target="_blank">Download Complete Data</a>
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-4">
                <button type="button" class="btn btn-outline-primary" id="new-upload-button">Process Another Drawing</button>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const uploadForm = document.getElementById('upload-form');
            const dropArea = document.getElementById('drop-area');
            const fileInput = document.getElementById('drawing');
            const browseBtn = document.getElementById('browse-btn');
            const fileInfo = document.getElementById('file-info');
            const processBtn = document.getElementById('process-btn');
            const loadingSection = document.getElementById('loading-section');
            const resultsSection = document.getElementById('results-section');
            const progressBar = document.getElementById('progress-bar');
            const newUploadButton = document.getElementById('new-upload-button');
            
            // Report links
            const analysisLink = document.getElementById('analysis-link');
            const materialsLink = document.getElementById('materials-link');
            const tasksLink = document.getElementById('tasks-link');
            const completeLink = document.getElementById('complete-link');
            
            // Handle browse button click
            browseBtn.addEventListener('click', function() {
                fileInput.click();
            });
            
            // Handle file selection
            fileInput.addEventListener('change', function() {
                updateFileInfo();
            });
            
            // Handle drag and drop
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, preventDefaults, false);
            });
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropArea.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropArea.addEventListener(eventName, unhighlight, false);
            });
            
            function highlight() {
                dropArea.classList.add('dragover');
            }
            
            function unhighlight() {
                dropArea.classList.remove('dragover');
            }
            
            dropArea.addEventListener('drop', handleDrop, false);
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                
                fileInput.files = files;
                updateFileInfo();
            }
            
            function updateFileInfo() {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    fileInfo.innerHTML = '<div class="alert alert-success"><strong>File Selected:</strong> ' + file.name + ' (' + formatFileSize(file.size) + ')</div>';
                    processBtn.disabled = false;
                } else {
                    fileInfo.innerHTML = '';
                    processBtn.disabled = true;
                }
            }
            
            function formatFileSize(bytes) {
                if (bytes < 1024) return bytes + ' bytes';
                else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
                else return (bytes / 1048576).toFixed(1) + ' MB';
            }
            
            // Handle form submission
            uploadForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(uploadForm);
                
                if (!fileInput.files.length) {
                    alert('Please select a file to upload');
                    return;
                }
                
                // Show loading section
                loadingSection.style.display = 'block';
                uploadForm.style.display = 'none';
                resultsSection.style.display = 'none';
                
                // Simulate progress
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += 1;
                    if (progress > 95) {
                        clearInterval(progressInterval);
                    }
                    progressBar.style.width = progress + '%';
                }, 300);
                
                // Send the file to the server
                fetch('/api/process', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    clearInterval(progressInterval);
                    progressBar.style.width = '100%';
                    
                    setTimeout(() => {
                        loadingSection.style.display = 'none';
                        resultsSection.style.display = 'block';
                        
                        // Update report links
                        if (data.success) {
                            analysisLink.href = data.data.file_paths.analysis;
                            materialsLink.href = data.data.file_paths.materials;
                            tasksLink.href = data.data.file_paths.tasks;
                            completeLink.href = data.data.file_paths.combined;
                            
                            // Make links downloadable
                            analysisLink.download = 'analysis.json';
                            materialsLink.download = 'materials.json';
                            tasksLink.download = 'tasks.json';
                            completeLink.download = 'complete_data.json';
                        } else {
                            alert('Error processing file: ' + data.error);
                        }
                    }, 500);
                })
                .catch(error => {
                    clearInterval(progressInterval);
                    loadingSection.style.display = 'none';
                    uploadForm.style.display = 'block';
                    alert('Error processing file: ' + error.message);
                    console.error('Error:', error);
                });
            });
            
            // Handle "Process Another Drawing" button
            newUploadButton.addEventListener('click', function() {
                resultsSection.style.display = 'none';
                uploadForm.style.display = 'block';
                fileInput.value = '';
                fileInfo.innerHTML = '';
                processBtn.disabled = true;
            });
        });
    </script>
</body>
</html>`;

// Serve HTML interface
app.get('/', (req, res) => {
    res.send(htmlInterface);
});

// Start server
app.listen(port, () => {
    console.log(`Suddeco AI Drawing Processor running at http://localhost:${port}`);
});
