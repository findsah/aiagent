// OpenAI configuration file
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = { openai };
