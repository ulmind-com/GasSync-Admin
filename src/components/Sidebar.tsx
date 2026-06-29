import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, LogOut, Fuel, Database, MessageSquare, ScanLine, BarChart3, ShieldAlert, History, UserCog } from 'lucide-react';
import { canWrite } from '../lib/permissions';

export const Sidebar: React.FC = () => {
  const writeAccess = canWrite();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminPermission');
    window.location.href = '/login';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">
          <Fuel size={22} color="#fff" />
        </span>
        <span className="logo-text">GasSync</span>
      </div>

      <div className="nav-section-label">Menu</div>
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
          to="/community-posts"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Database size={20} />
          Community Posts
        </NavLink>

        <NavLink
          to="/feedback"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MessageSquare size={20} />
          Feedback
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Bell size={20} />
          Notifications
        </NavLink>

        <NavLink
          to="/bills"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ScanLine size={20} />
          Bills & OCR
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={20} />
          Analytics
        </NavLink>

        <NavLink
          to="/moderation"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ShieldAlert size={20} />
          Moderation
        </NavLink>

        <NavLink
          to="/audit-log"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <History size={20} />
          Audit Log
        </NavLink>

        {writeAccess && (
          <NavLink
            to="/admins"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <UserCog size={20} />
            Admins
          </NavLink>
        )}
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
