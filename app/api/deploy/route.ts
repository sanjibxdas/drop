import { NextRequest, NextResponse } from 'next/server';
import { getDeploymentEngine } from '@/lib/deployment-engine';
import { extractAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await extractAuth(req);
    const engine = getDeploymentEngine();

    const contentType = req.headers.get('content-type') || '';
    const searchParams = req.nextUrl.searchParams;

    // Optional query/header parameters
    const customSlug = searchParams.get('slug') || req.headers.get('x-drop-slug') || undefined;
    const name = searchParams.get('name') || req.headers.get('x-drop-name') || undefined;
    const ttlStr = searchParams.get('ttl') || req.headers.get('x-drop-ttl');
    const ttlHours = ttlStr ? parseFloat(ttlStr) : undefined;
    const password = searchParams.get('password') || req.headers.get('x-drop-password') || undefined;
    const spaFallback = searchParams.get('spa') === 'true' || req.headers.get('x-drop-spa') === 'true';

    const deployOptions = {
      name,
      customSlug,
      ownerId: auth.userId,
      ttlHours,
      password,
      spaFallback,
    };

    // 1. Raw HTML text/html
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      const htmlText = await req.text();
      const result = await engine.deployHtml(htmlText, deployOptions);

      return NextResponse.json({
        id: result.deployment.id,
        slug: result.deployment.slug,
        name: result.deployment.name,
        url: result.url,
        files: result.deployment.files,
        status: result.deployment.status,
        expires_at: result.deployment.expiresAt,
        total_bytes: result.deployment.totalBytes,
        file_count: result.deployment.fileCount,
        claim_token: result.claimToken,
        deletion_token: result.deletionToken,
      }, { status: 201 });
    }

    // 2. Binary ZIP archive
    if (contentType.includes('application/zip') || contentType.includes('application/x-zip-compressed')) {
      const arrayBuffer = await req.arrayBuffer();
      const zipBuffer = Buffer.from(arrayBuffer);
      const result = await engine.deployZip(zipBuffer, deployOptions);

      return NextResponse.json({
        id: result.deployment.id,
        slug: result.deployment.slug,
        name: result.deployment.name,
        url: result.url,
        files: result.deployment.files,
        status: result.deployment.status,
        expires_at: result.deployment.expiresAt,
        total_bytes: result.deployment.totalBytes,
        file_count: result.deployment.fileCount,
        claim_token: result.claimToken,
        deletion_token: result.deletionToken,
      }, { status: 201 });
    }

    // 3. Structured JSON
    if (contentType.includes('application/json')) {
      const body = await req.json();

      const mergedOptions = {
        name: body.name || deployOptions.name,
        customSlug: body.slug || body.custom_slug || deployOptions.customSlug,
        ownerId: auth.userId,
        ttlHours: body.ttl ?? body.ttl_hours ?? deployOptions.ttlHours,
        password: body.password || deployOptions.password,
        spaFallback: body.spa_fallback ?? body.spaFallback ?? deployOptions.spaFallback,
      };

      if (body.html) {
        const result = await engine.deployHtml(body.html, mergedOptions);
        return NextResponse.json({
          id: result.deployment.id,
          slug: result.deployment.slug,
          name: result.deployment.name,
          url: result.url,
          files: result.deployment.files,
          status: result.deployment.status,
          expires_at: result.deployment.expiresAt,
          total_bytes: result.deployment.totalBytes,
          file_count: result.deployment.fileCount,
          claim_token: result.claimToken,
          deletion_token: result.deletionToken,
        }, { status: 201 });
      }

      if (Array.isArray(body.files)) {
        const result = await engine.deployFileMap(body.files, mergedOptions);
        return NextResponse.json({
          id: result.deployment.id,
          slug: result.deployment.slug,
          name: result.deployment.name,
          url: result.url,
          files: result.deployment.files,
          status: result.deployment.status,
          expires_at: result.deployment.expiresAt,
          total_bytes: result.deployment.totalBytes,
          file_count: result.deployment.fileCount,
          claim_token: result.claimToken,
          deletion_token: result.deletionToken,
        }, { status: 201 });
      }

      return NextResponse.json(
        { error: 'Invalid JSON request: Provide either "html" string or "files" array' },
        { status: 400 }
      );
    }

    // 4. Multipart form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      const formName = (formData.get('name') as string) || deployOptions.name;
      const formSlug = (formData.get('slug') as string) || deployOptions.customSlug;
      const formTtl = formData.get('ttl') ? parseFloat(formData.get('ttl') as string) : deployOptions.ttlHours;
      const formPassword = (formData.get('password') as string) || deployOptions.password;
      const formSpa = formData.get('spa') === 'true' || deployOptions.spaFallback;

      const finalOptions = {
        name: formName,
        customSlug: formSlug,
        ownerId: auth.userId,
        ttlHours: formTtl,
        password: formPassword,
        spaFallback: formSpa,
      };

      const fileEntries = formData.getAll('file') as File[];
      const filesList = formData.getAll('files') as File[];
      const allFiles = [...fileEntries, ...filesList].filter((f) => f && f.name);

      if (allFiles.length === 0) {
        return NextResponse.json({ error: 'No files provided in form-data' }, { status: 400 });
      }

      // Check if a single ZIP file was uploaded
      if (allFiles.length === 1 && (allFiles[0].name.endsWith('.zip') || allFiles[0].type.includes('zip'))) {
        const arrayBuf = await allFiles[0].arrayBuffer();
        const zipBuf = Buffer.from(arrayBuf);
        const result = await engine.deployZip(zipBuf, finalOptions);

        return NextResponse.json({
          id: result.deployment.id,
          slug: result.deployment.slug,
          name: result.deployment.name,
          url: result.url,
          files: result.deployment.files,
          status: result.deployment.status,
          expires_at: result.deployment.expiresAt,
          total_bytes: result.deployment.totalBytes,
          file_count: result.deployment.fileCount,
          claim_token: result.claimToken,
          deletion_token: result.deletionToken,
        }, { status: 201 });
      }

      // Process list of files / directory files
      const fileMap: Array<{ path: string; content: Buffer }> = [];
      for (const f of allFiles) {
        // webkitRelativePath or name
        const rawPath = (f as any).webkitRelativePath || f.name;
        const arrayBuf = await f.arrayBuffer();
        fileMap.push({
          path: rawPath,
          content: Buffer.from(arrayBuf),
        });
      }

      const result = await engine.deployFileMap(fileMap, finalOptions);

      return NextResponse.json({
        id: result.deployment.id,
        slug: result.deployment.slug,
        name: result.deployment.name,
        url: result.url,
        files: result.deployment.files,
        status: result.deployment.status,
        expires_at: result.deployment.expiresAt,
        total_bytes: result.deployment.totalBytes,
        file_count: result.deployment.fileCount,
        claim_token: result.claimToken,
        deletion_token: result.deletionToken,
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: `Unsupported Content-Type "${contentType}". Use text/html, application/zip, application/json, or multipart/form-data.` },
      { status: 415 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Deployment failed' },
      { status: 400 }
    );
  }
}
