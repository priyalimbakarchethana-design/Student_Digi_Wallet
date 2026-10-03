export type DocumentCategory = 'academics' | 'identity' | 'finance' | 'career' | 'personal';

export interface Document {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: DocumentCategory;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_starred: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  document_id: string | null;
  title: string;
  description: string | null;
  remind_date: string;
  is_completed: boolean;
  created_at: string;
}

export interface SharedLink {
  id: string;
  user_id: string;
  document_id: string;
  token: string;
  expires_at: string | null;
  max_views: number | null;
  views_count: number;
  is_active: boolean;
  created_at: string;
}

export interface NewDocument {
  title: string;
  description?: string;
  category: DocumentCategory;
  file_name: string;
  file_type: string;
  file_size: number;
  tags?: string[];
}

export interface NewReminder {
  title: string;
  description?: string;
  remind_date: string;
  document_id?: string | null;
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  academics: 'Academics',
  identity: 'Identity',
  finance: 'Finance',
  career: 'Career',
  personal: 'Personal',
};

export const CATEGORY_COLORS: Record<DocumentCategory, { bg: string; text: string; border: string; icon: string }> = {
  academics: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-500' },
  identity: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-500' },
  finance: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'text-amber-500' },
  career: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'text-rose-500' },
  personal: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'text-slate-500' },
};

export const CATEGORY_ICONS: Record<DocumentCategory, string> = {
  academics: 'GraduationCap',
  identity: 'IdCard',
  finance: 'Receipt',
  career: 'Briefcase',
  personal: 'User',
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return 'Image';
  if (fileType === 'application/pdf') return 'FileText';
  if (fileType.includes('word') || fileType.includes('document')) return 'FileType';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'Table';
  return 'File';
}
