const http = require('http');

const mockContainers = [
  {
    id: 'container1',
    name: 'nginx-web',
    image: 'nginx:latest',
    status: 'running',
    uptime: '2 hours'
  },
  {
    id: 'container2',
    name: 'redis-cache',
    image: 'redis:7',
    status: 'running',
    uptime: '5 hours'
  }
];

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  const method = req.method;

  // Parse request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    console.log(`[${new Date().toISOString()}] ${method} ${url}`);
    try {
      // Login endpoint
      if (url === '/api/auth/login' && method === 'POST') {
        const { username, password } = JSON.parse(body);
        console.log(`Login attempt: ${username}`);

        if (username === 'admin' && password === 'admin123') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            token: 'mock-token-12345',
            username: 'admin'
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          }));
        }
        return;
      }

      // Logout endpoint
      if (url === '/api/auth/logout' && method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // Get containers
      if (url === '/api/containers' && method === 'GET') {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ containers: mockContainers }));
        return;
      }

      // Container operations
      const containerOpMatch = url.match(/^\/api\/containers\/([^\/]+)\/(start|stop|restart)$/);
      if (containerOpMatch && method === 'POST') {
        const [, , operation] = containerOpMatch;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Container ${operation}ed successfully`
        }));
        return;
      }

      // Health check
      if (url === '/health' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      // Delete container
      const deleteMatch = url.match(/^\/api\/containers\/([^\/]+)$/);
      if (deleteMatch && method === 'DELETE') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Container removed successfully'
        }));
        return;
      }

      // Execute command
      const execMatch = url.match(/^\/api\/containers\/([^\/]+)\/exec$/);
      if (execMatch && method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          output: 'Command executed successfully'
        }));
        return;
      }

      // 404 for all other routes
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Mock backend server running on http://localhost:${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Mock backend server stopped');
    process.exit(0);
  });
});
