import fs from 'node:fs';
import path from 'node:path';
import type { Deployment, ApiKey, OperationalLimits } from './types.ts';
import { hashToken, generateApiKey } from './security.ts';

export interface MetadataSchema {
  deployments: Record<string, Deployment>;
  apiKeys: Record<string, ApiKey>;
  accounts: Record<string, { id: string; email?: string; createdAt: string }>;
}

export class DataStore {
  private filePath: string;
  private data: MetadataSchema = {
    deployments: {},
    apiKeys: {},
    accounts: {},
  };
  private isLoaded: boolean = false;

  constructor(customFilePath?: string) {
    this.filePath = path.resolve(customFilePath || './.data/metadata.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        this.save();
      }
    } catch {
      this.data = { deployments: {}, apiKeys: {}, accounts: {} };
    }
    this.isLoaded = true;
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      console.error('Failed to save metadata to disk:', err);
    }
  }

  // --- Deployments ---

  async saveDeployment(d: Deployment): Promise<void> {
    this.data.deployments[d.id] = d;
    this.save();
  }

  async getDeployment(idOrSlug: string): Promise<Deployment | null> {
    // 1. Direct lookup by ID
    if (this.data.deployments[idOrSlug]) {
      return this.data.deployments[idOrSlug];
    }
    // 2. Lookup by slug
    for (const d of Object.values(this.data.deployments)) {
      if (d.slug === idOrSlug) {
        return d;
      }
    }
    return null;
  }

  async listDeployments(filter?: {
    ownerId?: string | null;
    query?: string;
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Deployment[]; total: number }> {
    let items = Object.values(this.data.deployments);

    if (!filter?.includeDeleted) {
      items = items.filter((d) => d.status !== 'deleted');
    }

    if (filter?.ownerId !== undefined) {
      items = items.filter((d) => d.ownerId === filter.ownerId);
    }

    if (filter?.query) {
      const q = filter.query.toLowerCase();
      items = items.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
      );
    }

    // Sort by latest updated first
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = items.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 50;

    return {
      items: items.slice(offset, offset + limit),
      total,
    };
  }

  async deleteDeployment(id: string, hard: boolean = false): Promise<boolean> {
    const d = this.data.deployments[id];
    if (!d) return false;

    if (hard) {
      delete this.data.deployments[id];
    } else {
      d.status = 'deleted';
      d.deletedAt = new Date().toISOString();
      d.updatedAt = new Date().toISOString();
    }
    this.save();
    return true;
  }

  async restoreDeployment(id: string): Promise<Deployment | null> {
    const d = this.data.deployments[id];
    if (!d || d.status !== 'deleted') return null;

    d.status = 'ready';
    d.deletedAt = null;
    d.updatedAt = new Date().toISOString();
    this.save();
    return d;
  }

  async claimDeployment(id: string, rawClaimToken: string, newOwnerId: string): Promise<Deployment | null> {
    const d = this.data.deployments[id];
    if (!d) return null;
    if (d.ownerId) {
      throw new Error('Deployment is already claimed by an account');
    }
    if (!d.claimTokenHash) {
      throw new Error('Deployment has no claim token or has already been claimed');
    }

    const inputHash = hashToken(rawClaimToken);
    if (inputHash !== d.claimTokenHash) {
      throw new Error('Invalid claim token');
    }

    d.ownerId = newOwnerId;
    d.claimTokenHash = null; // Invalidate token so it cannot be reused
    d.updatedAt = new Date().toISOString();
    this.save();
    return d;
  }

  // --- API Keys ---

  async createApiKey(ownerId: string, name: string): Promise<{ apiKey: string; key: ApiKey }> {
    const { apiKey, keyHash, prefix } = generateApiKey();
    const id = `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const key: ApiKey = {
      id,
      keyHash,
      prefix,
      name: name || 'API Key',
      ownerId,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    this.data.apiKeys[id] = key;
    this.save();
    return { apiKey, key };
  }

  async verifyApiKey(rawKey: string): Promise<ApiKey | null> {
    const hash = hashToken(rawKey);
    for (const key of Object.values(this.data.apiKeys)) {
      if (key.keyHash === hash) {
        key.lastUsedAt = new Date().toISOString();
        this.save();
        return key;
      }
    }
    return null;
  }

  async listApiKeys(ownerId: string): Promise<ApiKey[]> {
    return Object.values(this.data.apiKeys)
      .filter((k) => k.ownerId === ownerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async revokeApiKey(id: string, ownerId: string): Promise<boolean> {
    const key = this.data.apiKeys[id];
    if (!key || key.ownerId !== ownerId) return false;
    delete this.data.apiKeys[id];
    this.save();
    return true;
  }

  // --- Account Quotas & Usage ---

  async getAccountUsage(ownerId: string): Promise<{
    deploymentCount: number;
    totalBytes: number;
    totalFiles: number;
  }> {
    const owned = Object.values(this.data.deployments).filter(
      (d) => d.ownerId === ownerId && d.status !== 'deleted'
    );
    const totalBytes = owned.reduce((sum, d) => sum + (d.totalBytes || 0), 0);
    const totalFiles = owned.reduce((sum, d) => sum + (d.fileCount || 0), 0);
    return {
      deploymentCount: owned.length,
      totalBytes,
      totalFiles,
    };
  }

  getLimits(): OperationalLimits {
    const maxFileMb = parseInt(process.env.DROP_MAX_FILE_SIZE_MB || '10', 10);
    const maxZipMb = parseInt(process.env.DROP_MAX_ZIP_SIZE_MB || '25', 10);
    const maxUncompressedMb = parseInt(process.env.DROP_MAX_UNCOMPRESSED_MB || '100', 10);
    const maxFiles = parseInt(process.env.DROP_MAX_FILES_PER_DROP || '200', 10);
    const defaultTtlHours = parseInt(process.env.DROP_DEFAULT_TTL_HOURS || '0', 10);

    return {
      maxFileSizeBytes: maxFileMb * 1024 * 1024,
      maxZipSizeBytes: maxZipMb * 1024 * 1024,
      maxUncompressedBytes: maxUncompressedMb * 1024 * 1024,
      maxFilesPerDrop: maxFiles,
      defaultTtlHours,
    };
  }

  // Cleanup expired drops
  async cleanupExpired(): Promise<number> {
    const now = new Date();
    let cleaned = 0;
    for (const d of Object.values(this.data.deployments)) {
      if (d.status === 'ready' && d.expiresAt) {
        const exp = new Date(d.expiresAt);
        if (now > exp) {
          d.status = 'expired';
          d.updatedAt = now.toISOString();
          cleaned++;
        }
      }
    }
    if (cleaned > 0) {
      this.save();
    }
    return cleaned;
  }
}

// Global singleton instance
let globalDataStore: DataStore | null = null;

export function getDataStore(): DataStore {
  if (!globalDataStore) {
    globalDataStore = new DataStore();
  }
  return globalDataStore;
}

export function setDataStore(store: DataStore): void {
  globalDataStore = store;
}
