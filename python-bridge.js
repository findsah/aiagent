/**
 * Python Bridge - Integration layer for the FixItAll Python agent
 * This module provides a bridge between the Node.js application and the Python drawing analysis functionality
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert fs.writeFile to Promise-based
const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);
const mkdirAsync = util.promisify(fs.mkdir);

/**
 * PythonBridge class to handle communication with the Python FixItAll agent
 */
class PythonBridge {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = path.join(__dirname, 'fixit_all_agent.py');
    this.tempDir = path.join(__dirname, 'temp');
    
    // Ensure the temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Check if the Python environment is properly set up
   * @returns {Promise<boolean>} True if Python and required packages are available
   */
  async checkEnvironment() {
    try {
      // Create a simple test script to check for required packages
      const testScriptPath = path.join(this.tempDir, 'test_imports.py');
      const testScript = `
import sys
try:
    import cv2
    import pytesseract
    import pdfplumber
    import ezdxf
    import pandas
    import numpy
    import fuzzywuzzy
    print("SUCCESS: All packages are available")
    sys.exit(0)
except ImportError as e:
    print(f"ERROR: Missing package - {str(e)}")
    sys.exit(1)
      `;
      
      await writeFileAsync(testScriptPath, testScript);
      
      return new Promise((resolve) => {
        const pythonProcess = spawn(this.pythonPath, [testScriptPath]);
        
        let output = '';
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          console.error(`Python Error: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0 && output.includes('SUCCESS')) {
            resolve(true);
          } else {
            console.error('Python environment check failed:', output);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Error checking Python environment:', error);
      return false;
    }
  }

  /**
   * Process a drawing file using the FixItAll Python agent
   * @param {string} filePath Path to the drawing file
   * @returns {Promise<object>} Analysis results from the Python agent
   */
  async processDrawing(filePath) {
    try {
      // Create a temporary Python script to run the FixItAll agent
      const runnerScriptPath = path.join(this.tempDir, 'run_fixit_agent.py');
      const uploadPath = path.dirname(filePath);
      const filename = path.basename(filePath);
      
      const runnerScript = `
import sys
import json
import os
sys.path.append('${__dirname.replace(/\\/g, '\\\\')}')

try:
    from fixit_all_agent import FixItAllAgent
    
    # Initialize the agent with the upload path
    agent = FixItAllAgent('${uploadPath.replace(/\\/g, '\\\\')}')
    
    # Process the file
    result = agent.process('${filename}')
    
    # Convert any non-serializable objects to strings
    def sanitize_for_json(obj):
        if isinstance(obj, (list, tuple)):
            return [sanitize_for_json(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: sanitize_for_json(value) for key, value in obj.items()}
        else:
            try:
                json.dumps(obj)
                return obj
            except (TypeError, OverflowError):
                return str(obj)
    
    # Print the result as JSON
    print(json.dumps(sanitize_for_json(result)))
    sys.exit(0)
except Exception as e:
    error_info = {
        'error': str(e),
        'type': str(type(e).__name__)
    }
    print(json.dumps(error_info))
    sys.exit(1)
      `;
      
      await writeFileAsync(runnerScriptPath, runnerScript);
      
      return new Promise((resolve, reject) => {
        const pythonProcess = spawn(this.pythonPath, [runnerScriptPath]);
        
        let output = '';
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        let errorOutput = '';
        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(output);
              resolve(result);
            } catch (error) {
              reject(new Error(`Failed to parse Python output: ${output}`));
            }
          } else {
            reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
          }
        });
      });
    } catch (error) {
      console.error('Error processing drawing with Python:', error);
      throw error;
    }
  }

  /**
   * Generate requirements.txt file for Python dependencies
   * @returns {Promise<void>}
   */
  async generateRequirements() {
    const requirements = [
      'opencv-python>=4.5.0',
      'pytesseract>=0.3.8',
      'pdfplumber>=0.7.0',
      'ezdxf>=0.17.0',
      'pandas>=1.3.0',
      'numpy>=1.20.0',
      'fuzzywuzzy>=0.18.0',
      'python-Levenshtein>=0.12.2'  // For better performance with fuzzywuzzy
    ];
    
    const requirementsPath = path.join(__dirname, 'requirements.txt');
    await writeFileAsync(requirementsPath, requirements.join('\n'));
    
    console.log(`Requirements file generated at ${requirementsPath}`);
    return requirementsPath;
  }
}

module.exports = new PythonBridge();
