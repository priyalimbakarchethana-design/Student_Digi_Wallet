import { useState } from 'react';
import { Document, formatBytes, formatDate } from '@/types';
import { useSharedLinks } from '@/hooks/useDocuments';
import { X, Share2, Link2, Copy, Check, Trash2, Clock, Eye, Loader2, Calendar } from 'lucide-react';

interface ShareModalProps {
  document: Document;
  onClose: () => void;
}

export default function ShareModal({ document, onClose }: ShareModalProps) {
  const { links, createShareLink, revokeLink } = useSharedLinks();
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [maxViews, setMaxViews] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const docLinks = links.filter((l) => l.document_id === document.id);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await createShareLink(document.id, expiresInDays, maxViews ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeLink(id);
    } catch (err) {
      setError('Failed to revoke link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Share Document</h2>
              <p className="text-sm text-slate-400 truncate">{document.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* File info */}
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Link2 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">{formatBytes(document.file_size)}</span>
              {' · '}Recipients can view and download this document via a secure link.
            </div>
          </div>

          {/* Create new link */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Link expires after</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 7, 30, 0].map((days) => (
                  <button
                    key={days}
                    onClick={() => setExpiresInDays(days)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                      expiresInDays === days
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {days === 0 ? 'Never' : `${days}d`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max views <span className="text-slate-400 font-normal">(optional)</span></label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Unlimited', value: null },
                  { label: '1', value: 1 },
                  { label: '5', value: 5 },
                  { label: '10', value: 10 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setMaxViews(opt.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                      maxViews === opt.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  Generate Secure Link
                </>
              )}
            </button>
          </div>

          {/* Existing links */}
          {docLinks.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Active Links</p>
              <div className="space-y-2">
                {docLinks.map((link) => (
                  <div key={link.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono text-slate-600 truncate">{link.token.slice(0, 16)}…</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyLink(link.token)}
                          className="p-1.5 rounded-md hover:bg-white transition-colors text-slate-500"
                          title="Copy link"
                        >
                          {copiedToken === link.token ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRevoke(link.id)}
                          className="p-1.5 rounded-md hover:bg-white transition-colors text-rose-500"
                          title="Revoke link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {link.views_count}{link.max_views ? `/${link.max_views}` : ''} views
                      </span>
                      {link.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(link.expires_at)}
                        </span>
                      )}
                      {!link.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Never expires
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
