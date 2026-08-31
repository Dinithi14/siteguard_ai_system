import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ title = "Dashboard", unreadAlerts = 0 }) => {
  const { user, logout, roleName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-title">
        <h1>{title}</h1>
      </div>

      <div className="navbar-actions">
        {/* Alerts Bell Link */}
        <button
          onClick={() => navigate('/alerts')}
          style={{
            position: 'relative',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475569',
            transition: 'background 0.15s ease',
          }}
          title="View Alerts"
        >
          <Bell size={18} />
          {unreadAlerts > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff',
              }}
            >
              {unreadAlerts}
            </span>
          )}
        </button>

        {/* User profile capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
          <div className="user-avatar" style={{ width: '34px', height: '34px', fontSize: '0.82rem' }}>
            {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0f172a' }}>
              {user?.first_name} {user?.last_name}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {roleName}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="btn btn-outline btn-sm"
          style={{ gap: '6px', color: '#dc2626', borderColor: '#fecaca' }}
          title="Sign out"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
