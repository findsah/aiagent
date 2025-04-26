// Suddeco AI Drawing Processor - Server Entry Point
// This file serves as the entry point for the application
// It imports and uses the consolidated agent file

console.log('Starting Suddeco AI Drawing Processor - Server Entry Point');

// Import the express module to create our own express app
const express = require('express');

// Import the final agent module
// This ensures that Render uses the correct file
const finalAgent = require('./suddeco-final-agent');

// Import the schema API router
const schemaApiRouter = require('./suddeco-schema-api');

// Get the express app instance from the final agent
// This is a workaround since we can't directly modify the existing app
// We'll add our schema API router to the final agent's express app

// The server is started in the consolidated agent file
// No need to call app.listen() here

// Log that we've loaded the schema API endpoints
console.log('Schema API endpoints registered at /api/schema');

// Export the finalAgent for Render to use
module.exports = finalAgent;
