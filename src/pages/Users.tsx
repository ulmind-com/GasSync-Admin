import React, { useEffect, useState } from 'react';
import { Trash2, Send, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchUsers = async (currentPage = page) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users?page=${currentPage}&limit=${limit}`);
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.totalPages || 1);
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to fetch users', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      alert('User deleted successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSendNotification = async (id: string, token: string | undefined) => {
    if (!token) {
      alert('User does not have an active push token');
      return;
    }

    const title = window.prompt('Notification Title:');
    if (!title) return;
    const body = window.prompt('Notification Body:');
    if (!body) return;

    try {
      await api.post(`/admin/notify/user/${id}`, { title, body });
      alert('Notification sent successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send notification');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">View and manage all registered users</p>
        </div>
        <button className="btn btn-outline" onClick={() => fetchUsers(page)}>
          Refresh
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Fuel Type</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.displayName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                        <Mail size={14} />
                        {user.email}
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{user.preferredFuelType}</span>
                    </td>
                    <td>
                      {user.expoPushToken ? (
                         <span className="badge badge-success">Push Active</span>
                      ) : (
                         <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>No Token</span>
                      )}
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          className="icon-btn" 
                          title="Send Push Notification"
                          onClick={() => handleSendNotification(user.id, user.expoPushToken)}
                          style={{ opacity: user.expoPushToken ? 1 : 0.5, cursor: user.expoPushToken ? 'pointer' : 'not-allowed' }}
                        >
                          <Send size={18} />
                        </button>
                        <button 
                          className="icon-btn danger" 
                          title="Delete User"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-outline" 
                disabled={page === 1}
                onClick={() => fetchUsers(page - 1)}
                style={{ padding: '8px', opacity: page === 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                className="btn btn-outline" 
                disabled={page === totalPages}
                onClick={() => fetchUsers(page + 1)}
                style={{ padding: '8px', opacity: page === totalPages ? 0.5 : 1 }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
