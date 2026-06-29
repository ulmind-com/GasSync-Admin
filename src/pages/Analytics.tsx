import React, { useEffect, useState } from 'react';
import { Activity, Zap, Mail, Bell, TrendingUp, Fuel, MapPin, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

interface Engagement {
  totalUsers: number;
  activity: { dau: number; wau: number; mau: number };
  rates: { pushEnabledPct: number; emailVerifiedPct: number; withTokenPct: number };
  counts: { pushEnabled: number; emailVerified: number; withToken: number };
  fuelDistribution: Array<{ fuelType: string; count: number }>;
  signupTrend: Array<{ date: string; count: number }>;
}

interface PriceAnalytics {
  byFuel: Array<{ fuelType: string; avg: number; min: number; max: number; count: number }>;
  byState: Array<{ state: string; avg: number; count: number }>;
  latestHistory: any[];
}

// Lightweight inline bar sparkline for the 30-day signup trend.
const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(1, ...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px' }}>
      {data.map((v, i) => (
        <div
          key={i}
          title={`${v}`}
          style={{
            flex: 1,
            height: `${Math.max(4, (v / max) * 100)}%`,
            background: 'linear-gradient(180deg,#5b8cff,#3b82f6)',
            borderRadius: '3px 3px 0 0',
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
};

export const Analytics: React.FC = () => {
  const [eng, setEng] = useState<Engagement | null>(null);
  const [price, setPrice] = useState<PriceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: 'users' | 'posts' | 'bills') => {
    setExporting(type);
    try {
      const res = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${type}.csv`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(null);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [e, p] = await Promise.all([
          api.get('/admin/engagement'),
          api.get('/admin/price-analytics'),
        ]);
        setEng(e.data.data);
        setPrice(p.data.data);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  const stateMax = price ? Math.max(1, ...price.byState.map((s) => s.count)) : 1;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Engagement, retention and price intelligence</p>
      </div>

      {/* ACTIVITY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {[
          { label: 'Active Today (DAU)', value: eng?.activity.dau, color: '#60a5fa', icon: <Activity size={24} /> },
          { label: 'Active 7d (WAU)', value: eng?.activity.wau, color: '#34d399', icon: <Activity size={24} /> },
          { label: 'Active 30d (MAU)', value: eng?.activity.mau, color: '#a78bfa', icon: <Activity size={24} /> },
          { label: 'Total Users', value: eng?.totalUsers, color: '#fbbf24', icon: <Zap size={24} /> },
        ].map((c) => (
          <div key={c.label} className="glass-panel stat-card" style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper" style={{ background: `${c.color}22`, color: c.color }}>{c.icon}</div>
            <div>
              <p className="stat-label">{c.label}</p>
              <h2 className="stat-value">{c.value ?? '—'}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* RATES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {[
          { label: 'Push Enabled', pct: eng?.rates.pushEnabledPct, count: eng?.counts.pushEnabled, icon: <Bell size={18} />, color: '#34d399' },
          { label: 'Email Verified', pct: eng?.rates.emailVerifiedPct, count: eng?.counts.emailVerified, icon: <Mail size={18} />, color: '#60a5fa' },
          { label: 'Has Push Token', pct: eng?.rates.withTokenPct, count: eng?.counts.withToken, icon: <Zap size={18} />, color: '#a78bfa' },
        ].map((r) => (
          <div key={r.label} className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '10px' }}>
              <span style={{ color: r.color }}>{r.icon}</span> {r.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{r.pct ?? 0}%</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.count ?? 0} users</span>
            </div>
            <div className="rank-bar" style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${r.pct ?? 0}%`, height: '100%', background: r.color, borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* SIGNUP TREND */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <TrendingUp size={20} color="var(--accent-primary)" />
          <h2 className="section-title">New Signups — Last 30 Days</h2>
        </div>
        {eng && eng.signupTrend.length > 0 ? (
          <Sparkline data={eng.signupTrend.map((d) => d.count)} />
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No signup data.</div>
        )}
      </div>

      {/* FUEL DISTRIBUTION + PRICE BY FUEL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Fuel size={20} color="#a78bfa" />
            <h2 className="section-title">Preferred Fuel Distribution</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {eng?.fuelDistribution.map((f) => {
              const max = Math.max(1, ...(eng.fuelDistribution.map((x) => x.count)));
              return (
                <div key={f.fuelType}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{f.fuelType}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{f.count}</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(f.count / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#8b5cf6,#a78bfa)', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
            {(!eng || eng.fuelDistribution.length === 0) && <div style={{ color: 'var(--text-secondary)' }}>No data.</div>}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Fuel size={20} color="#34d399" />
            <h2 className="section-title">Avg Reported Price by Fuel</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Fuel</th><th>Avg</th><th>Min</th><th>Max</th><th>Reports</th></tr>
              </thead>
              <tbody>
                {price?.byFuel.map((f) => (
                  <tr key={f.fuelType}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{f.fuelType}</td>
                    <td className="num" style={{ color: 'var(--success)' }}>${f.avg.toFixed(2)}</td>
                    <td className="num">${f.min.toFixed(2)}</td>
                    <td className="num">${f.max.toFixed(2)}</td>
                    <td>{f.count}</td>
                  </tr>
                ))}
                {(!price || price.byFuel.length === 0) && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No price data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TOP STATES */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <MapPin size={20} color="#60a5fa" />
          <h2 className="section-title">Top States by Report Volume</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {price?.byState.map((s) => (
            <div key={s.state}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>{s.state}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{s.count} reports • avg ${s.avg.toFixed(2)}</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(s.count / stateMax) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
          {(!price || price.byState.length === 0) && <div style={{ color: 'var(--text-secondary)' }}>No state data.</div>}
        </div>
      </div>

      {/* DATA EXPORTS */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Download size={20} color="var(--accent-primary)" />
          <h2 className="section-title">Data Exports (CSV)</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {(['users', 'posts', 'bills'] as const).map((t) => (
            <button
              key={t}
              className="btn btn-outline"
              style={{ textTransform: 'capitalize' }}
              onClick={() => handleExport(t)}
              disabled={exporting === t}
            >
              {exporting === t ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Download size={16} />}
              Export {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
