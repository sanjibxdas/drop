import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Drop Deployment API',
      version: '1.0.0',
      description: 'Instant static website hosting and deployment API. 100% free, zero ads, zero injected branding.',
    },
    servers: [{ url: '/api', description: 'Drop API Server' }],
    paths: {
      '/deploy': {
        post: {
          summary: 'Deploy a static website (HTML, ZIP, or JSON)',
          description: 'Deploy HTML directly, a ZIP archive, or a JSON file map. Returns a live public URL.',
          requestBody: {
            required: true,
            content: {
              'text/html': { schema: { type: 'string' } },
              'application/zip': { schema: { type: 'string', format: 'binary' } },
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    html: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    files: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          path: { type: 'string' },
                          content: { type: 'string' },
                          encoding: { type: 'string', enum: ['utf-8', 'base64'] },
                        },
                      },
                    },
                    ttl: { type: 'number' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Site deployed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      slug: { type: 'string' },
                      url: { type: 'string' },
                      files: { type: 'array', items: { type: 'string' } },
                      status: { type: 'string' },
                      claim_token: { type: 'string' },
                      deletion_token: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/deployments': {
        get: {
          summary: 'List deployments',
          responses: { 200: { description: 'List of deployments' } },
        },
      },
      '/deployments/{id}': {
        get: {
          summary: 'Get deployment details',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deployment details' } },
        },
        delete: {
          summary: 'Delete deployment',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/mcp': {
        post: {
          summary: 'Model Context Protocol (JSON-RPC 2.0)',
          description: 'Used by AI agents and LLMs to deploy, list, and manage static sites programmatically.',
          responses: { 200: { description: 'MCP response' } },
        },
      },
      '/limits': {
        get: {
          summary: 'Get operational limits',
          responses: { 200: { description: 'Free platform operational limits' } },
        },
      },
    },
  };

  return NextResponse.json(spec);
}
