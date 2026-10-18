'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Key,
  Trash2,
  Layers,
  ArrowRight,
  Globe,
  Share2,
} from 'lucide-react';
import type { DeployResult } from '@/lib/types';

interface DeploymentResultModalProps {
  result: DeployResult;
  onClose: () => void;
  onViewDashboard: () => void;
}

export function DeploymentResultModal({
  result,
  onClose,
  onViewDashboard,
}: DeploymentResultModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedClaim, setCopiedClaim] = useState(false);
  const [copiedDelete, setCopiedDelete] = useState(false);

  const copyText = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const { deployment, url, claimToken, deletionToken } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Top badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Website Deployed & Live
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-sm font-medium p-1"
          >
            ✕
          </button>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          Your site is live!
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          Your static files have been validated, stored, and are accessible worldwide at the link below.
        </p>

        {/* Primary URL Card */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 mb-6">
          <div className="text-xs font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
            <span>PUBLIC SHAREABLE URL</span>
            <span className="text-emerald-400 text-[11px] font-mono">Status: Ready</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none select-all"
            />
            <button
              onClick={() => copyText(url, setCopiedUrl)}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              title="Copy URL"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedUrl ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors flex-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Live Website
            </a>
          </div>
        </div>

        {/* Deployment stats grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg border border-zinc-800/70 bg-zinc-900/30 text-center text-xs mb-6">
          <div>
            <div className="text-zinc-500 text-[11px]">FILES</div>
            <div className="text-white font-mono font-semibold mt-0.5">{deployment.fileCount}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px]">TOTAL SIZE</div>
            <div className="text-white font-mono font-semibold mt-0.5">
              {(deployment.totalBytes / 1024).toFixed(1)} KB
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px]">SLUG</div>
            <div className="text-white font-mono font-semibold mt-0.5 truncate max-w-[120px] mx-auto">
              {deployment.slug}
            </div>
          </div>
        </div>

        {/* Anonymous Claims & Secret Tokens (Only shown when created) */}
        {claimToken && (
          <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 mb-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Save Your Anonymous Access Tokens</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              You published this deployment anonymously without an account. To claim this drop later or
              delete it without signing in, keep these one-time tokens safe. They will never be shown again.
            </p>

            {/* Claim Token */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" /> One-Time Claim Token
                </span>
                <button
                  onClick={() => copyText(claimToken, setCopiedClaim)}
                  className="text-amber-400 hover:text-amber-300 text-[11px]"
                >
                  {copiedClaim ? 'Copied' : 'Copy Token'}
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={claimToken}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 font-mono select-all outline-none"
              />
            </div>

            {/* Deletion Token */}
            {deletionToken && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                  <span className="font-medium flex items-center gap-1">
                    <Trash2 className="w-3 h-3 text-red-400" /> Anonymous Deletion Token
                  </span>
                  <button
                    onClick={() => copyText(deletionToken, setCopiedDelete)}
                    className="text-red-400 hover:text-red-300 text-[11px]"
                  >
                    {copiedDelete ? 'Copied' : 'Copy Token'}
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={deletionToken}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 font-mono select-all outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onViewDashboard}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
          >
            <Layers className="w-4 h-4" />
            Manage in My Drops
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Deploy Another Site
          </button>
        </div>
      </div>
    </div>
  );
}
