#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import pg from 'pg';

const { Client } = pg;

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'qqewusetilxxfvfkmsed';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable required');
  process.exit(1);
}

const server = new Server(
  { name: 'supabase-migration', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'execute_sql',
      description: 'Execute SQL query or migration on Supabase database',
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL query to execute' }
        },
        required: ['sql']
      }
    },
    {
      name: 'execute_migration_file',
      description: 'Execute SQL migration from file path',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to SQL file' }
        },
        required: ['filePath']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const client = new Client({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: SERVICE_KEY,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    if (name === 'execute_sql') {
      const result = await client.query(args.sql);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            rowCount: result.rowCount,
            rows: result.rows,
            command: result.command
          }, null, 2)
        }]
      };
    }

    if (name === 'execute_migration_file') {
      const fs = await import('fs/promises');
      const sql = await fs.readFile(args.filePath, 'utf-8');
      const result = await client.query(sql);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Migration executed successfully',
            rowCount: result.rowCount
          }, null, 2)
        }]
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          detail: error.detail
        }, null, 2)
      }],
      isError: true
    };
  } finally {
    await client.end();
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
