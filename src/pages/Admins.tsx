import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, ShieldCheck, Eye, Lock, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { confirmToast } from '../lib/confirm';
import { canWrite } from '../lib/permissions';

interface AdminRow {
  id: string;
  displayName: string;
  email: string;
  adminPermission: 'read' | 'write';
  lastLoginAt: string | null;
  createdAt: string;
}

const permBadge = (perm: string) =>
  perm === 'write'
    ? { label: 'Read + Write', style: { background: 'rgba(16,185,129,0.15)', color: '#34d399' } }
    : { label: 'Read only', style: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' } };

export const Admins: React.FC = () => {
  const writeAccess = canWrite();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string>('');

  // create form
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [listRes, meRes] = await Promise.all([
        api.get('/admin/admins'),
        api.get('/admin/me').catch(() => null),
      ]);
      setAdmins(listRes.data.data.admins);
      if (meRes) setMeId(meRes.data.data.id);
    } catch (error) {
      console.error('Failed to load admins', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setPermission('read');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/admins', { displayName: name, email, password, permission });
      toast.success('Admin created');
      setCreateOpen(false);
      resetForm();
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = async (admin: AdminRow) => {
    const next = admin.adminPermission === 'write' ? 'read' : 'write';
    setBusy(admin.id);
    try {
      await api.patch(`/admin/admins/${admin.id}`, { permission: next });
      setAdmins(admins.map((a) => (a.id === admin.id ? { ...a, adminPermission: next } : a)));
      toast.success(`Set to ${next === 'write' ? 'Read + Write' : 'Read only'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update admin');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (admin: AdminRow) => {
    const ok = await confirmToast({
      title: 'Delete admin?',
      message: `${admin.email} will lose all access permanently.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setBusy(admin.id);
    try {
      await api.delete(`/admin/admins/${admin.id}`);
      setAdmins(admins.filter((a) => a.id !== admin.id));
      toast.success('Admin deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Admin Management</h1>
          <p className="page-subtitle">Create admins and control their access level</p>
        </div>
        {writeAccess && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <UserPlus size={18} /> New Admin
          </button>
        )}
      </div>

      {!writeAccess && (
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
          <Lock size={18} color="#fbbf24" />
          You have read-only access. You can view admins but cannot create or modify them.
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Admin</th><th>Access Level</th><th>Last Login</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const badge = permBadge(admin.adminPermission);
                  const isMe = admin.id === meId;
                  return (
                    <tr key={admin.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {admin.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {admin.displayName} {isMe && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(you)</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge" style={badge.style}>{badge.label}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(admin.createdAt).toLocaleDateString()}</td>
                      <td>
                        {writeAccess ? (
                          <div className="actions-cell">
                            <button
                              className="icon-btn"
                              title={admin.adminPermission === 'write' ? 'Set to Read only' : 'Set to Read + Write'}
                              onClick={() => handleTogglePermission(admin)}
                              disabled={busy === admin.id || isMe}
                              style={{ opacity: isMe ? 0.4 : 1, cursor: isMe ? 'not-allowed' : 'pointer' }}
                            >
                              {admin.adminPermission === 'write' ? <Eye size={18} /> : <ShieldCheck size={18} />}
                            </button>
                            <button
                              className="icon-btn danger"
                              title="Delete admin"
                              onClick={() => handleDelete(admin)}
                              disabled={busy === admin.id || isMe}
                              style={{ opacity: isMe ? 0.4 : 1, cursor: isMe ? 'not-allowed' : 'pointer' }}
                            >
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
                {admins.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No admins found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Admin">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@thegassync.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-input" style={{ paddingLeft: '36px' }} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Share this password with the new admin securely.</span>
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Access Level</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${permission === 'read' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', padding: '14px' }}
                onClick={() => setPermission('read')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><Eye size={16} /> Read only</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 400 }}>View everything, cannot modify</span>
              </button>
              <button
                type="button"
                className={`btn ${permission === 'write' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', padding: '14px' }}
                onClick={() => setPermission('write')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><ShieldCheck size={16} /> Read + Write</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 400 }}>Full access incl. delete & manage</span>
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Admin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
