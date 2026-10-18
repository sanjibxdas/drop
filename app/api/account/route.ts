import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { extractAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await extractAuth(req);
  const datastore = getDataStore();

  if (!auth.userId) {
    return NextResponse.json({
      authenticated: false,
      user_id: null,
      message: 'Anonymous guest mode. You can deploy instantly without an account.',
      usage: {
        deployment_count: 0,
        total_bytes: 0,
        total_files: 0,
      },
    });
  }

  const usage = await datastore.getAccountUsage(auth.userId);

  return NextResponse.json({
    authenticated: true,
    user_id: auth.userId,
    usage: {
      deployment_count: usage.deploymentCount,
      total_bytes: usage.totalBytes,
      total_mb: (usage.totalBytes / (1024 * 1024)).toFixed(2),
      total_files: usage.totalFiles,
    },
    plan: 'Drop Free Unlimited (Operational Quota)',
  });
}
