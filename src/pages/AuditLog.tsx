import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const actionStyle = (action: string): React.CSSProperties => {
  if (action.includes('delete')) return { background: 'rgba(239,68,68,0.15)', color: '#f87171' };
  if (action.includes('verify') || action.includes('toggle')) return { background: 'rgba(59,130,246,0.15)', color: '#60a5fa' };
  if (action.includes('export')) return { background: 'rgba(139,92,246,0.15)', color: '#a78bfa' };
  return { background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' };
};

// Turn a meta key into a friendly label (e.g. "isVerified" -> "Verified").
const prettyKey = (k: string) =>
  k.replace(/^is/, '').replace(/([A-Z])/g, ' $1').replace(/^\s/, '').replace(/^./, (c) => c.toUpperCase());

// Render a meta value compactly: booleans as Yes/No, long strings truncated.
const prettyValue = (v: any): string => {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  const s = String(v);
  return s.length > 28 ? s.slice(0, 28) + '…' : s;
};

// Short form of a Mongo ObjectId for display.
const shortId = (id: string) => (id && id.length > 10 ? `…${id.slice(-6)}` : id);

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 30;

  const fetchLogs = async (currentPage = page) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/audit-log?page=${currentPage}&limit=${limit}`);
      setLogs(res.data.data.logs);
      setTotalPages(res.data.data.pagination.totalPages || 1);
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to fetch audit log', error);
      toast.error('Failed to fetch audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Record of admin actions taken in the panel</p>
        </div>
        <button className="btn btn-outline" onClick={() => fetchLogs(page)}>Refresh</button>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Action</th><th>Admin</th><th>Target</th><th>Details</th><th>When</th></tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td><span className="badge" style={actionStyle(log.action)}>{log.action}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.actor?.displayName || log.actorName || 'Admin'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{log.actor?.email || ''}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {log.targetType ? <span style={{ color: 'var(--text-secondary)' }}>{log.targetType}</span> : '—'}
                      {log.targetId && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }} title={log.targetId}>
                          {shortId(log.targetId)}
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      {log.meta && Object.keys(log.meta).length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {Object.entries(log.meta).map(([k, v]) => (
                            <span
                              key={k}
                              title={`${k}: ${String(v)}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', fontSize: '0.74rem' }}
                            >
                              <span style={{ color: 'var(--text-muted)' }}>{prettyKey(k)}</span>
                              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{prettyValue(v)}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      <History size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                      <div>No admin actions logged yet.</div>
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
              <button className="btn btn-outline" disabled={page === 1} onClick={() => fetchLogs(page - 1)} style={{ padding: '8px', opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={18} /></button>
              <button className="btn btn-outline" disabled={page === totalPages} onClick={() => fetchLogs(page + 1)} style={{ padding: '8px', opacity: page === totalPages ? 0.5 : 1 }}><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
