# Suddeco AI Agent

An intelligent agent for processing architectural and structural engineering drawings to extract measurements, identify tasks, and calculate quantities for Suddeco software.

## Project Overview

The Suddeco AI Agent is designed to assist with detailed architectural work by reading and extracting precise measurements and annotations from architectural drawings. It parses the extracted information into structured data formats (CSV, JSON, Excel) to support construction estimation, documentation, and integration with software development.

## Features

- Upload and process architectural and structural engineering drawings (PDF, PNG)
- Extract precise measurements according to architectural scale
- Parse annotations and room specifications
- Convert extracted data into structured formats
- Generate project descriptions
- Identify stages, tasks, materials, and quantities
- Integrate with OpenAI API for intelligent processing

## Project Structure

```
suddeco-ai-agent/
├── poc_implementation.js     # Main server implementation
├── package.json              # Project dependencies
├── public/                   # Frontend assets
│   └── index.html            # Web interface
├── data/                     # Reference data (create this directory)
├── uploads/                  # Upload directory (created automatically)
└── outputs/                  # Output files (created automatically)
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (Node Package Manager)

### Installation

1. Clone this repository or extract the provided files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

4. Create required directories:

```bash
mkdir -p data uploads outputs
```

5. Set up your OpenAI API key as an environment variable (or it will use the one in the code):

```bash
# For Windows
set OPENAI_API_KEY=your_api_key_here

# For macOS/Linux
export OPENAI_API_KEY=your_api_key_here
```

### Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Usage

1. Open the application in your web browser
2. Upload an architectural or structural drawing (PDF or PNG)
3. The system will process the drawing and extract measurements, annotations, and other data
4. View the extracted data in the various tabs
5. Download the results in CSV, JSON, or Excel format

## Development Workflow

See the `development_workflow.md` file for a detailed development plan.

## Technical Architecture

See the `technical_architecture.md` file for a detailed description of the system architecture.

## POC Implementation Plan

See the `poc_implementation_plan.md` file for details on the proof of concept implementation.

## Project Requirements

See the `project_requirements.md` file for a detailed list of project requirements.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
