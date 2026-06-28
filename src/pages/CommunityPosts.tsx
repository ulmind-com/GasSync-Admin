import React, { useEffect, useState } from 'react';
import { Database, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const CommunityPosts: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  const fetchPosts = async (currentPage: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/community-posts?page=${currentPage}&limit=${limit}`);
      setPosts(response.data.data.posts);
      setTotalPages(response.data.data.pagination.totalPages);
      setPage(currentPage);
    } catch (error) {
      console.error('Failed to fetch community posts', error);
      toast.error('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={28} color="var(--accent-primary)" />
          Community Posts
        </h1>
        <p className="page-subtitle">View and manage gas prices reported by the community</p>
      </div>

      <div className="glass-panel">
        {loading && posts.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" style={{ width: 40, height: 40 }}></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Location / Station</th>
                  <th>Fuel Type</th>
                  <th>Price</th>
                  <th>Date & Time</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500, color: 'white' }}>
                          {post.reportedBy?.displayName || 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {post.reportedBy?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {post.station ? post.station.name : (post.city ? `${post.city}, ${post.state}` : 'Unknown Location')}
                        </div>
                        {post.station && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {post.station.address}, {post.station.city}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        textTransform: 'capitalize', 
                        padding: '4px 8px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '4px',
                        fontSize: '0.85rem' 
                      }}>
                        {post.fuelType}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981' }}>${post.price.toFixed(2)}</strong>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(post.createdAt).toLocaleString()}
                    </td>
                    <td>
                      {post.isVerified ? (
                        <CheckCircle size={20} color="#10b981" />
                      ) : (
                        <XCircle size={20} color="var(--text-secondary)" />
                      )}
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No community posts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Page {page} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-outline" 
                    disabled={page === 1}
                    onClick={() => fetchPosts(page - 1)}
                    style={{ padding: '8px', opacity: page === 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    className="btn btn-outline" 
                    disabled={page === totalPages}
                    onClick={() => fetchPosts(page + 1)}
                    style={{ padding: '8px', opacity: page === totalPages ? 0.5 : 1 }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
