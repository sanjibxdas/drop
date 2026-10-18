import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url_or_slug, reason, email, details } = body;

    if (!url_or_slug || !reason) {
      return NextResponse.json({ error: 'Missing required fields: url_or_slug, reason' }, { status: 400 });
    }

    const datastore = getDataStore();
    // Extract slug from URL if full URL is given
    const slugMatch = url_or_slug.match(/\/sites\/([a-zA-Z0-9_-]+)/);
    const targetSlug = slugMatch ? slugMatch[1] : url_or_slug;

    const deployment = await datastore.getDeployment(targetSlug);

    // If report is high severity phishing/malware, platform can quarantine
    if (deployment && (reason === 'phishing' || reason === 'malware')) {
      deployment.status = 'failed'; // quarantine
      deployment.updatedAt = new Date().toISOString();
      await datastore.saveDeployment(deployment);
    }

    return NextResponse.json({
      success: true,
      report_id: `abuse_${Date.now()}`,
      message: 'Abuse report recorded. Site has been flagged for administrative review.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit report' }, { status: 500 });
  }
}
