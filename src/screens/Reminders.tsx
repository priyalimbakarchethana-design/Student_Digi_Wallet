import { useState } from 'react';
import { useReminders } from '@/hooks/useDocuments';
import { formatDate } from '@/types';
import {
  Bell, Plus, Check, Trash2, Clock, AlertCircle, Calendar, X, Loader2
} from 'lucide-react';

export default function Reminders() {
  const { reminders, addReminder, toggleReminder, deleteReminder } = useReminders();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const upcoming = reminders.filter((r) => !r.is_completed);
  const completed = reminders.filter((r) => r.is_completed);

  const overdue = upcoming.filter((r) => r.remind_date < today);
  const dueSoon = upcoming.filter((r) => {
    const days = Math.ceil((new Date(r.remind_date).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  });
  const later = upcoming.filter((r) => {
    const days = Math.ceil((new Date(r.remind_date).getTime() - Date.now()) / 86400000);
    return days > 7;
  });

  const handleAdd = async () => {
    if (!title.trim() || !date) {
      setError('Please enter a title and date');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addReminder({
        title: title.trim(),
        description: description.trim() || undefined,
        remind_date: date,
      });
      setTitle('');
      setDescription('');
      setDate('');
      setShowAdd(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reminder');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
          <p className="text-slate-400 mt-1">Never miss a deadline, renewal, or application date</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Reminder
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard icon={<AlertCircle className="w-5 h-5" />} label="Overdue" value={overdue.length} color="rose" />
        <SummaryCard icon={<Clock className="w-5 h-5" />} label="Due Soon" value={dueSoon.length} color="amber" />
        <SummaryCard icon={<Calendar className="w-5 h-5" />} label="Upcoming" value={upcoming.length} color="blue" />
      </div>

      {/* Reminder sections */}
      {upcoming.length === 0 && completed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">No reminders yet</p>
              <p className="text-sm text-slate-400 mt-1">Add a reminder for deadlines, renewals, or missing documents</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add your first reminder
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <ReminderSection
              title="Overdue"
              icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
              reminders={overdue}
              onToggle={toggleReminder}
              onDelete={deleteReminder}
              variant="overdue"
            />
          )}
          {dueSoon.length > 0 && (
            <ReminderSection
              title="Due Soon (Next 7 Days)"
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              reminders={dueSoon}
              onToggle={toggleReminder}
              onDelete={deleteReminder}
              variant="soon"
            />
          )}
          {later.length > 0 && (
            <ReminderSection
              title="Upcoming"
              icon={<Calendar className="w-5 h-5 text-blue-500" />}
              reminders={later}
              onToggle={toggleReminder}
              onDelete={deleteReminder}
              variant="later"
            />
          )}
          {completed.length > 0 && (
            <ReminderSection
              title="Completed"
              icon={<Check className="w-5 h-5 text-emerald-500" />}
              reminders={completed}
              onToggle={toggleReminder}
              onDelete={deleteReminder}
              variant="completed"
            />
          )}
        </div>
      )}

      {/* Add reminder modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">New Reminder</h2>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Passport renewal deadline"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details…"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function ReminderSection({
  title,
  icon,
  reminders,
  onToggle,
  onDelete,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  reminders: ReturnType<typeof useReminders>['reminders'];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  variant: 'overdue' | 'soon' | 'later' | 'completed';
}) {
  const borderColor = {
    overdue: 'border-rose-200',
    soon: 'border-amber-200',
    later: 'border-blue-200',
    completed: 'border-emerald-200',
  }[variant];

  return (
    <div className={`bg-white rounded-2xl border ${borderColor} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-bold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-400">({reminders.length})</span>
      </div>
      <div className="space-y-2">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
              reminder.is_completed ? 'bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <button
              onClick={() => onToggle(reminder.id, !reminder.is_completed)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                reminder.is_completed
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-300 hover:border-emerald-400'
              }`}
            >
              {reminder.is_completed && <Check className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${reminder.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                {reminder.title}
              </p>
              {reminder.description && (
                <p className="text-xs text-slate-400 mt-0.5">{reminder.description}</p>
              )}
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(reminder.remind_date)}
              </div>
            </div>
            <button
              onClick={() => onDelete(reminder.id)}
              className="text-slate-300 hover:text-rose-500 transition-colors p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
