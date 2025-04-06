// Simple OpenAI API test for architectural drawing analysis
const fs = require('fs');
const { OpenAI } = require('openai');
const PDFParser = require('pdf-parse');

// Initialize OpenAI with the provided API key
const openai = new OpenAI({
  apiKey: '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'
});

// Path to the PDF file
const pdfPath = './Architect Tech Pack Binder_Rev03 3.pdf';

async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await PDFParser(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

async function analyzeDrawingWithOpenAI(text) {
  try {
    console.log('Sending text to OpenAI for analysis...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI specialized in analyzing architectural drawings. Extract all measurements, room annotations, and determine the scale of the drawing. Provide the data in a structured JSON format with the following keys: 'measurements', 'annotations', 'scale', and 'summary'."
        },
        {
          role: "user",
          content: `Analyze this architectural drawing text content and extract all measurements, annotations, and scale information. Here's the extracted text from the PDF: ${text.substring(0, 4000)}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing drawing with OpenAI:', error);
    throw new Error('Failed to analyze drawing with OpenAI');
  }
}

async function main() {
  try {
    console.log('Starting PDF analysis...');
    
    // Extract text from PDF
    const pdfText = await extractTextFromPDF(pdfPath);
    console.log('PDF text extracted. Length:', pdfText.length);
    console.log('Sample text:', pdfText.substring(0, 200) + '...');
    
    // Analyze with OpenAI
    const analysisResult = await analyzeDrawingWithOpenAI(pdfText);
    console.log('\nAnalysis Result:');
    console.log(analysisResult);
    
    // Save result to file
    fs.writeFileSync('./analysis_result.json', analysisResult);
    console.log('\nAnalysis result saved to analysis_result.json');
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main();
