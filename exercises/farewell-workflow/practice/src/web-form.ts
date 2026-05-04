// web-form.ts
import express, { Request, Response } from 'express';
import { Client, Connection } from '@temporalio/client';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the HTML form
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Spanish Greeting & Farewell</title>
      <style>
        body { font-family: Arial; margin: 40px; }
        input, button { padding: 8px; margin: 5px; }
        button { cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Enter Your Name</h1>
      <form id="greetingForm">
        <input type="text" id="name" placeholder="Enter your name" required>
        <button type="submit">Submit</button>
      </form>
      <div id="result"></div>
      
      <script>
        document.getElementById('greetingForm').onsubmit = async (e) => {
          e.preventDefault();
          const name = document.getElementById('name').value;
          const result = document.getElementById('result');
          result.innerHTML = 'Processing...';
          
          const response = await fetch('/trigger-workflow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          });
          
          const data = await response.json();
          result.innerHTML = '<pre>' + data.message + '</pre>';
        };
      </script>
    </body>
    </html>
  `);
});

// Endpoint to trigger the workflow
app.post('/trigger-workflow', async (req: Request, res: Response) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  try {
    const connection = await Connection.connect();
    const client = new Client({ connection });
    
    const handle = await client.workflow.start('greeting', {
      taskQueue: 'translation-tasks',
      args: [name],
      workflowId: `web-form-${Date.now()}`,
    });
    
    const result = await handle.result();
    
    res.json({ message: result });
    await connection.close();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Workflow failed' });
  }
});

app.listen(port, () => {
  console.log(`Web form available at http://localhost:${port}`);
});
