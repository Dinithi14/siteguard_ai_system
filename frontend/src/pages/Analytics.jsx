import React, { useState, useEffect } from 'react';
import { listProjects } from '../api/projects';
import { getProjectAnalytics } from '../api/analytics';
import RiskGauge from '../components/common/RiskGauge';
import {
  BarChart3,
  TrendingUp,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Calendar,
} from 'lucide-react';

export const Analytics = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    const fetchProjectsList = async () => {
      try {
        setLoadingProjects(true);
        const res = await listProjects();
        const list = res.data || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects list:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjectsList();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchAnalytics(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchAnalytics = async (projectId) => {
    try {
      setLoadingAnalytics(true);
      const data = await getProjectAnalytics(projectId);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load project analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Project Intelligence & Risk Analytics
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
            Detailed milestone tracking, historical risk trends, and delay forecast curves
          </p>
        </div>

        {/* Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>Active Project:</span>
          <select
            className="form-select"
            style={{ width: '240px' }}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={loadingProjects}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingAnalytics ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748b' }}>Computing analytics model...</p>
        </div>
      ) : analytics ? (
        <div>
          {/* Milestone Metrics Grid */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Milestone Progress</div>
                <div className="stat-value">{analytics.milestones?.overall_progress || 0}%</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  {analytics.milestones?.completed || 0} of {analytics.milestones?.total || 0} completed
                </div>
              </div>
              <div className="stat-icon blue">
                <Layers size={22} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Latest Delay Risk</div>
                <div className="stat-value" style={{ color: analytics.latest_risk_score >= 65 ? '#dc2626' : analytics.latest_risk_score >= 35 ? '#d97706' : '#16a34a' }}>
                  {analytics.latest_risk_score !== null ? `${analytics.latest_risk_score}%` : 'N/A'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  {analytics.latest_risk_level ? `${analytics.latest_risk_level} Risk Tier` : 'Not evaluated yet'}
                </div>
              </div>
              <div className="stat-icon amber">
                <TrendingUp size={22} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Estimated Delay</div>
                <div className="stat-value" style={{ color: analytics.latest_estimated_delay_days > 0 ? '#dc2626' : '#16a34a' }}>
                  {analytics.latest_estimated_delay_days !== null
                    ? `+${analytics.latest_estimated_delay_days}d`
                    : '0 days'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  XGBoost Regressor Output
                </div>
              </div>
              <div className="stat-icon red">
                <Clock size={22} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Dispatched Alerts</div>
                <div className="stat-value">{analytics.total_alerts || 0}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  {analytics.unread_alerts || 0} unread warnings
                </div>
              </div>
              <div className="stat-icon amber">
                <AlertTriangle size={22} />
              </div>
            </div>
          </div>

          {/* 2-Column Analytics View */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* Risk Progression Chart Card */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Risk Progression Over Time</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Evolution of predicted delay risk scores across simulation runs
                  </p>
                </div>
                <span className="badge badge-primary">Trendline</span>
              </div>

              {analytics.risk_trend?.length > 0 ? (
                <div style={{ padding: '20px 0' }}>
                  {/* Clean SVG Trend Chart */}
                  <svg viewBox="0 0 500 200" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                    {/* Grid horizontal lines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeDasharray="4" />
                    <text x="30" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">100%</text>

                    <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeDasharray="4" />
                    <text x="30" y="74" fontSize="10" fill="#94a3b8" textAnchor="end">65%</text>

                    <line x1="40" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeDasharray="4" />
                    <text x="30" y="124" fontSize="10" fill="#94a3b8" textAnchor="end">35%</text>

                    <line x1="40" y1="170" x2="480" y2="170" stroke="#e2e8f0" />
                    <text x="30" y="174" fontSize="10" fill="#94a3b8" textAnchor="end">0%</text>

                    {/* Plot Points & Lines */}
                    {(() => {
                      const points = analytics.risk_trend.map((pt, idx) => {
                        const x =
                          analytics.risk_trend.length === 1
                            ? 260
                            : 40 + (idx / (analytics.risk_trend.length - 1)) * 440;
                        const y = 170 - (pt.risk_score / 100) * 150;
                        return { x, y, pt };
                      });

                      const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={polylinePoints}
                          />
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="5"
                                fill={p.pt.risk_score >= 65 ? '#dc2626' : p.pt.risk_score >= 35 ? '#d97706' : '#16a34a'}
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                              <text
                                x={p.x}
                                y={p.y - 10}
                                fontSize="11"
                                fontWeight="700"
                                fill="#0f172a"
                                textAnchor="middle"
                              >
                                {p.pt.risk_score}%
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px', marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>First Evaluation</span>
                    <span>Latest Evaluation</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  No prediction data points to render trendline.
                </div>
              )}
            </div>

            {/* Milestone Status Distribution */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Milestone Breakdown</h3>
                <span className="badge badge-primary">Phase Tracking</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: '#15803d', fontWeight: 600 }}>Completed</span>
                    <span style={{ fontWeight: 700 }}>{analytics.milestones?.completed || 0}</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${analytics.milestones?.total ? (analytics.milestones.completed / analytics.milestones.total) * 100 : 0}%`,
                        height: '100%',
                        background: '#16a34a',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: '#b45309', fontWeight: 600 }}>In Progress</span>
                    <span style={{ fontWeight: 700 }}>{analytics.milestones?.in_progress || 0}</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${analytics.milestones?.total ? (analytics.milestones.in_progress / analytics.milestones.total) * 100 : 0}%`,
                        height: '100%',
                        background: '#d97706',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Not Started</span>
                    <span style={{ fontWeight: 700 }}>{analytics.milestones?.not_started || 0}</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${analytics.milestones?.total ? (analytics.milestones.not_started / analytics.milestones.total) * 100 : 0}%`,
                        height: '100%',
                        background: '#94a3b8',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: '#b91c1c', fontWeight: 600 }}>Delayed</span>
                    <span style={{ fontWeight: 700 }}>{analytics.milestones?.delayed || 0}</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${analytics.milestones?.total ? (analytics.milestones.delayed / analytics.milestones.total) * 100 : 0}%`,
                        height: '100%',
                        background: '#dc2626',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <h3>Select a project to inspect intelligence</h3>
        </div>
      )}
    </div>
  );
};

export default Analytics;
