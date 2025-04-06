# Suddeco AI Agent - Technical Architecture

## System Architecture

### 1. Input Processing Layer
- **Document Uploader**
  -  Handles multiple PDF and PNG uploads
  - Validates file formats and sizes
  - Prepares files for processing

- **Image Preprocessor**
  - Converts PDFs to processable images
  - Enhances image quality for better OCR
  - Normalizes scale and orientation

### 2. AI Processing Core
- **OpenAI Integration Module**
  - Manages API authentication
  - Handles request/response cycles
  - Implements context management
  - Processes rate limiting and error handling

- **Computer Vision Engine**
  - Performs OCR on drawings
  - Detects lines, shapes, and symbols
  - Identifies text annotations and dimensions
  - Calibrates scale based on drawing information

- **Measurement Extraction System**
  - Calculates real-world measurements from scaled drawings with length and height
  - Processes dimension annotations
  - Handles different unit systems (metric/imperial)
  - Validates measurements for consistency

### 3. Data Processing Layer
- **Annotation Parser**
  - Extracts and categorizes text annotations
  - Identifies room names and specifications
  - Processes material callouts and notes
  - Links annotations to spatial elements

- **Project Structure Analyzer**
  - Identifies building components and spaces
  - Determines project stages and tasks
  - Maps elements to Suddeco's task database
  - Calculates quantities based on measurements

- **Material Quantity Calculator**
  - Estimates material requirements
  - Calculates areas, volumes, and counts
  - Applies standard wastage factors
  - Links materials to Suddeco's material database

### 4. Output Generation Layer
- **Data Formatter**
  - Structures extracted data into defined schemas
  - Generates CSV tables for room data
  - Creates JSON objects for complex structures
  - Builds Excel reports with formulas and formatting

- **Project Description Generator**
  - Creates natural language summaries
  - Highlights key project elements
  - Summarizes scope and scale
  - Identifies special considerations

### 5. Integration Layer
- **Suddeco API Client**
  - Communicates with Suddeco backend
  - Synchronizes extracted data
  - Updates project information
  - Retrieves reference data ( area / rooms ,stages ,tasks, materials and quantities)

- **User Interface Components**
  - Displays processing status
  - Visualizes extracted data
  - Provides validation interfaces
  - Enables manual corrections

## Data Flow

1. **Input Stage**
   - User uploads architectural/structural drawings
   - System validates and preprocesses files
   - Drawing metadata is extracted

2. **Processing Stage**
   - AI analyzes drawings for text, symbols, and measurements
   - Scale is determined and calibrated
   - Annotations are extracted and categorized
   - Measurements are calculated according to scale

3. **Analysis Stage**
   - Spaces and components are identified
   - Project stages and tasks are mapped
   - Materials are identified and quantified
   - Relationships between elements are established

4. **Output Stage**
   - Structured data is generated in required formats
   - Project description is created
   - Data is validated for consistency and completeness
   - Results are presented to the user

5. **Integration Stage**
   - Extracted data is synchronized with Suddeco
   - Project is created or updated in the system
   - Tasks and materials are linked to Suddeco database 
   - User can review and approve the results

## Technology Stack

- **Frontend**
  - React.js for user interface
  - Material-UI for components
  - PDF.js for client-side PDF rendering
  - Chart.js for data visualization

- **Backend**
  - Node.js application server
  - Express.js for API endpoints
  - Multer for file uploads
  - Sharp for image processing

- **AI & Processing**
  - OpenAI API for drawing analysis
  - Tesseract.js for OCR backup
  - OpenCV.js for computer vision tasks
  - PDFLib for PDF manipulation

- **Data Storage**
  - MongoDB for processed data
  - Redis for caching and job queues
  - AWS S3 for document storage

- **Integration**
  - RESTful APIs for Suddeco communication
  - WebSockets for real-time updates
  - JWT for secure authentication
  - Axios for HTTP requests
