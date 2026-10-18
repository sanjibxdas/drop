'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Sparkles } from 'lucide-react';

export function CurlSnippet() {
  const [copied, setCopied] = useState(false);
  const [snippetType, setSnippetType] = useState<'html' | 'zip' | 'json' | 'auth'>('html');
  const [origin] = useState(() =>
    typeof window !== 'undefined' ? window.location.origin : 'https://drop.run'
  );
  const [customSlug, setCustomSlug] = useState('');
  const [password, setPassword] = useState('');

  const getCommand = () => {
    const slugParam = customSlug.trim() ? `?slug=${encodeURIComponent(customSlug.trim())}` : '';
    const pwHeader = password.trim() ? ` \\\n  -H "x-drop-password: ${password.trim()}"` : '';

    switch (snippetType) {
      case 'html':
        return `# Deploy a single HTML file instantly\ncurl -X POST "${origin}/api/deploy${slugParam}" \\\n  -H "Content-Type: text/html"${pwHeader} \\\n  --data-binary @index.html`;

      case 'zip':
        return `# Deploy an entire static build or zipped site\ncurl -X POST "${origin}/api/deploy${slugParam}" \\\n  -H "Content-Type: application/zip"${pwHeader} \\\n  --data-binary @build.zip`;

      case 'json':
        return `# Deploy multiple files via JSON file map\ncurl -X POST "${origin}/api/deploy" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "My App",\n    "files": [\n      { "path": "index.html", "content": "<h1>Hello from API</h1>" },\n      { "path": "style.css", "content": "body { background: #000; color: #fff; }" }\n    ]\n  }'`;

      case 'auth':
        return `# Authenticated deployment with your API key\ncurl -X POST "${origin}/api/deploy" \\\n  -H "Authorization: Bearer drop_live_YOUR_API_KEY" \\\n  -H "Content-Type: text/html" \\\n  --data-binary @index.html`;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSnippetType('html')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              snippetType === 'html' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            HTML Document
          </button>
          <button
            type="button"
            onClick={() => setSnippetType('zip')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              snippetType === 'zip' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ZIP Archive
          </button>
          <button
            type="button"
            onClick={() => setSnippetType('json')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              snippetType === 'json' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            JSON Payload
          </button>
          <button
            type="button"
            onClick={() => setSnippetType('auth')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              snippetType === 'auth' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            API Key Deploy
          </button>
        </div>

        <button
          type="button"
          onClick={copyToClipboard}
          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy cURL'}
        </button>
      </div>

      {/* Code Window */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-lg">
        <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-zinc-300">Terminal Command</span>
          </div>
          <span className="text-[11px] text-zinc-500">HTTP REST API</span>
        </div>
        <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed whitespace-pre selection:bg-blue-600/30">
          {getCommand()}
        </pre>
      </div>

      {/* Quick Customizer */}
      <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/30 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>Slug:</span>
          <input
            type="text"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            placeholder="custom-slug"
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-white placeholder-zinc-600 outline-none w-32 font-mono"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>Password:</span>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="visitor-pw"
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-white placeholder-zinc-600 outline-none w-32 font-mono"
          />
        </div>
        <span className="text-zinc-500 text-[11px]">Parameters dynamically update the snippet above.</span>
      </div>
    </div>
  );
}
