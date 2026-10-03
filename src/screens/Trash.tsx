import { useState } from 'react';
import { useDocuments, useDeletedDocuments } from '@/hooks/useDocuments';
import { Document, CATEGORY_LABELS, CATEGORY_COLORS, formatBytes, formatDate, getFileIcon } from '@/types';
import {
  Trash2, RotateCcw, FileText, Image as ImageIcon, Table, File, Loader2, AlertTriangle
} from 'lucide-react';

export default function Trash() {
  const { deletedDocs, loading, fetchDeleted } = useDeletedDocuments();
  const { restoreDocument, permanentDelete } = useDocuments();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRestore = async (doc: Document) => {
    setActionLoading(doc.id);
    try {
      await restoreDocument(doc.id);
      await fetchDeleted();
    } catch (err) {
      console.error('Restore failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (doc: Document) => {
    if (!confirm(`Permanently delete "${doc.title}"? This cannot be undone.`)) return;
    setActionLoading(doc.id);
    try {
      await permanentDelete(doc);
      await fetchDeleted();
    } catch (err) {
      console.error('Permanent delete failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trash</h1>
        <p className="text-slate-400 mt-1">Restore deleted documents or permanently remove them</p>
      </div>

      {/* Warning banner */}
      {deletedDocs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Documents in trash are still stored securely</p>
            <p className="text-amber-700 mt-1">Restore them anytime. Permanently deleted documents cannot be recovered.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : deletedDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Trash is empty</p>
              <p className="text-sm text-slate-400 mt-1">Deleted documents will appear here for recovery</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {deletedDocs.map((doc) => {
            const catColor = CATEGORY_COLORS[doc.category];
            const iconName = getFileIcon(doc.file_type);
            const Icon = iconName === 'Image' ? ImageIcon : iconName === 'Table' ? Table : iconName === 'FileText' ? FileText : File;

            return (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${catColor.bg} opacity-60`}>
                  <Icon className={`w-6 h-6 ${catColor.icon}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 truncate">{doc.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{CATEGORY_LABELS[doc.category]}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>{formatBytes(doc.file_size)}</span>
                    <span>·</span>
                    <span>Deleted {doc.deleted_at ? formatDate(doc.deleted_at) : 'recently'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRestore(doc)}
                    disabled={actionLoading === doc.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-all disabled:opacity-50"
                  >
                    {actionLoading === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(doc)}
                    disabled={actionLoading === doc.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
