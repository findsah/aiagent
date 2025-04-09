require('dotenv').config();
const OpenAI = require('openai');

// Check if OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  console.log('Please create a .env file with your OpenAI API key:');
  console.log('OPENAI_API_KEY=your_api_key_here');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test OpenAI connection
async function testOpenAI() {
  try {
    console.log('Testing OpenAI connection...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Hello from Suddeco AI Drawing Processor!"
        }
      ]
    });
    
    console.log('OpenAI connection successful!');
    console.log('Response:', response.choices[0].message.content);
    console.log('\nYour application is ready to be deployed to Render!');
  } catch (error) {
    console.error('Error connecting to OpenAI:', error.message);
    console.log('\nPlease check your API key and try again.');
  }
}

testOpenAI();
