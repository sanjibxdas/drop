import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';
import { verifyPassword, rateLimiter } from '@/lib/security';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateKey = `pw_${slug}_${ip}`;

  const rateCheck = rateLimiter.check(rateKey, 10, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many password attempts. Please wait 1 minute.' },
      { status: 429 }
    );
  }

  const datastore = getDataStore();
  const deployment = await datastore.getDeployment(slug);

  if (!deployment || !deployment.passwordHash || !deployment.passwordSalt) {
    return NextResponse.json({ error: 'Site not found or not password-protected' }, { status: 404 });
  }

  let password = '';
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await req.json();
    password = body.password || '';
  } else {
    const formData = await req.formData();
    password = (formData.get('password') as string) || '';
  }

  const isValid = verifyPassword(password, deployment.passwordHash, deployment.passwordSalt);

  if (!isValid) {
    if (contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`/sites/${slug}?error=1`, req.url), 303);
  }

  // Password valid! Set cookie
  rateLimiter.reset(rateKey);

  const response = contentType.includes('application/json')
    ? NextResponse.json({ success: true })
    : NextResponse.redirect(new URL(`/sites/${slug}`, req.url), 303);

  response.cookies.set({
    name: `drop_auth_${slug}`,
    value: 'authenticated',
    path: `/sites/${slug}`,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 86400, // 24 hours session
  });

  return response;
}
