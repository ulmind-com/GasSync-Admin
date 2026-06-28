import React, { useEffect, useState } from 'react';
import { Database, ChevronLeft, ChevronRight, MapPin, Trash2, ExternalLink } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { confirmToast } from '../lib/confirm';

interface Post {
  _id: string;
  fuelType: string;
  price: number;
  isVerified: boolean;
  createdAt: string;
  city?: string;
  state?: string;
  stationName?: string;
  stationAddress?: string;
  googlePlaceId?: string;
  location?: { type: string; coordinates: number[] };
  reportedBy?: { displayName?: string; email?: string };
  station?: { name: string; address?: string; city?: string; state?: string };
}

// Build a Google Maps link from whatever location info a post has.
const mapsLink = (post: Post): string | null => {
  if (post.location?.coordinates?.length === 2) {
    const [lng, lat] = post.location.coordinates;
    const base = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    return post.googlePlaceId ? `${base}&query_place_id=${post.googlePlaceId}` : base;
  }
  if (post.googlePlaceId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      post.stationName || 'gas station'
    )}&query_place_id=${post.googlePlaceId}`;
  }
  return null;
};

// Resolve the best human-readable location label for a post.
const locationLabel = (post: Post): string => {
  if (post.station?.name) return post.station.name;
  if (post.stationName) return post.stationName;
  if (post.city) return `${post.city}${post.state ? `, ${post.state}` : ''}`;
  return 'Unknown Location';
};

export const CommunityPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 15;

  const fetchPosts = async (currentPage: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/community-posts?page=${currentPage}&limit=${limit}`);
      setPosts(response.data.data.posts);
      setTotalPages(response.data.data.pagination.totalPages);
      setTotal(response.data.data.pagination.total);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirmToast({
      title: 'Delete community post?',
      message: 'This price report will be permanently removed.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      setDeletingId(id);
      await api.delete(`/admin/community-posts/${id}`);
      toast.success('Post deleted');
      // If we just emptied the current page, step back a page.
      const remaining = posts.length - 1;
      const targetPage = remaining === 0 && page > 1 ? page - 1 : page;
      fetchPosts(targetPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={28} color="var(--accent-primary)" />
          Community Posts
        </h1>
        <p className="page-subtitle">
          View and manage gas prices reported by the community
          {total > 0 && <span style={{ color: 'var(--text-secondary)' }}> · {total} total</span>}
        </p>
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
                  <th>Date &amp; Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const link = mapsLink(post);
                  const label = locationLabel(post);
                  const subtitle = post.station?.address || post.stationAddress;
                  return (
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
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <MapPin
                            size={16}
                            color={label === 'Unknown Location' ? 'var(--text-secondary)' : 'var(--accent-primary)'}
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: label === 'Unknown Location' ? 'var(--text-secondary)' : 'white' }}>
                                {label}
                              </span>
                              {link && (
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open in Google Maps"
                                  className="maps-link"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                            </div>
                            {subtitle && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{subtitle}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`fuel-badge fuel-${(post.fuelType || 'default').toLowerCase()}`}>
                          {post.fuelType}
                        </span>
                      </td>
                      <td>
                        <strong className="num" style={{ color: 'var(--success)', fontSize: '0.98rem' }}>
                          ${post.price.toFixed(2)}
                        </strong>
                      </td>
                      <td className="num" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(post.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="icon-btn danger"
                            title="Delete Post"
                            onClick={() => handleDelete(post._id)}
                            disabled={deletingId === post._id}
                          >
                            {deletingId === post._id ? (
                              <div className="spinner" style={{ width: 18, height: 18 }} />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
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
