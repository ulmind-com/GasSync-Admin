import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Fuel, Power, AlertTriangle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export const Stations: React.FC = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ activeCount: number; staleCount: number }>({ activeCount: 0, staleCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toggling, setToggling] = useState<string | null>(null);
  const limit = 15;

  const fetchStations = async (currentPage = page, term = search, status = statusFilter) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/stations?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(term)}&status=${status}`);
      setStations(res.data.data.stations);
      setSummary(res.data.data.summary);
      setTotalPages(res.data.data.pagination.totalPages || 1);
      setPage(currentPage);
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

  const handleToggle = async (station: any) => {
    setToggling(station._id);
    try {
      const res = await api.patch(`/admin/stations/${station._id}`, { isActive: !station.isActive });
      setStations(stations.map((s) => (s._id === station._id ? { ...s, isActive: res.data.data.isActive } : s)));
      toast.success(`Station ${res.data.data.isActive ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update station');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Stations</h1>
          <p className="page-subtitle">Manage stations and spot stale price data</p>
        </div>
        <button className="btn btn-outline" onClick={() => fetchStations(page)}>Refresh</button>
      </div>

      {/* SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel stat-card" style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}><Power size={24} /></div>
          <div><p className="stat-label">Active Stations</p><h2 className="stat-value">{summary.activeCount}</h2></div>
        </div>
        <div className="glass-panel stat-card" style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}><AlertTriangle size={24} /></div>
          <div><p className="stat-label">Stale Price (&gt;7d)</p><h2 className="stat-value">{summary.staleCount}</h2></div>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search name, city or brand..."
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

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Station</th><th>Location</th><th>Last Price Update</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {stations.map((st) => (
                  <tr key={st._id}>
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
                    <td>
                      <button
                        className={`btn ${st.isActive ? 'btn-outline' : 'btn-primary'}`}
                        style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        onClick={() => handleToggle(st)}
                        disabled={toggling === st._id}
                      >
                        {toggling === st._id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : (st.isActive ? 'Deactivate' : 'Activate')}
                      </button>
                    </td>
                  </tr>
                ))}
                {stations.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No stations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
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
