import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  BrainCircuit,
  Bell,
  BarChart3,
  Users,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar = ({ unreadAlerts = 0 }) => {
  const { user, isAdmin, roleName } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo">
          <ShieldCheck size={22} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="brand-name">SiteGuard</span>
          <span className="brand-badge">AI</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FolderKanban size={18} />
          <span>Projects</span>
        </NavLink>

        <NavLink
          to="/predictions"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BrainCircuit size={18} />
          <span>AI Delay Predictor</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Bell size={18} />
          <span>Alerts Center</span>
          {unreadAlerts > 0 && <span className="nav-badge">{unreadAlerts}</span>}
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={18} />
          <span>Analytics & Trends</span>
        </NavLink>

        {isAdmin && (
          <>
            <div style={{ padding: '16px 14px 6px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Administration
            </div>
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>User Management</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Info Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-widget">
          <div className="user-avatar">
            {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.first_name} {user?.last_name}</div>
            <div className={`user-role-badge ${isAdmin ? 'admin' : ''}`}>
              {roleName}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
