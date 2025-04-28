#!/bin/bash
# Start script for Render deployment

# Print information about which agent file is being used
echo "Starting Suddeco AI Drawing Processor on Render"
echo "Using suddeco-final-agent.js as the agent file"

# Create necessary directories
mkdir -p uploads
mkdir -p output
mkdir -p temp
mkdir -p test/data
mkdir -p mock_data

# Create empty test file to prevent errors
touch test/data/05-versions-space.pdf

# Verify that all required files exist
echo "Checking for required files..."
for file in server.js suddeco-final-agent.js api-client.js rag-module.js suddeco-schema-api.js patched-pdf-parse.js; do
  if [ -f "$file" ]; then
    echo "✓ $file exists ($(wc -l < $file) lines)"
    # Show first few lines of each file for debugging
    echo "First 5 lines of $file:"
    head -n 5 "$file"
    echo ""
  else
    echo "✗ $file is missing!"
    # If api-client.js is missing, create a minimal version
    if [ "$file" == "api-client.js" ]; then
      echo "Creating minimal api-client.js file..."
      cat > api-client.js << 'EOF'
// Minimal api-client.js created by start-render.sh
function isHtmlResponse(data) {
  if (!data || typeof data !== 'string') return false;
  return data.includes('<html') || data.includes('<!DOCTYPE') || data.includes('<body');
}

module.exports = {
  isHtmlResponse,
  getAllAPIData: async () => ({
    materials: { materials: [] },
    tasks: { tasks: [] },
    stages: { stages: [] },
    rooms: { rooms: [] }
  })
};

// Also export isHtmlResponse directly to ensure compatibility
module.exports.isHtmlResponse = isHtmlResponse;
EOF
      echo "Created minimal api-client.js"
    else
      exit 1
    fi
  fi
done

# Set environment variables to specify configuration
export USE_AGENT_FILE=suddeco-final-agent.js
export NODE_ENV=production

# Log environment information
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Run the dependency verification script if it exists
if [ -f "verify-dependencies.js" ]; then
  echo "Running dependency verification script..."
  node verify-dependencies.js
fi

# Start the server
echo "Starting server with node server.js"
node server.js
