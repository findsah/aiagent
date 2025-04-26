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
- Vector database integration with Astra DB for similarity search

## Project Structure

```
suddeco-ai-agent/
├── server.js               # Entry point for the application
├── suddeco-final-agent.js  # Enhanced agent implementation (current)
├── suddeco-schema-api.js   # Schema API implementation
├── swagger-config.js       # Swagger API documentation configuration
├── rag-module.js           # RAG (Retrieval-Augmented Generation) module
├── vector-db.js            # Vector database integration with Astra DB
├── enhanced_system_prompt.js # Enhanced system prompts for OpenAI
├── openai-client.js        # OpenAI API client
├── package.json            # Project dependencies
├── README.md               # Project documentation
├── public/                 # Public assets and UI
│   ├── schema-manager.html # Schema Manager UI
│   ├── rag-chat.html       # RAG Chat UI
│   └── index.html          # Main application UI
├── mock_data/              # Mock data for testing
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
   npm install
   ```

4. Create required directories:
   ```bash
   mkdir -p uploads output
   ```

5. Add your OpenAI API key in the .env file (see .env.example for reference).

### Running the Application

Start the server:

```bash
node server.js
```

The application will be available at http://localhost:10000

## API Endpoints

### Main API Endpoints

- **API Documentation:** `/api-docs`
- **Process Drawing:** `POST /api/process-drawing`
- **Generate Description:** `POST /api/generate-description`
- **Estimate Measurements:** `POST /api/estimate-measurements`

### RAG-Enhanced Endpoints

- **RAG Search:** `GET /api/rag/search`
- **RAG Chat:** `POST /api/rag/chat`
- **RAG Process Drawing:** `POST /api/rag/process-drawing`

### Schema API Endpoints

- **Projects:** `GET/POST /api/schema/projects`
- **Stages:** `GET /api/schema/stages`
- **Tasks:** `GET /api/schema/tasks`
- **Materials:** `GET /api/schema/materials`
- **Drawing Upload:** `POST /api/schema/drawings/upload`
- **Vector Search:** `GET /api/schema/drawings/search`

## Deployment Instructions

### Environment Setup
1. Create a `.env` file in the root directory
2. Add your environment variables:
   ```
   # OpenAI API Key (required)
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Server Configuration
   PORT=10000
   
   # Vector Database Configuration (optional)
   ASTRA_DB_TOKEN=your_astra_db_token_here
   ASTRA_DB_ENDPOINT=your_astra_db_endpoint_here
   ASTRA_DB_COLLECTION=suddeco_drawings
   ```

### Option 1: Deploy to Render (Recommended)

1. Create a free account on [Render](https://render.com/)
2. Connect your GitHub repository
3. Create a new Web Service
4. Select your repository
5. Configure the service:
   - Name: suddeco-ai-drawing-processor
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Add environment variables:
   - OPENAI_API_KEY: your_openai_api_key_here
   - PORT: 10000
   - ASTRA_DB_TOKEN: (optional) your_astra_db_token_here
   - ASTRA_DB_ENDPOINT: (optional) your_astra_db_endpoint_here
   - ASTRA_DB_COLLECTION: (optional) suddeco_drawings
7. Deploy the service

The application will be available at https://suddeco-ai.onrender.com

## Vector Database Integration

The application now includes integration with Astra DB for vector similarity search. This enables:

- Storing drawing analyses with vector embeddings
- Searching for similar drawings based on semantic similarity
- Storing and retrieving reference data (materials, tasks, stages, rooms)

### Setting Up Vector Database

1. Create an account on [DataStax Astra](https://astra.datastax.com/)
2. Create a new Vector Database
3. Generate an API token with Admin permissions
4. Add the token and endpoint to your `.env` file
5. Run the initialization script to populate the database:
   ```
   node astra-db-init.js
   ```

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
