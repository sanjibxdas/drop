import { NextRequest, NextResponse } from 'next/server';
import { getDeploymentEngine } from '@/lib/deployment-engine';
import { extractAuth } from '@/lib/auth';
import { sanitizeFilePath, getMimeType } from '@/lib/security';
import type { DeploymentFile } from '@/lib/types';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await extractAuth(req);
    const engine = getDeploymentEngine();

    const contentType = req.headers.get('content-type') || '';
    const files: DeploymentFile[] = [];

    if (contentType.includes('text/html')) {
      const html = await req.text();
      const buf = Buffer.from(html, 'utf-8');
      files.push({
        path: 'index.html',
        content: buf,
        contentType: 'text/html; charset=utf-8',
        size: buf.length,
      });
    } else if (contentType.includes('application/zip')) {
      const arrayBuf = await req.arrayBuffer();
      const zip = await JSZip.loadAsync(Buffer.from(arrayBuf));
      for (const p of Object.keys(zip.files)) {
        if (zip.files[p].dir) continue;
        const clean = sanitizeFilePath(p);
        if (!clean) continue;
        const buf = await zip.files[p].async('nodebuffer');
        files.push({
          path: clean,
          content: buf,
          contentType: getMimeType(clean),
          size: buf.length,
        });
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      if (body.html) {
        const buf = Buffer.from(body.html, 'utf-8');
        files.push({
          path: 'index.html',
          content: buf,
          contentType: 'text/html; charset=utf-8',
          size: buf.length,
        });
      } else if (Array.isArray(body.files)) {
        for (const item of body.files) {
          const clean = sanitizeFilePath(item.path);
          if (!clean) continue;
          const buf = item.encoding === 'base64'
            ? Buffer.from(item.content, 'base64')
            : Buffer.from(item.content, 'utf-8');
          files.push({
            path: clean,
            content: buf,
            contentType: getMimeType(clean),
            size: buf.length,
          });
        }
      }
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type for redeploy' }, { status: 415 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No valid files provided for redeployment' }, { status: 400 });
    }

    const updated = await engine.redeploy(id, files, auth);

    return NextResponse.json({
      success: true,
      deployment: {
        id: updated.id,
        slug: updated.slug,
        version: updated.version,
        files: updated.files,
        total_bytes: updated.totalBytes,
        file_count: updated.fileCount,
        updated_at: updated.updatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Redeploy failed' }, { status: 400 });
  }
}
