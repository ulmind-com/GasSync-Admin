import React, { useState } from 'react';
import { Send, Bell } from 'lucide-react';
import api from '../api/axios';

export const Notifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to broadcast this notification to ALL users?')) return;

    setLoading(true);
    try {
      const response = await api.post('/admin/notify/broadcast', { title, body });
      alert(response.data.message || 'Broadcast initiated successfully');
      setTitle('');
      setBody('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to broadcast notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Broadcast Notifications</h1>
        <p className="page-subtitle">Send push notifications to all registered users</p>
      </div>

      <div className="glass-panel" style={{ padding: '32px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
            <Bell size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Compose Message</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This message will be sent to all users with active push tokens.</p>
          </div>
        </div>

        <form onSubmit={handleBroadcast}>
          <div className="form-group">
            <label className="form-label">Notification Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Important Gas Price Update"
              required
              maxLength={64}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Notification Body</label>
            <textarea
              className="form-input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              required
              maxLength={255}
            />
            <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {body.length}/255
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="spinner"></div> : (
              <>
                <Send size={18} />
                Send Broadcast
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
