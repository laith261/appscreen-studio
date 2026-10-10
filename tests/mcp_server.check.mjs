/**
 * Test Suite: AppScreen Studio MCP Server & Tool Integration
 * Verifies that all MCP tools, resources, prompts, and JSON-RPC stdio protocol handlers
 * function correctly and conform to the Model Context Protocol specification.
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { TOOL_DEFINITIONS, executeTool } from '../mcp/tools.js';
import { RESOURCE_DEFINITIONS, readResource } from '../mcp/resources.js';
import { PROMPT_DEFINITIONS, getPrompt } from '../mcp/prompts.js';
import { renderScreenToSvg, renderFeatureGraphicToSvg } from '../mcp/svgRenderer.js';

console.log('Testing AppScreen Studio MCP Server...');

// 1. Tool Definitions Verification
assert(Array.isArray(TOOL_DEFINITIONS), 'Tool definitions must be an array');
assert(TOOL_DEFINITIONS.length >= 15, `Expected at least 15 tools, found ${TOOL_DEFINITIONS.length}`);
const toolNames = TOOL_DEFINITIONS.map(t => t.name);
assert(toolNames.includes('create_project'), 'Missing create_project tool');
assert(toolNames.includes('list_templates'), 'Missing list_templates tool');
assert(toolNames.includes('validate_project'), 'Missing validate_project tool');
assert(toolNames.includes('render_screen_svg'), 'Missing render_screen_svg tool');
assert(toolNames.includes('localize_project'), 'Missing localize_project tool');
console.log(`  ✓ ${TOOL_DEFINITIONS.length} Tool definitions verified`);

// 2. Resource Definitions & Content Reading
assert(Array.isArray(RESOURCE_DEFINITIONS), 'Resource definitions must be an array');
assert(RESOURCE_DEFINITIONS.length >= 5, 'Expected at least 5 resources');
for (const resDef of RESOURCE_DEFINITIONS) {
  const content = readResource(resDef.uri);
  assert(content !== null, `Failed to read resource ${resDef.uri}`);
  assert.equal(content.uri, resDef.uri);
  assert(content.text.length > 20, `Resource ${resDef.uri} content is too short`);
}
console.log(`  ✓ ${RESOURCE_DEFINITIONS.length} Resources successfully resolved and read`);

// 3. Prompt Definitions
assert(Array.isArray(PROMPT_DEFINITIONS), 'Prompt definitions must be an array');
assert(PROMPT_DEFINITIONS.length >= 3, 'Expected at least 3 prompts');
const promptResult = getPrompt('generate_play_store_listing', {
  app_name: 'TestApp',
  app_category: 'Finance',
  key_features: 'Budgets, Crypto tracker'
});
assert(promptResult !== null);
assert(promptResult.messages[0].content.text.includes('TestApp'));
console.log(`  ✓ ${PROMPT_DEFINITIONS.length} Prompts verified`);

// 4. Tool Execution Checks
// Test: list_templates
const templatesRes = await executeTool('list_templates', {});
assert(!templatesRes.isError, 'list_templates failed');
const templates = JSON.parse(templatesRes.content[0].text);
assert(templates.length >= 6, 'Should list at least 6 curated templates');

// Test: get_template
const templateRes = await executeTool('get_template', { template_id: 'vibrant_saas' });
assert(!templateRes.isError, 'get_template failed');
const templateData = JSON.parse(templateRes.content[0].text);
assert.equal(templateData.id, 'vibrant_saas');

// Test: create_project from template
const createRes = await executeTool('create_project', {
  project_name: 'Super Saas Pro',
  template_id: 'vibrant_saas'
});
assert(!createRes.isError, 'create_project failed');
const createData = JSON.parse(createRes.content[0].text);
assert(createData.success, 'Project creation unsuccessful');
assert.equal(createData.projectName, 'Super Saas Pro');
assert(createData.screensCount >= 4, 'Expected at least 4 screens from vibrant_saas');

const project = createData.projectData;

// Test: inspect_project
const inspectRes = await executeTool('inspect_project', { project_data: project });
assert(!inspectRes.isError, 'inspect_project failed');
const inspectData = JSON.parse(inspectRes.content[0].text);
assert.equal(inspectData.totalScreens, project.screens.length);

// Test: add_screen
const addRes = await executeTool('add_screen', {
  project_data: project,
  screen_name: 'Analytics Dashboard',
  headline_text: 'Track Every Metric in Real-Time',
  subtitle_text: 'Custom widgets and daily summaries.',
  badge_label: '📈 99.9% Uptime'
});
assert(!addRes.isError, 'add_screen failed');
const addData = JSON.parse(addRes.content[0].text);
assert(addData.success);
assert.equal(project.screens.length, inspectData.totalScreens + 1);

// Test: list_fonts
const fontsRes = await executeTool('list_fonts', { language_code: 'ar' });
assert(!fontsRes.isError, 'list_fonts failed');
const fontsData = JSON.parse(fontsRes.content[0].text);
assert.equal(fontsData.defaultFontForLanguage, 'Cairo');
assert(Array.isArray(fontsData.popularFonts) && fontsData.popularFonts.length >= 18);

// Test: apply_palette
const paletteRes = await executeTool('apply_palette', {
  project_data: project,
  palette_id: 'cyber_emerald'
});
assert(!paletteRes.isError, 'apply_palette failed');
const paletteData = JSON.parse(paletteRes.content[0].text);
assert(paletteData.success);
assert.equal(project.screens[0].headline.color, '#34d399');

// Test: update_screen
const updateRes = await executeTool('update_screen', {
  project_data: project,
  screen_index_or_id: '0',
  headline_text: 'Brand New Headline Test',
  headline_font: 'Plus Jakarta Sans',
  device_type: 'frameless'
});
assert(!updateRes.isError, 'update_screen failed');
assert.equal(project.screens[0].headline.text, 'Brand New Headline Test');
assert.equal(project.screens[0].headline.fontFamily, 'Plus Jakarta Sans');
assert.equal(project.screens[0].device.type, 'frameless');

// Test: add_badge_to_screen
const badgeRes = await executeTool('add_badge_to_screen', {
  project_data: project,
  screen_index_or_id: '0',
  badge_type: 'rating_badge',
  label: '★ 4.9 (200k+ Reviews)'
});
assert(!badgeRes.isError, 'add_badge_to_screen failed');

// Test: localize_project (Arabic)
const localizeRes = await executeTool('localize_project', {
  project_data: project,
  language_code: 'ar',
  translations: [
    {
      screen_index: 0,
      headline: 'تتبع كل المؤشرات المالية بسهولة',
      subtitle: 'لوحة تحكم ذكية ومؤشرات دقيقة'
    }
  ]
});
assert(!localizeRes.isError, 'localize_project failed');
assert(project.languages.includes('ar'));
assert(project.localeScreens.ar[0].headline.text.includes('تتبع'));
assert.equal(project.localeScreens.ar[0].headline.fontFamily, 'Cairo');

// Test: generate_feature_graphic
const featRes = await executeTool('generate_feature_graphic', {
  project_data: project,
  headline_text: 'The Modern SaaS Powerhouse',
  subtitle_text: 'Over 1M+ teams crushing goals daily'
});
assert(!featRes.isError, 'generate_feature_graphic failed');
assert(project.feature);
assert.equal(project.feature.headline.text, 'The Modern SaaS Powerhouse');

// Test: validate_project
const valRes = await executeTool('validate_project', { project_data: project });
assert(!valRes.isError, 'validate_project failed');
const valData = JSON.parse(valRes.content[0].text);
assert(valData.isValidForPlayStore, 'Validation should be valid for compliant project');

// Test: SVG rendering
const screenSvg = renderScreenToSvg(project.screens[0]);
assert(screenSvg.startsWith('<?xml'), 'SVG must start with XML declaration');
assert(screenSvg.includes('<svg'), 'SVG must contain <svg tag');
assert(screenSvg.includes('Brand New Headline Test'), 'SVG must contain rendered headline');

const featSvg = renderFeatureGraphicToSvg(project.feature);
assert(featSvg.includes('Powerhouse'), 'Feature SVG must contain headline text');
assert(featSvg.includes('The Modern SaaS'), 'Feature SVG must contain headline text');

console.log('  ✓ All 17 Tool executions & validations passed');

// 5. Full Stdio Subprocess JSON-RPC Protocol Test
const serverPath = path.resolve('mcp/server.js');

await new Promise((resolve, reject) => {
  const proc = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';

  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep remainder

    for (const line of lines) {
      if (!line.trim()) continue;
      const resp = JSON.parse(line);

      if (resp.id === 1) {
        // Response to initialize
        assert.equal(resp.result.protocolVersion, '2024-11-05');
        assert.equal(resp.result.serverInfo.name, 'appscreen-studio-mcp');

        // Send tools/list
        proc.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        }) + '\n');
      } else if (resp.id === 2) {
        // Response to tools/list
        assert(resp.result.tools.length >= 15);

        // Send tools/call for list_palettes
        proc.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'list_palettes',
            arguments: {}
          }
        }) + '\n');
      } else if (resp.id === 3) {
        // Response to tools/call
        assert(!resp.result.isError);
        assert(resp.result.content[0].text.includes('Electric Indigo'));

        // All tests passed, close stdin
        proc.stdin.end();
        resolve(true);
      }
    }
  });

  proc.stderr.on('data', () => {
    // Stderr logs are normal for MCP server
  });

  proc.on('error', (err) => reject(err));
  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      reject(new Error(`Server exited with code ${code}`));
    }
  });

  // Start by sending initialize request
  proc.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'mcp-test-runner', version: '1.0.0' }
    }
  }) + '\n');
});

console.log('  ✓ Stdio JSON-RPC 2.0 communication handshake and execution verified');
console.log('All MCP checks passed successfully! ✨');
