# Suddeco AI Drawing Processor

An intelligent agent for dynamically processing architectural and structural engineering drawings to extract measurements, identify tasks, and calculate quantities for construction projects.

## Project Overview

The Suddeco AI Drawing Processor is designed to assist with detailed architectural work by analyzing and extracting precise measurements and annotations from architectural drawings. It dynamically processes the extracted information to generate comprehensive construction task breakdowns, materials quantities, and architectural analysis without any static measurements.

## Features

- Upload and process architectural and structural engineering drawings (PDF, DXF, DWG, JSON)
- Dynamically extract precise measurements according to architectural scale
- Generate detailed architectural analysis with room dimensions and areas
- Calculate comprehensive materials quantities based on the analysis
- Create detailed construction task breakdowns with dependencies and timelines
- Convert extracted data into structured formats (JSON)
- Integrate with OpenAI API for intelligent processing

## Project Structure

```
suddeco-ai-agent/
├── suddeco-agent.js        # Main server implementation
├── package.json            # Project dependencies
├── README.md               # Project documentation
├── SUDDECO_AGENT_DOCUMENTATION.md # Detailed documentation
├── uploads/                # Upload directory (created automatically)
└── output/                 # Output files (created automatically)
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/findsah/aiagent.git
   ```

2. Navigate to the project directory:
   ```bash
   cd aiagent
   ```

3. Install dependencies:
   ```bash
   npm install express multer path fs openai cors
   ```

4. Create required directories:
   ```bash
   mkdir -p uploads output
   ```

5. Add your OpenAI API key in the suddeco-agent.js file or set it as an environment variable.

### Running the Application

Start the server:

```bash
node suddeco-agent.js
```

The application will be available at http://localhost:8090

## Usage

1. Open the application in your web browser at http://localhost:8090
2. Upload an architectural drawing (PDF, DXF, DWG, or JSON)
3. The system will process the drawing and generate comprehensive reports
4. View and download the analysis results, materials quantities, and construction tasks

## API Endpoints

### Process Drawing

**Endpoint:** `POST /api/process`

Upload a drawing file for processing.

### Get Latest Analysis

**Endpoint:** `GET /api/latest`

Retrieve the latest processed drawing data.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
