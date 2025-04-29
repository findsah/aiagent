// OpenAI API Client Configuration
const { OpenAI } = require('openai');
require('dotenv').config();

// Create OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Check if API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is not set');
  console.error('Please set OPENAI_API_KEY in your .env file or environment variables');
}

// Log initialization but don't expose the actual key
console.log('OpenAI client initialized with API key');

module.exports = { openai };
