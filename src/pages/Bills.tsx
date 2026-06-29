import React, { useEffect, useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight, ScanLine, CheckCircle2, XCircle, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { confirmToast } from '../lib/confirm';

interface BillStats {
  total: number;
  totalToday: number;
  verifiedCount: number;
  failedCount: number;
  failedWithError: number;
  successRate: number;
  avgConfidence: number | null;
  statusBreakdown: Record<string, number>;
  providers: Array<{
    provider: string;
    total: number;
    verified: number;
    failed: number;
    avgConfidence: number | null;
    successRate: number;
  }>;
}

const STATUS_OPTIONS = ['all', 'uploading', 'processing', 'extracted', 'verified', 'failed'];

const statusStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'verified':
      return { background: 'rgba(16,185,129,0.15)', color: '#34d399' };
    case 'failed':
      return { background: 'rgba(239,68,68,0.15)', color: '#f87171' };
    case 'processing':
    case 'uploading':
      return { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' };
    default:
      return { background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' };
  }
};

export const Bills: React.FC = () => {
  const [stats, setStats] = useState<BillStats | null>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const limit = 15;

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/bills/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch bill stats', error);
    }
  };

  const fetchBills = async (currentPage = page, status = statusFilter) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/bills?page=${currentPage}&limit=${limit}&status=${status}`);
      setBills(res.data.data.bills);
      setTotalPages(res.data.data.pagination.totalPages || 1);
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to fetch bills', error);
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchBills(1, 'all');
  }, []);

  const applyFilter = (status: string) => {
    setStatusFilter(status);
    fetchBills(1, status);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmToast({
      title: 'Delete bill?',
      message: 'This receipt record will be permanently removed.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    setIsDeleting(id);
    try {
      await api.delete(`/admin/bills/${id}`);
      setBills(bills.filter((b) => b._id !== id));
      toast.success('Bill deleted');
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete bill');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Bills & OCR Monitoring</h1>
          <p className="page-subtitle">Receipt processing health and review queue</p>
        </div>
        <button className="btn btn-outline" onClick={() => { fetchStats(); fetchBills(page); }}>
          Refresh
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="glass-panel stat-card" style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '18px', ['--card-accent' as any]: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
            <ScanLine size={26} />
          </div>
          <div>
            <p className="stat-label">Total Bills</p>
            <h2 className="stat-value">{stats?.total ?? '—'}</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>+{stats?.totalToday ?? 0} today</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '18px', ['--card-accent' as any]: 'linear-gradient(90deg,#10b981,#34d399)' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p className="stat-label">Success Rate</p>
            <h2 className="stat-value">{stats ? `${stats.successRate}%` : '—'}</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stats?.verifiedCount ?? 0} verified</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '18px', ['--card-accent' as any]: 'linear-gradient(90deg,#ef4444,#f87171)' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
            <XCircle size={26} />
          </div>
          <div>
            <p className="stat-label">Failed</p>
            <h2 className="stat-value">{stats?.failedCount ?? '—'}</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stats?.failedWithError ?? 0} with error</span>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '18px', ['--card-accent' as any]: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
            <Gauge size={26} />
          </div>
          <div>
            <p className="stat-label">Avg OCR Confidence</p>
            <h2 className="stat-value">{stats?.avgConfidence != null ? `${Math.round(stats.avgConfidence * 100)}%` : '—'}</h2>
          </div>
        </div>
      </div>

      {/* PROVIDER BREAKDOWN */}
      {stats && stats.providers.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
          <h2 className="section-title" style={{ marginBottom: '16px' }}>OCR Providers</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {stats.providers.map((p) => (
              <div key={p.provider} style={{ flex: '1 1 200px', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: '8px' }}>{p.provider}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>{p.total} bills</span>
                  <span style={{ color: 'var(--success)' }}>{p.successRate}% ok</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Avg conf: {p.avgConfidence != null ? `${Math.round(p.avgConfidence * 100)}%` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', textTransform: 'capitalize', fontSize: '0.85rem' }}
            onClick={() => applyFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Station</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{bill.stationName || bill.station?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{bill.fuelType || '—'}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{bill.user?.email || '—'}</td>
                    <td><span className="badge" style={{ ...statusStyle(bill.status), textTransform: 'capitalize' }}>{bill.status}</span></td>
                    <td>{bill.ocrConfidence != null ? `${Math.round(bill.ocrConfidence * 100)}%` : '—'}</td>
                    <td className="num">{bill.totalAmount != null ? `$${Number(bill.totalAmount).toFixed(2)}` : '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(bill.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="icon-btn danger"
                          title="Delete Bill"
                          onClick={() => handleDelete(bill._id)}
                          disabled={isDeleting === bill._id}
                        >
                          {isDeleting === bill._id ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      No bills found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" disabled={page === 1} onClick={() => fetchBills(page - 1)} style={{ padding: '8px', opacity: page === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={18} />
              </button>
              <button className="btn btn-outline" disabled={page === totalPages} onClick={() => fetchBills(page + 1)} style={{ padding: '8px', opacity: page === totalPages ? 0.5 : 1 }}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
