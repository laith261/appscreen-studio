/**
 * App Screen Studio - Unified MCP JSON-RPC Request Handler
 * Shared between the stdio MCP server (mcp/server.js) and the unified HTTP server (server.mjs).
 */

import { TOOL_DEFINITIONS, executeTool } from './tools.js';
import { RESOURCE_DEFINITIONS, readResource } from './resources.js';
import { PROMPT_DEFINITIONS, getPrompt } from './prompts.js';

export const SERVER_NAME = 'appscreen-studio-mcp';
export const SERVER_VERSION = '1.0.0';
export const PROTOCOL_VERSION = '2024-11-05';

/**
 * Processes a single JSON-RPC 2.0 MCP request object and returns the JSON-RPC response object
 * (or null for notifications that do not expect a response).
 * @param {Object} request JSON-RPC 2.0 request payload
 * @param {Function} [onLog] Optional logger callback
 * @returns {Promise<Object|null>} JSON-RPC 2.0 response payload
 */
export async function processMcpRequest(request, onLog = () => {}) {
  if (!request || typeof request !== 'object') {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Invalid Request' }
    };
  }

  const { id, method, params } = request;

  // Handle notifications (no id)
  if (id === undefined || id === null) {
    if (method === 'notifications/initialized') {
      onLog('Client initialized session successfully');
    }
    return null;
  }

  try {
    switch (method) {
      case 'initialize': {
        onLog(`Client initializing session: ${params?.clientInfo?.name || 'unknown'}`);
        return {
          jsonrpc: '2.0',
          id,
          result: {
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
          }
        };
      }

      case 'ping': {
        return { jsonrpc: '2.0', id, result: {} };
      }

      case 'tools/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: { tools: TOOL_DEFINITIONS }
        };
      }

      case 'tools/call': {
        if (!params || !params.name) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: "name" is required for tools/call' }
          };
        }
        onLog(`Calling tool: ${params.name}`);
        const result = await executeTool(params.name, params.arguments || {});
        return {
          jsonrpc: '2.0',
          id,
          result
        };
      }

      case 'resources/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: { resources: RESOURCE_DEFINITIONS }
        };
      }

      case 'resources/read': {
        if (!params || !params.uri) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: "uri" is required for resources/read' }
          };
        }
        const resource = readResource(params.uri);
        if (!resource) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32002, message: `Resource not found: ${params.uri}` }
          };
        }
        return {
          jsonrpc: '2.0',
          id,
          result: { contents: [resource] }
        };
      }

      case 'prompts/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: { prompts: PROMPT_DEFINITIONS }
        };
      }

      case 'prompts/get': {
        if (!params || !params.name) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: "name" is required for prompts/get' }
          };
        }
        const prompt = getPrompt(params.name, params.arguments || {});
        if (!prompt) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Prompt not found: ${params.name}` }
          };
        }
        return {
          jsonrpc: '2.0',
          id,
          result: prompt
        };
      }

      default: {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        };
      }
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: 'Internal server error',
        data: error.message || String(error)
      }
    };
  }
}
