import fs from 'node:fs';
import path from 'node:path';
import { sanitizeFilePath, getMimeType } from './security.ts';

export interface StorageFile {
  content: Buffer;
  contentType: string;
  size: number;
}

export interface IStorageProvider {
  putFile(deploymentId: string, filePath: string, content: Buffer | Uint8Array, contentType?: string): Promise<void>;
  getFile(deploymentId: string, filePath: string): Promise<StorageFile | null>;
  hasFile(deploymentId: string, filePath: string): Promise<boolean>;
  deleteDeploymentFiles(deploymentId: string): Promise<void>;
  listFiles(deploymentId: string): Promise<string[]>;
}

/**
 * Local filesystem storage provider with sandbox validation
 */
export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = path.resolve(customBaseDir || process.env.DROP_STORAGE_PATH || './.data/drops');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getDeploymentDir(deploymentId: string): string {
    const cleanId = sanitizeFilePath(deploymentId);
    if (!cleanId) throw new Error('Invalid deployment ID');
    return path.join(this.baseDir, cleanId);
  }

  private getSafeFilePath(deploymentId: string, relativePath: string): string {
    const cleanRelative = sanitizeFilePath(relativePath);
    if (!cleanRelative) {
      throw new Error(`Unsafe or invalid file path: ${relativePath}`);
    }
    const deployDir = this.getDeploymentDir(deploymentId);
    const fullPath = path.resolve(deployDir, cleanRelative);

    // Verify it stays within the deployment directory
    if (!fullPath.startsWith(deployDir + path.sep) && fullPath !== deployDir) {
      throw new Error('Path traversal detected outside deployment directory');
    }
    return fullPath;
  }

  async putFile(
    deploymentId: string,
    filePath: string,
    content: Buffer | Uint8Array,
    contentType?: string
  ): Promise<void> {
    const fullPath = this.getSafeFilePath(deploymentId, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
    await fs.promises.writeFile(fullPath, buf);
  }

  async getFile(deploymentId: string, filePath: string): Promise<StorageFile | null> {
    try {
      const fullPath = this.getSafeFilePath(deploymentId, filePath);
      if (!fs.existsSync(fullPath)) return null;

      const stat = await fs.promises.stat(fullPath);
      if (!stat.isFile()) return null;

      const content = await fs.promises.readFile(fullPath);
      const contentType = getMimeType(filePath);

      return {
        content,
        contentType,
        size: stat.size,
      };
    } catch {
      return null;
    }
  }

  async hasFile(deploymentId: string, filePath: string): Promise<boolean> {
    try {
      const fullPath = this.getSafeFilePath(deploymentId, filePath);
      return fs.existsSync(fullPath) && (await fs.promises.stat(fullPath)).isFile();
    } catch {
      return false;
    }
  }

  async deleteDeploymentFiles(deploymentId: string): Promise<void> {
    try {
      const deployDir = this.getDeploymentDir(deploymentId);
      if (fs.existsSync(deployDir)) {
        await fs.promises.rm(deployDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error if already removed
    }
  }

  async listFiles(deploymentId: string): Promise<string[]> {
    try {
      const deployDir = this.getDeploymentDir(deploymentId);
      if (!fs.existsSync(deployDir)) return [];

      const results: string[] = [];
      const traverse = async (currentDir: string, relativePrefix: string) => {
        const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const entryRel = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            await traverse(path.join(currentDir, entry.name), entryRel);
          } else if (entry.isFile()) {
            results.push(entryRel);
          }
        }
      };

      await traverse(deployDir, '');
      return results;
    } catch {
      return [];
    }
  }
}

/**
 * In-memory storage provider for testing and ephemeral environments
 */
export class MemoryStorageProvider implements IStorageProvider {
  private store: Map<string, StorageFile> = new Map();

  private makeKey(deploymentId: string, filePath: string): string {
    const cleanRel = sanitizeFilePath(filePath);
    if (!cleanRel) throw new Error(`Invalid file path: ${filePath}`);
    return `${deploymentId}:::${cleanRel}`;
  }

  async putFile(
    deploymentId: string,
    filePath: string,
    content: Buffer | Uint8Array,
    contentType?: string
  ): Promise<void> {
    const key = this.makeKey(deploymentId, filePath);
    const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const mime = contentType || getMimeType(filePath);
    this.store.set(key, { content: buf, contentType: mime, size: buf.length });
  }

  async getFile(deploymentId: string, filePath: string): Promise<StorageFile | null> {
    try {
      const key = this.makeKey(deploymentId, filePath);
      return this.store.get(key) || null;
    } catch {
      return null;
    }
  }

  async hasFile(deploymentId: string, filePath: string): Promise<boolean> {
    try {
      const key = this.makeKey(deploymentId, filePath);
      return this.store.has(key);
    } catch {
      return false;
    }
  }

  async deleteDeploymentFiles(deploymentId: string): Promise<void> {
    const prefix = `${deploymentId}:::`;
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async listFiles(deploymentId: string): Promise<string[]> {
    const prefix = `${deploymentId}:::`;
    const files: string[] = [];
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        files.push(key.slice(prefix.length));
      }
    }
    return files;
  }
}

/**
 * Storage provider singleton accessor
 */
let globalStorageProvider: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!globalStorageProvider) {
    const providerType = process.env.STORAGE_PROVIDER?.toLowerCase();
    if (providerType === 'memory') {
      globalStorageProvider = new MemoryStorageProvider();
    } else {
      globalStorageProvider = new LocalStorageProvider();
    }
  }
  return globalStorageProvider;
}

export function setStorageProvider(provider: IStorageProvider): void {
  globalStorageProvider = provider;
}
