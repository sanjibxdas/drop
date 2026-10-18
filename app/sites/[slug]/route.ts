import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { getStorageProvider } from '@/lib/storage';

export const dynamic = 'force-dynamic';

function renderPasswordChallengeHtml(slug: string, error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Password Protected</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 2.25rem;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
    p { font-size: 0.875rem; color: #a1a1aa; margin-bottom: 1.5rem; line-height: 1.4; }
    .form-group { margin-bottom: 1.25rem; }
    input[type="password"] {
      width: 100%;
      padding: 0.65rem 0.85rem;
      background: #09090b;
      border: 1px solid #3f3f46;
      border-radius: 6px;
      color: #fff;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s ease;
    }
    input[type="password"]:focus {
      border-color: #3b82f6;
    }
    button {
      width: 100%;
      padding: 0.7rem;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    button:hover { background: #1d4ed8; }
    .error {
      background: #451a1a;
      border: 1px solid #7f1d1d;
      color: #fca5a5;
      padding: 0.6rem 0.8rem;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Protected Site</h1>
    <p>This website requires a password to view.</p>
    ${error ? `<div class="error">${error}</div>` : ''}
    <form method="POST" action="/api/sites/${encodeURIComponent(slug)}/verify-password">
      <div class="form-group">
        <input type="password" name="password" placeholder="Enter password" required autofocus />
      </div>
      <button type="submit">Unlock & View</button>
    </form>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const datastore = getDataStore();
  const storage = getStorageProvider();

  const deployment = await datastore.getDeployment(slug);
  if (!deployment || deployment.status === 'deleted') {
    return new NextResponse('Site Not Found (404)', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Check expiry
  if (deployment.status === 'expired' || (deployment.expiresAt && new Date() > new Date(deployment.expiresAt))) {
    return new NextResponse('This site has expired (410 Gone)', {
      status: 410,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Check password protection
  if (deployment.passwordHash) {
    const authCookie = req.cookies.get(`drop_auth_${slug}`)?.value;
    const headerAuth = req.headers.get('x-drop-password');

    let isAuthorized = authCookie === 'authenticated';
    if (!isAuthorized && headerAuth && deployment.passwordSalt) {
      const { verifyPassword } = await import('@/lib/security');
      isAuthorized = verifyPassword(headerAuth, deployment.passwordHash, deployment.passwordSalt);
    }

    if (!isAuthorized) {
      const err = req.nextUrl.searchParams.get('error') ? 'Incorrect password. Please try again.' : undefined;
      return new NextResponse(renderPasswordChallengeHtml(slug, err), {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  // Serve entrypoint
  const entrypoint = deployment.entrypoint || 'index.html';
  const file = await storage.getFile(deployment.id, entrypoint);

  if (!file) {
    return new NextResponse('Entrypoint file missing', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  let bodyData: Uint8Array = new Uint8Array(file.content);
  if (entrypoint.endsWith('.html') || entrypoint.endsWith('.htm')) {
    let htmlStr = file.content.toString('utf-8');
    if (!htmlStr.includes('<base ') && !htmlStr.includes('<base>')) {
      const baseTag = `<base href="/sites/${slug}/">`;
      if (htmlStr.includes('<head>')) {
        htmlStr = htmlStr.replace('<head>', `<head>${baseTag}`);
      } else if (htmlStr.includes('<head ')) {
        htmlStr = htmlStr.replace(/<head[^>]*>/, `$&${baseTag}`);
      } else {
        htmlStr = `${baseTag}\n` + htmlStr;
      }
      bodyData = new Uint8Array(Buffer.from(htmlStr, 'utf-8'));
    }
  }

  return new NextResponse(bodyData as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': file.contentType || 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
