#!/usr/bin/env node

/**
 * App Screen Studio - Model Context Protocol (MCP) Server
 * Enables any AI agent (Claude Desktop, Cursor, Antigravity, Windsurf, Roo Code, VS Code Copilot, etc.)
 * to inspect, generate, modify, translate, validate, and render Google Play Store screenshots and feature graphics.
 *
 * Implements MCP Specification 2024-11-05 over Standard I/O (stdio) and shares state with the web studio.
 */

import readline from 'node:readline';
import { SERVER_NAME, SERVER_VERSION, processMcpRequest } from './handler.js';

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
 * Main application bootstrap initializing standard input stream listener.
 */
function main() {
  logInfo(`Starting ${SERVER_NAME} v${SERVER_VERSION}...`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      const response = await processMcpRequest(parsed, logInfo);
      if (response) {
        sendJsonRpc(response);
      }
    } catch (err) {
      logError('Failed to parse incoming line as JSON:', trimmed);
      sendJsonRpc({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' }
      });
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
