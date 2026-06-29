import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, Bug, Trash2, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { confirmToast } from '../lib/confirm';
import { canWrite } from '../lib/permissions';

interface FeedbackItem {
  _id: string;
  email?: string;
  category: 'bug' | 'feature' | 'general';
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  userId?: { displayName?: string; email?: string };
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  bug: { label: 'Bug', icon: <Bug size={15} />, cls: 'cat-bug' },
  feature: { label: 'Feature', icon: <Star size={15} />, cls: 'cat-feature' },
  general: { label: 'General', icon: <MessageSquare size={15} />, cls: 'cat-general' },
};

const STATUS_FILTERS = ['all', 'open', 'in-progress', 'resolved'] as const;

export const Feedback: React.FC = () => {
  const writeAccess = canWrite();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchFeedback = async (currentPage: number, status: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/feedback?page=${currentPage}&limit=10&status=${status}`);
      setItems(response.data.data.feedback);
      setTotalPages(response.data.data.pagination.totalPages);
      setTotal(response.data.data.pagination.total);
      setOpenCount(response.data.data.openCount);
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to fetch feedback', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/feedback/${id}`, { status });
      setItems((prev) => prev.map((f) => (f._id === id ? { ...f, status: status as FeedbackItem['status'] } : f)));
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmToast({
      title: 'Delete feedback?',
      message: 'This feedback entry will be permanently removed.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setBusyId(id);
    try {
      await api.delete(`/admin/feedback/${id}`);
      toast.success('Feedback deleted');
      const remaining = items.length - 1;
      fetchFeedback(remaining === 0 && page > 1 ? page - 1 : page, statusFilter);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete feedback');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MessageSquare size={28} color="var(--accent-primary)" />
          Feedback
        </h1>
        <p className="page-subtitle">
          What users are telling you about GasSync
          {total > 0 && <span style={{ color: 'var(--text-secondary)' }}> · {total} total</span>}
          {openCount > 0 && <span style={{ color: 'var(--warning)' }}> · {openCount} open</span>}
        </p>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: 40, height: 40 }}></div>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No feedback {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((f) => {
            const cat = CATEGORY_META[f.category] || CATEGORY_META.general;
            const reporter = f.userId?.displayName || f.userId?.email || f.email || 'Anonymous';
            return (
              <div key={f._id} className="glass-panel feedback-card">
                <div className="feedback-head">
                  <span className={`cat-badge ${cat.cls}`}>
                    {cat.icon} {cat.label}
                  </span>
                  <h3 className="feedback-subject">{f.subject}</h3>
                  <div className="feedback-head-right">
                    <select
                      className={`status-select status-${f.status}`}
                      value={f.status}
                      disabled={busyId === f._id || !writeAccess}
                      onChange={(e) => handleStatusChange(f._id, e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    {writeAccess && (
                      <button
                        className="icon-btn danger"
                        title="Delete feedback"
                        disabled={busyId === f._id}
                        onClick={() => handleDelete(f._id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="feedback-message">{f.message}</p>

                <div className="feedback-foot">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={13} /> {reporter}
                  </span>
                  <span className="num">{new Date(f.createdAt).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" disabled={page === 1} onClick={() => fetchFeedback(page - 1, statusFilter)} style={{ padding: '8px' }}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn btn-outline" disabled={page === totalPages} onClick={() => fetchFeedback(page + 1, statusFilter)} style={{ padding: '8px' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
