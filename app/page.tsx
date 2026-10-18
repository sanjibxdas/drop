'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileCode,
  Terminal,
  Globe,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { UploadZone } from '@/components/UploadZone';
import { HtmlEditor } from '@/components/HtmlEditor';
import { CurlSnippet } from '@/components/CurlSnippet';
import { DeploymentResultModal } from '@/components/DeploymentResultModal';
import { Dashboard } from '@/components/Dashboard';
import { ApiKeysView } from '@/components/ApiKeysView';
import { DocsView } from '@/components/DocsView';
import { AuthModal } from '@/components/AuthModal';
import { AbuseModal } from '@/components/AbuseModal';
import type { DeployResult } from '@/lib/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'deploy' | 'dashboard' | 'api' | 'docs'>('deploy');
  const [deployMode, setDeployMode] = useState<'upload' | 'html' | 'curl'>('upload');
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('drop_user_id');
    }
    return null;
  });
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [deploymentCount, setDeploymentCount] = useState<number>(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAbuseModalOpen, setIsAbuseModalOpen] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Fetch count of deployments for current user
  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      try {
        const headers: Record<string, string> = {};
        if (userId) headers['x-user-id'] = userId;
        const res = await fetch('/api/deployments', { headers });
        if (res.ok && active) {
          const data = await res.json();
          setDeploymentCount(data.total || 0);
        }
      } catch {
        // ignore
      }
    };
    fetchCount();
    return () => {
      active = false;
    };
  }, [userId, deployResult]);

  const handleDeploySuccess = (result: DeployResult) => {
    setDeployResult(result);
  };

  const handleRunDemo = async () => {
    setIsDemoLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['x-user-id'] = userId;

      const res = await fetch('/api/demo', {
        method: 'POST',
        headers,
      });

      const data = await res.json();
      if (res.ok) {
        setDeployResult({
          deployment: data.deployment,
          url: data.url,
          claimToken: data.claim_token,
          deletionToken: data.deletion_token,
        });
      }
    } catch {
      // ignore
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-600/30">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        deploymentCount={deploymentCount}
        userId={userId}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAbuse={() => setIsAbuseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* TAB: DEPLOY (HOMEPAGE) */}
        {activeTab === 'deploy' && (
          <div className="flex flex-col items-center">
            {/* Hero Section */}
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 mb-4 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Drop it. Link it.
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
                Your website. One link away.
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Upload a file, folder, or static build. Get a live public URL in seconds. Free, with
                zero ads and no forced branding injected into your site.
              </p>
            </div>

            {/* Input Mode Selector */}
            <div className="w-full max-w-3xl flex items-center justify-center mb-6">
              <div className="flex items-center p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setDeployMode('upload')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    deployMode === 'upload'
                      ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Upload Files / ZIP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeployMode('html')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    deployMode === 'html'
                      ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Paste HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeployMode('curl')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    deployMode === 'curl'
                      ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Deploy with cURL</span>
                </button>
              </div>
            </div>

            {/* Selected Deployment Method Surface */}
            <div className="w-full max-w-3xl">
              {deployMode === 'upload' && (
                <UploadZone
                  onSuccess={handleDeploySuccess}
                  userId={userId}
                  onRunDemo={handleRunDemo}
                  isDemoLoading={isDemoLoading}
                />
              )}
              {deployMode === 'html' && (
                <HtmlEditor onSuccess={handleDeploySuccess} userId={userId} />
              )}
              {deployMode === 'curl' && <CurlSnippet />}
            </div>

            {/* Non-negotiable Guarantees Grid */}
            <div className="w-full max-w-4xl mt-16 pt-12 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Zero Injected Branding
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Published sites contain only the files you upload. Never modified with logos, promotional
                  footers, or tracking pixels.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Zap className="w-4 h-4 text-blue-400" />
                  No Forced Registration
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Deploy instantly as an anonymous user. Save your claim and deletion tokens to manage or
                  link your drops anytime.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Lock className="w-4 h-4 text-amber-400" />
                  Free Password Protection
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Gate any deployment with a visitor password at zero charge. Isolated origin security and
                  scrypt/PBKDF2 key derivation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard userId={userId} onDeployNew={() => setActiveTab('deploy')} />
        )}

        {/* TAB: API & KEYS */}
        {activeTab === 'api' && (
          <ApiKeysView userId={userId} onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}

        {/* TAB: DOCS */}
        {activeTab === 'docs' && <DocsView />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-8 mt-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">Drop</span>
            <span>•</span>
            <span>Completely free website deployment platform</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <button
              onClick={() => setActiveTab('docs')}
              className="hover:text-zinc-200 transition-colors"
            >
              Documentation
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className="hover:text-zinc-200 transition-colors"
            >
              API Reference
            </button>
            <button
              onClick={() => setIsAbuseModalOpen(true)}
              className="hover:text-zinc-200 transition-colors text-red-400/90 hover:text-red-300"
            >
              Report Abuse
            </button>
          </div>
        </div>
      </footer>

      {/* Deployment Result Dialog */}
      {deployResult && (
        <DeploymentResultModal
          result={deployResult}
          onClose={() => setDeployResult(null)}
          onViewDashboard={() => {
            setDeployResult(null);
            setActiveTab('dashboard');
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userId={userId}
        onSetUserId={(id) => setUserId(id)}
      />

      {/* Abuse Report Modal */}
      <AbuseModal isOpen={isAbuseModalOpen} onClose={() => setIsAbuseModalOpen(false)} />
    </div>
  );
}
