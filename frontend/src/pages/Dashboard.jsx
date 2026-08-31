import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardOverview } from '../api/analytics';
import {
  FolderKanban,
  AlertTriangle,
  BrainCircuit,
  Bell,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <p style={{ color: '#64748b', fontWeight: 500 }}>Loading project intelligence...</p>
      </div>
    );
  }

  const totalEvaluated =
    (data?.risk_distribution?.low || 0) +
    (data?.risk_distribution?.medium || 0) +
    (data?.risk_distribution?.high || 0);

  const lowPct = totalEvaluated > 0 ? ((data.risk_distribution.low / totalEvaluated) * 100).toFixed(0) : 0;
  const medPct = totalEvaluated > 0 ? ((data.risk_distribution.medium / totalEvaluated) * 100).toFixed(0) : 0;
  const highPct = totalEvaluated > 0 ? ((data.risk_distribution.high / totalEvaluated) * 100).toFixed(0) : 0;

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '14px',
          padding: '24px 32px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(37,99,235,0.04)'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            SiteGuard AI Control Center
          </h2>
          <p style={{ color: '#475569', fontSize: '0.92rem' }}>
            Predictive Delay-Risk Assessment and Intelligent Construction Monitoring
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-outline"
            style={{ gap: '6px' }}
          >
            <FolderKanban size={16} />
            <span>Manage Projects</span>
          </button>
          <button
            onClick={() => navigate('/predictions')}
            className="btn btn-primary"
            style={{ gap: '6px' }}
          >
            <BrainCircuit size={16} />
            <span>Run Delay Prediction</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{data?.total_users || 0}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Active platform members
            </div>
          </div>
          <div className="stat-icon green">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Projects</div>
            <div className="stat-value">{data?.total_projects || 0}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              {data?.active_projects || 0} active / {data?.completed_projects || 0} completed
            </div>
          </div>
          <div className="stat-icon blue">
            <FolderKanban size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">High Delay Risk</div>
            <div className="stat-value" style={{ color: data?.high_risk_projects > 0 ? '#dc2626' : '#0f172a' }}>
              {data?.high_risk_projects || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Requires immediate action
            </div>
          </div>
          <div className="stat-icon red">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">AI Predictions</div>
            <div className="stat-value">{data?.total_predictions || 0}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Avg Risk: {data?.average_risk_score || 0}%
            </div>
          </div>
          <div className="stat-icon amber">
            <BrainCircuit size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Warning Alerts</div>
            <div className="stat-value" style={{ color: data?.unread_alerts > 0 ? '#d97706' : '#0f172a' }}>
              {data?.total_alerts || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              {data?.unread_alerts || 0} unread notifications
            </div>
          </div>
          <div className="stat-icon amber">
            <Bell size={22} />
          </div>
        </div>
      </div>

      {/* Grid: Risk Distribution + Alert Center */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Risk Distribution Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Portfolio Delay-Risk Distribution</h3>
            <span className="badge badge-primary">AI Forecast</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Multi-segment progress bar */}
            <div style={{ height: '14px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: `${lowPct}%`, background: '#16a34a', transition: 'width 0.5s ease' }} title={`Low Risk: ${lowPct}%`} />
              <div style={{ width: `${medPct}%`, background: '#d97706', transition: 'width 0.5s ease' }} title={`Medium Risk: ${medPct}%`} />
              <div style={{ width: `${highPct}%`, background: '#dc2626', transition: 'width 0.5s ease' }} title={`High Risk: ${highPct}%`} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', marginTop: '8px' }}>
              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>LOW RISK</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>{data?.risk_distribution?.low || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{lowPct}% of portfolio</div>
              </div>
              <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706' }}>MEDIUM RISK</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>{data?.risk_distribution?.medium || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{medPct}% of portfolio</div>
              </div>
              <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>HIGH RISK</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c' }}>{data?.risk_distribution?.high || 0}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{highPct}% of portfolio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Alerts Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Delay Alerts</h3>
            <button onClick={() => navigate('/alerts')} className="btn btn-outline btn-sm">
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.recent_alerts?.length > 0 ? (
              data.recent_alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: alert.is_read ? '#f8fafc' : '#fef2f2',
                    border: `1px solid ${alert.is_read ? '#e2e8f0' : '#fecaca'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <AlertTriangle
                    size={18}
                    style={{ color: alert.severity === 'HIGH' ? '#dc2626' : '#d97706', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{alert.project_name}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: '#16a34a' }} />
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No active alerts. All projects are on track!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent AI Delay Predictions</h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
              Latest model evaluations computed using XGBoost classifier and regressor
            </p>
          </div>
          <button onClick={() => navigate('/predictions')} className="btn btn-outline btn-sm">
            Launch Predictor
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Delay Risk Score</th>
                <th>Risk Category</th>
                <th>Estimated Delay Days</th>
                <th>Evaluated Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_predictions?.length > 0 ? (
                data.recent_predictions.map((pred) => (
                  <tr key={pred.id}>
                    <td style={{ fontWeight: 600 }}>{pred.project_name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700 }}>{pred.risk_score}%</span>
                        <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pred.risk_score}%`,
                              height: '100%',
                              background:
                                pred.risk_score >= 65 ? '#dc2626' : pred.risk_score >= 35 ? '#d97706' : '#16a34a',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          pred.risk_level === 'HIGH'
                            ? 'badge-high'
                            : pred.risk_level === 'MEDIUM'
                            ? 'badge-medium'
                            : 'badge-low'
                        }`}
                      >
                        {pred.risk_level}
                      </span>
                    </td>
                    <td>
                      {pred.estimated_delay_days !== null ? (
                        <span style={{ fontWeight: 700, color: '#dc2626' }}>
                          +{pred.estimated_delay_days} days
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>0 days (On Track)</span>
                      )}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                      {new Date(pred.created_at).toLocaleString()}
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/projects/${pred.project_id}`)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        View Project
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                    No predictions run yet. Select a project and run your first AI Delay-Risk prediction!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
