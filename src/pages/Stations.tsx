import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Fuel, AlertTriangle, Search, Trash2, Plus, Pencil, X, Eye } from 'lucide-react';
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

  // Add/Edit modal
  const FUELS: { key: string; label: string }[] = [
    { key: 'REGULAR_UNLEADED', label: 'Regular 87' },
    { key: 'MIDGRADE', label: 'Plus 89' },
    { key: 'PREMIUM', label: 'Premium 93' },
    { key: 'DIESEL', label: 'Diesel' },
  ];
  const emptyForm = { name: '', brand: '', address: '', city: '', state: '', zipCode: '', lat: '', lng: '' };
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = adding
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPriceInputs({});
    setModalOpen(true);
  };
  const openEdit = async (st: any) => {
    setEditingId(st._id);
    setForm({ name: st.name || '', brand: st.brand || '', address: st.address || '', city: st.city || '', state: st.state || '', zipCode: st.zipCode || '', lat: '', lng: '' });
    setPriceInputs({});
    setModalOpen(true);
    // Pull the station's current prices so the form shows what's already set —
    // the admin only tweaks what they want, the rest stay unchanged.
    try {
      const res = await api.get(`/admin/stations/${st._id}`);
      const d = res.data.data;
      const s = d.station;
      setForm({ name: s.name || '', brand: s.brand || '', address: s.address || '', city: s.city || '', state: s.state || '', zipCode: s.zipCode || '', lat: '', lng: '' });
      const pi: Record<string, string> = {};
      for (const p of d.marketPrices || []) pi[p.type] = String(p.price);
      setPriceInputs(pi);
    } catch {
      /* keep the row values if the detail fetch fails */
    }
  };

  const saveStation = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/admin/stations/${editingId}`, {
          name: form.name, brand: form.brand, address: form.address,
          city: form.city, state: form.state, zipCode: form.zipCode,
        });
      } else {
        if (!form.lat || !form.lng) { toast.error('Latitude & Longitude required for a new station'); setSaving(false); return; }
        await api.post('/admin/stations', form);
      }
      // Save any entered prices (only for existing/just-updated stations)
      const prices = FUELS
        .filter((f) => priceInputs[f.key] && parseFloat(priceInputs[f.key]) > 0)
        .map((f) => ({ type: f.key, price: parseFloat(priceInputs[f.key]) }));
      if (prices.length > 0 && editingId) {
        await api.post(`/admin/stations/${editingId}/price`, { prices });
      }
      toast.success(editingId ? 'Station updated' : 'Station created');
      setModalOpen(false);
      fetchStations(page);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // View details
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<any>(null);
  const fuelLabel = (t: string) => FUELS.find((f) => f.key === t)?.label || t;

  const openView = async (st: any) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    try {
      const res = await api.get(`/admin/stations/${st._id}`);
      setViewData(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load details');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const deleteOne = async (st: any) => {
    const ok = await confirmToast({ title: `Delete "${st.name}"?`, message: 'This station will be permanently removed.', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await api.delete(`/admin/stations/${st._id}`);
      toast.success('Station deleted');
      fetchStations(stations.length === 1 && page > 1 ? page - 1 : page);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    }
  };

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
        <div style={{ display: 'flex', gap: '10px' }}>
          {writeAccess && (
            <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Station</button>
          )}
          <button className="btn btn-outline" onClick={() => fetchStations(page)}>Refresh</button>
        </div>
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
                  {writeAccess && <th style={{ textAlign: 'right' }}>Actions</th>}
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
                    {writeAccess && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-outline" style={{ padding: '6px' }} title="View details" onClick={() => openView(st)}><Eye size={15} /></button>
                          <button className="btn btn-outline" style={{ padding: '6px' }} title="Edit / set price" onClick={() => openEdit(st)}><Pencil size={15} /></button>
                          <button className="btn btn-outline" style={{ padding: '6px', color: '#f87171' }} title="Delete" onClick={() => deleteOne(st)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {stations.length === 0 && (
                  <tr><td colSpan={writeAccess ? 6 : 4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No stations found.</td></tr>
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

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div
          onClick={() => !saving && setModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-panel-solid)', border: '1px solid var(--border-strong)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingId ? 'Edit Station' : 'Add Station'}</h2>
              <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setModalOpen(false)} disabled={saving}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Station name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div><label className="form-label">Brand</label><input className="form-input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
              <div><label className="form-label">Zip code</label><input className="form-input" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><label className="form-label">City</label><input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><label className="form-label">State</label><input className="form-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              {!editingId && (
                <>
                  <div><label className="form-label">Latitude *</label><input className="form-input" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="e.g. 40.6070" /></div>
                  <div><label className="form-label">Longitude *</label><input className="form-input" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="e.g. -75.4932" /></div>
                </>
              )}
            </div>

            {/* PRICE — only for existing stations (needs an id) */}
            {editingId && (
              <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Set price / gallon (leave blank to skip)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {FUELS.map((f) => (
                    <div key={f.key}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                        <input className="form-input" style={{ paddingLeft: '22px' }} inputMode="decimal" placeholder="0.000"
                          value={priceInputs[f.key] || ''} onChange={(e) => setPriceInputs({ ...priceInputs, [f.key]: e.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Prices show to users instantly, then refresh on the normal cycle like every other station.</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={saveStation} disabled={saving}>
                {saving ? <div className="spinner" style={{ width: 16, height: 16 }} /> : null}
                {editingId ? 'Save changes' : 'Create station'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewOpen && (
        <div
          onClick={() => setViewOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-panel-solid)', border: '1px solid var(--border-strong)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Station Details</h2>
              <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => setViewOpen(false)}><X size={16} /></button>
            </div>

            {viewLoading || !viewData ? (
              <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{viewData.station.name}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{viewData.station.brand}</div>
                </div>

                {(() => {
                  const s = viewData.station;
                  const rows: [string, any][] = [
                    ['Address', s.address || '—'],
                    ['City', s.city || '—'],
                    ['State', s.state || '—'],
                    ['Zip code', s.zipCode || '—'],
                    ['Coordinates', `${viewData.coordinates.lat}, ${viewData.coordinates.lng}`],
                    ['Status', s.isActive ? 'Active' : 'Inactive'],
                    ['Community reports', viewData.communityCount],
                    ['Last price update', s.lastPriceUpdate ? new Date(s.lastPriceUpdate).toLocaleString() : 'Never'],
                    ['Price fetched at', viewData.priceFetchedAt ? new Date(viewData.priceFetchedAt).toLocaleString() : '—'],
                  ];
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: '8px', columnGap: '12px', fontSize: '0.9rem' }}>
                      {rows.map(([k, v]) => (
                        <React.Fragment key={k}>
                          <div style={{ color: 'var(--text-secondary)' }}>{k}</div>
                          <div style={{ fontWeight: 500 }}>{v}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })()}

                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Current market prices</div>
                  {viewData.marketPrices.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No price data yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {viewData.marketPrices.map((p: any) => (
                        <div key={p.type} style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{fuelLabel(p.type)}</div>
                          <div style={{ fontWeight: 700 }}>${Number(p.price).toFixed(3)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  {writeAccess && (
                    <button className="btn btn-primary" onClick={() => { setViewOpen(false); openEdit(viewData.station); }}><Pencil size={15} /> Edit</button>
                  )}
                  <button className="btn btn-outline" onClick={() => setViewOpen(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
