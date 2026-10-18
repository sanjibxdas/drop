import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { extractAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await extractAuth(req);
  const datastore = getDataStore();
  const searchParams = req.nextUrl.searchParams;

  const query = searchParams.get('q') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const filterOwner = searchParams.get('all') === 'true' ? undefined : (auth.userId || null);

  const result = await datastore.listDeployments({
    ownerId: filterOwner,
    query,
    limit,
    offset,
  });

  return NextResponse.json({
    deployments: result.items.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      status: d.status,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
      expires_at: d.expiresAt,
      file_count: d.fileCount,
      total_bytes: d.totalBytes,
      version: d.version,
      password_protected: !!d.passwordHash,
      spa_fallback: d.spaFallback,
      is_owner: auth.userId ? d.ownerId === auth.userId : false,
      is_anonymous: !d.ownerId,
    })),
    total: result.total,
    offset,
    limit,
  });
}
