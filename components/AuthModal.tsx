'use client';

import React, { useState } from 'react';
import { User, LogIn, LogOut, Check, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onSetUserId: (id: string | null) => void;
}

export function AuthModal({ isOpen, onClose, userId, onSetUserId }: AuthModalProps) {
  const [inputEmail, setInputEmail] = useState('');

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    const cleanId = `user_${inputEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    onSetUserId(cleanId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drop_user_id', cleanId);
    }
    onClose();
  };

  const handleSignOut = () => {
    onSetUserId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('drop_user_id');
    }
    onClose();
  };

  const handleQuickDemoUser = () => {
    const demoId = 'user_demo_creator';
    onSetUserId(demoId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drop_user_id', demoId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <User className="w-4 h-4 text-blue-400" />
            {userId ? 'Account Settings' : 'Sign In (Optional)'}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">
            ✕
          </button>
        </div>

        {userId ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
              <span className="text-zinc-500 block text-[11px] mb-0.5">CURRENT USER ID</span>
              <span className="font-mono text-white text-xs font-semibold">{userId}</span>
              <span className="inline-block mt-2 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px]">
                Free Unlimited Active
              </span>
            </div>

            <p className="text-zinc-400 leading-relaxed">
              Your deployments and generated API keys are automatically grouped under this account.
            </p>

            <button
              onClick={handleSignOut}
              className="w-full py-2 rounded-lg border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-950/50 transition-colors flex items-center justify-center gap-1.5 font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out to Guest Mode
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <p className="text-zinc-400 leading-relaxed">
              No account is ever required to deploy or share websites. Signing in allows managing your
              drops together and generating API keys.
            </p>

            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Email or Username</label>
                <input
                  type="text"
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In Free
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-2 text-zinc-600 text-[10px] uppercase">Or</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <button
              type="button"
              onClick={handleQuickDemoUser}
              className="w-full py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Quick Demo Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
