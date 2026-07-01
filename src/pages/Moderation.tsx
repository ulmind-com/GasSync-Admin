import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { confirmToast } from '../lib/confirm';
import { canWrite } from '../lib/permissions';

export const Moderation: React.FC = () => {
  const writeAccess = canWrite();
  const [outliers, setOutliers] = useState<any[]>([]);
  const [averages, setAverages] = useState<Array<{ fuelType: string; avg: number }>>([]);
  const [deviation, setDeviation] = useState(0.4);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const avgMap = new Map(averages.map((a) => [a.fuelType, a.avg]));

  const fetchOutliers = async (dev = deviation) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/moderation/outliers?deviation=${dev}`);
      setOutliers(res.data.data.outliers);
      setAverages(res.data.data.fuelAverages);
    } catch (error) {
      console.error('Failed to fetch outliers', error);
      toast.error('Failed to fetch flagged posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutliers(0.4);
  }, []);

  const handleVerify = async (post: any, isVerified: boolean) => {
    setBusy(post._id);
    try {
      await api.patch(`/admin/community-posts/${post._id}/verify`, { isVerified });
      setOutliers(outliers.map((o) => (o._id === post._id ? { ...o, isVerified } : o)));
      toast.success(isVerified ? 'Marked verified' : 'Marked unverified');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update post');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (post: any) => {
    const ok = await confirmToast({
      title: 'Delete post?',
      message: 'This community report will be permanently removed.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    setBusy(post._id);
    try {
      await api.delete(`/admin/prices/${post._id}`);
      setOutliers(outliers.filter((o) => o._id !== post._id));
      toast.success('Post deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Moderation Queue</h1>
          <p className="page-subtitle">Community reports with prices far from the fuel-type average</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Deviation:</span>
          {[0.3, 0.4, 0.5].map((d) => (
            <button
              key={d}
              className={`btn ${deviation === d ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={() => { setDeviation(d); fetchOutliers(d); }}
            >
              ±{Math.round(d * 100)}%
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ShieldAlert size={20} color="#fbbf24" />
        <span style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'white' }}>{outliers.length}</strong> flagged report{outliers.length !== 1 ? 's' : ''} outside ±{Math.round(deviation * 100)}% of the average price.
        </span>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Fuel</th><th>Reported Price</th><th>Avg</th><th>Station</th><th>Reporter</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {outliers.map((o) => {
                  const avg = avgMap.get(o.fuelType);
                  const diffPct = avg ? Math.round(((o.price - avg) / avg) * 100) : 0;
                  return (
                    <tr key={o._id}>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{o.fuelType}</td>
                      <td>
                        <span className="num" style={{ color: diffPct >= 0 ? '#f87171' : '#fbbf24', fontWeight: 600 }}>
                          ${Number(o.price).toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          ({diffPct >= 0 ? '+' : ''}{diffPct}%)
                        </span>
                      </td>
                      <td className="num" style={{ color: 'var(--text-secondary)' }}>{avg ? `$${avg.toFixed(2)}` : '—'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{o.stationName || o.city || 'Unknown'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{o.reportedBy?.email || '—'}</td>
                      <td>
                        {o.isVerified
                          ? <span className="badge badge-success">Verified</span>
                          : <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>Unverified</span>}
                      </td>
                      <td>
                        {writeAccess ? (
                          <div className="actions-cell">
                            <button className="icon-btn" title="Mark Verified" onClick={() => handleVerify(o, true)} disabled={busy === o._id} style={{ color: '#34d399' }}>
                              <CheckCircle2 size={18} />
                            </button>
                            <button className="icon-btn" title="Mark Unverified" onClick={() => handleVerify(o, false)} disabled={busy === o._id} style={{ color: '#fbbf24' }}>
                              <XCircle size={18} />
                            </button>
                            <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(o)} disabled={busy === o._id}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {outliers.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No flagged reports. 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
