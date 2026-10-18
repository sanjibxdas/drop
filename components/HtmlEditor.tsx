'use client';

import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  Play,
  RotateCcw,
  Sparkles,
  Lock,
  Clock,
  AlertCircle,
  Columns,
  Code2,
  Eye,
} from 'lucide-react';
import type { DeployResult } from '@/lib/types';

interface HtmlEditorProps {
  onSuccess: (result: DeployResult) => void;
  userId: string | null;
}

const TEMPLATES: Record<string, { label: string; code: string }> = {
  portfolio: {
    label: 'Minimal Portfolio',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Rivera — Software Engineer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      padding: 3rem 1.5rem;
    }
    .wrapper { max-width: 600px; margin: 0 auto; }
    h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
    .role { color: #a1a1aa; font-size: 1rem; margin-bottom: 2rem; }
    p { margin-bottom: 1.5rem; color: #d4d4d8; font-size: 0.95rem; }
    .section-title { font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin: 2.5rem 0 1rem; }
    .project-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      transition: border-color 0.2s;
    }
    .project-card:hover { border-color: #3f3f46; }
    .project-card h3 { font-size: 1.05rem; margin-bottom: 0.25rem; }
    .project-card p { font-size: 0.85rem; color: #a1a1aa; margin-bottom: 0.75rem; }
    .links a {
      color: #60a5fa;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      margin-right: 1.25rem;
    }
    .links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <h1>Alex Rivera</h1>
    <div class="role">Staff Infrastructure Engineer • San Francisco</div>
    <p>I design high-throughput distributed systems, edge compilers, and zero-overhead developer runtimes. Previously built real-time streaming architectures at Scale.</p>

    <div class="section-title">Selected Work</div>
    <div class="project-card">
      <h3>HyperKernel</h3>
      <p>A bare-metal web-worker microkernel written in Rust and WebAssembly.</p>
      <div class="links">
        <a href="#github">GitHub →</a>
        <a href="#docs">Architecture Spec →</a>
      </div>
    </div>

    <div class="project-card">
      <h3>StaticFlow</h3>
      <p>Sub-millisecond asset pipeline for multi-cloud edge deployment.</p>
      <div class="links">
        <a href="#github">View Source →</a>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  countdown: {
    label: 'Launch Announcement',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus 2.0 — Coming Soon</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #030712;
      color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      background: #1e1b4b;
      color: #818cf8;
      border: 1px solid #3730a3;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    h1 { font-size: 3rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 1rem; }
    p { color: #9ca3af; font-size: 1.15rem; max-width: 500px; margin: 0 auto 2.5rem; }
    .timer {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin-bottom: 2.5rem;
    }
    .time-slot {
      background: #111827;
      border: 1px solid #1f2937;
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      min-width: 90px;
    }
    .time-val { font-size: 2.25rem; font-weight: 700; color: #fff; font-family: monospace; }
    .time-lbl { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <div>
    <div class="badge">Next Generation Release</div>
    <h1>Nexus 2.0</h1>
    <p>The autonomous web infrastructure layer built for the agentic era.</p>
    <div class="timer">
      <div class="time-slot"><div class="time-val" id="days">14</div><div class="time-lbl">Days</div></div>
      <div class="time-slot"><div class="time-val" id="hours">08</div><div class="time-lbl">Hours</div></div>
      <div class="time-slot"><div class="time-val" id="mins">42</div><div class="time-lbl">Minutes</div></div>
    </div>
  </div>
</body>
</html>`,
  },
  terminal: {
    label: 'Retro Terminal Card',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>drop://terminal</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0e14;
      color: #00ff66;
      font-family: "Courier New", Courier, monospace;
      padding: 2rem;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .terminal {
      background: #010409;
      border: 1px solid #00ff66;
      box-shadow: 0 0 20px rgba(0, 255, 102, 0.15);
      border-radius: 6px;
      max-width: 650px;
      width: 100%;
      padding: 1.5rem;
    }
    .prompt { color: #00ff66; margin-bottom: 0.5rem; }
    .cursor {
      display: inline-block;
      width: 8px;
      height: 16px;
      background: #00ff66;
      animation: blink 1s step-start infinite;
      vertical-align: middle;
    }
    @keyframes blink { 50% { opacity: 0; } }
    .output { color: #a3be8c; margin-bottom: 1rem; line-height: 1.5; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="terminal">
    <div class="prompt">&gt; init drop_system --zero-config</div>
    <div class="output">
      [OK] Storage layer initialized.<br>
      [OK] Sandboxed HTTP origin mounted.<br>
      [OK] Ready to receive static payloads.
    </div>
    <div class="prompt">&gt; status<span class="cursor"></span></div>
  </div>
</body>
</html>`,
  },
};

export function HtmlEditor({ onSuccess, userId }: HtmlEditorProps) {
  const [htmlCode, setHtmlCode] = useState<string>(TEMPLATES.portfolio.code);
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [customSlug, setCustomSlug] = useState('');
  const [password, setPassword] = useState('');
  const [ttlHours, setTtlHours] = useState<number>(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTemplateChange = (key: string) => {
    if (TEMPLATES[key]) {
      setHtmlCode(TEMPLATES[key].code);
      setErrorMsg(null);
    }
  };

  const handleDeploy = async () => {
    if (!htmlCode.trim()) {
      setErrorMsg('Cannot deploy empty HTML. Please paste or write HTML code.');
      return;
    }

    setIsDeploying(true);
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          html: htmlCode,
          slug: customSlug.trim() || undefined,
          password: password.trim() || undefined,
          ttl: ttlHours > 0 ? ttlHours : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

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
          spaFallback: false,
          storagePrefix: data.id,
          deletedAt: null,
        },
        url: data.url,
        claimToken: data.claim_token,
        deletionToken: data.deletion_token,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Deployment error');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Editor Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/70 text-xs">
        {/* Templates Selector */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Template:
          </span>
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTemplateChange(key)}
                className="px-2.5 py-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode & Viewport */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                viewMode === 'split' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Split View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                viewMode === 'code' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Code Only"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                viewMode === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Preview Only"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          {/* Desktop/Mobile preview toggle */}
          {viewMode !== 'code' && (
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                className={`p-1 rounded ${
                  previewViewport === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
                title="Desktop Viewport"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                className={`p-1 rounded ${
                  previewViewport === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
                title="Mobile Viewport (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setHtmlCode('')}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Reset Editor"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div
        className={`grid gap-4 ${
          viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* Code Input */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner h-[460px]">
            <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                index.html
              </span>
              <span>{htmlCode.length} chars</span>
            </div>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder="<!DOCTYPE html><html>..."
              spellCheck={false}
              className="w-full flex-1 p-4 bg-transparent text-xs font-mono text-zinc-200 outline-none resize-none leading-relaxed selection:bg-blue-600/30"
            />
          </div>
        )}

        {/* Sandboxed Live Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden h-[460px]">
            <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Sandboxed Live Preview
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {previewViewport === 'desktop' ? 'Fluid (100%)' : 'Mobile (375px)'}
              </span>
            </div>
            <div className="flex-1 bg-zinc-900/30 flex items-center justify-center p-2 overflow-auto">
              <iframe
                title="HTML Preview"
                srcDoc={htmlCode}
                sandbox="allow-scripts"
                className={`h-full border border-zinc-800/80 rounded-lg bg-zinc-950 transition-all ${
                  previewViewport === 'mobile' ? 'w-[375px]' : 'w-full'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Optional Metadata Controls */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Custom Slug (Optional)</label>
          <input
            type="text"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-site"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-blue-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
            <Lock className="w-3 h-3 text-zinc-400" /> Password (Optional)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Visitor password"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" /> Expiration
          </label>
          <select
            value={ttlHours}
            onChange={(e) => setTtlHours(parseFloat(e.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
          >
            <option value={0}>Permanent (No expiration)</option>
            <option value={1}>1 Hour</option>
            <option value={24}>24 Hours</option>
            <option value={168}>7 Days</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 rounded-lg border border-red-900/60 bg-red-950/40 flex items-start gap-2 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Deploy Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleDeploy}
          disabled={isDeploying || !htmlCode.trim()}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-white" />
          {isDeploying ? 'Deploying...' : 'Deploy HTML to Live URL'}
        </button>
      </div>
    </div>
  );
}
