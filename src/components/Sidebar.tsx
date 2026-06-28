import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, LogOut, Fuel } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Fuel size={28} color="#3b82f6" />
        GasSync Admin
      </div>
      
      <div className="nav-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        
        <NavLink 
          to="/users" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          Users
        </NavLink>
        
        <NavLink 
          to="/notifications" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Bell size={20} />
          Notifications
        </NavLink>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button className="nav-item" onClick={handleLogout} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem' }}>
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};
