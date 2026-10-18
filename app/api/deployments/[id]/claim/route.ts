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

    if (!auth.userId) {
      return NextResponse.json(
        { error: 'Authentication required. Sign in or provide a user ID / API key to claim a drop.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const claimToken = body.claim_token || body.claimToken;

    if (!claimToken) {
      return NextResponse.json({ error: 'Missing required "claim_token"' }, { status: 400 });
    }

    const datastore = getDataStore();
    const claimed = await datastore.claimDeployment(id, claimToken, auth.userId);

    return NextResponse.json({
      success: true,
      message: 'Deployment claimed successfully',
      deployment: {
        id: claimed!.id,
        slug: claimed!.slug,
        name: claimed!.name,
        owner_id: claimed!.ownerId,
        updated_at: claimed!.updatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Claim failed' }, { status: 400 });
  }
}
