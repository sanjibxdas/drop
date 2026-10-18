import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { extractAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await extractAuth(req);
  if (!auth.userId) {
    return NextResponse.json({ error: 'Authentication required to list API keys' }, { status: 401 });
  }

  const datastore = getDataStore();
  const keys = await datastore.listApiKeys(auth.userId);

  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      created_at: k.createdAt,
      last_used_at: k.lastUsedAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await extractAuth(req);
  if (!auth.userId) {
    return NextResponse.json({ error: 'Authentication required to create API keys' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body.name || 'Default API Key';

  const datastore = getDataStore();
  const { apiKey, key } = await datastore.createApiKey(auth.userId, name);

  return NextResponse.json({
    success: true,
    message: 'API key created. Copy it now, as it will never be displayed again.',
    api_key: apiKey,
    key: {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      created_at: key.createdAt,
    },
  }, { status: 201 });
}
