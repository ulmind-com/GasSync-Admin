import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, UserPlus, Database, Activity, MapPin, Clock, Droplets } from 'lucide-react';
import api from '../api/axios';

interface DashboardData {
  metrics: {
    totalUsers: number;
    users24h: number;
    totalPosts: number;
    posts24h: number;
  };
  topLocations: Array<{ name?: string; city?: string; state?: string; count: number }>;
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
        <div className="glass-panel stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <UsersIcon size={32} />
          </div>
          <div>
            <p className="stat-label">Total Users</p>
            <h2 className="stat-value">{data.metrics.totalUsers}</h2>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <UserPlus size={32} />
          </div>
          <div>
            <p className="stat-label">Users (Last 24h)</p>
            <h2 className="stat-value">+{data.metrics.users24h}</h2>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <Database size={32} />
          </div>
          <div>
            <p className="stat-label">Community Posts</p>
            <h2 className="stat-value">{data.metrics.totalPosts}</h2>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Activity size={32} />
          </div>
          <div>
            <p className="stat-label">Posts (Last 24h)</p>
            <h2 className="stat-value">+{data.metrics.posts24h}</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* TOP LOCATIONS */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <MapPin size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Top Reporting Stations</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.topLocations.map((loc, idx) => {
              const percentage = Math.max(5, (loc.count / maxLocationCount) * 100);
              const label = loc.name || (loc.city ? `${loc.city}${loc.state ? `, ${loc.state}` : ''}` : 'Unknown');
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', gap: '12px' }}>
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                    <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{loc.count} posts</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        background: 'linear-gradient(90deg, var(--accent-primary), #8b5cf6)',
                        borderRadius: '4px',
                        transition: 'width 1s ease-out'
                      }} 
                    />
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
              <Droplets size={24} color="#8b5cf6" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Recent Prices Reported</h2>
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
                      <strong style={{ color: '#10b981' }}> ${price.price.toFixed(2)}</strong>
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
              <Clock size={24} color="#10b981" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Recent Signups</h2>
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
