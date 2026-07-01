import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Fuel, AlertTriangle, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { confirmToast } from '../lib/confirm';
import { canWrite } from '../lib/permissions';

export const Stations: React.FC = () => {
  const writeAccess = canWrite();
  const [stations, setStations] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ activeCount: number; staleCount: number }>({ activeCount: 0, staleCount: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const limit = 10;

  const fetchStations = async (currentPage = page, term = search, status = statusFilter) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/stations?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(term)}&status=${status}`);
      setStations(res.data.data.stations);
      setSummary(res.data.data.summary);
      setTotal(res.data.data.pagination.total || 0);
      setTotalPages(res.data.data.pagination.totalPages || 1);
      setPage(currentPage);
      setSelected(new Set()); // clear selection when the visible page changes
    } catch (error) {
      console.error('Failed to fetch stations', error);
      toast.error('Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations(1, '', 'all');
  }, []);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allOnPageSelected = stations.length > 0 && stations.every((s) => selected.has(s._id));
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        stations.forEach((s) => next.delete(s._id));
      } else {
        stations.forEach((s) => next.add(s._id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const ok = await confirmToast({
      title: `Delete ${ids.length} station${ids.length > 1 ? 's' : ''}?`,
      message: 'The selected stations will be permanently removed from the database.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await api.post('/admin/stations/bulk-delete', { ids });
      toast.success(res.data.message || `Deleted ${ids.length} station(s)`);
      setSelected(new Set());
      // Reload; step back a page if we emptied the current one.
      const remaining = stations.length - ids.filter((id) => stations.some((s) => s._id === id)).length;
      fetchStations(remaining === 0 && page > 1 ? page - 1 : page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete stations');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Stations</h1>
          <p className="page-subtitle">{total.toLocaleString()} stations · manage and clean up data</p>
        </div>
        <button className="btn btn-outline" onClick={() => fetchStations(page)}>Refresh</button>
      </div>

      {/* SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel stat-card" style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}><Fuel size={24} /></div>
          <div><p className="stat-label">Total Stations</p><h2 className="stat-value">{total.toLocaleString()}</h2></div>
        </div>
        <div className="glass-panel stat-card" style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}><AlertTriangle size={24} /></div>
          <div><p className="stat-label">Stale Price (&gt;7d)</p><h2 className="stat-value">{summary.staleCount.toLocaleString()}</h2></div>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search name, city or brand... (press Enter)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchStations(1, search, statusFilter); }}
          />
        </div>
        {['all', 'active', 'inactive'].map((s) => (
          <button
            key={s}
            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 16px', textTransform: 'capitalize' }}
            onClick={() => { setStatusFilter(s); fetchStations(1, search, s); }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* BULK ACTION BAR */}
      {writeAccess && selected.size > 0 && (
        <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--accent-primary)' }}>
          <span style={{ fontWeight: 600 }}>{selected.size} selected</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" onClick={() => setSelected(new Set())} disabled={deleting}>Clear</button>
            <button className="btn btn-danger" onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Trash2 size={16} />}
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {writeAccess && (
                    <th style={{ width: '36px' }}>
                      <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} title="Select all on this page" />
                    </th>
                  )}
                  <th>Station</th>
                  <th>Location</th>
                  <th>Last Price Update</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((st) => (
                  <tr key={st._id} style={selected.has(st._id) ? { background: 'rgba(91,140,255,0.08)' } : undefined}>
                    {writeAccess && (
                      <td>
                        <input type="checkbox" checked={selected.has(st._id)} onChange={() => toggleOne(st._id)} />
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="icon-wrapper" style={{ width: 34, height: 34, background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}><Fuel size={16} /></div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{st.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{st.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.88rem' }}>{[st.city, st.state].filter(Boolean).join(', ') || '—'}</td>
                    <td>
                      {st.lastPriceUpdate ? (
                        <span style={{ color: st.isStale ? '#fbbf24' : 'var(--text-secondary)' }}>
                          {new Date(st.lastPriceUpdate).toLocaleDateString()}{st.isStale && ' (stale)'}
                        </span>
                      ) : (
                        <span style={{ color: '#fbbf24' }}>Never</span>
                      )}
                    </td>
                    <td>
                      {st.isActive
                        ? <span className="badge badge-success">Active</span>
                        : <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>Inactive</span>}
                    </td>
                  </tr>
                ))}
                {stations.length === 0 && (
                  <tr><td colSpan={writeAccess ? 5 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No stations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Page {page} of {totalPages.toLocaleString()}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" disabled={page === 1} onClick={() => fetchStations(page - 1)} style={{ padding: '8px', opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={18} /></button>
              <button className="btn btn-outline" disabled={page === totalPages} onClick={() => fetchStations(page + 1)} style={{ padding: '8px', opacity: page === totalPages ? 0.5 : 1 }}><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
