import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { getStorageProvider } from '@/lib/storage';
import { sanitizeFilePath, getMimeType } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; path: string[] }> }
) {
  const { slug, path: pathSegments } = await params;
  const rawPath = pathSegments.join('/');
  const cleanPath = sanitizeFilePath(rawPath);

  if (!cleanPath) {
    return new NextResponse('Invalid or forbidden path (400)', { status: 400 });
  }

  const datastore = getDataStore();
  const storage = getStorageProvider();

  const deployment = await datastore.getDeployment(slug);
  if (!deployment || deployment.status === 'deleted') {
    return new NextResponse('Site Not Found (404)', { status: 404 });
  }

  // Check expiry
  if (deployment.status === 'expired' || (deployment.expiresAt && new Date() > new Date(deployment.expiresAt))) {
    return new NextResponse('Site Expired (410)', { status: 410 });
  }

  // Check password if enabled
  if (deployment.passwordHash) {
    const authCookie = req.cookies.get(`drop_auth_${slug}`)?.value;
    const headerAuth = req.headers.get('x-drop-password');
    let isAuthorized = authCookie === 'authenticated';
    if (!isAuthorized && headerAuth && deployment.passwordSalt) {
      const { verifyPassword } = await import('@/lib/security');
      isAuthorized = verifyPassword(headerAuth, deployment.passwordHash, deployment.passwordSalt);
    }
    if (!isAuthorized) {
      return new NextResponse('Unauthorized: Password required', { status: 401 });
    }
  }

  // Attempt to fetch file from storage
  let file = await storage.getFile(deployment.id, cleanPath);

  // If path is a folder without extension, check if it has an index.html (e.g. /about -> /about/index.html)
  if (!file && !cleanPath.includes('.')) {
    file = await storage.getFile(deployment.id, `${cleanPath}/index.html`);
  }

  // SPA fallback check
  if (!file && deployment.spaFallback) {
    const ext = cleanPath.split('.').pop()?.toLowerCase();
    const isStaticAsset = ext && ['js', 'css', 'png', 'jpg', 'svg', 'woff2', 'json', 'wasm', 'ico', 'webp'].includes(ext);
    if (!isStaticAsset) {
      file = await storage.getFile(deployment.id, deployment.entrypoint || 'index.html');
    }
  }

  if (!file) {
    return new NextResponse('Asset Not Found (404)', { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.content) as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': file.contentType || getMimeType(cleanPath),
      'Content-Length': file.size.toString(),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
