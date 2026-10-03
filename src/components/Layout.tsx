import { ReactNode, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, FolderOpen, Bell, Zap, Trash2, LogOut,
  FolderLock, Menu, X, Upload
} from 'lucide-react';

export type ViewName = 'dashboard' | 'documents' | 'reminders' | 'compressor' | 'trash';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  onUpload: () => void;
}

const NAV_ITEMS: { id: ViewName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'My Documents', icon: FolderOpen },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'compressor', label: 'Compressor', icon: Zap },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

export default function Layout({ children, currentView, onNavigate, onUpload }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (view: ViewName) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent
          currentView={currentView}
          onNavigate={handleNavigate}
          onUpload={onUpload}
          userEmail={user?.email ?? ''}
          onSignOut={signOut}
        />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col shadow-xl animate-in slide-in-from-left">
            <SidebarContent
              currentView={currentView}
              onNavigate={handleNavigate}
              onUpload={() => { onUpload(); setMobileOpen(false); }}
              userEmail={user?.email ?? ''}
              onSignOut={signOut}
            />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FolderLock className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">DocVault</span>
            </div>
          </div>
          <button
            onClick={onUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  currentView,
  onNavigate,
  onUpload,
  userEmail,
  onSignOut,
}: {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  onUpload: () => void;
  userEmail: string;
  onSignOut: () => void;
}) {
  return (
    <>
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <FolderLock className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900">DocVault</span>
            <p className="text-xs text-slate-400">Secure Student Locker</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={onUpload}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          <Upload className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              {item.label}
              {item.id === 'reminders' && (
                <span className="ml-auto bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">!</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-semibold text-sm">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{userEmail}</p>
            <p className="text-xs text-slate-400">Student Account</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );
}
