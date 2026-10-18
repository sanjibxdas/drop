'use client';

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

interface AbuseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AbuseModal({ isOpen, onClose }: AbuseModalProps) {
  const [urlOrSlug, setUrlOrSlug] = useState('');
  const [reason, setReason] = useState('phishing');
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResultMsg(null);

    try {
      const res = await fetch('/api/abuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url_or_slug: urlOrSlug.trim(),
          reason,
          email: email.trim(),
          details: details.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResultMsg({ text: 'Report submitted. Flagged site is queued for security quarantine.' });
        setUrlOrSlug('');
        setDetails('');
      } else {
        setResultMsg({ text: data.error || 'Failed to submit report', error: true });
      }
    } catch (err: any) {
      setResultMsg({ text: err.message, error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" />
            Report Harmful or Abusive Site
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">
            ✕
          </button>
        </div>

        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          Drop enforces zero-tolerance for malware, credential harvesting (phishing), and copyright abuse.
          Reports trigger automated quarantine review.
        </p>

        {resultMsg && (
          <div
            className={`p-3 rounded-lg text-xs mb-4 ${
              resultMsg.error
                ? 'bg-red-950/60 border border-red-900 text-red-300'
                : 'bg-emerald-950/60 border border-emerald-900 text-emerald-300'
            }`}
          >
            {resultMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Target Site URL or Slug</label>
            <input
              type="text"
              required
              value={urlOrSlug}
              onChange={(e) => setUrlOrSlug(e.target.value)}
              placeholder="e.g. https://.../sites/phish-site or phish-site"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Reason for Report</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-red-500"
            >
              <option value="phishing">Phishing / Credential Harvesting</option>
              <option value="malware">Malware / Malicious Script Distribution</option>
              <option value="copyright">DMCA / Copyright Infringement</option>
              <option value="spam">Spam / SEO Abuse</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Your Email (Optional, for updates)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reporter@example.com"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Additional Details</label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain why this content violates policy..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-white outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Abuse Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
