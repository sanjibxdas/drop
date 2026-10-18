'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Plus,
  Clock,
  Layers,
  FileCode,
  AlertCircle,
  Key,
  ShieldCheck,
  Edit2,
  Upload,
} from 'lucide-react';
import type { Deployment } from '@/lib/types';

interface DashboardProps {
  userId: string | null;
  onDeployNew: () => void;
}

export function Dashboard({ userId, onDeployNew }: DashboardProps) {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'password' | 'expired'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [passwordModalDrop, setPasswordModalDrop] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimDropId, setClaimDropId] = useState('');
  const [claimTokenInput, setClaimTokenInput] = useState('');
  const [appendModalDrop, setAppendModalDrop] = useState<any | null>(null);
  const [appendFiles, setAppendFiles] = useState<File[]>([]);
  const [actionMsg, setActionMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (userId) {
          headers['x-user-id'] = userId;
        }

        const res = await fetch(`/api/deployments?all=true`, { headers });
        const data = await res.json();
        if (res.ok && active) {
          setDeployments(data.deployments || []);
        }
      } catch {
        // Handle error gracefully
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [userId, refreshCount]);

  const reloadDeployments = () => setRefreshCount((c) => c + 1);

  const copyUrl = (slug: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/sites/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deployment?')) return;
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch(`/api/deployments/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setActionMsg({ text: 'Deployment deleted successfully.' });
        reloadDeployments();
      } else {
        const d = await res.json();
        setActionMsg({ text: d.error || 'Failed to delete deployment', error: true });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Delete error', error: true });
    }
  };

  const handleSetPassword = async () => {
    if (!passwordModalDrop) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch(`/api/deployments/${passwordModalDrop.id}/password`, {
        method: newPassword.trim() ? 'POST' : 'DELETE',
        headers,
        body: JSON.stringify({ password: newPassword.trim() }),
      });

      if (res.ok) {
        setActionMsg({
          text: newPassword.trim() ? 'Password protection enabled' : 'Password protection removed',
        });
        setPasswordModalDrop(null);
        setNewPassword('');
        reloadDeployments();
      } else {
        const d = await res.json();
        setActionMsg({ text: d.error || 'Failed to configure password', error: true });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, error: true });
    }
  };

  const handleClaim = async () => {
    if (!claimDropId.trim() || !claimTokenInput.trim()) {
      setActionMsg({ text: 'Please enter both Drop ID and Claim Token', error: true });
      return;
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch(`/api/deployments/${claimDropId.trim()}/claim`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ claim_token: claimTokenInput.trim() }),
      });

      const d = await res.json();
      if (res.ok) {
        setActionMsg({ text: 'Drop successfully claimed into your account!' });
        setClaimModalOpen(false);
        setClaimDropId('');
        setClaimTokenInput('');
        reloadDeployments();
      } else {
        setActionMsg({ text: d.error || 'Claim failed', error: true });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, error: true });
    }
  };

  const handleAppend = async () => {
    if (!appendModalDrop || appendFiles.length === 0) return;
    try {
      const formData = new FormData();
      appendFiles.forEach((f) => {
        formData.append('files', f);
      });

      const headers: Record<string, string> = {};
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch(`/api/deployments/${appendModalDrop.id}/append`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.ok) {
        setActionMsg({ text: 'Files appended and new version deployed!' });
        setAppendModalDrop(null);
        setAppendFiles([]);
        reloadDeployments();
      } else {
        const d = await res.json();
        setActionMsg({ text: d.error || 'Failed to append files', error: true });
      }
    } catch (err: any) {
      setActionMsg({ text: err.message, error: true });
    }
  };

  // Filter deployments
  const filtered = deployments.filter((d) => {
    const matchesQuery =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;

    if (filterStatus === 'active') return d.status === 'ready';
    if (filterStatus === 'password') return d.password_protected;
    if (filterStatus === 'expired') return d.status === 'expired';
    return true;
  });

  const totalBytes = deployments.reduce((sum, d) => sum + (d.total_bytes || 0), 0);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{deployments.length}</div>
            <div className="text-xs text-zinc-400">Total Deployments</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{(totalBytes / 1024).toFixed(1)} KB</div>
            <div className="text-xs text-zinc-400">Storage Used (100% Free)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Free Platform</div>
            <div className="text-xs text-zinc-400 mt-1">Unlimited Sites • Zero Injected Ads</div>
          </div>
          <button
            onClick={() => setClaimModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            Claim Drop
          </button>
        </div>
      </div>

      {/* Action Banner */}
      {actionMsg && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            actionMsg.error
              ? 'border-red-900/60 bg-red-950/40 text-red-300'
              : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-zinc-500 hover:text-zinc-300 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, slug, or ID..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterStatus === 'all' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterStatus === 'active' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('password')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterStatus === 'password' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Protected
            </button>
          </div>

          <button
            onClick={reloadDeployments}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onDeployNew}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Deploy
          </button>
        </div>
      </div>

      {/* Deployment List */}
      {isLoading ? (
        <div className="py-16 text-center text-zinc-500 text-sm">Loading deployments...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <FileCode className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h4 className="text-base font-medium text-zinc-300 mb-1">No deployments found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            {searchQuery
              ? 'No sites match your search criteria.'
              : 'You haven’t deployed any websites yet. Deploy your first static site in seconds!'}
          </p>
          <button
            onClick={onDeployNew}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
          >
            Deploy Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Info */}
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-white truncate">{d.name}</span>
                  <span className="font-mono text-xs text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    /sites/{d.slug}
                  </span>
                  {d.password_protected && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 text-amber-400 border border-amber-800/60">
                      <Lock className="w-2.5 h-2.5" /> Protected
                    </span>
                  )}
                  {d.version > 1 && (
                    <span className="text-[10px] text-zinc-500 font-mono">v{d.version}</span>
                  )}
                  {d.status === 'expired' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800/60">
                      Expired
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                  <span>{d.file_count} files</span>
                  <span>•</span>
                  <span>{(d.total_bytes / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>Deployed {new Date(d.created_at).toLocaleDateString()}</span>
                  {d.expires_at ? (
                    <>
                      <span>•</span>
                      <span className="text-amber-500/80 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires {new Date(d.expires_at).toLocaleDateString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>•</span>
                      <span className="text-zinc-500">Permanent</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyUrl(d.slug, d.id)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-xs flex items-center gap-1"
                  title="Copy share link"
                >
                  {copiedId === d.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === d.id ? 'Copied' : 'Link'}</span>
                </button>

                <a
                  href={`/sites/${d.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Open live site"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open</span>
                </a>

                <button
                  onClick={() => {
                    setPasswordModalDrop(d);
                    setNewPassword('');
                  }}
                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title={d.password_protected ? 'Change or remove password' : 'Set password'}
                >
                  {d.password_protected ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setAppendModalDrop(d)}
                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Append or replace files"
                >
                  <Upload className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(d.id)}
                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                  title="Delete deployment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password Modal */}
      {passwordModalDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-white mb-1">
              {passwordModalDrop.password_protected ? 'Manage Password' : 'Set Password'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Protect <strong>/sites/{passwordModalDrop.slug}</strong> with a password. Leave blank to remove
              password protection.
            </p>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (or blank to remove)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none mb-4 focus:border-blue-500"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPasswordModalDrop(null)}
                className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetPassword}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Drop Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-white mb-1">Claim Anonymous Drop</h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              If you published a website anonymously without an account, paste its Drop ID and secret Claim
              Token to link it permanently to your account.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Drop ID or Slug</label>
                <input
                  type="text"
                  value={claimDropId}
                  onChange={(e) => setClaimDropId(e.target.value)}
                  placeholder="e.g. drop_8f2e9a1c or my-slug"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Secret Claim Token</label>
                <input
                  type="text"
                  value={claimTokenInput}
                  onChange={(e) => setClaimTokenInput(e.target.value)}
                  placeholder="claim_..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setClaimModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClaim}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Claim to Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Append Files Modal */}
      {appendModalDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
            <h3 className="text-base font-semibold text-white mb-1">Append or Update Files</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Add new assets or replace existing files for <strong>/sites/{appendModalDrop.slug}</strong> without
              changing the URL.
            </p>

            <input
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) setAppendFiles(Array.from(e.target.files));
              }}
              className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-200 file:font-medium hover:file:bg-zinc-700 mb-4"
            />

            {appendFiles.length > 0 && (
              <p className="text-xs text-zinc-400 mb-4">{appendFiles.length} files selected for update.</p>
            )}

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAppendModalDrop(null)}
                className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAppend}
                disabled={appendFiles.length === 0}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
              >
                Upload & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
