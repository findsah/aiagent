// Architectural Drawing Analyzer - Enhanced Example
const fs = require('fs');
const { OpenAI } = require('openai');
const path = require('path');

// Initialize OpenAI with the provided API key
const openai = new OpenAI({
  apiKey: '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'
});

// Enhanced architectural data with more detailed measurements
const enhancedArchitecturalData = {
  "drawing_type": "Floor Plan - Ground Floor",
  "scale": "1:50",
  "wall_thickness": "0.2m",
  "ceiling_height": "2.4m",
  "rooms": [
    {
      "name": "Kitchen",
      "internal_dimensions": {
        "length": "4.2m",
        "width": "3.5m",
        "height": "2.4m"
      },
      "features": ["Sink", "Oven", "Refrigerator Space", "Countertops"]
    },
    {
      "name": "Living Room",
      "internal_dimensions": {
        "length": "6.0m",
        "width": "4.5m",
        "height": "2.4m"
      },
      "features": ["Fireplace", "Large Windows", "Open Plan"]
    },
    {
      "name": "Dining Area",
      "internal_dimensions": {
        "length": "4.0m",
        "width": "3.8m",
        "height": "2.4m"
      },
      "features": ["Connected to Kitchen", "Bay Window"]
    },
    {
      "name": "Bathroom",
      "internal_dimensions": {
        "length": "2.5m",
        "width": "2.0m",
        "height": "2.4m"
      },
      "features": ["Shower", "Toilet", "Sink", "Tiled Walls"]
    },
    {
      "name": "Hallway",
      "internal_dimensions": {
        "length": "5.0m",
        "width": "1.5m",
        "height": "2.4m"
      },
      "features": ["Storage Cupboard", "Access to All Rooms"]
    }
  ],
  "openings": [
    {
      "type": "Door",
      "width": "0.9m",
      "height": "2.1m",
      "quantity": 6
    },
    {
      "type": "Window",
      "width": "1.2m",
      "height": "1.0m",
      "quantity": 8
    }
  ],
  "fixtures": [
    {
      "type": "Electrical outlets",
      "quantity": 24
    },
    {
      "type": "Light fixtures",
      "quantity": 12
    },
    {
      "type": "Plumbing fixtures",
      "quantity": 6
    }
  ]
};

async function analyzeArchitecturalData(data) {
  try {
    console.log('Sending enhanced architectural data to OpenAI for analysis...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI specialized in analyzing architectural drawings for construction purposes. 
          Extract all measurements and provide detailed analysis following construction industry standards.
          
          For each room, calculate:
          1. Internal dimensions (width, length, height)
          2. External dimensions (including wall thickness)
          3. Floor area (internal and external)
          4. Wall surface area (for painting, tiling, etc.)
          5. Ceiling area
          6. Skirting board length
          
          Also provide:
          1. Total building dimensions (width, length, height)
          2. Total floor area (internal and external)
          3. Total wall area (internal and external)
          4. Volume calculations
          
          Format your response as a detailed JSON object following construction industry standards.`
        },
        {
          role: "user",
          content: `Analyze this architectural data and provide detailed measurements for construction:
          ${JSON.stringify(data, null, 2)}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing data with OpenAI:', error);
    throw new Error('Failed to analyze architectural data with OpenAI');
  }
}

async function generateMaterialsQuantities(analysisResult) {
  try {
    console.log('Generating detailed materials quantities based on analysis...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI specialized in construction estimation.
          Based on the architectural analysis, calculate detailed quantities of materials needed for construction.
          
          Include detailed breakdowns for:
          1. Foundation materials (concrete, rebar, etc.)
          2. Structural materials (bricks, blocks, timber, etc.)
          3. Finishing materials by room:
             - Flooring (by type and room)
             - Wall coverings (paint, tiles, etc.)
             - Ceiling treatments
          4. Fixtures and fittings
          5. Electrical components
          6. Plumbing components
          
          For each material, specify:
          - Quantity
          - Unit of measurement
          - Location/room
          - Purpose
          
          Format your response as a detailed JSON object following construction industry standards.`
        },
        {
          role: "user",
          content: `Generate detailed material quantities based on this architectural analysis:
          ${analysisResult}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating materials with OpenAI:', error);
    throw new Error('Failed to generate materials quantities with OpenAI');
  }
}

async function generateTaskBreakdown(analysisResult, materialsResult) {
  try {
    console.log('Generating detailed construction task breakdown...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI specialized in construction project planning.
          Based on the architectural analysis and materials quantities, create a comprehensive task breakdown for construction.
          
          For each construction stage, provide detailed tasks including:
          1. Task ID and name
          2. Construction stage
          3. Detailed description
          4. Estimated duration (days)
          5. Required labor (person-days and specific trades)
          6. Dependencies (which tasks must be completed first)
          7. Materials used (with quantities)
          8. Quality control requirements
          9. Room/location specific details
          
          Organize tasks by construction stage following industry standard sequencing.
          Format your response as a detailed JSON object following construction industry standards.`
        },
        {
          role: "user",
          content: `Generate a detailed construction task breakdown based on this architectural analysis and materials list:
          Architectural Analysis: ${analysisResult}
          Materials Quantities: ${materialsResult}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating task breakdown with OpenAI:', error);
    throw new Error('Failed to generate task breakdown with OpenAI');
  }
}

async function main() {
  try {
    console.log('Starting enhanced architectural analysis...');
    
    // Step 1: Analyze architectural data with detailed measurements
    const analysisResult = await analyzeArchitecturalData(enhancedArchitecturalData);
    console.log('\nDetailed Architectural Analysis Result:');
    console.log(analysisResult);
    fs.writeFileSync('./detailed_architectural_analysis.json', analysisResult);
    
    // Step 2: Generate detailed materials quantities
    const materialsResult = await generateMaterialsQuantities(analysisResult);
    console.log('\nDetailed Materials Quantities:');
    console.log(materialsResult);
    fs.writeFileSync('./detailed_materials_quantities.json', materialsResult);
    
    // Step 3: Generate detailed task breakdown
    const taskBreakdown = await generateTaskBreakdown(analysisResult, materialsResult);
    console.log('\nDetailed Construction Task Breakdown:');
    console.log(taskBreakdown);
    fs.writeFileSync('./detailed_task_breakdown.json', taskBreakdown);
    
    // Step 4: Generate a combined detailed report
    const combinedReport = {
      architectural_analysis: JSON.parse(analysisResult),
      materials_quantities: JSON.parse(materialsResult),
      task_breakdown: JSON.parse(taskBreakdown),
      generated_at: new Date().toISOString()
    };
    
    fs.writeFileSync('./detailed_combined_report.json', JSON.stringify(combinedReport, null, 2));
    console.log('\nDetailed combined report saved to detailed_combined_report.json');
    
    // Save as SKSON file with construction industry standard format
    fs.writeFileSync('./suddeco_detailed_analysis.skson', JSON.stringify(combinedReport, null, 2));
    console.log('Detailed analysis also saved to suddeco_detailed_analysis.skson');
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main();
