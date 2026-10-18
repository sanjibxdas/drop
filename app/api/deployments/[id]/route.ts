import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { getDeploymentEngine } from '@/lib/deployment-engine';
import { extractAuth } from '@/lib/auth';
import { hashToken } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const datastore = getDataStore();
  const engine = getDeploymentEngine();

  const deployment = await datastore.getDeployment(id);
  if (!deployment) {
    return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
  }

  const url = engine.getPublicUrl(deployment.slug);

  return NextResponse.json({
    id: deployment.id,
    slug: deployment.slug,
    name: deployment.name,
    url,
    status: deployment.status,
    created_at: deployment.createdAt,
    updated_at: deployment.updatedAt,
    expires_at: deployment.expiresAt,
    files: deployment.files,
    entrypoint: deployment.entrypoint,
    total_bytes: deployment.totalBytes,
    file_count: deployment.fileCount,
    version: deployment.version,
    password_protected: !!deployment.passwordHash,
    spa_fallback: deployment.spaFallback,
    is_anonymous: !deployment.ownerId,
    deleted_at: deployment.deletedAt,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await extractAuth(req);
  const datastore = getDataStore();

  const deployment = await datastore.getDeployment(id);
  if (!deployment) {
    return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
  }

  // Authorization check
  if (deployment.ownerId && deployment.ownerId !== auth.userId) {
    return NextResponse.json({ error: 'Unauthorized to modify this deployment' }, { status: 403 });
  }

  const body = await req.json();

  if (body.name && typeof body.name === 'string') {
    deployment.name = body.name.trim();
  }

  if (typeof body.spa_fallback === 'boolean') {
    deployment.spaFallback = body.spa_fallback;
  }

  if (body.ttl !== undefined) {
    const ttl = parseFloat(body.ttl);
    if (ttl > 0) {
      deployment.expiresAt = new Date(Date.now() + ttl * 3600 * 1000).toISOString();
    } else {
      deployment.expiresAt = null;
    }
  }

  deployment.updatedAt = new Date().toISOString();
  await datastore.saveDeployment(deployment);

  return NextResponse.json({
    success: true,
    deployment: {
      id: deployment.id,
      slug: deployment.slug,
      name: deployment.name,
      spa_fallback: deployment.spaFallback,
      expires_at: deployment.expiresAt,
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await extractAuth(req);
  const datastore = getDataStore();

  const deployment = await datastore.getDeployment(id);
  if (!deployment) {
    return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
  }

  // Check deletion token for anonymous drops
  const deletionToken = req.headers.get('x-deletion-token') || req.nextUrl.searchParams.get('token');
  let isAuthorized = false;

  if (deployment.ownerId) {
    isAuthorized = deployment.ownerId === auth.userId;
  } else if (deletionToken && deployment.deletionTokenHash) {
    const tokenHash = hashToken(deletionToken);
    isAuthorized = tokenHash === deployment.deletionTokenHash;
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid account ownership or deletion token required' },
      { status: 403 }
    );
  }

  const hard = req.nextUrl.searchParams.get('permanent') === 'true';
  await datastore.deleteDeployment(deployment.id, hard);

  return NextResponse.json({ success: true, message: 'Deployment deleted' });
}
