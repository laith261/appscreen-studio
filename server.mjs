/**
 * AppScreen Studio - Local HTTP Web Server
 * Zero-dependency static file server using Node.js built-in http, fs, and path modules.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // API: List workspace projects created by MCP or saved on disk
    if (pathname === '/api/projects') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

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
          // Also remove corresponding preview SVG if it exists
          const svgSample1 = path.join(ROOT_DIR, 'sample_screen_1.svg');
          if (file.includes('sample') && fs.existsSync(svgSample1)) {
            try { fs.unlinkSync(svgSample1); } catch (e) {}
          }
          // Update workspace_projects.json
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
  console.log(`\n🚀 AppScreen Studio is running!`);
  console.log(`   Local URL:    http://localhost:${PORT}/`);
  console.log(`   Studio App:   http://localhost:${PORT}/editor.html`);
  console.log(`   Dashboard:    http://localhost:${PORT}/index.html`);
  console.log(`   MCP Endpoint: stdio (mcp/server.js)`);
  console.log(`   Press Ctrl+C to stop.\n`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
