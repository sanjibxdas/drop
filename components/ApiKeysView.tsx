'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  Terminal,
  Play,
  Code2,
} from 'lucide-react';
import type { ApiKey } from '@/lib/types';

interface ApiKeysViewProps {
  userId: string | null;
  onOpenAuth: () => void;
}

export function ApiKeysView({ userId, onOpenAuth }: ApiKeysViewProps) {
  const [keys, setKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Interactive API Tester state
  const [apiEndpoint, setApiEndpoint] = useState('/api/limits');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiPayload, setApiPayload] = useState('');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isCallingApi, setIsCallingApi] = useState(false);

  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!userId) {
        if (active) setKeys([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/keys', {
          headers: { 'x-user-id': userId },
        });
        const data = await res.json();
        if (res.ok && active) {
          setKeys(data.keys || []);
        }
      } catch {
        // ignore
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userId, refreshCount]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      onOpenAuth();
      return;
    }

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ name: keyName.trim() || 'Development Key' }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewlyCreatedKey(data.api_key);
        setKeyName('');
        setRefreshCount((c) => c + 1);
      } else {
        setActionMsg(data.error || 'Failed to generate key');
      }
    } catch (err: any) {
      setActionMsg(err.message || 'Key creation failed');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This will stop automated deployments using this key.')) return;
    try {
      const res = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId || '' },
      });
      if (res.ok) {
        setRefreshCount((c) => c + 1);
      }
    } catch {
      // ignore
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const runApiTest = async () => {
    setIsCallingApi(true);
    setApiResponse(null);
    try {
      const headers: Record<string, string> = {};
      if (apiMethod === 'POST') headers['Content-Type'] = 'application/json';
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch(apiEndpoint, {
        method: apiMethod,
        headers,
        body: apiMethod === 'POST' && apiPayload ? apiPayload : undefined,
      });

      const json = await res.json();
      setApiResponse(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsCallingApi(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Overview Card */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" /> API Keys & Automation
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Create unlimited scoped API keys for automated deployments from CLI scripts, CI/CD pipelines,
              and AI agents. Free for all users.
            </p>
          </div>

          {!userId && (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0"
            >
              Sign In to Create Keys
            </button>
          )}
        </div>

        {/* Generate Key Form */}
        {userId && (
          <form onSubmit={handleCreateKey} className="flex flex-wrap items-center gap-2 mb-6">
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key label (e.g. GitHub Actions, Laptop CLI)"
              className="flex-1 min-w-[240px] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Generate Secret Key
            </button>
          </form>
        )}

        {/* Newly Created Key Alert (Shown Only Once) */}
        {newlyCreatedKey && (
          <div className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/30 mb-6">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Save your new secret API key now</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              This secret is hashed using SHA-256 and stored securely. It will never be displayed again.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={newlyCreatedKey}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white select-all outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(newlyCreatedKey)}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 shrink-0"
              >
                {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedKey ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Keys List */}
        {userId ? (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Active Keys ({keys.length})
            </h3>
            {keys.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3">No API keys created yet.</p>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="p-3 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>{k.name}</span>
                        <span className="font-mono text-zinc-500 text-[11px]">{k.prefix}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Created {new Date(k.created_at).toLocaleDateString()}
                        {k.last_used_at && ` • Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeKey(k.id)}
                      className="p-1.5 rounded text-zinc-500 hover:text-red-400 transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Sign in with an account to generate, track, and revoke secret API keys.
          </p>
        )}
      </div>

      {/* Interactive REST API Explorer */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" /> Interactive API Explorer
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Test live Drop API endpoints directly in your browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select
            value={apiMethod}
            onChange={(e) => setApiMethod(e.target.value as any)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white font-mono outline-none"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>

          <select
            value={apiEndpoint}
            onChange={(e) => {
              const val = e.target.value;
              setApiEndpoint(val);
              if (val === '/api/mcp') {
                setApiMethod('POST');
                setApiPayload(
                  JSON.stringify(
                    {
                      jsonrpc: '2.0',
                      id: 1,
                      method: 'tools/call',
                      params: {
                        name: 'deploy_html',
                        arguments: { html: '<h1>Hello from MCP Explorer</h1>' },
                      },
                    },
                    null,
                    2
                  )
                );
              } else if (val === '/api/deploy') {
                setApiMethod('POST');
                setApiPayload(
                  JSON.stringify(
                    {
                      name: 'API Explorer Drop',
                      html: '<!DOCTYPE html><html><body><h1>Deployed from Explorer</h1></body></html>',
                    },
                    null,
                    2
                  )
                );
              } else {
                setApiMethod('GET');
                setApiPayload('');
              }
            }}
            className="flex-1 min-w-[200px] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white font-mono outline-none"
          >
            <option value="/api/limits">/api/limits (Get Platform Quotas)</option>
            <option value="/api/account">/api/account (Get Usage Stats)</option>
            <option value="/api/deployments">/api/deployments (List Drops)</option>
            <option value="/api/openapi.json">/api/openapi.json (OpenAPI 3.0 Spec)</option>
            <option value="/api/deploy">/api/deploy (Deploy JSON Site)</option>
            <option value="/api/mcp">/api/mcp (Model Context Protocol)</option>
          </select>

          <button
            type="button"
            onClick={runApiTest}
            disabled={isCallingApi}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {isCallingApi ? 'Running...' : 'Send Request'}
          </button>
        </div>

        {/* JSON Payload input if POST */}
        {apiMethod === 'POST' && (
          <div className="mb-3">
            <label className="block text-[11px] text-zinc-400 font-mono mb-1">Request Body (JSON)</label>
            <textarea
              value={apiPayload}
              onChange={(e) => setApiPayload(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs font-mono text-zinc-200 outline-none resize-y"
            />
          </div>
        )}

        {/* Response Box */}
        {apiResponse && (
          <div className="mt-3">
            <div className="text-[11px] font-mono text-zinc-400 mb-1 flex items-center justify-between">
              <span>HTTP 200 OK — JSON Response:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(apiResponse)}
                className="text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <pre className="max-h-64 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs font-mono text-emerald-400">
              {apiResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
