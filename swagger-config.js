// Swagger configuration for Suddeco AI Drawing Processor
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Suddeco AI Drawing Processor API',
    version: '1.0.0',
    description: 'API documentation for the Suddeco AI Drawing Processor application',
    contact: {
      name: 'Suddeco',
      url: 'https://suddeco.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:10000',
      description: 'Development server',
    },
    {
      url: 'https://sudecco-ai.onrender.com',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Drawing Processing',
      description: 'API endpoints for processing architectural drawings',
    },
    {
      name: 'RAG',
      description: 'Retrieval-Augmented Generation endpoints for enhanced context',
    },
    {
      name: 'Data',
      description: 'Endpoints for retrieving materials, tasks, stages, and rooms data',
    },
    {
      name: 'Projects',
      description: 'API endpoints for managing construction projects',
    },
    {
      name: 'Elements',
      description: 'API endpoints for managing project elements',
    },
    {
      name: 'Rooms',
      description: 'API endpoints for managing project rooms',
    },
    {
      name: 'Stages',
      description: 'API endpoints for construction stages',
    },
    {
      name: 'Tasks',
      description: 'API endpoints for construction tasks',
    },
    {
      name: 'Materials',
      description: 'API endpoints for construction materials',
    },
    {
      name: 'Drawings',
      description: 'API endpoints for uploading and analyzing drawings',
    },
  ],
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          details: {
            type: 'string',
            description: 'Detailed error information',
          },
        },
      },
      AnalysisResult: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the analysis was successful',
          },
          message: {
            type: 'string',
            description: 'Status message',
          },
          fileInfo: {
            type: 'object',
            description: 'Information about the processed file',
          },
          analysis: {
            type: 'object',
            description: 'Detailed architectural analysis results',
          },
          outputPath: {
            type: 'string',
            description: 'Path to the output file',
          },
        },
      },
      RagSearchResult: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
          results: {
            type: 'object',
            description: 'Search results organized by category',
          },
          timestamp: {
            type: 'string',
            description: 'Timestamp of the search',
          },
        },
      },
      RagChatResponse: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The chat query',
          },
          response: {
            type: 'string',
            description: 'AI response to the query',
          },
          timestamp: {
            type: 'string',
            description: 'Timestamp of the response',
          },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Project ID' },
          suddecoId: { type: 'string', description: 'Unique Suddeco ID for the project' },
          name: { type: 'string', description: 'Project name' },
          description: { type: 'string', description: 'Project description' },
          status: { type: 'string', description: 'Project status (on_going, completed, etc.)' },
          location: { type: 'string', description: 'Project location', nullable: true },
          address: { type: 'string', description: 'Project address' },
          zipCode: { type: 'string', description: 'Project zip code' },
          city: { type: 'string', description: 'Project city' },
          state: { type: 'string', description: 'Project state' },
          region: { type: 'string', description: 'Project region' },
          projectType: { type: 'string', description: 'Project type', nullable: true },
          specification: { type: 'string', description: 'Project specification' },
          totalCost: { type: 'string', description: 'Project total cost' },
          startDate: { type: 'string', description: 'Project start date (ISO format)' },
          endDate: { type: 'string', description: 'Project end date (ISO format)' },
          duration: { type: 'string', description: 'Project duration', nullable: true },
          lat: { type: 'number', description: 'Project latitude', nullable: true },
          lng: { type: 'number', description: 'Project longitude', nullable: true },
          averageWorkers: { type: 'integer', description: 'Average number of workers' },
          createdAt: { type: 'string', description: 'Creation timestamp (ISO format)' },
          updatedAt: { type: 'string', description: 'Update timestamp (ISO format)' },
          createdFrom: { type: 'string', description: 'Creator email' },
          createdFor: { type: 'string', description: 'Client email' },
          updatedFrom: { type: 'string', description: 'Updater email', nullable: true },
          labourMargin: { type: 'number', description: 'Labour margin percentage' },
          materialMargin: { type: 'number', description: 'Material margin percentage' },
        },
      },
      ProjectInput: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          description: { type: 'string', description: 'Project description' },
          address: { type: 'string', description: 'Project address' },
          city: { type: 'string', description: 'Project city' },
          status: { type: 'string', description: 'Project status' },
        },
        required: ['name', 'address'],
      },
      Element: {
        type: 'object',
        properties: {
          elementId: { type: 'integer', description: 'Element ID' },
          suddecoId: { type: 'string', description: 'Unique Suddeco ID for the element' },
          projectId: { type: 'integer', description: 'Project ID' },
          roomId: { type: 'integer', description: 'Room ID' },
          stageId: { type: 'integer', description: 'Stage ID' },
          taskId: { type: 'integer', description: 'Task ID' },
          materialId: { type: 'integer', description: 'Material ID' },
          qty: { type: 'number', description: 'Quantity' },
          margin: { type: 'number', description: 'Margin percentage', nullable: true },
          materialCost: { type: 'number', description: 'Material cost' },
          labourCost: { type: 'number', description: 'Labour cost' },
          createdAt: { type: 'string', description: 'Creation timestamp (ISO format)' },
          updatedAt: { type: 'string', description: 'Update timestamp (ISO format)' },
        },
      },
      ElementInput: {
        type: 'object',
        properties: {
          roomId: { type: 'integer', description: 'Room ID' },
          stageId: { type: 'integer', description: 'Stage ID' },
          taskId: { type: 'integer', description: 'Task ID' },
          materialId: { type: 'integer', description: 'Material ID' },
          qty: { type: 'number', description: 'Quantity' },
          margin: { type: 'number', description: 'Margin percentage' },
          materialCost: { type: 'number', description: 'Material cost' },
          labourCost: { type: 'number', description: 'Labour cost' },
        },
        required: ['roomId', 'stageId', 'taskId', 'materialId'],
      },
      ProjectRoom: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Project room ID' },
          suddecoId: { type: 'string', description: 'Unique Suddeco ID for the room' },
          name: { type: 'string', description: 'Room name' },
          description: { type: 'string', description: 'Room description' },
          width: { type: 'number', description: 'Room width' },
          height: { type: 'number', description: 'Room height' },
          deepth: { type: 'number', description: 'Room depth' },
          projectId: { type: 'integer', description: 'Project ID' },
          roomId: { type: 'integer', description: 'Room type ID' },
          createdAt: { type: 'string', description: 'Creation timestamp (ISO format)' },
          updatedAt: { type: 'string', description: 'Update timestamp (ISO format)' },
        },
      },
      ProjectRoomInput: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Room name' },
          description: { type: 'string', description: 'Room description' },
          width: { type: 'number', description: 'Room width' },
          height: { type: 'number', description: 'Room height' },
          deepth: { type: 'number', description: 'Room depth' },
          roomId: { type: 'integer', description: 'Room type ID' },
        },
        required: ['name', 'roomId'],
      },
      Room: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Room ID' },
          scopeId: { type: 'integer', description: 'Scope ID' },
          name: { type: 'string', description: 'Room name' },
          type: { type: 'string', description: 'Room type' },
          icon: { type: 'string', description: 'Room icon' },
          description: { type: 'string', description: 'Room description' },
          popularity: { type: 'integer', description: 'Room popularity' },
          createdAt: { type: 'string', description: 'Creation timestamp (ISO format)' },
          updatedAt: { type: 'string', description: 'Update timestamp (ISO format)' },
        },
      },
      Stage: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Stage ID' },
          stageId: { type: 'integer', description: 'Stage ID (duplicate)' },
          stage: { type: 'string', description: 'Stage name' },
          priority: { type: 'integer', description: 'Stage priority' },
          createdAt: { type: 'string', description: 'Creation timestamp (ISO format)', nullable: true },
          updatedAt: { type: 'string', description: 'Update timestamp (ISO format)', nullable: true },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Task ID' },
          taskId: { type: 'integer', description: 'Task ID (duplicate)' },
          task: { type: 'string', description: 'Task name' },
          roomArea: { type: 'array', items: { type: 'string' }, description: 'Room areas' },
          unitId: { type: 'integer', description: 'Unit ID' },
          unit: { type: 'string', description: 'Unit name' },
          unitPlural: { type: 'string', description: 'Unit name (plural)' },
          ratio: { type: 'string', description: 'Ratio' },
          action: { type: 'string', description: 'Action' },
          elementId: { type: 'integer', description: 'Element ID' },
          stage: { type: 'string', description: 'Stage name' },
          stageId: { type: 'integer', description: 'Stage ID' },
          cssElementId: { type: 'integer', description: 'CSS element ID' },
          cssElement: { type: 'string', description: 'CSS element name' },
          type: { type: 'string', description: 'Task type' },
          otherStage: { type: 'boolean', description: 'Other stage flag' },
          displayName: { type: 'string', description: 'Display name' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Product ID' },
          supplier: { type: 'string', description: 'Supplier name' },
          sku: { type: 'string', description: 'SKU' },
          name: { type: 'string', description: 'Product name' },
          price: { type: 'string', description: 'Product price' },
          category1: { type: 'string', description: 'Category 1' },
          category2: { type: 'string', description: 'Category 2' },
          category3: { type: 'string', description: 'Category 3' },
          category4: { type: 'string', description: 'Category 4' },
          category5: { type: 'string', description: 'Category 5', nullable: true },
          photo_url: { type: 'string', description: 'Photo URL' },
          photo_url2: { type: 'string', description: 'Photo URL 2', nullable: true },
          product_url: { type: 'string', description: 'Product URL' },
          unit: { type: 'string', description: 'Unit' },
          time_per_unit: { type: 'string', description: 'Time per unit' },
          labour_type: { type: 'string', description: 'Labour type' },
          scope: { type: 'string', description: 'Scope' },
          area: { type: 'string', description: 'Area', nullable: true },
          margin: { type: 'number', description: 'Margin percentage', nullable: true },
          email: { type: 'string', description: 'Email' },
          materialId: { type: 'integer', description: 'Material ID', nullable: true },
          createdAt: { type: 'string', description: 'Creation timestamp (ISO format)', nullable: true },
          updatedAt: { type: 'string', description: 'Update timestamp (ISO format)', nullable: true },
        },
      },
      DrawingAnalysis: {
        type: 'object',
        properties: {
          success: { type: 'boolean', description: 'Success flag' },
          message: { type: 'string', description: 'Status message' },
          fileInfo: { type: 'object', description: 'File information' },
          analysis: { type: 'object', description: 'Analysis results' },
          outputPath: { type: 'string', description: 'Output path' },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./suddeco-consolidated-agent.js', './suddeco-final-agent.js', './suddeco-schema-api.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
