# Suddeco AI Drawing Processor API Documentation

## Overview

The Suddeco AI Drawing Processor is a powerful tool for analyzing architectural drawings and generating detailed measurements, material quantities, and construction task breakdowns. This document explains how to use both the web interface and the API.

## Web Interface

The web interface is available at `http://localhost:3030` and provides an easy way to upload and process architectural drawings.

### Supported File Types

- PDF (`.pdf`)
- DXF (`.dxf`)
- DWG (`.dwg`)
- JSON (`.json`)

### Using the Web Interface

1. Navigate to `http://localhost:3030` in your browser
2. Drag and drop a drawing file or click "Browse Files" to select a file
3. Click "Process Drawing" to analyze the file
4. View the results in the various report formats:
   - HTML Report: Detailed measurements in a formatted web page
   - Text Report: Simple text-based report with all measurements
   - SKSON Data: Structured data file for software integration

## API Endpoint

The API endpoint is available at `http://localhost:3030/api/process-drawing` and allows programmatic access to the drawing processor.

### API Request

**Endpoint:** `POST http://localhost:3030/api/process-drawing`

**Content-Type:** `multipart/form-data`

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| drawing   | File | Yes      | The architectural drawing file to process (PDF, DXF, DWG, or JSON) |

### API Response

The API returns a JSON response with the following structure:

```json
{
  "success": true,
  "message": "Drawing processed successfully",
  "data": {
    "analysis": {
      // Detailed architectural analysis with measurements
    },
    "materials": {
      // Material quantities required for construction
    },
    "tasks": {
      // Construction task breakdown
    },
    "reportUrls": {
      "skson": "/output/suddeco_detailed_analysis_TIMESTAMP.skson",
      "text": "/suddeco_measurements_report.txt",
      "html": "/measurements_report.html"
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error processing drawing",
  "details": "Error message details"
}
```

## Sample API Usage

### Using cURL

```bash
curl -X POST http://localhost:3030/api/process-drawing \
  -F "drawing=@/path/to/your/drawing.pdf"
```

### Using JavaScript Fetch

```javascript
const form = new FormData();
form.append('drawing', fileInput.files[0]);

fetch('http://localhost:3030/api/process-drawing', {
  method: 'POST',
  body: form
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Output Files

The processor generates several output files:

1. **SKSON File**: `output/suddeco_detailed_analysis_TIMESTAMP.skson`
   - Contains all the structured data for software integration
   - Includes architectural analysis, materials quantities, and task breakdown

2. **Text Report**: `suddeco_measurements_report.txt`
   - Simple text-based report with all measurements and calculations

3. **HTML Report**: `measurements_report.html`
   - Interactive web-based report with detailed measurements

## Data Structure

### Architectural Analysis

The architectural analysis includes:

- Room dimensions (internal and external)
- Floor areas (internal and external)
- Wall surface areas
- Ceiling areas
- Skirting board lengths
- Total building dimensions
- Volume calculations

### Materials Quantities

The materials quantities include:

- Construction materials (concrete, bricks, etc.)
- Finishing materials (paint, tiles, etc.)
- Fixtures and fittings
- Electrical components
- Plumbing components

### Task Breakdown

The task breakdown includes:

- Construction stages
- Detailed tasks for each stage
- Estimated durations
- Required labor
- Dependencies
- Materials used
- Quality control requirements

## Integration with Suddeco Software

The SKSON file can be directly imported into Suddeco software for further processing and visualization.
