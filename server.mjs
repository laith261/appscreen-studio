/**
 * AppScreen Studio - Unified Web Studio & Model Context Protocol (MCP) Server
 * Serves the web studio UI, real-time project sync API, Server-Sent Events (SSE) live bridge,
 * and HTTP MCP JSON-RPC 2.0 endpoint from a single zero-dependency Node.js process.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processMcpRequest, SERVER_NAME, SERVER_VERSION } from './mcp/handler.js';
import {
  TOOL_DEFINITIONS,
  executeTool,
  ACTIVE_SESSION_FILE,
  readActiveSession,
  writeActiveSession
} from './mcp/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.md': 'text/markdown; charset=utf-8'
};

/** Connected Server-Sent Events (SSE) clients for real-time Web <-> MCP synchronization */
const sseClients = new Set();

/**
 * Broadcasts an SSE event to all connected web studio tabs.
 * @param {string} eventName
 * @param {Object} payload
 */
function broadcastSse(eventName, payload) {
  const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(message);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

// Watch workspace directory for MCP stdio updates to .active_project.json or project .json files
let watchDebounceTimer = null;
let lastBroadcastTime = 0;
try {
  fs.watch(ROOT_DIR, (eventType, filename) => {
    if (!filename) return;
    if (filename === '.active_project.json' || (filename.endsWith('.json') && !filename.includes('package'))) {
      clearTimeout(watchDebounceTimer);
      watchDebounceTimer = setTimeout(() => {
        const session = readActiveSession();
        if (session && session.updatedAt && session.updatedAt !== lastBroadcastTime) {
          lastBroadcastTime = session.updatedAt;
          broadcastSse('project_updated', session);
        } else if (filename.endsWith('.json') && filename !== '.active_project.json') {
          try {
            const fullPath = path.join(ROOT_DIR, filename);
            if (fs.existsSync(fullPath)) {
              const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
              if (data && Array.isArray(data.screens)) {
                broadcastSse('file_updated', {
                  filename,
                  updatedAt: Date.now(),
                  projectData: data
                });
              }
            }
          } catch (e) {}
        }
      }, 60);
    }
  });
} catch (err) {
  console.warn('File watcher notice:', err.message);
}

/**
 * Reads JSON request body from an incoming HTTP request.
 * @param {http.IncomingMessage} req
 * @returns {Promise<Object>}
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Sets standard CORS headers for API and MCP endpoints.
 * @param {http.ServerResponse} res
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    if (req.method === 'OPTIONS') {
      setCorsHeaders(res);
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. Server-Sent Events (SSE) Live Bridge between Web Studio and MCP
    if (pathname === '/api/events' && req.method === 'GET') {
      setCorsHeaders(res);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      });
      res.write(`event: connected\ndata: ${JSON.stringify({ server: SERVER_NAME, version: SERVER_VERSION })}\n\n`);
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    // 2. Unified MCP JSON-RPC 2.0 HTTP Endpoint (/mcp)
    if (pathname === '/mcp') {
      setCorsHeaders(res);
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          name: SERVER_NAME,
          version: SERVER_VERSION,
          status: 'online',
          toolsCount: TOOL_DEFINITIONS.length,
          endpoints: {
            jsonrpc: 'POST /mcp',
            tools: 'GET /api/mcp/tools',
            call: 'POST /api/mcp/call',
            events: 'GET /api/events',
            activeProject: 'GET/POST /api/projects/sync'
          }
        }, null, 2));
        return;
      }

      if (req.method === 'POST') {
        try {
          const rpcPayload = await readJsonBody(req);
          const rpcResponse = await processMcpRequest(rpcPayload);
          if (!rpcResponse) {
            res.writeHead(204);
            res.end();
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(rpcResponse));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error', data: err.message }
          }));
        }
        return;
      }
    }

    // 3. Direct REST MCP Tool Endpoints for Web Studio UI (/api/mcp/tools & /api/mcp/call)
    if (pathname === '/api/mcp/tools' && req.method === 'GET') {
      setCorsHeaders(res);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ tools: TOOL_DEFINITIONS }, null, 2));
      return;
    }

    if (pathname === '/api/mcp/call' && req.method === 'POST') {
      setCorsHeaders(res);
      const body = await readJsonBody(req);
      if (!body || !body.name) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Tool "name" is required' }));
        return;
      }
      const result = await executeTool(body.name, body.arguments || {});
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result, null, 2));
      return;
    }

    // 4. Live Active Project Sync API (/api/projects/sync)
    if (pathname === '/api/projects/sync') {
      setCorsHeaders(res);
      if (req.method === 'GET') {
        const session = readActiveSession();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(session || { projectData: null }));
        return;
      }

      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        const projectData = body.projectData || body;
        if (!projectData || !Array.isArray(projectData.screens)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Valid projectData with screens array is required' }));
          return;
        }
        const saved = writeActiveSession(projectData, {
          projectId: body.projectId || 'live-session',
          boundFile: body.boundFile || null,
          source: body.source || 'web'
        });
        if (saved) {
          lastBroadcastTime = saved.updatedAt;
          broadcastSse('project_updated', saved);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, updatedAt: saved?.updatedAt || Date.now() }));
        return;
      }
    }

    // 5. API: List or delete workspace projects created by MCP or saved on disk
    if (pathname === '/api/projects') {
      setCorsHeaders(res);

      if (req.method === 'GET') {
        try {
          const files = fs.readdirSync(ROOT_DIR);
          const projects = [];
          for (const file of files) {
            if (file.endsWith('.json') && !file.includes('package') && !file.includes('config') && !file.startsWith('.')) {
              try {
                const fullPath = path.join(ROOT_DIR, file);
                const stat = fs.statSync(fullPath);
                if (stat.isFile()) {
                  const raw = fs.readFileSync(fullPath, 'utf8');
                  const data = JSON.parse(raw);
                  if (data && data.projectName && Array.isArray(data.screens)) {
                    projects.push({
                      id: file.replace('.json', ''),
                      filename: file,
                      name: data.projectName,
                      screens: data.screens.length,
                      languages: data.languages || ['en'],
                      updated: stat.mtimeMs,
                      isFile: true,
                      fileUrl: `/${file}`
                    });
                  }
                }
              } catch (e) {}
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(projects, null, 2));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      if (req.method === 'DELETE') {
        try {
          const file = parsedUrl.searchParams.get('file');
          if (!file || !file.endsWith('.json') || file.includes('package') || file.includes('..')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid file parameter' }));
            return;
          }
          const targetPath = path.join(ROOT_DIR, path.basename(file));
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
          }
          const svgSample1 = path.join(ROOT_DIR, 'sample_screen_1.svg');
          if (file.includes('sample') && fs.existsSync(svgSample1)) {
            try { fs.unlinkSync(svgSample1); } catch (e) {}
          }
          const wpPath = path.join(ROOT_DIR, 'workspace_projects.json');
          if (fs.existsSync(wpPath)) {
            try {
              const wpList = JSON.parse(fs.readFileSync(wpPath, 'utf8'));
              const filtered = wpList.filter(item => item.filename !== file && item.id !== file.replace('.json', ''));
              fs.writeFileSync(wpPath, JSON.stringify(filtered, null, 2), 'utf8');
            } catch (e) {}
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, deleted: file }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }
    }

    if (pathname === '/') {
      pathname = '/index.html';
    }

    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT_DIR, safePath);

    // Prevent directory traversal
    if (!filePath.startsWith(ROOT_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${pathname}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    });
  } catch (error) {
    console.error('Server request error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 AppScreen Studio + MCP Unified Server is running!`);
  console.log(`   Local URL:      http://localhost:${PORT}/`);
  console.log(`   Studio App:     http://localhost:${PORT}/editor.html`);
  console.log(`   Dashboard:      http://localhost:${PORT}/index.html`);
  console.log(`   MCP HTTP RPC:   http://localhost:${PORT}/mcp`);
  console.log(`   MCP Live Sync:  http://localhost:${PORT}/api/events`);
  console.log(`   MCP Stdio CLI:  node mcp/server.js`);
  console.log(`   Press Ctrl+C to stop.\n`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
