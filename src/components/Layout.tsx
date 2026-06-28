import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container fade-in">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
