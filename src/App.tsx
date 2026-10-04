import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthScreen from '@/screens/AuthScreen';
import Layout, { ViewName } from '@/components/Layout';
import Dashboard from '@/screens/Dashboard';
import DocumentList from '@/screens/DocumentList';
import Reminders from '@/screens/Reminders';
import Compressor from '@/components/Compressor';
import Trash from '@/screens/Trash';
import UploadModal from '@/components/UploadModal';
import DocumentDetailModal from '@/components/DocumentDetailModal';
import ShareModal from '@/components/ShareModal';
import { Document } from '@/types';
import { useDocuments } from '@/hooks/useDocuments';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<ViewName>('dashboard');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const { documents, loading: docsLoading } = useDocuments();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'oauth' || hashParams.get('access_token') || hashParams.get('error')) {
      supabase.auth.exchangeCodeForSession(window.location.href).then(() => {
        if (window.history.replaceState) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <>
      <Layout currentView={view} onNavigate={setView} onUpload={() => setShowUpload(true)}>
        {view === 'dashboard' && (
          <Dashboard
            documents={documents}
            onDocumentClick={setSelectedDoc}
            onNavigate={(v) => setView(v)}
            onUpload={() => setShowUpload(true)}
          />
        )}
        {view === 'documents' && (
          <DocumentList
            documents={documents}
            onDocumentClick={setSelectedDoc}
            onUpload={() => setShowUpload(true)}
          />
        )}
        {view === 'reminders' && <Reminders />}
        {view === 'compressor' && <Compressor />}
        {view === 'trash' && <Trash />}
      </Layout>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onShare={(doc) => {
            setSelectedDoc(null);
            setShareDoc(doc);
          }}
          onDeleted={() => setSelectedDoc(null)}
        />
      )}

      {shareDoc && (
        <ShareModal document={shareDoc} onClose={() => setShareDoc(null)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
