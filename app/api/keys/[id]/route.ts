import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { extractAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await extractAuth(req);

  if (!auth.userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const datastore = getDataStore();
  const revoked = await datastore.revokeApiKey(id, auth.userId);

  if (!revoked) {
    return NextResponse.json({ error: 'API key not found or unauthorized' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'API key revoked' });
}
