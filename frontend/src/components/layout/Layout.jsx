import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { getDashboardOverview } from '../../api/analytics';

export const Layout = () => {
  const location = useLocation();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Derive page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'System Overview';
    if (path.startsWith('/projects/') && path.split('/').length > 2) return 'Project Management';
    if (path.startsWith('/projects')) return 'Construction Projects';
    if (path.startsWith('/predictions')) return 'AI Delay-Risk Predictor';
    if (path.startsWith('/alerts')) return 'Warning & Delay Alerts';
    if (path.startsWith('/analytics')) return 'Project Intelligence & Analytics';
    if (path.startsWith('/users')) return 'System User Administration';
    return 'SiteGuard AI';
  };

  const fetchOverview = async () => {
    try {
      const data = await getDashboardOverview();
      setUnreadAlerts(data.unread_alerts || 0);
    } catch (err) {
      // Silently catch unhandled errors
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Sidebar unreadAlerts={unreadAlerts} />
      <div className="main-wrapper">
        <Navbar title={getPageTitle()} unreadAlerts={unreadAlerts} />
        <main className="content-container">
          <Outlet context={{ refreshAlerts: fetchOverview }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
