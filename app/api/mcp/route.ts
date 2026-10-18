import { NextRequest, NextResponse } from 'next/server';
import { handleMcpRequest, McpRequest } from '@/lib/mcp';
import { extractAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await extractAuth(req);
    const body: McpRequest = await req.json();

    if (!body || body.jsonrpc !== '2.0' || !body.method) {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: (body as any)?.id || null,
          error: { code: -32600, message: 'Invalid Request: must be JSON-RPC 2.0 with a method' },
        },
        { status: 400 }
      );
    }

    const response = await handleMcpRequest(body, auth);
    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` },
      },
      { status: 400 }
    );
  }
}
