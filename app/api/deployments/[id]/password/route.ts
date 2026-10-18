import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { extractAuth } from '@/lib/auth';
import { hashPassword } from '@/lib/security';

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
      return NextResponse.json({ error: 'Unauthorized to configure password for this deployment' }, { status: 403 });
    }

    const body = await req.json();
    const password = body.password;

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return NextResponse.json({ error: 'Password cannot be empty' }, { status: 400 });
    }

    const { hash, salt } = hashPassword(password.trim());
    deployment.passwordHash = hash;
    deployment.passwordSalt = salt;
    deployment.updatedAt = new Date().toISOString();

    await datastore.saveDeployment(deployment);

    return NextResponse.json({
      success: true,
      message: 'Password protection enabled',
      password_protected: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Password update failed' }, { status: 400 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Unauthorized to remove password for this deployment' }, { status: 403 });
    }

    deployment.passwordHash = null;
    deployment.passwordSalt = null;
    deployment.updatedAt = new Date().toISOString();

    await datastore.saveDeployment(deployment);

    return NextResponse.json({
      success: true,
      message: 'Password protection removed',
      password_protected: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Password removal failed' }, { status: 400 });
  }
}
