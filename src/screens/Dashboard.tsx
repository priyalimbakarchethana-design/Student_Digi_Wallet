import { Document, CATEGORY_LABELS, CATEGORY_COLORS, formatBytes, formatDate, getFileIcon } from '@/types';
import { useStats } from '@/hooks/useDocuments';
import { useReminders } from '@/hooks/useDocuments';
import {
  FileText, Star, HardDrive, Bell, TrendingUp, GraduationCap,
  IdCard, Receipt, Briefcase, User, ArrowRight, Clock, AlertCircle
} from 'lucide-react';

interface DashboardProps {
  documents: Document[];
  onDocumentClick: (doc: Document) => void;
  onNavigate: (view: 'documents' | 'reminders') => void;
  onUpload: () => void;
}

const CATEGORY_ICON_MAP: Record<string, typeof GraduationCap> = {
  academics: GraduationCap,
  identity: IdCard,
  finance: Receipt,
  career: Briefcase,
  personal: User,
};

export default function Dashboard({ documents, onDocumentClick, onNavigate, onUpload }: DashboardProps) {
  const stats = useStats();
  const { reminders } = useReminders();

  const recentDocs = documents.slice(0, 6);
  const starredDocs = documents.filter((d) => d.is_starred).slice(0, 4);

  const today = new Date().toISOString().split('T')[0];
  const upcomingReminders = reminders
    .filter((r) => !r.is_completed && r.remind_date >= today)
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero greeting */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome back to your locker</h1>
          <p className="text-slate-300 text-lg">All your important documents, organized and secure.</p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={onUpload}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-all"
            >
              Upload Document
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('documents')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
            >
              Browse All
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Total Documents"
          value={stats.totalDocs.toString()}
          color="blue"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Starred"
          value={stats.starredDocs.toString()}
          color="amber"
        />
        <StatCard
          icon={<HardDrive className="w-5 h-5" />}
          label="Storage Used"
          value={formatBytes(stats.totalSize)}
          color="emerald"
        />
        <StatCard
          icon={<Bell className="w-5 h-5" />}
          label="Reminders"
          value={stats.upcomingReminders.toString()}
          color="rose"
        />
      </div>

      {/* Category overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Documents by Category</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.byCategory.map(({ category, count }) => {
            const Icon = CATEGORY_ICON_MAP[category] ?? User;
            const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
            return (
              <div key={category} className={`${color.bg} ${color.border} border rounded-xl p-4 text-center`}>
                <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 ${color.icon}`} />
                </div>
                <p className={`text-2xl font-bold ${color.text}`}>{count}</p>
                <p className="text-sm text-slate-500 mt-0.5">{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent documents + Reminders */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent docs — takes 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recently Added</h2>
            <button
              onClick={() => onNavigate('documents')}
              className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-10 h-10 text-slate-300" />}
              title="No documents yet"
              desc="Upload your first document to get started"
              action={<button onClick={onUpload} className="text-blue-600 font-medium text-sm hover:underline">Upload now</button>}
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {recentDocs.map((doc) => (
                <DocCard key={doc.id} doc={doc} onClick={() => onDocumentClick(doc)} />
              ))}
            </div>
          )}
        </div>

        {/* Reminders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Reminders</h2>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingReminders.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-10 h-10 text-slate-300" />}
              title="No reminders"
              desc="Set reminders for deadlines and renewals"
            />
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map((reminder) => {
                const daysLeft = Math.ceil((new Date(reminder.remind_date).getTime() - Date.now()) / 86400000);
                const isUrgent = daysLeft <= 3;
                return (
                  <div key={reminder.id} className={`p-3 rounded-xl border ${isUrgent ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 ${isUrgent ? 'text-rose-500' : 'text-slate-400'}`}>
                        {isUrgent ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{reminder.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(reminder.remind_date)}</p>
                        <p className={`text-xs font-medium mt-1 ${isUrgent ? 'text-rose-600' : 'text-slate-500'}`}>
                          {daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Starred */}
      {starredDocs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <h2 className="text-lg font-bold text-slate-900">Important Documents</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {starredDocs.map((doc) => (
              <DocCard key={doc.id} doc={doc} onClick={() => onDocumentClick(doc)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function DocCard({ doc, onClick }: { doc: Document; onClick: () => void }) {
  const catColor = CATEGORY_COLORS[doc.category];
  const IconName = getFileIcon(doc.file_type);
  const Icon = IconName === 'Image' ? FileText : FileText;

  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-white group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${catColor.bg}`}>
          <Icon className={`w-5 h-5 ${catColor.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">{doc.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{CATEGORY_LABELS[doc.category]}</p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
            <span>{formatBytes(doc.file_size)}</span>
            <span>·</span>
            <span>{formatDate(doc.created_at)}</span>
          </div>
        </div>
        {doc.is_starred && <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />}
      </div>
    </button>
  );
}

function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {icon}
      <p className="font-medium text-slate-700 mt-3">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{desc}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
