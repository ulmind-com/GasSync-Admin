import React, { useState } from 'react';
import { Send, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export const Notifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to broadcast this notification to ALL users?')) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', body);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post('/admin/notify/broadcast', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message || 'Broadcast initiated successfully');
      setTitle('');
      setBody('');
      setImageFile(null);
      
      // Reset file input if needed (a bit hacky but works for simple forms)
      const fileInput = document.getElementById('broadcast-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to broadcast notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <h1 className="page-title">Broadcast Notifications</h1>
        <p className="page-subtitle">Send push notifications to all registered users</p>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <Bell size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>Compose Message</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>This message will be sent to all users with active push tokens.</p>
          </div>
        </div>

        <form onSubmit={handleBroadcast}>
          <div className="form-group">
            <label className="form-label">Notification Title</label>
            <input 
              type="text" 
              className="form-input" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Important Gas Price Update"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notification Body</label>
            <textarea 
              className="form-input" 
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type your message here..."
              maxLength={255}
              required
            />
            <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {body.length}/255
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Image Attachment (Optional)</label>
            <input 
              id="broadcast-image"
              type="file" 
              accept="image/*"
              className="form-input" 
              onChange={handleImageChange}
              style={{ padding: '8px' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: 'auto', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? <div className="spinner" style={{ width: 18, height: 18, marginRight: '8px' }} /> : <Send size={18} style={{ marginRight: '8px' }} />}
            Send Broadcast
          </button>
        </form>
      </div>
    </div>
  );
};
