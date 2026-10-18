export interface Deployment {
  id: string;
  slug: string;
  name: string;
  ownerId: string | null;
  claimTokenHash: string | null;
  deletionTokenHash: string | null;
  passwordHash: string | null;
  passwordSalt: string | null;
  status: 'ready' | 'building' | 'failed' | 'expired' | 'deleted';
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  files: string[];
  entrypoint: string;
  totalBytes: number;
  fileCount: number;
  version: number;
  spaFallback: boolean;
  storagePrefix: string;
  deletedAt: string | null;
}

export interface DeploymentFile {
  path: string;
  content: Buffer | Uint8Array;
  contentType: string;
  size: number;
}

export interface ApiKey {
  id: string;
  keyHash: string;
  prefix: string;
  name: string;
  ownerId: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface OperationalLimits {
  maxFileSizeBytes: number;
  maxZipSizeBytes: number;
  maxUncompressedBytes: number;
  maxFilesPerDrop: number;
  defaultTtlHours: number;
}

export interface AuthContext {
  userId: string | null;
  apiKeyId: string | null;
  isOwner: boolean;
  canClaim: boolean;
}

export interface DeployOptions {
  name?: string;
  customSlug?: string;
  ownerId?: string | null;
  ttlHours?: number | null;
  password?: string | null;
  spaFallback?: boolean;
}

export interface DeployResult {
  deployment: Deployment;
  url: string;
  claimToken?: string;
  deletionToken?: string;
}
