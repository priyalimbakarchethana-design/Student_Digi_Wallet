import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Document, Reminder, SharedLink, NewDocument, NewReminder, DocumentCategory } from '@/types';
import { useAuth } from '@/context/AuthContext';

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }
    setDocuments(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (file: File, meta: NewDocument) => {
    if (!user) throw new Error('Not authenticated');

    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('documents')
      .insert({
        ...meta,
        file_path: filePath,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    setDocuments((prev) => [data as Document, ...prev]);
    return data as Document;
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setDocuments((prev) => prev.map((d) => (d.id === id ? (data as Document) : d)));
    return data as Document;
  };

  const toggleStar = async (id: string, starred: boolean) => {
    return updateDocument(id, { is_starred: starred });
  };

  const softDelete = async (id: string) => {
    const { error } = await supabase
      .from('documents')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const restoreDocument = async (id: string) => {
    const { error } = await supabase
      .from('documents')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id);

    if (error) throw error;
    await fetchDocuments();
  };

  const permanentDelete = async (doc: Document) => {
    const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
    if (dbError) throw dbError;

    await supabase.storage.from('documents').remove([doc.file_path]);
    await fetchDocuments();
  };

  const getDownloadUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    updateDocument,
    toggleStar,
    softDelete,
    restoreDocument,
    permanentDelete,
    getDownloadUrl,
  };
}

export function useDeletedDocuments() {
  const { user } = useAuth();
  const [deletedDocs, setDeletedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error fetching deleted docs:', error);
      return;
    }
    setDeletedDocs(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  return { deletedDocs, loading, fetchDeleted };
}

export function useReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('remind_date', { ascending: true });

    if (error) {
      console.error('Error fetching reminders:', error);
      return;
    }
    setReminders(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = async (reminder: NewReminder) => {
    const { data, error } = await supabase
      .from('reminders')
      .insert(reminder)
      .select()
      .single();

    if (error) throw error;
    setReminders((prev) => [...prev, data as Reminder].sort((a, b) => a.remind_date.localeCompare(b.remind_date)));
    return data as Reminder;
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    const { data, error } = await supabase
      .from('reminders')
      .update({ is_completed: completed })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setReminders((prev) => prev.map((r) => (r.id === id ? (data as Reminder) : r)));
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return { reminders, loading, fetchReminders, addReminder, toggleReminder, deleteReminder };
}

export function useSharedLinks() {
  const { user } = useAuth();
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('shared_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared links:', error);
      return;
    }
    setLinks(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const createShareLink = async (documentId: string, expiresInDays?: number, maxViews?: number) => {
    const payload: Record<string, unknown> = { document_id: documentId };
    if (expiresInDays) {
      payload.expires_at = new Date(Date.now() + expiresInDays * 86400000).toISOString();
    }
    if (maxViews) {
      payload.max_views = maxViews;
    }

    const { data, error } = await supabase
      .from('shared_links')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    setLinks((prev) => [data as SharedLink, ...prev]);
    return data as SharedLink;
  };

  const revokeLink = async (id: string) => {
    const { error } = await supabase.from('shared_links').delete().eq('id', id);
    if (error) throw error;
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return { links, loading, fetchLinks, createShareLink, revokeLink };
}

export function useStats() {
  const { documents } = useDocuments();
  const { reminders } = useReminders();

  const activeDocs = documents.filter((d) => !d.is_deleted);
  const starredDocs = activeDocs.filter((d) => d.is_starred);
  const totalSize = activeDocs.reduce((sum, d) => sum + d.file_size, 0);

  const today = new Date().toISOString().split('T')[0];
  const upcomingReminders = reminders.filter(
    (r) => !r.is_completed && r.remind_date >= today
  );
  const overdueReminders = reminders.filter(
    (r) => !r.is_completed && r.remind_date < today
  );

  const byCategory = (Object.keys({ academics: '', identity: '', finance: '', career: '', personal: '' }) as DocumentCategory[]).map((cat) => ({
    category: cat,
    count: activeDocs.filter((d) => d.category === cat).length,
  }));

  return {
    totalDocs: activeDocs.length,
    starredDocs: starredDocs.length,
    totalSize,
    upcomingReminders: upcomingReminders.length,
    overdueReminders: overdueReminders.length,
    byCategory,
  };
}
