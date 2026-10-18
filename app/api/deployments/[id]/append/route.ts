import { NextRequest, NextResponse } from 'next/server';
import { getDeploymentEngine } from '@/lib/deployment-engine';
import { extractAuth } from '@/lib/auth';

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
    let files: Array<{ path: string; content: string | Buffer; encoding?: 'utf-8' | 'base64' }> = [];

    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!Array.isArray(body.files)) {
        return NextResponse.json({ error: 'Missing "files" array in request body' }, { status: 400 });
      }
      files = body.files;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const fileList = formData.getAll('files') as File[];
      for (const f of fileList) {
        const rawPath = (f as any).webkitRelativePath || f.name;
        const arrayBuf = await f.arrayBuffer();
        files.push({
          path: rawPath,
          content: Buffer.from(arrayBuf),
        });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type for append' }, { status: 415 });
    }

    const updated = await engine.appendFiles(id, files, auth);

    return NextResponse.json({
      success: true,
      deployment: {
        id: updated.id,
        version: updated.version,
        file_count: updated.fileCount,
        files: updated.files,
        total_bytes: updated.totalBytes,
        updated_at: updated.updatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Append failed' }, { status: 400 });
  }
}
