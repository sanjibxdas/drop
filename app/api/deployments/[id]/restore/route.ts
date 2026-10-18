import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { extractAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await extractAuth(req);
    const datastore = getDataStore();

    const deployment = await datastore.getDeployment(id);
    if (!deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    if (deployment.ownerId && deployment.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'Unauthorized to restore this deployment' }, { status: 403 });
    }

    const restored = await datastore.restoreDeployment(deployment.id);
    if (!restored) {
      return NextResponse.json(
        { error: 'Deployment cannot be restored (already active or purged)' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deployment restored successfully',
      deployment: {
        id: restored.id,
        slug: restored.slug,
        status: restored.status,
        updated_at: restored.updatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Restore failed' }, { status: 400 });
  }
}
