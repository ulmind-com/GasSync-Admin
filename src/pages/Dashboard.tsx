import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, UserPlus, Database, Activity, MapPin, Clock, Droplets, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import { TrendChart, type TrendPoint } from '../components/TrendChart';

interface DashboardData {
  metrics: {
    totalUsers: number;
    users24h: number;
    totalPosts: number;
    posts24h: number;
  };
  topLocations: Array<{ name?: string; city?: string; state?: string; count: number }>;
  trend: TrendPoint[];
  recentActivity: {
    users: Array<{ _id: string; displayName: string; email: string; createdAt: string }>;
    prices: Array<{ _id: string; fuelType: string; price: number; city?: string; state?: string; stationName?: string; createdAt: string; reportedBy?: { displayName: string }; station?: { name: string } }>;
  };
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/dashboard');
        setData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  if (!data) return null;

  const maxLocationCount = data.topLocations.length > 0 ? Math.max(...data.topLocations.map(l => l.count)) : 1;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">Real-time community engagement and growth metrics</p>
      </div>

      {/* METRICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-panel stat-card" style={{ padding: '26px', display: 'flex', alignItems: 'center', gap: '20px', ['--card-accent' as any]: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <UsersIcon size={28} />
          </div>
          <div>
            <p className="stat-label">Total Users</p>
            <h2 className="stat-value">{data.metrics.totalUsers}</h2>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '26px', display: 'flex', alignItems: 'center', gap: '20px', ['--card-accent' as any]: 'linear-gradient(90deg,#10b981,#34d399)' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <UserPlus size={28} />
          </div>
          <div>
            <p className="stat-label">Users (Last 24h)</p>
            <h2 className="stat-value">+{data.metrics.users24h}</h2>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '26px', display: 'flex', alignItems: 'center', gap: '20px', ['--card-accent' as any]: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <Database size={28} />
          </div>
          <div>
            <p className="stat-label">Community Posts</p>
            <h2 className="stat-value">{data.metrics.totalPosts}</h2>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '26px', display: 'flex', alignItems: 'center', gap: '20px', ['--card-accent' as any]: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Activity size={28} />
          </div>
          <div>
            <p className="stat-label">Posts (Last 24h)</p>
            <h2 className="stat-value">+{data.metrics.posts24h}</h2>
          </div>
        </div>
      </div>

      {/* ACTIVITY TREND CHART */}
      <div className="glass-panel" style={{ padding: '28px 28px 18px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp size={22} color="var(--accent-primary)" />
            <h2 className="section-title">Activity Trend</h2>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Last 14 days</span>
        </div>
        {data.trend && data.trend.length > 0 ? (
          <TrendChart data={data.trend} />
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>No activity data yet.</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* TOP LOCATIONS */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <MapPin size={22} color="var(--accent-primary)" />
            <h2 className="section-title">Top Reporting Stations</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {data.topLocations.map((loc, idx) => {
              const percentage = Math.max(6, (loc.count / maxLocationCount) * 100);
              const label = loc.name || (loc.city ? `${loc.city}${loc.state ? `, ${loc.state}` : ''}` : 'Unknown');
              const medal = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : '';
              return (
                <div key={idx} className="rank-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span className={`rank-medal ${medal}`}>{idx + 1}</span>
                      <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                    </span>
                    <span className="num" style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{loc.count}</span>
                  </div>
                  <div className="rank-bar-track">
                    <div className="rank-bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
            {data.topLocations.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No community posts yet.</div>
            )}
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Droplets size={22} color="#a78bfa" />
              <h2 className="section-title">Recent Prices Reported</h2>
            </div>
            
            <div className="activity-list">
              {data.recentActivity.prices.map((price) => (
                <div key={price._id} className="activity-item">
                  <div className="activity-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                    <Droplets size={16} />
                  </div>
                  <div className="activity-content">
                    <p>
                      <strong style={{ color: 'white' }}>{price.reportedBy?.displayName || 'Someone'}</strong> reported <strong style={{ textTransform: 'capitalize', color: 'white' }}>{price.fuelType}</strong> gas at 
                      <strong className="num" style={{ color: 'var(--success)' }}> ${price.price.toFixed(2)}</strong>
                    </p>
                    <span className="activity-time">{new Date(price.createdAt).toLocaleString()} • {price.station?.name || price.stationName || price.city || 'Unknown Location'}</span>
                  </div>
                </div>
              ))}
              {data.recentActivity.prices.length === 0 && (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }}>No recent prices.</div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Clock size={22} color="#34d399" />
              <h2 className="section-title">Recent Signups</h2>
            </div>
            
            <div className="activity-list">
              {data.recentActivity.users.map((user) => (
                <div key={user._id} className="activity-item">
                  <div className="activity-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <UserPlus size={16} />
                  </div>
                  <div className="activity-content">
                    <p>
                      <strong style={{ color: 'white' }}>{user.displayName}</strong> joined GasSync!
                    </p>
                    <span className="activity-time">{new Date(user.createdAt).toLocaleString()} • {user.email}</span>
                  </div>
                </div>
              ))}
              {data.recentActivity.users.length === 0 && (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }}>No recent users.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
