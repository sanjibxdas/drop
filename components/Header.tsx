'use client';

import React from 'react';
import { Globe, BookOpen, Key, Layers, Sparkles, User, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'deploy' | 'dashboard' | 'api' | 'docs';
  setActiveTab: (tab: 'deploy' | 'dashboard' | 'api' | 'docs') => void;
  deploymentCount: number;
  userId: string | null;
  onOpenAuth: () => void;
  onOpenAbuse: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  deploymentCount,
  userId,
  onOpenAuth,
  onOpenAbuse,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('deploy')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
            aria-label="Drop home"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm group-hover:bg-blue-500 transition-colors">
              D
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-zinc-100 flex items-center gap-1.5">
                Drop
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  FREE
                </span>
              </span>
            </div>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('deploy')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'deploy'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              Deploy
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              My Drops
              {deploymentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-blue-900/60 text-blue-300 font-mono">
                  {deploymentCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'api'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Key className="w-4 h-4" />
              API & Keys
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'docs'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Docs
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAbuse}
            className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1"
            title="Report abuse or unauthorized content"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Report Abuse
          </button>

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            {userId ? (
              <span className="truncate max-w-[100px]">{userId.replace('user_', '')}</span>
            ) : (
              <span>Account (Optional)</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center justify-around border-t border-zinc-800/80 px-2 py-1.5 bg-zinc-900/40 text-xs">
        <button
          onClick={() => setActiveTab('deploy')}
          className={`px-2.5 py-1 rounded flex items-center gap-1 ${
            activeTab === 'deploy' ? 'text-blue-400 font-semibold' : 'text-zinc-400'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Deploy
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2.5 py-1 rounded flex items-center gap-1 ${
            activeTab === 'dashboard' ? 'text-blue-400 font-semibold' : 'text-zinc-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Drops
          {deploymentCount > 0 && <span className="text-[10px]">({deploymentCount})</span>}
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-2.5 py-1 rounded flex items-center gap-1 ${
            activeTab === 'api' ? 'text-blue-400 font-semibold' : 'text-zinc-400'
          }`}
        >
          <Key className="w-3.5 h-3.5" /> API
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-2.5 py-1 rounded flex items-center gap-1 ${
            activeTab === 'docs' ? 'text-blue-400 font-semibold' : 'text-zinc-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Docs
        </button>
      </div>
    </header>
  );
}
