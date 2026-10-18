import JSZip from 'jszip';
import type {
  Deployment,
  DeploymentFile,
  DeployOptions,
  DeployResult,
  AuthContext,
} from './types.ts';
import {
  sanitizeFilePath,
  generateRandomId,
  generateSecretToken,
  hashToken,
  hashPassword,
  validateSlug,
  getMimeType,
} from './security.ts';
import { getStorageProvider, type IStorageProvider } from './storage.ts';
import { getDataStore, DataStore } from './datastore.ts';

export class DeploymentEngine {
  private storage: IStorageProvider;
  private datastore: DataStore;

  constructor(customStorage?: IStorageProvider, customDatastore?: DataStore) {
    this.storage = customStorage || getStorageProvider();
    this.datastore = customDatastore || getDataStore();
  }

  /**
   * Builds the public URL for a deployment
   */
  getPublicUrl(slug: string): string {
    const siteBase = process.env.PUBLIC_SITE_BASE_URL?.trim();
    if (siteBase) {
      // If a custom base URL with wildcard or dedicated subdomain is configured
      if (siteBase.includes('{slug}')) {
        return siteBase.replace('{slug}', slug);
      }
      return `${siteBase.replace(/\/+$/, '')}/${slug}/`;
    }

    const appUrl =
      process.env.APP_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    return `${appUrl.replace(/\/+$/, '')}/sites/${slug}/`;
  }

  /**
   * Deploys a single raw HTML string
   */
  async deployHtml(html: string, options: DeployOptions = {}): Promise<DeployResult> {
    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      throw new Error('HTML content cannot be empty');
    }

    const limits = this.datastore.getLimits();
    const htmlBuffer = Buffer.from(html, 'utf-8');

    if (htmlBuffer.length > limits.maxFileSizeBytes) {
      throw new Error(
        `HTML file size (${(htmlBuffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed size of ${(limits.maxFileSizeBytes / (1024 * 1024)).toFixed(0)} MB`
      );
    }

    const files: DeploymentFile[] = [
      {
        path: 'index.html',
        content: htmlBuffer,
        contentType: 'text/html; charset=utf-8',
        size: htmlBuffer.length,
      },
    ];

    return this.processAndPublish(files, options);
  }

  /**
   * Deploys from a ZIP archive buffer
   */
  async deployZip(zipBuffer: Buffer, options: DeployOptions = {}): Promise<DeployResult> {
    const limits = this.datastore.getLimits();

    if (!zipBuffer || zipBuffer.length === 0) {
      throw new Error('ZIP file buffer is empty');
    }

    if (zipBuffer.length > limits.maxZipSizeBytes) {
      throw new Error(
        `ZIP archive size (${(zipBuffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds limit of ${(limits.maxZipSizeBytes / (1024 * 1024)).toFixed(0)} MB`
      );
    }

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(zipBuffer);
    } catch {
      throw new Error('Failed to parse ZIP archive. Ensure file is a valid, uncorrupted ZIP.');
    }

    // Inspect files & check for single wrapper directory
    const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
    if (entries.length === 0) {
      throw new Error('ZIP archive contains no files');
    }

    if (entries.length > limits.maxFilesPerDrop) {
      throw new Error(
        `ZIP archive contains ${entries.length} files, which exceeds maximum limit of ${limits.maxFilesPerDrop} files per drop`
      );
    }

    // Check if all files share a common single root folder (e.g. "build/index.html", "build/style.css")
    let commonPrefix = '';
    const firstSlash = entries[0].indexOf('/');
    if (firstSlash > 0) {
      const candidate = entries[0].slice(0, firstSlash + 1);
      const allShare = entries.every((e) => e.startsWith(candidate));
      if (allShare) {
        commonPrefix = candidate;
      }
    }

    let totalUncompressed = 0;
    const extractedFiles: DeploymentFile[] = [];

    for (const rawName of entries) {
      const fileEntry = zip.files[rawName];
      if (fileEntry.dir) continue;

      // Strip common wrapper directory if present
      const stripped = commonPrefix ? rawName.slice(commonPrefix.length) : rawName;
      const cleanPath = sanitizeFilePath(stripped);

      // Skip OS junk or unsafe paths
      if (!cleanPath) continue;

      const fileData = await fileEntry.async('nodebuffer');
      totalUncompressed += fileData.length;

      // Prevent decompression bombs
      if (totalUncompressed > limits.maxUncompressedBytes) {
        throw new Error(
          `Decompressed archive size exceeds safety limit of ${(limits.maxUncompressedBytes / (1024 * 1024)).toFixed(0)} MB`
        );
      }

      if (fileData.length > limits.maxFileSizeBytes) {
        throw new Error(
          `File "${cleanPath}" exceeds single file limit of ${(limits.maxFileSizeBytes / (1024 * 1024)).toFixed(0)} MB`
        );
      }

      extractedFiles.push({
        path: cleanPath,
        content: fileData,
        contentType: getMimeType(cleanPath),
        size: fileData.length,
      });
    }

    if (extractedFiles.length === 0) {
      throw new Error('No valid web files found in ZIP archive after sanitization');
    }

    return this.processAndPublish(extractedFiles, options);
  }

  /**
   * Deploys from an array of file records (useful for JSON API & folder picker)
   */
  async deployFileMap(
    files: Array<{ path: string; content: string | Buffer; encoding?: 'utf-8' | 'base64' }>,
    options: DeployOptions = {}
  ): Promise<DeployResult> {
    const limits = this.datastore.getLimits();

    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('File map cannot be empty');
    }

    if (files.length > limits.maxFilesPerDrop) {
      throw new Error(`File map exceeds limit of ${limits.maxFilesPerDrop} files`);
    }

    const processedFiles: DeploymentFile[] = [];
    let totalBytes = 0;

    for (const item of files) {
      const cleanPath = sanitizeFilePath(item.path);
      if (!cleanPath) {
        throw new Error(`Invalid or unsafe file path in file map: "${item.path}"`);
      }

      let buf: Buffer;
      if (Buffer.isBuffer(item.content)) {
        buf = item.content;
      } else if (item.encoding === 'base64') {
        buf = Buffer.from(item.content, 'base64');
      } else {
        buf = Buffer.from(item.content, 'utf-8');
      }

      if (buf.length > limits.maxFileSizeBytes) {
        throw new Error(`File "${cleanPath}" exceeds size limit`);
      }

      totalBytes += buf.length;
      if (totalBytes > limits.maxUncompressedBytes) {
        throw new Error(`Total deployment size exceeds limit`);
      }

      processedFiles.push({
        path: cleanPath,
        content: buf,
        contentType: getMimeType(cleanPath),
        size: buf.length,
      });
    }

    return this.processAndPublish(processedFiles, options);
  }

  /**
   * Core deployment pipeline: validation, slug allocation, storage upload, metadata record
   */
  private async processAndPublish(
    files: DeploymentFile[],
    options: DeployOptions
  ): Promise<DeployResult> {
    // 1. Identify entrypoint
    const hasIndexHtml = files.some((f) => f.path === 'index.html');
    let entrypoint = 'index.html';

    if (!hasIndexHtml) {
      const anyHtml = files.find((f) => f.path.endsWith('.html') || f.path.endsWith('.htm'));
      if (anyHtml) {
        entrypoint = anyHtml.path;
      } else {
        // If no HTML found, create a simple default index that lists files
        const listHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Files</title></head><body><ul>${files.map((f) => `<li><a href="${f.path}">${f.path}</a></li>`).join('')}</ul></body></html>`;
        const listBuf = Buffer.from(listHtml, 'utf-8');
        files.push({
          path: 'index.html',
          content: listBuf,
          contentType: 'text/html; charset=utf-8',
          size: listBuf.length,
        });
        entrypoint = 'index.html';
      }
    }

    // 2. Validate or allocate slug and ID
    let slug: string;
    const deploymentId = `drop_${generateRandomId(12)}`;

    if (options.customSlug) {
      const cleanSlug = options.customSlug.trim().toLowerCase();
      const slugValidation = validateSlug(cleanSlug);
      if (!slugValidation.valid) {
        throw new Error(slugValidation.error || 'Invalid custom slug');
      }

      // Check collision
      const existing = await this.datastore.getDeployment(cleanSlug);
      if (existing) {
        // If user owns the existing deployment, allow updating it
        if (options.ownerId && existing.ownerId === options.ownerId) {
          slug = cleanSlug;
        } else {
          throw new Error(`The custom slug "${cleanSlug}" is already taken`);
        }
      } else {
        slug = cleanSlug;
      }
    } else {
      slug = generateRandomId(8);
    }

    // 3. Password handling
    let passwordHash: string | null = null;
    let passwordSalt: string | null = null;
    if (options.password && options.password.trim().length > 0) {
      const pw = hashPassword(options.password.trim());
      passwordHash = pw.hash;
      passwordSalt = pw.salt;
    }

    // 4. Anonymous tokens
    let claimToken: string | undefined;
    let claimTokenHash: string | null = null;
    let deletionToken: string | undefined;
    let deletionTokenHash: string | null = null;

    if (!options.ownerId) {
      claimToken = generateSecretToken('claim');
      claimTokenHash = hashToken(claimToken);
      deletionToken = generateSecretToken('del');
      deletionTokenHash = hashToken(deletionToken);
    }

    // 5. Expiry calculation
    let expiresAt: string | null = null;
    if (options.ttlHours && options.ttlHours > 0) {
      const expDate = new Date(Date.now() + options.ttlHours * 3600 * 1000);
      expiresAt = expDate.toISOString();
    }

    // 6. Write files to storage
    let totalBytes = 0;
    const filePaths: string[] = [];

    for (const f of files) {
      await this.storage.putFile(deploymentId, f.path, f.content, f.contentType);
      totalBytes += f.size;
      filePaths.push(f.path);
    }

    // 7. Assemble deployment record
    const now = new Date().toISOString();
    const deployment: Deployment = {
      id: deploymentId,
      slug,
      name: options.name?.trim() || slug,
      ownerId: options.ownerId || null,
      claimTokenHash,
      deletionTokenHash,
      passwordHash,
      passwordSalt,
      status: 'ready',
      createdAt: now,
      updatedAt: now,
      expiresAt,
      files: filePaths,
      entrypoint,
      totalBytes,
      fileCount: files.length,
      version: 1,
      spaFallback: !!options.spaFallback,
      storagePrefix: deploymentId,
      deletedAt: null,
    };

    await this.datastore.saveDeployment(deployment);

    const publicUrl = this.getPublicUrl(slug);

    return {
      deployment,
      url: publicUrl,
      claimToken,
      deletionToken,
    };
  }

  /**
   * Appends or replaces specific files in an existing deployment
   */
  async appendFiles(
    deploymentIdOrSlug: string,
    filesToAppend: Array<{ path: string; content: string | Buffer; encoding?: 'utf-8' | 'base64' }>,
    authContext: AuthContext
  ): Promise<Deployment> {
    const deployment = await this.datastore.getDeployment(deploymentIdOrSlug);
    if (!deployment || deployment.status === 'deleted') {
      throw new Error('Deployment not found');
    }

    // Check authorization
    this.assertAuthorized(deployment, authContext);

    const limits = this.datastore.getLimits();
    const existingFileSet = new Set(deployment.files);

    for (const item of filesToAppend) {
      const cleanPath = sanitizeFilePath(item.path);
      if (!cleanPath) {
        throw new Error(`Invalid file path: ${item.path}`);
      }

      let buf: Buffer;
      if (Buffer.isBuffer(item.content)) {
        buf = item.content;
      } else if (item.encoding === 'base64') {
        buf = Buffer.from(item.content, 'base64');
      } else {
        buf = Buffer.from(item.content, 'utf-8');
      }

      if (buf.length > limits.maxFileSizeBytes) {
        throw new Error(`File "${cleanPath}" exceeds size limit`);
      }

      await this.storage.putFile(deployment.id, cleanPath, buf, getMimeType(cleanPath));
      existingFileSet.add(cleanPath);
    }

    deployment.files = Array.from(existingFileSet);
    deployment.fileCount = deployment.files.length;
    deployment.version += 1;
    deployment.updatedAt = new Date().toISOString();

    // Recalculate total bytes
    let totalBytes = 0;
    for (const f of deployment.files) {
      const fileData = await this.storage.getFile(deployment.id, f);
      if (fileData) totalBytes += fileData.size;
    }
    deployment.totalBytes = totalBytes;

    await this.datastore.saveDeployment(deployment);
    return deployment;
  }

  /**
   * Redeploys updated content onto the same stable slug
   */
  async redeploy(
    deploymentIdOrSlug: string,
    files: DeploymentFile[],
    authContext: AuthContext
  ): Promise<Deployment> {
    const deployment = await this.datastore.getDeployment(deploymentIdOrSlug);
    if (!deployment || deployment.status === 'deleted') {
      throw new Error('Deployment not found');
    }

    this.assertAuthorized(deployment, authContext);

    // Clean old files and write new ones
    await this.storage.deleteDeploymentFiles(deployment.id);

    let totalBytes = 0;
    const filePaths: string[] = [];

    for (const f of files) {
      await this.storage.putFile(deployment.id, f.path, f.content, f.contentType);
      totalBytes += f.size;
      filePaths.push(f.path);
    }

    deployment.files = filePaths;
    deployment.fileCount = files.length;
    deployment.totalBytes = totalBytes;
    deployment.version += 1;
    deployment.updatedAt = new Date().toISOString();

    await this.datastore.saveDeployment(deployment);
    return deployment;
  }

  private assertAuthorized(deployment: Deployment, auth: AuthContext): void {
    if (auth.isOwner && auth.userId && deployment.ownerId === auth.userId) {
      return;
    }
    if (auth.apiKeyId && auth.userId && deployment.ownerId === auth.userId) {
      return;
    }
    throw new Error('Unauthorized: You do not own this deployment');
  }
}

let globalEngine: DeploymentEngine | null = null;

export function getDeploymentEngine(): DeploymentEngine {
  if (!globalEngine) {
    globalEngine = new DeploymentEngine();
  }
  return globalEngine;
}
