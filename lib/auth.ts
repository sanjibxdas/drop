import { NextRequest } from 'next/server';
import { getDataStore } from './datastore.ts';
import type { AuthContext } from './types.ts';

export async function extractAuth(req: NextRequest): Promise<AuthContext> {
  const authHeader = req.headers.get('authorization');
  const datastore = getDataStore();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();

    if (token.startsWith('drop_live_')) {
      const apiKey = await datastore.verifyApiKey(token);
      if (apiKey) {
        return {
          userId: apiKey.ownerId,
          apiKeyId: apiKey.id,
          isOwner: true,
          canClaim: true,
        };
      }
    }
  }

  // Check custom user ID header (for client-side auth state / Firebase)
  const clientUserId = req.headers.get('x-user-id');
  if (clientUserId && clientUserId.trim().length > 0) {
    return {
      userId: clientUserId.trim(),
      apiKeyId: null,
      isOwner: true,
      canClaim: true,
    };
  }

  // Check session cookie
  const sessionCookie = req.cookies.get('drop_session')?.value;
  if (sessionCookie) {
    return {
      userId: sessionCookie,
      apiKeyId: null,
      isOwner: true,
      canClaim: true,
    };
  }

  return {
    userId: null,
    apiKeyId: null,
    isOwner: false,
    canClaim: false,
  };
}
