import { useState, useMemo } from 'react';
import { Document, DocumentCategory, CATEGORY_LABELS, CATEGORY_COLORS, formatBytes, formatDate, getFileIcon } from '@/types';
import {
  Search, Star, FileText, Image as ImageIcon, Table, File,
  GraduationCap, IdCard, Receipt, Briefcase, User, Filter, X, Tag
} from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onDocumentClick: (doc: Document) => void;
  onUpload: () => void;
}

const CATEGORY_ICON_MAP: Record<DocumentCategory, typeof GraduationCap> = {
  academics: GraduationCap,
  identity: IdCard,
  finance: Receipt,
  career: Briefcase,
  personal: User,
};

export default function DocumentList({ documents, onDocumentClick, onUpload }: DocumentListProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach((d) => d.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [documents]);

  const filteredDocs = useMemo(() => {
    let result = documents;

    if (showStarredOnly) {
      result = result.filter((d) => d.is_starred);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((d) => d.category === categoryFilter);
    }

    if (tagFilter) {
      result = result.filter((d) => d.tags.includes(tagFilter));
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((d) =>
        d.title.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query) ||
        d.file_name.toLowerCase().includes(query) ||
        d.tags.some((t) => t.includes(query))
      );
    }

    const sorted = [...result];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'size') {
      sorted.sort((a, b) => b.file_size - a.file_size);
    } else {
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    return sorted;
  }, [documents, search, categoryFilter, tagFilter, showStarredOnly, sortBy]);

  const hasFilters = categoryFilter !== 'all' || tagFilter !== null || showStarredOnly || search.trim() !== '';

  const clearFilters = () => {
    setCategoryFilter('all');
    setTagFilter(null);
    setShowStarredOnly(false);
    setSearch('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
          <p className="text-slate-400 mt-1">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <FileText className="w-5 h-5" />
          Upload
        </button>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, file name, or tag…"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all border ${
              showStarredOnly
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-amber-400 text-amber-500' : ''}`} />
            Starred
          </button>
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-sm text-slate-400 font-medium">
            <Filter className="w-4 h-4" />
            Category:
          </span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              categoryFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as DocumentCategory[]).map((cat) => {
            const Icon = CATEGORY_ICON_MAP[cat];
            const color = CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  categoryFilter === cat
                    ? `${color.bg} ${color.text} ${color.border}`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-slate-400 font-medium">
              <Tag className="w-4 h-4" />
              Tags:
            </span>
            {allTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  tagFilter === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Sort + clear */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'size')}
              className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most recent</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">File size</option>
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Document grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">
                {hasFilters ? 'No documents match your filters' : 'No documents yet'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {hasFilters ? 'Try adjusting your search or filters' : 'Upload your first document to get started'}
              </p>
            </div>
            {!hasFilters && (
              <button
                onClick={onUpload}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
              >
                <FileText className="w-4 h-4" />
                Upload Document
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onClick={() => onDocumentClick(doc)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentCard({ doc, onClick }: { doc: Document; onClick: () => void }) {
  const catColor = CATEGORY_COLORS[doc.category];
  const iconName = getFileIcon(doc.file_type);
  const Icon = iconName === 'Image' ? ImageIcon : iconName === 'Table' ? Table : iconName === 'FileText' ? FileText : File;

  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${catColor.bg}`}>
          <Icon className={`w-6 h-6 ${catColor.icon}`} />
        </div>
        {doc.is_starred && (
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        )}
      </div>

      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{doc.title}</h3>
      <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{doc.description || CATEGORY_LABELS[doc.category]}</p>

      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {doc.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
          {doc.tags.length > 3 && (
            <span className="text-xs text-slate-400">+{doc.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
        <span>{formatBytes(doc.file_size)}</span>
        <span>·</span>
        <span>{formatDate(doc.created_at)}</span>
      </div>
    </button>
  );
}
