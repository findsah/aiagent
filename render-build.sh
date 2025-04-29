#!/bin/bash

# This script is used by Render to build and start the application
# It ensures that the correct agent file (suddeco-final-agent.js) is used

echo "Starting Suddeco AI Drawing Processor build process..."

# Install dependencies
npm install

# Create a symlink to ensure suddeco-agent.js points to suddeco-final-agent.js
# This is a failsafe in case Render tries to use the wrong file
echo "Creating symlink to ensure the correct agent file is used"
if [ -f "suddeco-agent.js" ]; then
  mv suddeco-agent.js suddeco-agent.js.bak
fi
ln -sf suddeco-final-agent.js suddeco-agent.js

echo "Build process completed successfully"
