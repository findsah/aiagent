const express = require('express');
const app = express();
const port = 3030;

app.get('/', (req, res) => {
  res.send('Suddeco AI Drawing Processor is working!');
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});
