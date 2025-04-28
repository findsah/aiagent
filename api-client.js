// API Client for Suddeco External Data
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URL for the Suddeco API
const BASE_URL = 'https://api.suddeco.com/syed';

// Cache for API responses to minimize redundant calls
const apiCache = new Map();

// Local mock data directory
const MOCK_DATA_DIR = path.join(__dirname, 'mock_data');

// Ensure mock data directory exists
if (!fs.existsSync(MOCK_DATA_DIR)) {
  fs.mkdirSync(MOCK_DATA_DIR, { recursive: true });
}

/**
 * Check if a response is HTML instead of JSON
 * @param {any} data - Response data to check
 * @returns {boolean} - True if data appears to be HTML
 */
function isHtmlResponse(data) {
  // If data is not a string, convert it to string for checking
  const strData = typeof data === 'string' ? data : String(data);
  
  // Convert to string and trim for consistent checking
  const trimmedData = strData.trim();
  
  // Quick check for empty or very short strings
  if (!trimmedData || trimmedData.length < 5) {
    return false;
  }
  
  // Check for common HTML indicators (case insensitive)
  const htmlIndicators = [
    '<!DOCTYPE', '<html', '<head', '<body', '<div', '<script',
    '<!doctype', '<HTML', '<HEAD', '<BODY', '<DIV', '<SCRIPT',
    '<meta', '<META', '<title', '<TITLE', '<style', '<STYLE',
    '<link', '<LINK', '<img', '<IMG', '<table', '<TABLE',
    '<form', '<FORM', '<iframe', '<IFRAME', '<svg', '<SVG'
  ];
  
  // Check for exact starting patterns (most common case)
  for (const indicator of htmlIndicators) {
    if (trimmedData.toLowerCase().startsWith(indicator.toLowerCase())) {
      console.log(`API Client: HTML detected: starts with ${indicator}`);
      return true;
    }
  }
  
  // Check for HTML tags anywhere in the content
  if (/<\/?[a-z][\s\S]*>/i.test(trimmedData)) {
    console.log('API Client: HTML detected: contains HTML tags');
    return true;
  }
  
  // Check for specific error patterns
  if (trimmedData.includes('Error') && 
      (trimmedData.includes('<br>') || trimmedData.includes('<p>') || trimmedData.includes('<div>'))) {
    console.log('API Client: HTML detected: contains error with HTML formatting');
    return true;
  }
  
  // Check for common HTML entities
  if (trimmedData.includes('&lt;') || trimmedData.includes('&gt;') || 
      trimmedData.includes('&amp;') || trimmedData.includes('&quot;')) {
    console.log('API Client: HTML detected: contains HTML entities');
    return true;
  }
  
  // Additional check for the specific error pattern mentioned
  if (trimmedData.includes('<!DOCTYPE')) {
    console.log('API Client: HTML detected: contains <!DOCTYPE');
    return true;
  }
  
  return false;
}

/**
 * Load mock data from local file
 * @param {string} endpoint - API endpoint to load mock data for
 * @returns {Object} - Mock data
 */
function loadMockData(endpoint) {
  const mockFilePath = path.join(MOCK_DATA_DIR, `${endpoint}.json`);
  
  try {
    if (fs.existsSync(mockFilePath)) {
      console.log(`Loading mock data for ${endpoint} from ${mockFilePath}`);
      const fileContent = fs.readFileSync(mockFilePath, 'utf8');
      if (module.exports.isHtmlResponse(fileContent)) {
        console.error('Error: mock file contains HTML, returning empty object.');
        return {};
      }
      const data = JSON.parse(fileContent);
      return data;
    }
  } catch (error) {
    console.error(`Error loading mock data for ${endpoint}:`, error.message);
  }
  
  return createDefaultMockData(endpoint);
}

/**
 * Create default mock data for an endpoint
 * @param {string} endpoint - API endpoint to create mock data for
 * @returns {Object} - Default mock data
 */
function createDefaultMockData(endpoint) {
  console.log(`Creating default mock data for ${endpoint}`);
  
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
    console.log(`Saved default mock data for ${endpoint} to ${mockFilePath}`);
  } catch (error) {
    console.error(`Error saving mock data for ${endpoint}:`, error.message);
  }
  
  return mockData;
}

/**
 * Fetch data from an API endpoint with enhanced error handling
 * @param {string} endpoint - API endpoint name
 * @returns {Promise<Object>} - API response data
 */
async function fetchApiData(endpoint) {
  try {
    console.log(`API Client: Fetching data from ${endpoint} API...`);
    
    // Construct the API URL
    const apiUrl = `${BASE_URL}/${endpoint}`;
    console.log(`API Client: Full URL: ${apiUrl}`);
    
    // Make the API request with timeout and validation
    const response = await axios.get(apiUrl, {
      headers: { 'Accept': 'application/json' },
      validateStatus: status => status < 400,
      timeout: 8000, // Increased timeout
      responseType: 'text' // Get raw response to check for HTML
    });
    
    // Log response details for debugging
    console.log(`API Client: ${endpoint} API response status: ${response.status}`);
    console.log(`API Client: ${endpoint} API content type: ${response.headers['content-type'] || 'unknown'}`);
    
    // Check if the response is HTML instead of JSON
    if (isHtmlResponse(response.data)) {
      console.error(`API Client: Received HTML instead of JSON from ${endpoint} API`);
      console.error(`API Client: First 100 chars of response: ${response.data.substring(0, 100)}`);
      return loadMockData(endpoint);
    }
    
    // Try to parse the JSON response
    try {
      // If response is already an object, return it
      if (typeof response.data === 'object' && response.data !== null) {
        return response.data;
      }
      
      // Otherwise try to parse it
      if (module.exports.isHtmlResponse(response.data)) {
        console.error('Error: API returned HTML instead of JSON. Returning empty object.');
        return {};
      }
      const parsedData = JSON.parse(response.data);
      return parsedData;
    } catch (parseError) {
      console.error(`API Client: Error parsing JSON from ${endpoint} API:`, parseError.message);
      console.error(`API Client: First 100 chars of problematic JSON: ${response.data.substring(0, 100)}`);
      return loadMockData(endpoint);
    }
  } catch (error) {
    console.error(`API Client: Error fetching ${endpoint} data:`, error.message);
    if (error.response) {
      console.error(`API Client: Response status: ${error.response.status}`);
      console.error(`API Client: Response headers:`, error.response.headers);
    }
    return loadMockData(endpoint);
  }
}

/**
 * Get materials data from the Suddeco API
 * @returns {Promise<Object>} - Materials data
 */
async function getMaterials() {
  return fetchApiData('materials');
}

/**
 * Get tasks data from the Suddeco API
 * @returns {Promise<Object>} - Tasks data
 */
async function getTasks() {
  return fetchApiData('tasks');
}

/**
 * Get stages data from the Suddeco API
 * @returns {Promise<Object>} - Stages data
 */
async function getStages() {
  return fetchApiData('stages');
}

/**
 * Get rooms data from the Suddeco API
 * @returns {Promise<Object>} - Rooms data
 */
async function getRooms() {
  return fetchApiData('rooms');
}

/**
 * Get all API data in parallel
 * @returns {Promise<Object>} - Combined API data
 */
async function getAllAPIData() {
  try {
    const [materials, tasks, stages, rooms] = await Promise.all([
      getMaterials(),
      getTasks(),
      getStages(),
      getRooms()
    ]);
    
    return {
      materials,
      tasks,
      stages,
      rooms
    };
  } catch (error) {
    console.error('Error fetching all API data:', error.message);
    return {
      materials: { materials: [] },
      tasks: { tasks: [] },
      stages: { stages: [] },
      rooms: { rooms: [] }
    };
  }
}

module.exports = {
  getMaterials,
  getTasks,
  getStages,
  getRooms,
  getAllAPIData,
  isHtmlResponse // Export the HTML detection function for use in other modules
};

// Also export isHtmlResponse directly to ensure compatibility
module.exports.isHtmlResponse = isHtmlResponse;
