'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
  Upload,
  FolderUp,
  FileCode,
  Lock,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  FileArchive,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { DeployResult } from '@/lib/types';

interface UploadZoneProps {
  onSuccess: (result: DeployResult) => void;
  userId: string | null;
  onRunDemo: () => void;
  isDemoLoading: boolean;
}

export function UploadZone({
  onSuccess,
  userId,
  onRunDemo,
  isDemoLoading,
}: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [customSlug, setCustomSlug] = useState('');
  const [password, setPassword] = useState('');
  const [ttlHours, setTtlHours] = useState<number>(0);
  const [spaFallback, setSpaFallback] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    setErrorMsg(null);
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setSelectedFiles(arr);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const calculateTotalSize = () => {
    return selectedFiles.reduce((acc, f) => acc + f.size, 0);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const executeDeploy = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one file or archive to deploy.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      if (customSlug.trim()) formData.append('slug', customSlug.trim().toLowerCase());
      if (password.trim()) formData.append('password', password.trim());
      if (ttlHours > 0) formData.append('ttl', ttlHours.toString());
      if (spaFallback) formData.append('spa', 'true');

      // Append files
      selectedFiles.forEach((f) => {
        formData.append('files', f);
      });

      setUploadProgress(40);

      const headers: Record<string, string> = {};
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers,
        body: formData,
      });

      setUploadProgress(85);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

      setUploadProgress(100);
      onSuccess({
        deployment: {
          id: data.id,
          slug: data.slug,
          name: data.name,
          ownerId: userId,
          claimTokenHash: null,
          deletionTokenHash: null,
          passwordHash: password ? 'set' : null,
          passwordSalt: null,
          status: data.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: data.expires_at,
          files: data.files,
          entrypoint: 'index.html',
          totalBytes: data.total_bytes,
          fileCount: data.file_count,
          version: 1,
          spaFallback,
          storagePrefix: data.id,
          deletedAt: null,
        },
        url: data.url,
        claimToken: data.claim_token,
        deletionToken: data.deletion_token,
      });

      clearSelection();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during deployment.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isZip =
    selectedFiles.length === 1 &&
    (selectedFiles[0].name.endsWith('.zip') || selectedFiles[0].type.includes('zip'));

  return (
    <div className="w-full">
      {/* Hidden file and directory inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in browsers
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />

      {/* Main Drag-and-Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 transition-all flex flex-col items-center justify-center text-center ${
          dragOver
            ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-950/40'
            : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-blue-400 mb-4 shadow-sm">
          {isZip ? (
            <FileArchive className="w-8 h-8 text-amber-400" />
          ) : selectedFiles.length > 0 ? (
            <FileCode className="w-8 h-8 text-emerald-400" />
          ) : (
            <Upload className="w-8 h-8 text-blue-400" />
          )}
        </div>

        <h3 className="text-xl font-semibold text-zinc-100 tracking-tight mb-2">
          {selectedFiles.length > 0 ? (
            <span>
              {isZip
                ? selectedFiles[0].name
                : `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} ready to deploy`}
            </span>
          ) : (
            <span>Drop your files, folder, or ZIP archive here</span>
          )}
        </h3>

        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          {selectedFiles.length > 0 ? (
            <span>Total size: {formatBytes(calculateTotalSize())}</span>
          ) : (
            <span>
              Accepts HTML, CSS, JavaScript, images, fonts, or packaged archives. Sub-second hosting,
              100% free with no branding injected.
            </span>
          )}
        </p>

        {/* Buttons inside drop zone */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white transition-colors shadow-sm"
          >
            Choose Files
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <FolderUp className="w-4 h-4" />
            Upload Folder
          </button>
          <button
            type="button"
            onClick={onRunDemo}
            disabled={isDemoLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-blue-900/60 bg-blue-950/40 text-blue-300 hover:bg-blue-900/50 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            {isDemoLoading ? 'Deploying Demo...' : 'Try a Live Demo'}
          </button>
        </div>

        {/* Operational Limits Footnote */}
        <div className="mt-6 text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>Max file: 10 MB</span>
          <span>•</span>
          <span>Max archive: 25 MB</span>
          <span>•</span>
          <span>Max files: 200</span>
          <span>•</span>
          <span>Unlimited deployments</span>
        </div>
      </div>

      {/* Selected Files Preview & Controls */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Selected Files ({selectedFiles.length})
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs font-mono text-zinc-300">
            {selectedFiles.slice(0, 10).map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1 px-2 rounded bg-zinc-950/60"
              >
                <span className="truncate max-w-[80%]">
                  {(f as any).webkitRelativePath || f.name}
                </span>
                <span className="text-zinc-500">{formatBytes(f.size)}</span>
              </div>
            ))}
            {selectedFiles.length > 10 && (
              <p className="text-zinc-500 text-center py-1">
                + {selectedFiles.length - 10} more files
              </p>
            )}
          </div>
        </div>
      )}

      {/* Advanced Settings Disclosure */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>Deployment Settings (Custom Slug, Password, Expiration)</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custom Slug */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Custom URL Slug (Optional)
              </label>
              <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 focus-within:border-blue-500">
                <span className="text-xs text-zinc-500 select-none">/sites/</span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-portfolio"
                  maxLength={48}
                  className="w-full bg-transparent text-xs text-white placeholder-zinc-600 outline-none ml-1 font-mono"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Lowercase letters, numbers, and hyphens.</p>
            </div>

            {/* Visitor Password */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-zinc-400" /> Password Protect (Free)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for public access"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">Only visitors with this password can view the site.</p>
            </div>

            {/* Expiry TTL */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Retention / Expiration
              </label>
              <select
                value={ttlHours}
                onChange={(e) => setTtlHours(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              >
                <option value={0}>Permanent (No expiration)</option>
                <option value={1}>1 Hour (Quick preview)</option>
                <option value={24}>24 Hours</option>
                <option value={168}>7 Days</option>
                <option value={720}>30 Days</option>
              </select>
            </div>

            {/* SPA Fallback Routing */}
            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer mt-2 sm:mt-5">
                <input
                  type="checkbox"
                  checked={spaFallback}
                  onChange={(e) => setSpaFallback(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-zinc-300 font-medium">SPA Fallback Routing</span>
              </label>
              <p className="text-[11px] text-zinc-500 ml-5 mt-0.5">
                Redirect 404 navigation routes to index.html (for React/Vue apps).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-lg border border-red-900/60 bg-red-950/40 flex items-start gap-2.5 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Deployment Error: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-medium">
            <span>Uploading assets and generating public URL...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Primary Deploy Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={executeDeploy}
            disabled={isUploading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isUploading ? 'Publishing Site...' : 'Publish to Live URL'}
          </button>
        </div>
      )}
    </div>
  );
}
