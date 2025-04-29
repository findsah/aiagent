// Vector Database Integration Module for Suddeco AI Drawing Processor
// This module handles integration with Astra DB for vector similarity search

const { DataAPIClient } = require('@datastax/astra-db-ts');
const axios = require('axios');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Default configuration
let config = {
  enabled: false,
  astraToken: null,
  astraEndpoint: null,
  astraCollection: 'suddeco_drawings',
  referenceCollections: {
    materials: 'suddeco_materials',
    tasks: 'suddeco_tasks',
    stages: 'suddeco_stages',
    rooms: 'suddeco_rooms'
  }
};

// Clients
let openaiClient = null;
let astraClient = null;
let astraDb = null;

/**
 * Initialize the vector database connection
 * @param {Object} options Configuration options
 * @param {boolean} options.enabled Whether vector DB is enabled
 * @param {string} options.astraToken Astra DB token
 * @param {string} options.astraEndpoint Astra DB endpoint
 * @param {string} options.astraCollection Astra DB collection name
 */
function initialize(options) {
  config = { ...config, ...options };
  
  // Initialize OpenAI client for embeddings
  if (config.enabled && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('Vector DB: OpenAI client initialized for embeddings');
  } else if (config.enabled) {
    console.warn('Vector DB: OpenAI API key missing, embeddings will not work');
  }
  
  // Initialize Astra DB client
  if (config.enabled && config.astraToken && config.astraEndpoint) {
    try {
      astraClient = new DataAPIClient(config.astraToken);
      astraDb = astraClient.db(config.astraEndpoint);
      console.log('Vector DB: AstraDB client initialized');
      
      // Ensure collections exist
      ensureCollectionsExist().then(() => {
        console.log('Vector DB: Collections verified');
      }).catch(err => {
        console.error('Vector DB: Error verifying collections:', err.message);
      });
    } catch (error) {
      console.error('Vector DB: Error initializing AstraDB client:', error.message);
    }
  }
}

/**
 * Ensure all required collections exist in Astra DB
 */
async function ensureCollectionsExist() {
  if (!config.enabled || !astraDb) return;
  
  try {
    const collections = await astraDb.listCollections();
    console.log('Existing collections:', collections);
    
    // Create main drawings collection if it doesn't exist
    if (!collections.includes(config.astraCollection)) {
      await astraDb.createCollection(config.astraCollection, { vector: { dimension: 1536, metric: 'cosine' } });
      console.log(`Created collection: ${config.astraCollection}`);
    }
    
    // Create reference collections if they don't exist
    for (const [key, collName] of Object.entries(config.referenceCollections)) {
      if (!collections.includes(collName)) {
        await astraDb.createCollection(collName, { vector: { dimension: 1536, metric: 'cosine' } });
        console.log(`Created collection: ${collName}`);
      }
    }
  } catch (error) {
    console.error('Error ensuring collections exist:', error.message);
    throw error;
  }
}

/**
 * Generate an embedding for the given text using OpenAI
 * @param {string} text Text to generate embedding for
 * @returns {Promise<number[]>} The embedding vector
 */
async function generateEmbedding(text) {
  if (!config.enabled || !openaiClient) {
    throw new Error('Vector DB not enabled or OpenAI client not initialized');
  }
  
  try {
    const response = await openaiClient.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Vector DB: Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Store drawing analysis in vector database
 * @param {Object} drawingData Drawing data to store
 * @param {string} drawingData.id Unique ID for the drawing
 * @param {string} drawingData.projectId Project ID
 * @param {string} drawingData.fileName Original filename
 * @param {Object} drawingData.analysis Analysis results
 * @returns {Promise<Object>} Result of the operation
 */
async function storeDrawingAnalysis(drawingData) {
  if (!config.enabled || !astraDb) {
    return { success: false, message: 'Vector DB not enabled or not initialized' };
  }
  
  try {
    // Create a text representation of the drawing data for embedding
    const textForEmbedding = [
      `Drawing: ${drawingData.fileName}`,
      `Project: ${drawingData.projectId}`,
      `Analysis Summary: ${drawingData.analysis.summary || ''}`,
      `Measurements: ${JSON.stringify(drawingData.analysis.measurements || [])}`,
      `Annotations: ${JSON.stringify(drawingData.analysis.annotations || [])}`,
      `Scale: ${drawingData.analysis.scale || 'Unknown'}`
    ].join('\n');
    
    // Generate embedding
    const embedding = await generateEmbedding(textForEmbedding);
    
    // Get collection
    const collection = astraDb.collection(config.astraCollection);
    
    // Store in Astra DB
    await collection.insertOne({
      _id: drawingData.id,
      ...drawingData,
      $vector: embedding
    });
    
    return { 
      success: true, 
      message: 'Drawing analysis stored in vector database',
      documentId: drawingData.id
    };
  } catch (error) {
    console.error('Error storing drawing analysis in vector DB:', error.message);
    return { 
      success: false, 
      message: 'Error storing drawing analysis', 
      error: error.message 
    };
  }
}

/**
 * Search for similar drawings in vector database
 * @param {string} query Search query
 * @param {number} limit Maximum number of results to return
 * @returns {Promise<Array>} Array of similar drawings
 */
async function searchSimilarDrawings(query, limit = 5) {
  if (!config.enabled || !astraDb) {
    return [];
  }
  
  try {
    // Generate embedding for query
    const embedding = await generateEmbedding(query);
    
    // Get collection
    const collection = astraDb.collection(config.astraCollection);
    
    // Search in Astra DB
    const results = await collection.find({
      $vector: {
        $similarity: embedding,
        $limit: limit
      }
    }).toArray();
    
    return results.map(doc => ({
      id: doc._id,
      projectId: doc.projectId,
      fileName: doc.fileName,
      analysis: doc.analysis,
      similarity: doc.$similarity || 0
    }));
  } catch (error) {
    console.error('Error searching similar drawings:', error.message);
    return [];
  }
}

/**
 * Fetch data from Suddeco API and store in vector database
 * @param {string} endpoint API endpoint (materials, tasks, stages, rooms)
 * @returns {Promise<Object>} Result of the operation
 */
async function fetchAndStoreReferenceData(endpoint) {
  if (!config.enabled || !astraDb) {
    return { success: false, message: 'Vector DB not enabled or not initialized' };
  }
  
  if (!config.referenceCollections[endpoint]) {
    return { success: false, message: `Unknown endpoint: ${endpoint}` };
  }
  
  try {
    // Fetch data from Suddeco API
    console.log(`Fetching data from ${endpoint} API...`);
    const response = await axios.get(`https://api.suddeco.com/syed/${endpoint}`);
    const items = response.data[endpoint] || [];
    
    if (items.length === 0) {
      return { success: false, message: `No ${endpoint} data found` };
    }
    
    console.log(`Found ${items.length} ${endpoint} to process`);
    
    // Get collection
    const collection = astraDb.collection(config.referenceCollections[endpoint]);
    
    // Process items in batches to avoid rate limits
    const batchSize = 50;
    const batches = Math.ceil(items.length / batchSize);
    let successCount = 0;
    
    for (let i = 0; i < batches; i++) {
      const batchItems = items.slice(i * batchSize, (i + 1) * batchSize);
      console.log(`Processing batch ${i + 1}/${batches} (${batchItems.length} items)`);
      
      for (const item of batchItems) {
        // Create a text representation for embedding
        const textForEmbedding = createTextRepresentation(endpoint, item);
        
        // Generate embedding
        const embedding = await generateEmbedding(textForEmbedding);
        
        // Store in Astra DB
        await collection.insertOne({
          _id: `${endpoint}_${item.id}`,
          type: endpoint,
          data: item,
          text: textForEmbedding,
          $vector: embedding
        });
        
        successCount++;
      }
      
      // Add a small delay between batches to avoid rate limits
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return { 
      success: true, 
      message: `Successfully stored ${successCount} ${endpoint} in vector database`,
      count: successCount
    };
  } catch (error) {
    console.error(`Error storing ${endpoint} in vector DB:`, error.message);
    return { 
      success: false, 
      message: `Error storing ${endpoint}`, 
      error: error.message 
    };
  }
}

/**
 * Create a text representation of an item for embedding
 * @param {string} type Item type (materials, tasks, stages, rooms)
 * @param {Object} item Item data
 * @returns {string} Text representation
 */
function createTextRepresentation(type, item) {
  switch (type) {
    case 'materials':
      return [
        `Material ID: ${item.id}`,
        `Name: ${item.name || ''}`,
        `Category: ${item.category1 || ''} - ${item.category2 || ''}`,
        `Supplier: ${item.supplier || ''}`,
        `Description: ${item.description || ''}`,
        `Price: ${item.price || 0}`,
        `Unit: ${item.unit || ''}`
      ].join('\n');
      
    case 'tasks':
      return [
        `Task ID: ${item.id}`,
        `Name: ${item.task || ''}`,
        `Display Name: ${item.displayName || ''}`,
        `Stage: ${item.stage || ''}`,
        `Stage ID: ${item.stageId || ''}`,
        `Description: ${item.description || ''}`
      ].join('\n');
      
    case 'stages':
      return [
        `Stage ID: ${item.id}`,
        `Name: ${item.stage || ''}`,
        `Priority: ${item.priority || 0}`
      ].join('\n');
      
    case 'rooms':
      return [
        `Room ID: ${item.id}`,
        `Name: ${item.name || ''}`,
        `Type: ${item.type || ''}`,
        `Description: ${item.description || ''}`
      ].join('\n');
      
    default:
      return JSON.stringify(item);
  }
}

/**
 * Search for similar reference data in vector database
 * @param {string} type Data type (materials, tasks, stages, rooms)
 * @param {string} query Search query
 * @param {number} limit Maximum number of results to return
 * @returns {Promise<Array>} Array of similar items
 */
async function searchReferenceData(type, query, limit = 10) {
  if (!config.enabled || !astraDb || !config.referenceCollections[type]) {
    return [];
  }
  
  try {
    // Generate embedding for query
    const embedding = await generateEmbedding(query);
    
    // Get collection
    const collection = astraDb.collection(config.referenceCollections[type]);
    
    // Search in Astra DB
    const results = await collection.find({
      $vector: {
        $similarity: embedding,
        $limit: limit
      }
    }).toArray();
    
    return results.map(doc => ({
      id: doc.data.id,
      type: doc.type,
      data: doc.data,
      similarity: doc.$similarity || 0
    }));
  } catch (error) {
    console.error(`Error searching ${type}:`, error.message);
    return [];
  }
}

/**
 * Fetch and store all reference data from Suddeco API endpoints
 * @returns {Promise<Object>} Results of all operations
 */
async function fetchAndStoreAllReferenceData() {
  const endpoints = Object.keys(config.referenceCollections);
  const results = {};
  
  for (const endpoint of endpoints) {
    console.log(`Processing ${endpoint}...`);
    results[endpoint] = await fetchAndStoreReferenceData(endpoint);
  }
  
  return results;
}

/**
 * Get a collection from Astra DB
 * @param {string} type Collection type (drawings, materials, tasks, stages, rooms)
 * @returns {Object} Astra DB collection
 */
function getCollection(type) {
  if (!config.enabled || !astraDb) {
    throw new Error('Vector DB not enabled or not initialized');
  }
  
  if (type === 'drawings') {
    return astraDb.collection(config.astraCollection);
  }
  
  if (config.referenceCollections[type]) {
    return astraDb.collection(config.referenceCollections[type]);
  }
  
  throw new Error(`Unknown collection type: ${type}`);
}

module.exports = {
  initialize,
  generateEmbedding,
  storeDrawingAnalysis,
  searchSimilarDrawings,
  fetchAndStoreReferenceData,
  fetchAndStoreAllReferenceData,
  searchReferenceData,
  getCollection
};
