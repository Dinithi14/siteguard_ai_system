import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { listProjects } from '../api/projects';
import { runPrediction, listProjectPredictions } from '../api/predictions';
import RiskGauge from '../components/common/RiskGauge';
import {
  BrainCircuit,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  History,
  Info,
  Calendar,
  DollarSign,
  Users as UsersIcon,
  CloudRain,
  Layers,
} from 'lucide-react';

export const PredictionStudio = () => {
  const location = useLocation();
  const initialProjectId = location.state?.selectedProjectId || '';

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  // ML Form Data matching backend XGBoost features
  const [formData, setFormData] = useState({
    project_type: 'Residential',
    project_size: 'Medium',
    planned_duration: 365,
    contract_value_lkr: 45000000,
    labourers_count: 50,
    material_availability: 'Medium',
    weather_condition: 'Clear',
  });

  const [latestResult, setLatestResult] = useState(null);

  useEffect(() => {
    const fetchProjectsList = async () => {
      try {
        setLoadingProjects(true);
        const res = await listProjects();
        setProjects(res.data || []);
        if (!selectedProjectId && res.data?.length > 0) {
          setSelectedProjectId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjectsList();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find((p) => p.id === parseInt(selectedProjectId));
      if (proj) {
        // Dynamically calculate planned duration from project dates
        let plannedDuration = 365;
        if (proj.start_date && proj.expected_end_date) {
          const start = new Date(proj.start_date);
          const end = new Date(proj.expected_end_date);
          plannedDuration = Math.max(10, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        }

        // Dynamically determine project size based on budget if available
        const budget = parseFloat(proj.budget) || 0;
        let projectSize = 'Medium';
        if (budget > 100000000) projectSize = 'Large';
        else if (budget < 10000000) projectSize = 'Small';

        setFormData((prev) => ({
          ...prev,
          project_type: proj.project_type || 'Residential',
          contract_value_lkr: budget || prev.contract_value_lkr,
          planned_duration: plannedDuration,
          project_size: projectSize,
          labourers_count: proj.labourers_count || 50,
        }));
      }
      fetchHistory(selectedProjectId);
    }
  }, [selectedProjectId, projects]);

  const fetchHistory = async (projectId) => {
    try {
      setLoadingHistory(true);
      const res = await listProjectPredictions(projectId);
      setPredictionHistory(res.data || []);
      if (res.data?.length > 0 && !latestResult) {
        setLatestResult(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load prediction history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === 'planned_duration' || name === 'labourers_count'
          ? parseInt(value) || 0
          : name === 'contract_value_lkr'
          ? parseFloat(value) || 0
          : value,
    });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project first.');
      return;
    }
    setError('');
    setRunning(true);

    try {
      const res = await runPrediction(selectedProjectId, formData);
      setLatestResult(res);
      await fetchHistory(selectedProjectId);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 'Failed to generate AI delay prediction.'
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      {/* Studio Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          AI Delay-Risk Prediction Studio
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Simulate project variables and forecast construction delay likelihood using trained Machine Learning models
        </p>
      </div>

      {error && (
        <div className="alert-box danger" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Studio 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Left: Input Parameters Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Project Parameters & Site Conditions</h3>
            <span className="badge badge-primary">XGBoost ML Input</span>
          </div>

          <form onSubmit={handlePredict}>
            {/* Select Target Project */}
            <div className="form-group">
              <label className="form-label">Target Project *</label>
              <select
                className="form-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={loadingProjects}
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.project_type}) - LKR {Number(p.budget).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Project Type</label>
                <select
                  name="project_type"
                  className="form-select"
                  value={formData.project_type}
                  onChange={handleInputChange}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Project Scale / Size</label>
                <select
                  name="project_size"
                  className="form-select"
                  value={formData.project_size}
                  onChange={handleInputChange}
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Planned Duration (Days)</label>
                <input
                  type="number"
                  name="planned_duration"
                  className="form-input"
                  min="10"
                  max="3650"
                  value={formData.planned_duration}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contract Value (LKR)</label>
                <input
                  type="number"
                  name="contract_value_lkr"
                  className="form-input"
                  min="100000"
                  value={formData.contract_value_lkr}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Labourers Count</label>
                <input
                  type="number"
                  name="labourers_count"
                  className="form-input"
                  min="1"
                  max="2000"
                  value={formData.labourers_count}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Material Availability</label>
                <select
                  name="material_availability"
                  className="form-select"
                  value={formData.material_availability}
                  onChange={handleInputChange}
                >
                  <option value="High">High (Abundant supply)</option>
                  <option value="Medium">Medium (Normal)</option>
                  <option value="Low">Low (Supply shortage)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Weather / Environmental Condition</label>
              <select
                name="weather_condition"
                className="form-select"
                value={formData.weather_condition}
                onChange={handleInputChange}
              >
                <option value="Clear">Clear (Optimal)</option>
                <option value="Rainy">Rainy (Minor delays)</option>
                <option value="Monsoon">Monsoon (Severe conditions)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: '10px' }}
              disabled={running || !selectedProjectId}
            >
              <Zap size={18} />
              <span>{running ? 'Running ML Inference...' : 'Generate Delay-Risk Prediction'}</span>
            </button>
          </form>
        </div>

        {/* Right: AI Prediction Results & Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div className="card-header" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              <h3 className="card-title">AI Delay Risk Evaluation</h3>
            </div>

            {latestResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <RiskGauge
                  score={latestResult.risk_score}
                  level={latestResult.risk_level}
                  size={190}
                />

                {/* Delay Days Forecast Banner */}
                <div
                  style={{
                    width: '100%',
                    marginTop: '24px',
                    padding: '16px',
                    borderRadius: '12px',
                    background:
                      latestResult.risk_level === 'HIGH'
                        ? '#fef2f2'
                        : latestResult.risk_level === 'MEDIUM'
                        ? '#fffbeb'
                        : '#f0fdf4',
                    border: `1px solid ${
                      latestResult.risk_level === 'HIGH'
                        ? '#fecaca'
                        : latestResult.risk_level === 'MEDIUM'
                        ? '#fde68a'
                        : '#bbf7d0'
                    }`,
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Estimated Delay Forecast
                  </div>
                  <div
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      color:
                        latestResult.risk_level === 'HIGH'
                          ? '#dc2626'
                          : latestResult.risk_level === 'MEDIUM'
                          ? '#d97706'
                          : '#16a34a',
                      marginTop: '4px',
                    }}
                  >
                    {latestResult.estimated_delay_days !== null
                      ? `+${latestResult.estimated_delay_days} Days Expected Delay`
                      : '0 Days (On Schedule)'}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                    Model Version: <strong>{latestResult.model_version || 'xgb-v1'}</strong> • Evaluated on{' '}
                    {new Date(latestResult.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Recommendation Advice Box */}
                <div style={{ width: '100%', marginTop: '16px', textAlign: 'left', background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={15} style={{ color: '#2563eb' }} />
                    <span>SiteGuard AI Mitigation Guidance</span>
                  </div>
                  <p style={{ color: '#475569', margin: 0, lineHeight: 1.45 }}>
                    {latestResult.risk_level === 'HIGH'
                      ? 'High risk detected due to adverse site conditions or constrained resources. An alert has been dispatched. Recommend expediting critical milestones and procuring buffer materials.'
                      : latestResult.risk_level === 'MEDIUM'
                      ? 'Moderate risk detected. Monitor resource availability and adjust milestone schedules where possible to prevent spillover.'
                      : 'Project is in optimal health. Current labour allocation and material conditions support on-time delivery.'}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '36px 0', color: '#94a3b8' }}>
                <BrainCircuit size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>No Prediction Computed</h4>
                <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                  Fill out the parameters on the left and click "Generate Delay-Risk Prediction".
                </p>
              </div>
            )}
          </div>

          {/* Historical Predictions List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Prediction History</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{predictionHistory.length} runs</span>
            </div>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Loading history...</div>
            ) : predictionHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                {predictionHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background:
                            item.risk_score >= 65 ? '#dc2626' : item.risk_score >= 35 ? '#d97706' : '#16a34a',
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                          {item.risk_score}% Delay Risk
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`badge ${
                          item.risk_level === 'HIGH'
                            ? 'badge-high'
                            : item.risk_level === 'MEDIUM'
                            ? 'badge-medium'
                            : 'badge-low'
                        }`}
                      >
                        {item.risk_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.84rem' }}>
                No prior evaluations recorded for this project.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionStudio;
