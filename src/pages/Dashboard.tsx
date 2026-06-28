import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, Smartphone, Bell, Activity } from 'lucide-react';
import api from '../api/axios';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activePushTokens: 0,
    recentUsers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/users?limit=1000');
        const users = response.data.data.users || [];
        
        setStats({
          totalUsers: response.data.data.pagination.total || users.length,
          activePushTokens: users.filter((u: any) => u.expoPushToken).length,
          recentUsers: users.filter((u: any) => new Date(u.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length
        });
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle">Welcome back to the GasSync Admin Portal</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '12px', color: '#3b82f6' }}>
            <UsersIcon size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Total Users</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalUsers}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '12px', color: '#8b5cf6' }}>
            <Smartphone size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Active Push Tokens</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.activePushTokens}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px', color: '#10b981' }}>
            <Activity size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>New Users (7d)</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.recentUsers}</h2>
          </div>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '32px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
         <Bell size={48} color="rgba(255,255,255,0.1)" />
         <h3 style={{ color: 'var(--text-secondary)' }}>System is operating normally</h3>
      </div>
    </div>
  );
};
