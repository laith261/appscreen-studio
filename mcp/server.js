#!/usr/bin/env node

/**
 * App Screen Studio - Model Context Protocol (MCP) Server
 * Enables any AI agent (Claude Desktop, Cursor, Antigravity, Windsurf, Roo Code, VS Code Copilot, etc.)
 * to inspect, generate, modify, translate, validate, and render Google Play Store screenshots and feature graphics.
 *
 * Implements MCP Specification 2024-11-05 over Standard I/O (stdio).
 */

import readline from 'node:readline';
import { TOOL_DEFINITIONS, executeTool } from './tools.js';
import { RESOURCE_DEFINITIONS, readResource } from './resources.js';
import { PROMPT_DEFINITIONS, getPrompt } from './prompts.js';

const SERVER_NAME = 'appscreen-studio-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

/**
 * Logs informational messages to stderr (never stdout, to keep stdio protocol clean).
 * @param {...any} args
 */
function logInfo(...args) {
  process.stderr.write(`[MCP] ${args.join(' ')}\n`);
}

/**
 * Logs error messages to stderr.
 * @param {...any} args
 */
function logError(...args) {
  process.stderr.write(`[MCP ERROR] ${args.join(' ')}\n`);
}

/**
 * Sends a JSON-RPC 2.0 response or notification to stdout.
 * @param {Object} message
 */
function sendJsonRpc(message) {
  try {
    const raw = JSON.stringify(message);
    process.stdout.write(raw + '\n');
  } catch (err) {
    logError('Failed to serialize JSON-RPC response:', err);
  }
}

/**
 * Sends a successful JSON-RPC result.
 * @param {string|number|null} id
 * @param {Object} result
 */
function sendResult(id, result) {
  sendJsonRpc({
    jsonrpc: '2.0',
    id,
    result
  });
}

/**
 * Sends a JSON-RPC error response.
 * @param {string|number|null} id
 * @param {number} code
 * @param {string} message
 * @param {any} [data]
 */
function sendError(id, code, message, data = null) {
  const errObj = { code, message };
  if (data !== null) errObj.data = data;
  sendJsonRpc({
    jsonrpc: '2.0',
    id,
    error: errObj
  });
}

/**
 * Handles incoming JSON-RPC request and dispatches to appropriate handler.
 * @param {Object} request
 */
async function handleRequest(request) {
  if (!request || typeof request !== 'object') {
    return sendError(null, -32600, 'Invalid Request');
  }

  const { id, method, params } = request;

  // Handle notifications (no id)
  if (id === undefined || id === null) {
    if (method === 'notifications/initialized') {
      logInfo('Client initialized session successfully');
    }
    return;
  }

  try {
    switch (method) {
      case 'initialize': {
        logInfo(`Client initializing session: ${params?.clientInfo?.name || 'unknown'}`);
        return sendResult(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {
            tools: { listChanged: true },
            resources: { listChanged: true, subscribe: false },
            prompts: { listChanged: true }
          },
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION
          }
        });
      }

      case 'ping': {
        return sendResult(id, {});
      }

      // --- Tools ---
      case 'tools/list': {
        return sendResult(id, {
          tools: TOOL_DEFINITIONS
        });
      }

      case 'tools/call': {
        if (!params || !params.name) {
          return sendError(id, -32602, 'Invalid params: "name" is required for tools/call');
        }
        logInfo(`Calling tool: ${params.name}`);
        const result = await executeTool(params.name, params.arguments || {});
        return sendResult(id, result);
      }

      // --- Resources ---
      case 'resources/list': {
        return sendResult(id, {
          resources: RESOURCE_DEFINITIONS
        });
      }

      case 'resources/read': {
        if (!params || !params.uri) {
          return sendError(id, -32602, 'Invalid params: "uri" is required for resources/read');
        }
        const resource = readResource(params.uri);
        if (!resource) {
          return sendError(id, -32002, `Resource not found: ${params.uri}`);
        }
        return sendResult(id, {
          contents: [resource]
        });
      }

      // --- Prompts ---
      case 'prompts/list': {
        return sendResult(id, {
          prompts: PROMPT_DEFINITIONS
        });
      }

      case 'prompts/get': {
        if (!params || !params.name) {
          return sendError(id, -32602, 'Invalid params: "name" is required for prompts/get');
        }
        const prompt = getPrompt(params.name, params.arguments || {});
        if (!prompt) {
          return sendError(id, -32602, `Prompt not found: ${params.name}`);
        }
        return sendResult(id, prompt);
      }

      default: {
        return sendError(id, -32601, `Method not found: ${method}`);
      }
    }
  } catch (error) {
    logError(`Internal error executing ${method}:`, error);
    return sendError(id, -32603, 'Internal server error', error.message || String(error));
  }
}

/**
 * Main application bootstrap initializing standard input stream listener.
 */
function main() {
  logInfo(`Starting ${SERVER_NAME} v${SERVER_VERSION}...`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      handleRequest(parsed);
    } catch (err) {
      logError('Failed to parse incoming line as JSON:', trimmed);
      sendError(null, -32700, 'Parse error');
    }
  });

  rl.on('close', () => {
    logInfo('Stdio stream closed. Exiting server.');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logInfo('Received SIGINT. Shutting down.');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logInfo('Received SIGTERM. Shutting down.');
    process.exit(0);
  });
}

main();
