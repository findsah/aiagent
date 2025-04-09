const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Suddeco AI Drawing Processor</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
        .status { padding: 15px; background-color: #d4edda; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Suddeco AI Drawing Processor</h1>
        <div class="status">
          <p>Server is running successfully!</p>
          <p>Ready for deployment to Render.</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

const port = 3030;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
