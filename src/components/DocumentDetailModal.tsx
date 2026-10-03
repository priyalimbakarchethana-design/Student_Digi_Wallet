import { useState, useEffect } from 'react';
import { Document, CATEGORY_LABELS, CATEGORY_COLORS, formatBytes, formatDate, getFileIcon } from '@/types';
import { useDocuments } from '@/hooks/useDocuments';
import {
  X, Download, Star, Trash2, Share2, FileText, Image as ImageIcon,
  Table, File, Calendar, HardDrive, Tag as TagIcon, Loader2
} from 'lucide-react';

interface DocumentDetailModalProps {
  document: Document;
  onClose: () => void;
  onShare: (doc: Document) => void;
  onDeleted: () => void;
}

export default function DocumentDetailModal({ document, onClose, onShare, onDeleted }: DocumentDetailModalProps) {
  const { getDownloadUrl, toggleStar, softDelete } = useDocuments();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImage, setIsImage] = useState(false);
  const [starred, setStarred] = useState(document.is_starred);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadUrl = async () => {
      try {
        const url = await getDownloadUrl(document.file_path);
        setDownloadUrl(url);
        setIsImage(document.file_type.startsWith('image/'));
      } catch (err) {
        console.error('Failed to load preview:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUrl();
  }, [document]);

  const handleStar = async () => {
    const newStarred = !starred;
    setStarred(newStarred);
    try {
      await toggleStar(document.id, newStarred);
    } catch (err) {
      setStarred(!newStarred);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await softDelete(document.id);
      onDeleted();
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    const el = window.document.createElement('a');
    el.href = downloadUrl;
    el.download = document.file_name;
    window.document.body.appendChild(el);
    el.click();
    window.document.body.removeChild(el);
  };

  const catColor = CATEGORY_COLORS[document.category];
  const IconComponent = isImage ? ImageIcon : getFileIcon(document.file_type) === 'Table' ? Table : getFileIcon(document.file_type) === 'Image' ? ImageIcon : FileText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${catColor.bg}`}>
              <IconComponent className={`w-6 h-6 ${catColor.icon}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">{document.title}</h2>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text} mt-0.5`}>
                {CATEGORY_LABELS[document.category]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleStar}
              className="p-2 rounded-lg hover:bg-amber-50 transition-colors"
              title={starred ? 'Unstar' : 'Star'}
            >
              <Star className={`w-5 h-5 ${starred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row">
            {/* Preview */}
            <div className="md:w-3/5 bg-slate-50 min-h-[300px] flex items-center justify-center p-6">
              {loading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm">Loading preview…</p>
                </div>
              ) : isImage && downloadUrl ? (
                <img
                  src={downloadUrl}
                  alt={document.title}
                  className="max-w-full max-h-[400px] object-contain rounded-lg shadow-md"
                />
              ) : downloadUrl ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                    <File className="w-10 h-10 text-slate-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{document.file_name}</p>
                    <p className="text-sm text-slate-400 mt-1">Preview not available for this file type</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download to view
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Failed to load preview</p>
              )}
            </div>

            {/* Details */}
            <div className="md:w-2/5 p-6 space-y-4">
              {document.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{document.description}</p>
                </div>
              )}

              <div className="space-y-3">
                <DetailRow icon={<File className="w-4 h-4" />} label="File name" value={document.file_name} />
                <DetailRow icon={<HardDrive className="w-4 h-4" />} label="Size" value={formatBytes(document.file_size)} />
                <DetailRow icon={<Calendar className="w-4 h-4" />} label="Uploaded" value={formatDate(document.created_at)} />
              </div>

              {document.tags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-sm px-2.5 py-1 rounded-full">
                        <TagIcon className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleDownload}
            disabled={!downloadUrl}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={() => onShare(document)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <div className="flex-1" />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-medium hover:bg-rose-100 transition-all disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
