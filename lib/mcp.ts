import { getDeploymentEngine } from './deployment-engine.ts';
import { getDataStore } from './datastore.ts';
import { hashPassword } from './security.ts';
import type { AuthContext } from './types.ts';

export interface McpRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export const MCP_TOOLS = [
  {
    name: 'deploy_html',
    description: 'Deploy a website from raw HTML string and return an instant live public URL',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'Complete HTML document to deploy' },
        name: { type: 'string', description: 'Optional human-readable name' },
        custom_slug: { type: 'string', description: 'Optional custom URL slug' },
        ttl_hours: { type: 'number', description: 'Optional hours before automatic expiry (0 = permanent)' },
        password: { type: 'string', description: 'Optional visitor password' },
      },
      required: ['html'],
    },
  },
  {
    name: 'deploy_files',
    description: 'Deploy a multi-file static website (HTML, CSS, JS, images) and return a live public URL',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          description: 'Array of file objects { path, content, encoding }',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Relative file path (e.g. index.html or css/style.css)' },
              content: { type: 'string', description: 'File contents (text or base64)' },
              encoding: { type: 'string', enum: ['utf-8', 'base64'] },
            },
            required: ['path', 'content'],
          },
        },
        name: { type: 'string' },
        custom_slug: { type: 'string' },
        ttl_hours: { type: 'number' },
        password: { type: 'string' },
      },
      required: ['files'],
    },
  },
  {
    name: 'append_files',
    description: 'Add or update files in an existing deployment without changing its URL',
    inputSchema: {
      type: 'object',
      properties: {
        deployment_id: { type: 'string', description: 'ID or slug of existing deployment' },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
              encoding: { type: 'string', enum: ['utf-8', 'base64'] },
            },
            required: ['path', 'content'],
          },
        },
      },
      required: ['deployment_id', 'files'],
    },
  },
  {
    name: 'list_drops',
    description: 'List deployments belonging to the authenticated account',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term' },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    name: 'claim_drop',
    description: 'Claim an anonymous deployment into the current account using its one-time claim token',
    inputSchema: {
      type: 'object',
      properties: {
        deployment_id: { type: 'string' },
        claim_token: { type: 'string' },
      },
      required: ['deployment_id', 'claim_token'],
    },
  },
  {
    name: 'restore_drop',
    description: 'Restore a deleted or expired deployment if files are still retained',
    inputSchema: {
      type: 'object',
      properties: {
        deployment_id: { type: 'string' },
      },
      required: ['deployment_id'],
    },
  },
  {
    name: 'delete_drop',
    description: 'Delete a deployment',
    inputSchema: {
      type: 'object',
      properties: {
        deployment_id: { type: 'string' },
      },
      required: ['deployment_id'],
    },
  },
  {
    name: 'set_password',
    description: 'Set or remove password protection for an owned deployment',
    inputSchema: {
      type: 'object',
      properties: {
        deployment_id: { type: 'string' },
        password: { type: 'string', description: 'Leave empty or null to remove password protection' },
      },
      required: ['deployment_id'],
    },
  },
  {
    name: 'get_limits',
    description: 'Get operational limits and quotas for Drop platform',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_account',
    description: 'Get account usage statistics and storage totals',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function handleMcpRequest(req: McpRequest, authContext: AuthContext): Promise<McpResponse> {
  const id = req.id ?? null;
  const engine = getDeploymentEngine();
  const datastore = getDataStore();

  try {
    switch (req.method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'drop-deployment-mcp',
              version: '1.0.0',
            },
          },
        };
      }

      case 'tools/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        };
      }

      case 'tools/call': {
        const { name, arguments: args = {} } = req.params || {};

        switch (name) {
          case 'deploy_html': {
            if (!args.html) {
              return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing required param "html"' } };
            }
            const res = await engine.deployHtml(args.html, {
              name: args.name,
              customSlug: args.custom_slug,
              ttlHours: args.ttl_hours,
              password: args.password,
              ownerId: authContext.userId,
            });
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      url: res.url,
                      id: res.deployment.id,
                      slug: res.deployment.slug,
                      files: res.deployment.files,
                      claim_token: res.claimToken,
                      deletion_token: res.deletionToken,
                    }),
                  },
                ],
              },
            };
          }

          case 'deploy_files': {
            if (!Array.isArray(args.files) || args.files.length === 0) {
              return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing or invalid "files" array' } };
            }
            const res = await engine.deployFileMap(args.files, {
              name: args.name,
              customSlug: args.custom_slug,
              ttlHours: args.ttl_hours,
              password: args.password,
              ownerId: authContext.userId,
            });
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      url: res.url,
                      id: res.deployment.id,
                      slug: res.deployment.slug,
                      files: res.deployment.files,
                      claim_token: res.claimToken,
                    }),
                  },
                ],
              },
            };
          }

          case 'append_files': {
            const updated = await engine.appendFiles(args.deployment_id, args.files, authContext);
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      id: updated.id,
                      version: updated.version,
                      files: updated.files,
                    }),
                  },
                ],
              },
            };
          }

          case 'list_drops': {
            const list = await datastore.listDeployments({
              ownerId: authContext.userId,
              query: args.query,
              limit: args.limit,
            });
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(list) }],
              },
            };
          }

          case 'claim_drop': {
            if (!authContext.userId) {
              return {
                jsonrpc: '2.0',
                id,
                error: { code: -32001, message: 'Authentication required to claim deployment' },
              };
            }
            const claimed = await datastore.claimDeployment(
              args.deployment_id,
              args.claim_token,
              authContext.userId
            );
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify({ success: true, deployment: claimed }) }],
              },
            };
          }

          case 'restore_drop': {
            const restored = await datastore.restoreDeployment(args.deployment_id);
            if (!restored) {
              return { jsonrpc: '2.0', id, error: { code: -32004, message: 'Deployment not found or not eligible for restoration' } };
            }
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify({ success: true, deployment: restored }) }],
              },
            };
          }

          case 'delete_drop': {
            const success = await datastore.deleteDeployment(args.deployment_id);
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify({ success }) }],
              },
            };
          }

          case 'set_password': {
            const dep = await datastore.getDeployment(args.deployment_id);
            if (!dep) {
              return { jsonrpc: '2.0', id, error: { code: -32004, message: 'Deployment not found' } };
            }
            if (authContext.userId && dep.ownerId !== authContext.userId) {
              return { jsonrpc: '2.0', id, error: { code: -32003, message: 'Unauthorized' } };
            }

            if (args.password && args.password.trim().length > 0) {
              const { hash, salt } = hashPassword(args.password.trim());
              dep.passwordHash = hash;
              dep.passwordSalt = salt;
            } else {
              dep.passwordHash = null;
              dep.passwordSalt = null;
            }
            dep.updatedAt = new Date().toISOString();
            await datastore.saveDeployment(dep);

            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      passwordProtected: !!dep.passwordHash,
                    }),
                  },
                ],
              },
            };
          }

          case 'get_limits': {
            const limits = datastore.getLimits();
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(limits) }],
              },
            };
          }

          case 'get_account': {
            const usage = authContext.userId
              ? await datastore.getAccountUsage(authContext.userId)
              : { deploymentCount: 0, totalBytes: 0, totalFiles: 0 };
            return {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(usage) }],
              },
            };
          }

          default:
            return {
              jsonrpc: '2.0',
              id,
              error: { code: -32601, message: `Method not found: ${name}` },
            };
        }
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Unknown JSON-RPC method: ${req.method}` },
        };
    }
  } catch (err: any) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: err.message || 'Internal error' },
    };
  }
}
