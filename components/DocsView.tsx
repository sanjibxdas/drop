'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Terminal,
  Cpu,
  Lock,
  GitBranch,
  Shield,
  HelpCircle,
  Clock,
  Layers,
  Copy,
  Check,
  Code,
  FileCode,
} from 'lucide-react';

export function DocsView() {
  const [activeSection, setActiveSection] = useState<string>('quickstart');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const navItems = [
    { id: 'quickstart', label: 'Quickstart', icon: BookOpen },
    { id: 'curl', label: 'cURL & CLI', icon: Terminal },
    { id: 'github-actions', label: 'GitHub Actions CI/CD', icon: GitBranch },
    { id: 'mcp', label: 'Model Context Protocol (AI Agents)', icon: Cpu },
    { id: 'rest-api', label: 'REST API Reference', icon: Code },
    { id: 'password', label: 'Free Password Protection', icon: Lock },
    { id: 'limits', label: 'Operational Limits & Free Policy', icon: Shield },
    { id: 'privacy-faq', label: 'Privacy, Security & FAQ', icon: HelpCircle },
  ];

  const githubActionsYaml = `name: Deploy to Drop

on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Build Static Site
        run: |
          npm ci
          npm run build

      - name: Package Build Output
        run: |
          cd out || cd dist || cd build
          zip -r ../site.zip .

      - name: Deploy to Drop Platform
        id: drop
        run: |
          RESPONSE=$(curl -s -X POST "https://drop.run/api/deploy" \\
            -H "Authorization: Bearer \${{ secrets.DROP_API_KEY }}" \\
            -H "Content-Type: application/zip" \\
            --data-binary @site.zip)
          
          URL=$(echo "$RESPONSE" | jq -r '.url')
          echo "DEPLOY_URL=$URL" >> $GITHUB_OUTPUT
          echo "### 🚀 Deployed Successfully" >> $GITHUB_STEP_SUMMARY
          echo "Visit live site: [$URL]($URL)" >> $GITHUB_STEP_SUMMARY`;

  const mcpConfigJson = `{
  "mcpServers": {
    "drop": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "https://drop.run/api/mcp"]
    }
  }
}`;

  return (
    <div className="w-full flex flex-col md:flex-row gap-8 items-start">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 space-y-1 sticky top-24">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Documentation Content */}
      <div className="flex-1 min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 sm:p-8 space-y-8 text-zinc-300 text-sm leading-relaxed">
        {/* Quickstart */}
        {activeSection === 'quickstart' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Quickstart Guide</h2>
            <p>
              Drop is an instant static website hosting and deployment engine. Drop a single HTML file,
              folder, or ZIP archive to receive a fast, worldwide shareable public URL within seconds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="text-blue-400 font-bold mb-1">1. Drag & Drop</div>
                <p className="text-xs text-zinc-400">
                  Drop your HTML, CSS, JS, images, or build directory onto the homepage.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="text-emerald-400 font-bold mb-1">2. Zero Config</div>
                <p className="text-xs text-zinc-400">
                  No accounts, credit cards, or build step configurations required.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="text-amber-400 font-bold mb-1">3. Live in Seconds</div>
                <p className="text-xs text-zinc-400">
                  Receive a permanent or TTL-controlled public URL without injected badges.
                </p>
              </div>
            </div>

            <h3 className="text-base font-semibold text-white mt-6">Input Formats Supported</h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 text-xs">
              <li><strong>Single HTML:</strong> A standalone document (.html or .htm).</li>
              <li><strong>ZIP Archive:</strong> Static build output. If wrapped in a single root folder, Drop automatically unwraps it.</li>
              <li><strong>Directory Upload:</strong> Entire folder preserving directory structures and nested paths.</li>
              <li><strong>JSON Payload:</strong> Programmatic file arrays for bots, scripts, and agent tool execution.</li>
            </ul>
          </div>
        )}

        {/* cURL & CLI */}
        {activeSection === 'curl' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">cURL & Command Line Deployments</h2>
            <p>
              Deploy straight from your terminal with standard unix tools. No CLI package installation
              required.
            </p>

            <h3 className="text-sm font-semibold text-white mt-4">1. Deploy Single HTML Document</h3>
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <button
                onClick={() => copySnippet('curl -X POST "https://drop.run/api/deploy" -H "Content-Type: text/html" --data-binary @index.html', 'curl-1')}
                className="absolute right-3 top-3 px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs hover:text-white"
              >
                {copiedSection === 'curl-1' ? 'Copied' : 'Copy'}
              </button>
              <pre className="text-xs font-mono text-zinc-200 overflow-x-auto">
{`curl -X POST "https://drop.run/api/deploy" \\
  -H "Content-Type: text/html" \\
  --data-binary @index.html`}
              </pre>
            </div>

            <h3 className="text-sm font-semibold text-white mt-4">2. Deploy ZIP Archive</h3>
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <button
                onClick={() => copySnippet('curl -X POST "https://drop.run/api/deploy" -H "Content-Type: application/zip" --data-binary @build.zip', 'curl-2')}
                className="absolute right-3 top-3 px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs hover:text-white"
              >
                {copiedSection === 'curl-2' ? 'Copied' : 'Copy'}
              </button>
              <pre className="text-xs font-mono text-zinc-200 overflow-x-auto">
{`curl -X POST "https://drop.run/api/deploy" \\
  -H "Content-Type: application/zip" \\
  --data-binary @build.zip`}
              </pre>
            </div>

            <h3 className="text-sm font-semibold text-white mt-4">3. Deploy with Custom Slug & Password</h3>
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <pre className="text-xs font-mono text-zinc-200 overflow-x-auto">
{`curl -X POST "https://drop.run/api/deploy?slug=my-docs" \\
  -H "Content-Type: text/html" \\
  -H "x-drop-password: secretpassword" \\
  --data-binary @index.html`}
              </pre>
            </div>
          </div>
        )}

        {/* GitHub Actions */}
        {activeSection === 'github-actions' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">GitHub Actions CI/CD Integration</h2>
            <p>
              Automate deployments on every git push or pull request preview. Add your API key as a
              repository secret named <code className="text-blue-400 font-mono">DROP_API_KEY</code>.
            </p>

            <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <button
                onClick={() => copySnippet(githubActionsYaml, 'gh-yaml')}
                className="absolute right-3 top-3 px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs hover:text-white"
              >
                {copiedSection === 'gh-yaml' ? 'Copied' : 'Copy YAML'}
              </button>
              <pre className="text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                {githubActionsYaml}
              </pre>
            </div>
          </div>
        )}

        {/* MCP */}
        {activeSection === 'mcp' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Model Context Protocol (MCP) for AI Agents</h2>
            <p>
              Drop provides a first-class JSON-RPC 2.0 endpoint over HTTP at{' '}
              <code className="text-blue-400 font-mono">/api/mcp</code> for AI coding agents (Claude Desktop,
              Cursor, Windsurf, Gemini CLI).
            </p>

            <h3 className="text-sm font-semibold text-white mt-4">Available Agent Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-blue-400">deploy_html</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Deploy HTML string to live URL</p>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-blue-400">deploy_files</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Deploy multi-file static site</p>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-blue-400">append_files</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Update site at stable URL</p>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-blue-400">set_password</span>
                <p className="text-zinc-500 font-sans text-[11px] mt-0.5">Configure visitor password gate</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-white mt-4">Claude / Cursor MCP Config</h3>
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <pre className="text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                {mcpConfigJson}
              </pre>
            </div>
          </div>
        )}

        {/* REST API */}
        {activeSection === 'rest-api' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">REST API Reference</h2>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs">
                <span className="text-emerald-400 font-bold mr-2">POST</span>
                <span className="text-white">/api/deploy</span>
                <p className="text-zinc-400 font-sans text-xs mt-1">Deploy HTML, ZIP, or JSON file map</p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs">
                <span className="text-blue-400 font-bold mr-2">GET</span>
                <span className="text-white">/api/deployments</span>
                <p className="text-zinc-400 font-sans text-xs mt-1">List deployments for current user</p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs">
                <span className="text-red-400 font-bold mr-2">DELETE</span>
                <span className="text-white">/api/deployments/:id</span>
                <p className="text-zinc-400 font-sans text-xs mt-1">Delete deployment with ownership or deletion token</p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs">
                <span className="text-blue-400 font-bold mr-2">GET</span>
                <span className="text-white">/api/limits</span>
                <p className="text-zinc-400 font-sans text-xs mt-1">View operational limits and quotas</p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs">
                <span className="text-blue-400 font-bold mr-2">GET</span>
                <span className="text-white">/api/openapi.json</span>
                <p className="text-zinc-400 font-sans text-xs mt-1">Full OpenAPI 3.0 specification</p>
              </div>
            </div>
          </div>
        )}

        {/* Password */}
        {activeSection === 'password' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Free Password Protection</h2>
            <p>
              Every Drop deployment can be protected with a visitor password at zero charge.
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 text-xs">
              <li>Protected using secure PBKDF2/scrypt key derivation.</li>
              <li>Visitor password challenge is unbranded and clean.</li>
              <li>Rate limited against brute-force password guessing.</li>
              <li>Passwords are never logged or stored in plaintext.</li>
            </ul>
          </div>
        )}

        {/* Limits */}
        {activeSection === 'limits' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Operational Quotas & Free Operating Policy</h2>
            <p>
              Drop is 100% free for everyone. There are no paid tiers, paywalls, or upgrade buttons. To
              protect the platform from abuse and resource starvation, transparent operational limits apply:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-center">
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="text-lg font-bold text-white">10 MB</div>
                <div className="text-[11px] text-zinc-500">Single File Limit</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="text-lg font-bold text-white">25 MB</div>
                <div className="text-[11px] text-zinc-500">ZIP Archive Limit</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="text-lg font-bold text-white">100 MB</div>
                <div className="text-[11px] text-zinc-500">Uncompressed Limit</div>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="text-lg font-bold text-white">200</div>
                <div className="text-[11px] text-zinc-500">Files Per Drop</div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy & FAQ */}
        {activeSection === 'privacy-faq' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Privacy, Security & FAQ</h2>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Do you inject advertisements or branding?</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Never. Your published websites contain only the files you uploaded. We never inject
                  watermarks, promotional footers, tracking pixels, or advertisements.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">How is my site isolated from other users?</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Published sites are served with strict sandboxed security headers (no dashboard cookies
                  shared, nosniff, referrer protection).
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Can I host commercial websites?</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Yes, commercial use is 100% permitted.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
