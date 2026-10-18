import crypto from 'node:crypto';

/**
 * Normalizes and sanitizes a relative file path for static hosting.
 * Returns null if path contains path traversal, null bytes, absolute roots, or illegal characters.
 */
export function sanitizeFilePath(rawPath: string): string | null {
  if (!rawPath || typeof rawPath !== 'string') return null;

  // Reject null bytes or control characters
  if (/[\0\x00-\x1f\x7f]/.test(rawPath)) return null;

  // Replace backslashes with forward slashes
  let normalized = rawPath.replace(/\\/g, '/');

  // Strip leading and trailing slashes
  normalized = normalized.replace(/^\/+|\/+$/g, '');

  // Split into segments and validate
  const segments = normalized.split('/');
  const cleanSegments: string[] = [];

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed || trimmed === '.') {
      continue;
    }
    // Reject directory traversal
    if (trimmed === '..') {
      return null;
    }
    // Reject Windows drive letters (e.g. C:)
    if (/^[a-zA-Z]:$/.test(trimmed)) {
      return null;
    }
    // Reject OS junk directories/files
    if (
      trimmed === '__MACOSX' ||
      trimmed === '.DS_Store' ||
      trimmed === 'Thumbs.db' ||
      trimmed === 'desktop.ini'
    ) {
      return null;
    }
    cleanSegments.push(trimmed);
  }

  if (cleanSegments.length === 0) return null;
  return cleanSegments.join('/');
}

/**
 * Generates a cryptographically random, URL-safe identifier
 */
export function generateRandomId(length: number = 10): string {
  // Use crypto random bytes converted to hex/base64url
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Generates an unpredictable high-entropy claim or deletion token
 */
export function generateSecretToken(prefix: string = 'token'): string {
  const secret = crypto.randomBytes(24).toString('base64url');
  return `${prefix}_${secret}`;
}

/**
 * Generates an API key (e.g. drop_live_...)
 */
export function generateApiKey(): { apiKey: string; keyHash: string; prefix: string } {
  const secret = crypto.randomBytes(24).toString('base64url');
  const apiKey = `drop_live_${secret}`;
  const keyHash = hashToken(apiKey);
  const prefix = `drop_live_${secret.slice(0, 4)}...`;
  return { apiKey, keyHash, prefix };
}

/**
 * Computes SHA-256 hash of a string/token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Hashes a password using PBKDF2 with a random salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verifies a password against the stored PBKDF2 hash and salt
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Normalizes and validates custom slugs/aliases (alphanumeric, dashes, lowercase)
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) return { valid: false, error: 'Slug cannot be empty' };
  if (slug.length < 3 || slug.length > 48) {
    return { valid: false, error: 'Slug must be between 3 and 48 characters' };
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    return {
      valid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)',
    };
  }
  const reserved = [
    'api', 'admin', 'drop', 'sites', 'dashboard', 'static', 'auth', 'login', 'account',
    'settings', 'help', 'docs', 'documentation', 'terms', 'privacy', 'status', 'mcp'
  ];
  if (reserved.includes(slug)) {
    return { valid: false, error: `Slug "${slug}" is reserved for system routes` };
  }
  return { valid: true };
}

/**
 * Maps common file extensions to proper MIME Content-Types
 */
export function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    htm: 'text/html; charset=utf-8',
    css: 'text/css; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    mjs: 'application/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    xml: 'application/xml; charset=utf-8',
    txt: 'text/plain; charset=utf-8',
    md: 'text/markdown; charset=utf-8',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
    pdf: 'application/pdf',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    mp4: 'video/mp4',
    webm: 'video/webm',
    wasm: 'application/wasm',
    zip: 'application/zip',
  };

  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * In-memory sliding rate limiter for password attempts & sensitive endpoints
 */
class SimpleRateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();

  check(key: string, maxAttempts: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (record.count >= maxAttempts) {
      return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    return { allowed: true, remaining: maxAttempts - record.count };
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new SimpleRateLimiter();
