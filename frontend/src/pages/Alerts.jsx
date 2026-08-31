import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { listProjects } from '../api/projects';
import { listProjectAlerts, markAlertAsRead } from '../api/alerts';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Check,
  FolderKanban,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const Alerts = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState('ALL'); // ALL, UNREAD, READ

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      const projRes = await listProjects();
      const projectList = projRes.data || [];
      setProjects(projectList);

      // Fetch alerts for all projects
      let allAlerts = [];
      for (const p of projectList) {
        try {
          const alertRes = await listProjectAlerts(p.id);
          const projectAlerts = (alertRes.data || []).map((a) => ({
            ...a,
            projectName: p.name,
          }));
          allAlerts = [...allAlerts, ...projectAlerts];
        } catch (e) {
          // ignore individual project alert errors
        }
      }

      // Sort newest first
      allAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAlerts(allAlerts);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, []);

  const handleMarkRead = async (alertId) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
      if (outletContext?.refreshAlerts) {
        outletContext.refreshAlerts();
      }
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  // Filtered alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (selectedProjectId !== 'ALL' && alert.project_id !== parseInt(selectedProjectId)) {
      return false;
    }
    if (filterRead === 'UNREAD' && alert.is_read) return false;
    if (filterRead === 'READ' && !alert.is_read) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Delay Risk Alert Center
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Automated alerts dispatched when AI prediction risk thresholds are exceeded
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderKanban size={16} style={{ color: '#64748b' }} />
            <select
              className="form-select"
              style={{ width: '220px' }}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#64748b' }} />
            <select
              className="form-select"
              style={{ width: '160px' }}
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="UNREAD">Unread Only</option>
              <option value="READ">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748b' }}>Loading notification feed...</p>
        </div>
      ) : filteredAlerts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="card"
              style={{
                padding: '20px 24px',
                background: alert.is_read ? '#ffffff' : '#fef2f2',
                borderColor: alert.is_read ? '#e2e8f0' : '#fecaca',
                borderLeftWidth: '5px',
                borderLeftColor: alert.severity === 'HIGH' ? '#dc2626' : '#d97706',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '280px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: alert.severity === 'HIGH' ? '#fee2e2' : '#fef3c7',
                    color: alert.severity === 'HIGH' ? '#dc2626' : '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldAlert size={20} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      {alert.title}
                    </h4>
                    <span className={`badge ${alert.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
                      {alert.severity}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      Project: {alert.projectName}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '8px' }}>
                    {alert.message}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Dispatched on {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => navigate(`/projects/${alert.project_id}`)}
                  className="btn btn-outline btn-sm"
                  style={{ gap: '4px' }}
                >
                  <span>Open Project</span>
                  <ArrowRight size={14} />
                </button>

                {!alert.is_read && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '4px', background: '#16a34a', borderColor: '#16a34a' }}
                  >
                    <Check size={14} />
                    <span>Mark as Read</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <CheckCircle2 size={48} style={{ margin: '0 auto 12px', color: '#16a34a' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
            No Active Alerts
          </h3>
          <p style={{ fontSize: '0.88rem' }}>
            There are no high-risk alerts matching your current filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default Alerts;
