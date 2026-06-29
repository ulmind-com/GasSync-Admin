import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, Droplets, MessageSquare, Bell, Mail, Heart, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/users/${id}/overview`);
        setData(res.data.data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [id]);

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fade-in">
        <button className="btn btn-outline" onClick={() => navigate('/users')}><ArrowLeft size={18} /> Back</button>
        <p style={{ marginTop: '24px', color: 'var(--text-secondary)' }}>User not found.</p>
      </div>
    );
  }

  const { user, extra, counts, recent } = data;

  const statCards = [
    { label: 'Bills', value: counts.bills, icon: <Receipt size={22} />, color: '#60a5fa' },
    { label: 'Reports', value: counts.reports, icon: <Droplets size={22} />, color: '#a78bfa' },
    { label: 'Feedback', value: counts.feedback, icon: <MessageSquare size={22} />, color: '#fbbf24' },
    { label: 'Notifications', value: counts.notifications, icon: <Bell size={22} />, color: '#34d399' },
  ];

  return (
    <div className="fade-in">
      <button className="btn btn-outline" onClick={() => navigate('/users')} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={18} /> Back to Users
      </button>

      {/* PROFILE HEADER */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.6rem' }}>
          {(user.displayName || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>{user.displayName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Mail size={15} /> {user.email}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge" style={{ textTransform: 'capitalize' }}>{user.role}</span>
          {extra.isEmailVerified
            ? <span className="badge badge-success">Email Verified</span>
            : <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>Unverified</span>}
          {extra.hasPushToken
            ? <span className="badge badge-success">Push Active</span>
            : <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>No Token</span>}
        </div>
      </div>

      {/* META ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}><Clock size={15} /> Last Login</div>
          <div style={{ fontWeight: 600 }}>{extra.lastLoginAt ? new Date(extra.lastLoginAt).toLocaleString() : 'Never'}</div>
        </div>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}><Heart size={15} /> Favorites</div>
          <div style={{ fontWeight: 600 }}>{extra.favoritesCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Preferred Fuel</div>
          <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user.preferredFuelType || '—'}</div>
        </div>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Joined</div>
          <div style={{ fontWeight: 600 }}>{new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      {/* COUNT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {statCards.map((c) => (
          <div key={c.label} className="glass-panel stat-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper" style={{ background: `${c.color}22`, color: c.color }}>{c.icon}</div>
            <div>
              <p className="stat-label">{c.label}</p>
              <h2 className="stat-value">{c.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT ACTIVITY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: '16px' }}>Recent Bills</h2>
          <div className="activity-list">
            {recent.bills.map((b: any) => (
              <div key={b._id} className="activity-item">
                <div className="activity-icon" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}><Receipt size={16} /></div>
                <div className="activity-content">
                  <p><strong style={{ color: 'white' }}>{b.stationName || 'Unknown'}</strong> — {b.status}</p>
                  <span className="activity-time">{new Date(b.createdAt).toLocaleDateString()} • {b.totalAmount != null ? `$${Number(b.totalAmount).toFixed(2)}` : '—'}</span>
                </div>
              </div>
            ))}
            {recent.bills.length === 0 && <div style={{ color: 'var(--text-secondary)', padding: '10px 0' }}>No bills.</div>}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: '16px' }}>Recent Reports</h2>
          <div className="activity-list">
            {recent.reports.map((r: any) => (
              <div key={r._id} className="activity-item">
                <div className="activity-icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}><Droplets size={16} /></div>
                <div className="activity-content">
                  <p><strong style={{ textTransform: 'capitalize', color: 'white' }}>{r.fuelType}</strong> at <strong style={{ color: 'var(--success)' }}>${Number(r.price).toFixed(2)}</strong></p>
                  <span className="activity-time">{new Date(r.createdAt).toLocaleDateString()} • {r.stationName || r.city || 'Unknown'}</span>
                </div>
              </div>
            ))}
            {recent.reports.length === 0 && <div style={{ color: 'var(--text-secondary)', padding: '10px 0' }}>No reports.</div>}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 className="section-title" style={{ marginBottom: '16px' }}>Recent Feedback</h2>
          <div className="activity-list">
            {recent.feedback.map((f: any) => (
              <div key={f._id} className="activity-item">
                <div className="activity-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}><MessageSquare size={16} /></div>
                <div className="activity-content">
                  <p><strong style={{ color: 'white' }}>{f.subject}</strong></p>
                  <span className="activity-time">{new Date(f.createdAt).toLocaleDateString()} • {f.category} • {f.status}</span>
                </div>
              </div>
            ))}
            {recent.feedback.length === 0 && <div style={{ color: 'var(--text-secondary)', padding: '10px 0' }}>No feedback.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
