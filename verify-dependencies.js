// Dependency verification script for Suddeco AI Drawing Processor
// This script checks that all required modules and files are present and can be loaded

const fs = require('fs');
const path = require('path');

console.log('Suddeco AI Drawing Processor - Dependency Verification');
console.log('=====================================================');

// Required files to check
const requiredFiles = [
  'server.js',
  'suddeco-final-agent.js',
  'api-client.js',
  'rag-module.js',
  'suddeco-schema-api.js',
  'patched-pdf-parse.js'
];

// Required directories to check
const requiredDirs = [
  'uploads',
  'output',
  'temp',
  'test/data',
  'mock_data',
  'public'
];

// Check files
console.log('\nChecking required files:');
let allFilesPresent = true;
for (const file of requiredFiles) {
  try {
    const stats = fs.statSync(file);
    if (stats.isFile()) {
      console.log(`✓ ${file} exists (${stats.size} bytes)`);
    } else {
      console.log(`✗ ${file} exists but is not a file!`);
      allFilesPresent = false;
    }
  } catch (error) {
    console.log(`✗ ${file} is missing! (${error.message})`);
    allFilesPresent = false;
  }
}

// Check directories
console.log('\nChecking required directories:');
let allDirsPresent = true;
for (const dir of requiredDirs) {
  try {
    const stats = fs.statSync(dir);
    if (stats.isDirectory()) {
      console.log(`✓ ${dir} exists`);
    } else {
      console.log(`✗ ${dir} exists but is not a directory!`);
      allDirsPresent = false;
    }
  } catch (error) {
    console.log(`✗ ${dir} is missing! (${error.message})`);
    allDirsPresent = false;
    
    // Create missing directory
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  Created missing directory: ${dir}`);
    } catch (mkdirError) {
      console.log(`  Failed to create directory: ${mkdirError.message}`);
    }
  }
}

// Check module dependencies
console.log('\nChecking module dependencies:');

// Function to check if a module can be required
function checkModule(modulePath) {
  try {
    require(modulePath);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      requireStack: error.requireStack
    };
  }
}

// Check each module
const moduleResults = {};
for (const file of requiredFiles) {
  if (file.endsWith('.js')) {
    const modulePath = `./${file}`;
    const result = checkModule(modulePath);
    moduleResults[file] = result;
    
    if (result.success) {
      console.log(`✓ ${file} can be loaded successfully`);
    } else {
      console.log(`✗ ${file} failed to load: ${result.error}`);
      if (result.requireStack) {
        console.log(`  Require stack: ${JSON.stringify(result.requireStack)}`);
      }
    }
  }
}

// Check specific dependencies
console.log('\nChecking specific module imports:');

// Check if rag-module can import api-client
const ragModuleContent = fs.readFileSync('rag-module.js', 'utf8');
if (ragModuleContent.includes("require('./api-client')")) {
  console.log('✓ rag-module.js imports api-client.js');
} else {
  console.log('✗ rag-module.js does not import api-client.js');
}

// Check if server.js imports suddeco-final-agent
const serverContent = fs.readFileSync('server.js', 'utf8');
if (serverContent.includes("require('./suddeco-final-agent')")) {
  console.log('✓ server.js imports suddeco-final-agent.js');
} else {
  console.log('✗ server.js does not import suddeco-final-agent.js');
}

// Summary
console.log('\nVerification Summary:');
console.log(`Files: ${allFilesPresent ? 'All present' : 'Some missing'}`);
console.log(`Directories: ${allDirsPresent ? 'All present' : 'Some missing but created'}`);

const allModulesLoadable = Object.values(moduleResults).every(r => r.success);
console.log(`Module loading: ${allModulesLoadable ? 'All modules can be loaded' : 'Some modules failed to load'}`);

if (!allFilesPresent || !allModulesLoadable) {
  console.log('\nRecommendations:');
  if (!allFilesPresent) {
    console.log('- Create any missing files listed above');
  }
  if (!allModulesLoadable) {
    console.log('- Check the error messages for module loading failures');
    console.log('- Ensure all required dependencies are installed (npm install)');
    console.log('- Fix any import/require paths in the failing modules');
  }
}

console.log('\nVerification complete!');
