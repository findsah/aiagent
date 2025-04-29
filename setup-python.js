/**
 * Python Environment Setup Script
 * This script helps set up the Python environment required for the FixItAll agent
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const pythonBridge = require('./python-bridge');

// Function to check if Python is installed
async function checkPythonInstallation() {
  return new Promise((resolve) => {
    const pythonProcess = spawn(pythonBridge.pythonPath, ['--version']);
    
    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Python is installed: ${output.trim()}`);
        resolve(true);
      } else {
        console.error('Python is not installed or not in PATH');
        resolve(false);
      }
    });
  });
}

// Function to install Python packages
async function installPythonPackages() {
  return new Promise((resolve) => {
    const requirementsPath = path.join(__dirname, 'requirements.txt');
    
    if (!fs.existsSync(requirementsPath)) {
      console.error('requirements.txt not found');
      resolve(false);
      return;
    }
    
    console.log('Installing Python packages...');
    const pipProcess = spawn(pythonBridge.pythonPath, ['-m', 'pip', 'install', '-r', requirementsPath]);
    
    pipProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    pipProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    pipProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Python packages installed successfully');
        resolve(true);
      } else {
        console.error(`Failed to install Python packages (exit code: ${code})`);
        resolve(false);
      }
    });
  });
}

// Function to verify the Python environment
async function verifyPythonEnvironment() {
  console.log('Verifying Python environment...');
  const environmentOk = await pythonBridge.checkEnvironment();
  
  if (environmentOk) {
    console.log('✅ Python environment is properly set up');
    return true;
  } else {
    console.error('❌ Python environment verification failed');
    return false;
  }
}

// Main function
async function main() {
  console.log('Setting up Python environment for FixItAll agent...');
  
  // Step 1: Check if Python is installed
  const pythonInstalled = await checkPythonInstallation();
  if (!pythonInstalled) {
    console.error('Please install Python 3.8 or later and make sure it is in your PATH');
    process.exit(1);
  }
  
  // Step 2: Install Python packages
  const packagesInstalled = await installPythonPackages();
  if (!packagesInstalled) {
    console.error('Failed to install required Python packages');
    process.exit(1);
  }
  
  // Step 3: Verify the Python environment
  const environmentVerified = await verifyPythonEnvironment();
  if (!environmentVerified) {
    console.error('Python environment verification failed');
    process.exit(1);
  }
  
  console.log('Python environment setup completed successfully');
  console.log('You can now use the FixItAll agent through the /api/advanced-analysis endpoint');
}

// Run the main function
main().catch((error) => {
  console.error('Error setting up Python environment:', error);
  process.exit(1);
});
