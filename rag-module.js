// RAG (Retrieval-Augmented Generation) Module for Suddeco AI
// This module handles the integration with external APIs and provides context for the AI

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Import the api-client module with proper error handling
let apiClient;
try {
  apiClient = require('./api-client');
} catch (error) {
  console.error('Error loading api-client module:', error.message);
  // Create a fallback implementation if the module can't be loaded
  apiClient = {
    isHtmlResponse: function(data) {
      if (!data || typeof data !== 'string') return false;
      return data.includes('<html') || data.includes('<!DOCTYPE') || data.includes('<body');
    }
  };
  console.log('Created fallback api-client with basic isHtmlResponse function');
}

const { isHtmlResponse } = apiClient;

// Base URLs for the Suddeco API
const BASE_URL = 'https://api.suddeco.com/syed';

// API endpoints
const API_ENDPOINTS = {
  MATERIALS: `${BASE_URL}/materials`,
  TASKS: `${BASE_URL}/tasks`,
  STAGES: `${BASE_URL}/stages`,
  ROOMS: `${BASE_URL}/rooms`
};

// Local mock data directory
const MOCK_DATA_DIR = path.join(__dirname, 'mock_data');

// Ensure mock data directory exists
if (!fs.existsSync(MOCK_DATA_DIR)) {
  fs.mkdirSync(MOCK_DATA_DIR, { recursive: true });
}

// Cache for API data
const apiCache = {
  materials: null,
  tasks: null,
  stages: null,
  rooms: null,
  lastUpdated: null
};

/**
 * Fetch data from an API endpoint with fallback to local mock data
 * @param {string} endpoint - API endpoint (materials, tasks, stages, rooms)
 * @returns {Promise<Object>} - API data or mock data
 */
async function fetchApiData(endpoint) {
  console.log(`RAG: Fetching data from ${endpoint} API...`);
  
  try {
    // Use cached data if available and less than 1 hour old
    if (apiCache[endpoint] && apiCache.lastUpdated && 
        (Date.now() - apiCache.lastUpdated) < 3600000) {
      console.log(`RAG: Using cached ${endpoint} data`);
      return apiCache[endpoint];
    }
    
    // Attempt to fetch from API
    const response = await axios.get(`${BASE_URL}/${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 5000,
      validateStatus: status => status < 400 // Only accept 2xx and 3xx status codes
    });
    
    // Check if response is HTML instead of JSON
    if (typeof response.data === 'string') {
      if (isHtmlResponse(response.data)) {
        console.error(`RAG: Received HTML instead of JSON for ${endpoint}`);
        console.error(`RAG: First 100 chars of HTML response: ${response.data.substring(0, 100)}...`);
        throw new Error(`Invalid API response format (HTML received for ${endpoint})`);
      }
      
      // Try to parse string response as JSON
      try {
        response.data = JSON.parse(response.data);
      } catch (parseError) {
        console.error(`RAG: Error parsing response for ${endpoint}:`, parseError.message);
        throw parseError;
      }
    }
    
    // Check if response is valid
    if (response.status === 200 && response.data && typeof response.data === 'object') {
      
      // Cache the data
      apiCache[endpoint] = response.data;
      apiCache.lastUpdated = Date.now();
      
      // Save to local file as backup
      const mockFilePath = path.join(MOCK_DATA_DIR, `${endpoint}.json`);
      fs.writeFileSync(mockFilePath, JSON.stringify(response.data, null, 2));
      
      return response.data;
    } else {
      console.warn(`RAG: Invalid response from ${endpoint} API, status: ${response.status}`);
      return loadMockData(endpoint);
    }
  } catch (error) {
    console.error(`RAG: Error fetching ${endpoint} data:`, error.message);
    return loadMockData(endpoint);
  }
}

/**
 * Load mock data from local file
 * @param {string} endpoint - API endpoint
 * @returns {Object} - Mock data
 */
function loadMockData(endpoint) {
  console.log(`RAG: Loading mock data for ${endpoint}...`);
  
  // First try to load wrapped mock data
  const wrappedMockFilePath = path.join(MOCK_DATA_DIR, `${endpoint}_wrapped.json`);
  if (fs.existsSync(wrappedMockFilePath)) {
    try {
      console.log(`RAG: Found wrapped mock data for ${endpoint}`);
      const data = JSON.parse(fs.readFileSync(wrappedMockFilePath, 'utf8'));
      return data;
    } catch (wrappedError) {
      console.error(`RAG: Error loading wrapped mock data for ${endpoint}:`, wrappedError.message);
    }
  }
  
  // Fall back to regular mock data
  const mockFilePath = path.join(MOCK_DATA_DIR, `${endpoint}.json`);
  try {
    if (fs.existsSync(mockFilePath)) {
      const rawData = JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
      
      // Wrap the raw data in the expected format
      if (Array.isArray(rawData)) {
        console.log(`RAG: Wrapping raw mock data for ${endpoint}`);
        const wrappedData = {};
        wrappedData[endpoint] = rawData;
        return wrappedData;
      }
      
      return rawData;
    }
  } catch (error) {
    console.error(`RAG: Error loading mock data for ${endpoint}:`, error.message);
  }
  
  return createMockData(endpoint);
}

/**
 * Create mock data for an endpoint
 * @param {string} endpoint - API endpoint
 * @returns {Object} - Mock data
 */
function createMockData(endpoint) {
  console.log(`RAG: Creating mock data for ${endpoint}...`);
  
  let mockData = {};
  
  switch (endpoint) {
    case 'materials':
      mockData = {
        materials: [
          { id: 1, name: 'Concrete', description: 'Standard concrete mix for foundations and structural elements', unit: 'm³', category: 'structural' },
          { id: 2, name: 'Brick', description: 'Standard clay bricks for walls', unit: 'pieces', category: 'walls' },
          { id: 3, name: 'Timber', description: 'Structural timber for framing', unit: 'm', category: 'structural' },
          { id: 4, name: 'Drywall', description: 'Standard gypsum board for interior walls', unit: 'm²', category: 'interior' },
          { id: 5, name: 'Paint', description: 'Interior wall paint', unit: 'L', category: 'finishes' }
        ]
      };
      break;
    case 'tasks':
      mockData = {
        tasks: [
          { id: 1, name: 'Site Preparation', description: 'Clear site and prepare for construction', duration: 5, predecessors: [] },
          { id: 2, name: 'Foundation Work', description: 'Excavate and pour concrete foundations', duration: 10, predecessors: [1] },
          { id: 3, name: 'Framing', description: 'Construct structural frame of the building', duration: 15, predecessors: [2] },
          { id: 4, name: 'Roofing', description: 'Install roof structure and covering', duration: 7, predecessors: [3] },
          { id: 5, name: 'Interior Work', description: 'Complete all interior finishes', duration: 20, predecessors: [4] }
        ]
      };
      break;
    case 'stages':
      mockData = {
        stages: [
          { id: 1, name: 'Planning', description: 'Initial planning and design phase', tasks: [1] },
          { id: 2, name: 'Foundation', description: 'Foundation and groundwork', tasks: [2] },
          { id: 3, name: 'Structure', description: 'Main structural elements', tasks: [3, 4] },
          { id: 4, name: 'Interior', description: 'Interior work and finishes', tasks: [5] },
          { id: 5, name: 'Completion', description: 'Final touches and handover', tasks: [] }
        ]
      };
      break;
    case 'rooms':
      mockData = {
        rooms: [
          { id: 1, name: 'Living Room', description: 'Main living area', typical_dimensions: { length: '5.0m', width: '4.0m', height: '2.4m' } },
          { id: 2, name: 'Kitchen', description: 'Food preparation area', typical_dimensions: { length: '3.5m', width: '3.0m', height: '2.4m' } },
          { id: 3, name: 'Bedroom', description: 'Sleeping area', typical_dimensions: { length: '4.0m', width: '3.5m', height: '2.4m' } },
          { id: 4, name: 'Bathroom', description: 'Bathroom with toilet and shower', typical_dimensions: { length: '2.5m', width: '2.0m', height: '2.4m' } },
          { id: 5, name: 'Hallway', description: 'Connecting corridor', typical_dimensions: { length: '3.0m', width: '1.2m', height: '2.4m' } }
        ]
      };
      break;
    default:
      mockData = {};
  }
  
  // Save the mock data for future use
  try {
    const mockFilePath = path.join(MOCK_DATA_DIR, `${endpoint}.json`);
    fs.writeFileSync(mockFilePath, JSON.stringify(mockData, null, 2));
    console.log(`RAG: Saved mock data for ${endpoint}`);
  } catch (error) {
    console.error(`RAG: Error saving mock data for ${endpoint}:`, error.message);
  }
  
  return mockData;
}

/**
 * Fetch all API data in parallel
 * @returns {Promise<Object>} - All API data
 */
async function fetchAllApiData() {
  console.log('RAG: Fetching all API data...');
  
  try {
    console.log(`RAG: Direct API call to ${API_ENDPOINTS.MATERIALS}`);
    console.log(`RAG: Direct API call to ${API_ENDPOINTS.TASKS}`);
    console.log(`RAG: Direct API call to ${API_ENDPOINTS.STAGES}`);
    console.log(`RAG: Direct API call to ${API_ENDPOINTS.ROOMS}`);
    
    // Use Promise.all for parallel fetching
    const [materialsRes, tasksRes, stagesRes, roomsRes] = await Promise.all([
      axios.get(API_ENDPOINTS.MATERIALS, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      }),
      axios.get(API_ENDPOINTS.TASKS, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      }),
      axios.get(API_ENDPOINTS.STAGES, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      }),
      axios.get(API_ENDPOINTS.ROOMS, {
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      })
    ]);

    // HTML detection and fallback for each API response
    const materialsData = isHtmlResponse(materialsRes.data)
      ? await module.exports.createMockData('materials')
      : materialsRes.data;
    const tasksData = isHtmlResponse(tasksRes.data)
      ? await module.exports.createMockData('tasks')
      : tasksRes.data;
    const stagesData = isHtmlResponse(stagesRes.data)
      ? await module.exports.createMockData('stages')
      : stagesRes.data;
    const roomsData = isHtmlResponse(roomsRes.data)
      ? await module.exports.createMockData('rooms')
      : roomsRes.data;

    return {
      materials: materialsData,
      tasks: tasksData,
      stages: stagesData,
      rooms: roomsData,
      timestamp: new Date().toISOString(),
      partial_success: false,
      is_mock: false
    };
  } catch (error) {
    console.error('RAG: Error fetching all API data:', error.message);
    return {
      materials: await module.exports.createMockData('materials'),
      tasks: await module.exports.createMockData('tasks'),
      stages: await module.exports.createMockData('stages'),
      rooms: await module.exports.createMockData('rooms'),
      timestamp: new Date().toISOString(),
      is_mock: true,
      error: error.message
    };
  }
}

/**
 * Generate a context string for AI prompts based on API data
 * @param {Object} apiData - API data from all endpoints
 * @returns {string} - Context string for AI prompts
 */
function generateContextString(apiData) {
  if (!apiData) return '';
  
  let context = '# CONTEXT INFORMATION\n\n';
  
  // Add materials context
  if (apiData.materials && apiData.materials.materials && apiData.materials.materials.length > 0) {
    context += '## MATERIALS\n';
    apiData.materials.materials.forEach(material => {
      context += `- ${material.name}: ${material.description || 'No description'} (Unit: ${material.unit || 'N/A'})\n`;
    });
    context += '\n';
  }
  
  // Add tasks context
  if (apiData.tasks && apiData.tasks.tasks && apiData.tasks.tasks.length > 0) {
    context += '## TASKS\n';
    apiData.tasks.tasks.forEach(task => {
      context += `- ${task.name}: ${task.description || 'No description'} (Duration: ${task.duration || 'N/A'} days)\n`;
    });
    context += '\n';
  }
  
  // Add stages context
  if (apiData.stages && apiData.stages.stages && apiData.stages.stages.length > 0) {
    context += '## STAGES\n';
    apiData.stages.stages.forEach(stage => {
      context += `- ${stage.name}: ${stage.description || 'No description'}\n`;
    });
    context += '\n';
  }
  
  // Add rooms context
  if (apiData.rooms && apiData.rooms.rooms && apiData.rooms.rooms.length > 0) {
    context += '## ROOMS\n';
    apiData.rooms.rooms.forEach(room => {
      let dimensions = 'No dimensions available';
      if (room.typical_dimensions) {
        dimensions = `Length: ${room.typical_dimensions.length || 'N/A'}, Width: ${room.typical_dimensions.width || 'N/A'}, Height: ${room.typical_dimensions.height || 'N/A'}`;
      }
      context += `- ${room.name}: ${room.description || 'No description'} (${dimensions})\n`;
    });
    context += '\n';
  }
  
  return context;
}

/**
 * Find the most relevant items from API data based on a query
 * @param {string} query - Search query
 * @param {Object} apiData - API data from all endpoints
 * @param {number} limit - Maximum number of results per category
 * @returns {Object} - Relevant items from API data
 */
function findRelevantItems(query, apiData, limit = 5) {
  if (!query || !apiData) return {};
  
  const results = {
    materials: [],
    tasks: [],
    stages: [],
    rooms: []
  };
  
  // Simple relevance scoring function
  function calculateRelevance(item, query) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let score = 0;
    
    // Check name
    if (item.name) {
      const name = item.name.toLowerCase();
      queryTerms.forEach(term => {
        if (name.includes(term)) score += 3;
      });
    }
    
    // Check description
    if (item.description) {
      const description = item.description.toLowerCase();
      queryTerms.forEach(term => {
        if (description.includes(term)) score += 2;
      });
    }
    
    // Check other fields
    Object.keys(item).forEach(key => {
      if (key !== 'name' && key !== 'description' && typeof item[key] === 'string') {
        const value = item[key].toLowerCase();
        queryTerms.forEach(term => {
          if (value.includes(term)) score += 1;
        });
      }
    });
    
    return score;
  }
  
  // Search materials
  if (apiData.materials && apiData.materials.materials) {
    results.materials = apiData.materials.materials
      .map(item => ({ item, score: calculateRelevance(item, query) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => result.item);
  }
  
  // Search tasks
  if (apiData.tasks && apiData.tasks.tasks) {
    results.tasks = apiData.tasks.tasks
      .map(item => ({ item, score: calculateRelevance(item, query) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => result.item);
  }
  
  // Search stages
  if (apiData.stages && apiData.stages.stages) {
    results.stages = apiData.stages.stages
      .map(item => ({ item, score: calculateRelevance(item, query) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => result.item);
  }
  
  // Search rooms
  if (apiData.rooms && apiData.rooms.rooms) {
    results.rooms = apiData.rooms.rooms
      .map(item => ({ item, score: calculateRelevance(item, query) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => result.item);
  }
  
  return results;
}

/**
 * Safe JSON parsing with HTML detection
 * @param {string} jsonString - JSON string to parse
 * @param {Object} defaultValue - Default value if parsing fails
 * @returns {Object} - Parsed JSON or default value
 */
function safeJsonParse(jsonString, defaultValue = {}) {
  try {
    // Check if input is valid
    if (!jsonString || typeof jsonString !== 'string') {
      console.error('RAG: Invalid input to safeJsonParse');
      return defaultValue;
    }
    
    // Check if the string is HTML
    if (isHtmlResponse(jsonString)) {
      console.error('RAG: Received HTML instead of JSON');
      console.error('RAG: First 100 chars:', jsonString.substring(0, 100));
      return defaultValue;
    }
    
    // Pre-process the string to handle common issues
    let processedString = jsonString;
    
    // Remove any leading/trailing whitespace
    processedString = processedString.trim();
    
    // Remove code block markers if present (from markdown)
    processedString = processedString.replace(/^```(json)?\s+/, '').replace(/\s*```$/, '');
    
    // Remove control characters that can break JSON parsing
    processedString = processedString.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // Try to parse the JSON
    try {
      return JSON.parse(processedString);
    } catch (parseError) {
      console.error('RAG: JSON parsing error:', parseError.message);
      console.error('RAG: Problematic content (first 100 chars):', processedString.substring(0, 100));
      
      // Try more aggressive cleaning
      try {
        // Look for valid JSON object within the string
        const jsonMatch = processedString.match(/\{[\s\S]*\}/m);
        if (jsonMatch) {
          console.log('RAG: Attempting to parse extracted JSON object');
          return JSON.parse(jsonMatch[0]);
        }
        
        // Try to fix common JSON syntax errors
        const fixedJson = processedString
          .replace(/,\s*}/g, '}')           // Remove trailing commas in objects
          .replace(/,\s*\]/g, ']')         // Remove trailing commas in arrays
          .replace(/([\{,])\s*([\w]+)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
          .replace(/:\s*'([^']*)'/g, ':"$1"'); // Replace single quotes with double quotes
        
        console.log('RAG: Attempting to parse fixed JSON');
        return JSON.parse(fixedJson);
      } catch (fixError) {
        console.error('RAG: Failed to fix and parse JSON:', fixError.message);
        return defaultValue;
      }
    }
  } catch (error) {
    console.error('RAG: Unexpected error in safeJsonParse:', error.message);
    return defaultValue;
  }
}

module.exports = {
  fetchApiData,
  fetchAllApiData,
  generateContextString,
  findRelevantItems,
  isHtmlResponse,
  safeJsonParse
};
