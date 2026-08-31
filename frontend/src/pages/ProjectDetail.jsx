import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../api/projects';
import {
  listProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../api/milestones';
import { listProjectPredictions, runPrediction } from '../api/predictions';
import { listProjectDailyLogs, createDailyLog, updateDailyLog, deleteDailyLog } from '../api/dailyLogs';
import { listUsers } from '../api/users';
import { getLiveWeatherForLocation, getWeatherByCoordinates } from '../api/weather';
import RiskGauge from '../components/common/RiskGauge';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/common/Toast';
import Modal from '../components/common/Modal';
import {
  FolderKanban,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  Plus,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  AlertTriangle,
  Eye,
} from 'lucide-react';

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [toast, setToast] = useState({ text: '', type: 'success' });
  const [dailyLogs, setDailyLogs] = useState([]);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState(null); // 'success', 'error', or null

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [logFormData, setLogFormData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    weather_condition: 'Clear',
    labour_count: 0,
    material_availability: 'High',
    work_completed: '',
    issues_encountered: '',
    notes: '',
  });

  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);
  const [predictFormData, setPredictFormData] = useState({
    weather_condition: 'Clear',
    labourers_count: 0,
    material_availability: 'High',
  });
  const [runningPrediction, setRunningPrediction] = useState(false);


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    progress_percentage: 0,
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    sequence: 1,
    responsible_id: '',
  });

  const [viewMilestone, setViewMilestone] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    planned_start_date: '',
    planned_end_date: '',
    actual_start_date: '',
    actual_end_date: '',
    progress_percentage: 0,
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    sequence: 1,
    responsible_id: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (text, type = 'success') => setToast({ text, type });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, mileRes, predRes, userRes, logsRes] = await Promise.all([
        getProject(projectId),
        listProjectMilestones(projectId),
        listProjectPredictions(projectId).catch(() => ({ data: [] })),
        listUsers().catch(() => ({ data: [] })),
        listProjectDailyLogs(projectId).catch(() => ({ data: [] })),
      ]);
      setProject(projRes);
      setMilestones(mileRes.data || []);
      const predictions = predRes.data || [];
      if (predictions.length > 0) {
        setLatestPrediction(predictions[0]);
      }
      setUsers(userRes.data || []);
      setDailyLogs(logsRes.data || []);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleOpenPredictModal = async () => {
    let defaultWeather = 'Clear';
    let defaultLabour = project?.labourers_count || 50;
    let defaultMaterial = 'High';

    if (dailyLogs.length > 0) {
      const latestLog = dailyLogs[0];
      defaultWeather = latestLog.weather_condition;
      defaultLabour = latestLog.labour_count;
      defaultMaterial = latestLog.material_availability;
      setWeatherStatus(null); // use existing log data
    } else {
      setIsFetchingWeather(true);
      let res;
      if (project?.latitude && project?.longitude) {
        res = await getWeatherByCoordinates(project.latitude, project.longitude);
      } else {
        res = await getLiveWeatherForLocation(project?.location);
      }
      defaultWeather = res.category;
      setWeatherStatus(res.status);
      setIsFetchingWeather(false);
    }

    setPredictFormData({
      weather_condition: defaultWeather,
      labourers_count: defaultLabour,
      material_availability: defaultMaterial,
    });
    setIsPredictModalOpen(true);
  };

  const handleRunPrediction = async (e) => {
    e.preventDefault();
    setFormError('');
    setRunningPrediction(true);
    try {
      let plannedDuration = 365;
      if (project.start_date && project.expected_end_date) {
        const start = new Date(project.start_date);
        const end = new Date(project.expected_end_date);
        plannedDuration = Math.max(10, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      }
      const budget = parseFloat(project.budget) || 0;
      let projectSize = 'Medium';
      if (budget > 100000000) projectSize = 'Large';
      else if (budget < 10000000) projectSize = 'Small';

      const payload = {
        project_type: project.project_type || 'Residential',
        planned_duration: plannedDuration,
        contract_value_lkr: budget,
        project_size: projectSize,
        ...predictFormData
      };

      const res = await runPrediction(projectId, payload);
      setLatestPrediction(res);
      showToast('AI Delay-Risk Prediction completed.');
      setIsPredictModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to run prediction.');
    } finally {
      setRunningPrediction(false);
    }
  };

  const handleLogInputChange = (e) => {
    const { name, value } = e.target;
    setLogFormData({
      ...logFormData,
      [name]: name === 'labour_count' ? parseInt(value) || 0 : value,
    });
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editingLog) {
        await updateDailyLog(editingLog.id, logFormData);
        showToast('Daily log updated successfully.');
      } else {
        await createDailyLog(projectId, logFormData);
        showToast('Daily log created successfully.');
      }
      setIsLogModalOpen(false);
      setEditingLog(null);
      setLogFormData({
        log_date: new Date().toISOString().split('T')[0],
        weather_condition: 'Clear',
        labour_count: 0,
        material_availability: 'High',
        work_completed: '',
        issues_encountered: '',
        notes: '',
      });
      await fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to save daily log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm('Delete this daily log?')) {
      try {
        await deleteDailyLog(logId);
        showToast('Daily log deleted successfully.');
        await fetchData();
      } catch (err) {
        console.error(err);
        showToast(err.response?.data?.detail || 'Failed to delete daily log.', 'danger');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'progress_percentage' || name === 'sequence' ? parseInt(value) || 0 : value,
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'progress_percentage' || name === 'sequence' ? parseInt(value) || 0 : value,
    });
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await createMilestone(projectId, {
        ...formData,
        sequence: parseInt(formData.sequence) || 1,
        responsible_id: formData.responsible_id ? parseInt(formData.responsible_id) : null,
        actual_start_date: formData.actual_start_date || null,
        actual_end_date: formData.actual_end_date || null,
      });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        planned_start_date: '',
        planned_end_date: '',
        actual_start_date: '',
        actual_end_date: '',
        progress_percentage: 0,
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        sequence: milestones.length + 2,
        responsible_id: '',
      });
      showToast('Milestone created successfully.');
      await fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to create milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMilestone = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await updateMilestone(editingMilestone.id, {
        ...editFormData,
        sequence: parseInt(editFormData.sequence) || 1,
        responsible_id: editFormData.responsible_id ? parseInt(editFormData.responsible_id) : null,
        actual_start_date: editFormData.actual_start_date || null,
        actual_end_date: editFormData.actual_end_date || null,
      });
      setEditingMilestone(null);
      showToast('Milestone updated successfully.');
      await fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to update milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (milestoneId, newStatus) => {
    try {
      const ms = milestones.find((m) => m.id === milestoneId);
      const progress = newStatus === 'COMPLETED' ? 100 : newStatus === 'NOT_STARTED' ? 0 : ms.progress_percentage || 50;
      await updateMilestone(milestoneId, { status: newStatus, progress_percentage: progress });
      showToast('Status updated successfully.');
      await fetchData();
    } catch (err) {
      console.error('Failed to update milestone status:', err);
      showToast(err.response?.data?.detail || 'Failed to update milestone status.', 'danger');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (window.confirm('Are you sure you want to delete this milestone? This cannot be undone.')) {
      try {
        await deleteMilestone(milestoneId);
        showToast('Milestone deleted successfully.');
        await fetchData();
      } catch (err) {
        console.error('Failed to delete milestone:', err);
        showToast(err.response?.data?.detail || 'Failed to delete milestone.', 'danger');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <p style={{ color: '#64748b' }}>Loading project milestones...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Project not found</h3>
        <button onClick={() => navigate('/projects')} className="btn btn-outline" style={{ marginTop: '16px' }}>
          Back to Projects
        </button>
      </div>
    );
  }

  const overallProgress =
    milestones.length > 0
      ? Math.round(
          milestones.reduce((acc, m) => acc + (m.progress_percentage || 0), 0) / milestones.length
        )
      : 0;

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length;
  const delayedMilestones = milestones.filter((m) => m.status === 'DELAYED' || (m.delay_days && m.delay_days > 0)).length;

  const sortedMilestones = [...milestones].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const currentPhaseMilestone = sortedMilestones.find((m) => m.status !== 'COMPLETED');
  const currentPhaseId = currentPhaseMilestone ? currentPhaseMilestone.id : null;
  const allCompleted = milestones.length > 0 && !currentPhaseMilestone;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/projects')}
        className="btn btn-outline btn-sm"
        style={{ marginBottom: '20px', gap: '6px' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Projects</span>
      </button>

      <Toast message={toast.text} type={toast.type} onClose={() => setToast({ text: '', type: toast.type })} />

      {/* Project Overview Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="badge badge-primary">{project.project_type}</span>
              <span className={`badge badge-${project.status.toLowerCase().replace('_', '-')}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>{project.name}</h2>
            {project.description && (
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>{project.description}</p>
            )}
            {project.supervisor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '0.84rem', color: '#475569' }}>
                <div className="user-avatar" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>
                  {project.supervisor.first_name[0].toUpperCase()}
                </div>
                <span>Supervisor: <strong>{project.supervisor.first_name} {project.supervisor.last_name}</strong></span>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenPredictModal}
            className="btn btn-primary"
            style={{ gap: '8px' }}
          >
            <BrainCircuit size={18} />
            <span>Launch AI Predictor</span>
          </button>
        </div>

        {/* Project Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>CONTRACT VALUE</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              LKR {Number(project.budget).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>LOCATION</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {project.location}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>SCHEDULE</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
              {project.start_date} → {project.expected_end_date}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>CLIENT</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {project.client_name || 'N/A'}
            </div>
          </div>
        </div>

        {/* AI & Progress Metrics Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                Overall Project Milestone Progress
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2563eb' }}>
                {overallProgress}%
              </span>
            </div>
            <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
              <div
                style={{
                  width: `${overallProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.8rem', textAlign: 'center' }}>
              <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontWeight: 500 }}>Total Milestones</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{totalMilestones}</div>
              </div>
              <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ color: '#16a34a', fontWeight: 500 }}>Completed</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>{completedMilestones}</div>
              </div>
              <div style={{ padding: '8px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ color: '#dc2626', fontWeight: 500 }}>Delayed</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{delayedMilestones}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>AI Risk Overview</div>
            {latestPrediction ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <RiskGauge
                  score={latestPrediction.risk_score}
                  level={latestPrediction.risk_level}
                  size={140}
                />
                {latestPrediction.estimated_delay_days !== null && latestPrediction.estimated_delay_days > 0 && (
                  <div style={{ marginTop: '12px', fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
                    +{latestPrediction.estimated_delay_days} Days Expected Delay
                  </div>
                )}
                
                {latestPrediction.recommendations && latestPrediction.recommendations.length > 0 && (
                  <div style={{ marginTop: '20px', width: '100%', textAlign: 'left', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase' }}>
                      Risk Factors & Recommended Actions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {latestPrediction.recommendations.map((rec, idx) => (
                        <div key={idx} style={{ background: rec.severity === 'High' ? '#fef2f2' : rec.severity === 'Medium' ? '#fffbeb' : '#f8fafc', borderLeft: `3px solid ${rec.severity === 'High' ? '#dc2626' : rec.severity === 'Medium' ? '#d97706' : '#94a3b8'}`, padding: '10px 12px', borderRadius: '0 6px 6px 0' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: rec.severity === 'High' ? '#b91c1c' : rec.severity === 'Medium' ? '#b45309' : '#475569', marginBottom: '4px' }}>
                            {rec.severity !== 'Low' && '⚠ '}{rec.factor}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                            {rec.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '16px' }}>
                  Last predicted: {new Date(latestPrediction.created_at).toLocaleString()}
                </div>
                <button
                  onClick={handleOpenPredictModal}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '16px', gap: '6px' }}
                >
                  <BrainCircuit size={14} />
                  <span>Run AI Risk Prediction</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <BrainCircuit size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>No Prediction Computed</div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', marginBottom: '16px', maxWidth: '200px' }}>
                  Evaluate current conditions to assess delay risks.
                </p>
                <button
                  onClick={handleOpenPredictModal}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <BrainCircuit size={14} />
                  <span>Run AI Risk Prediction</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Site Logs Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '40px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            Daily Site Logs ({dailyLogs.length})
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Record weather, labour, and materials to feed AI assessments
          </p>
        </div>
        <button onClick={async () => {
          setEditingLog(null);
          setIsFetchingWeather(true);
          let res;
          if (project?.latitude && project?.longitude) {
            res = await getWeatherByCoordinates(project.latitude, project.longitude);
          } else {
            res = await getLiveWeatherForLocation(project?.location);
          }
          setIsFetchingWeather(false);
          setWeatherStatus(res.status);
          
          setLogFormData({
            log_date: new Date().toISOString().split('T')[0],
            weather_condition: res.category,
            labour_count: 0,
            material_availability: 'High',
            work_completed: '',
            issues_encountered: '',
            notes: '',
          });
          setIsLogModalOpen(true);
        }} className="btn btn-outline" style={{ gap: '6px' }} disabled={isFetchingWeather}>
          <Plus size={16} />
          <span>{isFetchingWeather ? 'Loading...' : 'Add Daily Log'}</span>
        </button>
      </div>

      <div style={{ marginBottom: '40px', overflowX: 'auto' }}>
        {dailyLogs.length > 0 ? (
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weather</th>
                <th>Labour Count</th>
                <th>Material Status</th>
                <th>Work Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dailyLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600 }}>{log.log_date}</td>
                  <td>{log.weather_condition}</td>
                  <td>{log.labour_count}</td>
                  <td>
                    <span className={`badge ${log.material_availability === 'High' ? 'badge-low' : log.material_availability === 'Medium' ? 'badge-medium' : 'badge-high'}`}>
                      {log.material_availability}
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.work_completed}>
                    {log.work_completed || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => {
                        setEditingLog(log);
                        setLogFormData({
                          log_date: log.log_date,
                          weather_condition: log.weather_condition,
                          labour_count: log.labour_count,
                          material_availability: log.material_availability,
                          work_completed: log.work_completed || '',
                          issues_encountered: log.issues_encountered || '',
                          notes: log.notes || '',
                        });
                        setIsLogModalOpen(true);
                      }} className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteLog(log.id)} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fecaca' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8' }}>
            <p style={{ fontSize: '0.9rem' }}>No daily site logs found. Create one to keep track of site conditions.</p>
          </div>
        )}
      </div>

      {/* Milestones Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            Project Milestones ({milestones.length})
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Track phase deliverables, completion rates, and delay points
          </p>
        </div>
        <button onClick={() => {
          setFormData({ ...formData, sequence: milestones.length + 1 });
          setIsCreateModalOpen(true);
        }} className="btn btn-primary" style={{ gap: '6px' }}>
          <Plus size={16} />
          <span>Add Milestone</span>
        </button>
      </div>

      {/* Milestones List */}
      <div style={{ padding: '10px 0' }}>
        {sortedMilestones.length > 0 ? (
          <>
            {allCompleted && (
              <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontWeight: 600 }}>
                <CheckCircle2 size={18} />
                <span>✓ All milestones completed</span>
              </div>
            )}
            
            <div style={{ position: 'relative', marginLeft: '16px' }}>
              {/* Vertical line connecting nodes */}
              <div style={{ position: 'absolute', left: '15px', top: '24px', bottom: '24px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {sortedMilestones.map((milestone, index) => {
                  const isCompleted = milestone.status === 'COMPLETED';
                  const isDelayed = milestone.status === 'DELAYED' || (milestone.delay_days && milestone.delay_days > 0);
                  const isCurrentPhase = milestone.id === currentPhaseId;
                  
                  // Determine node styling based on status
                  let nodeColor = '#cbd5e1'; // default gray (Planned)
                  if (isCompleted) nodeColor = '#16a34a'; // Green
                  else if (isDelayed) nodeColor = '#dc2626'; // Red
                  else if (milestone.status === 'IN_PROGRESS') nodeColor = '#3b82f6'; // Blue
                  else if (milestone.status === 'BLOCKED') nodeColor = '#ea580c'; // Orange
                  
                  return (
                    <div key={milestone.id} style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
                      {/* Node Column */}
                      <div style={{ width: '32px', display: 'flex', justifyContent: 'center', flexShrink: 0, marginTop: '16px' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          background: nodeColor,
                          border: isCurrentPhase ? `4px solid #eff6ff` : '4px solid white',
                          boxShadow: isCurrentPhase ? `0 0 0 2px ${nodeColor}` : '0 0 0 1px #e2e8f0',
                          zIndex: 2,
                          transition: 'all 0.2s ease'
                        }} />
                      </div>
                      
                      {/* Card Column */}
                      <div style={{ flex: 1, paddingLeft: '16px' }}>
                        <div className="card" style={{ 
                          padding: '20px', 
                          border: isCurrentPhase ? `1px solid ${nodeColor}` : '1px solid #e2e8f0',
                          boxShadow: isCurrentPhase ? '0 4px 12px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.02)',
                          position: 'relative'
                        }}>
                          {isCurrentPhase && (
                            <div style={{ position: 'absolute', top: '-10px', left: '20px', background: nodeColor, color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Current Phase
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                  {String(milestone.sequence).padStart(2, '0')}. {milestone.name}
                                </h4>
                                <span className={`badge badge-${isCompleted ? 'completed' : isDelayed ? 'delayed' : milestone.status === 'BLOCKED' ? 'cancelled' : 'in-progress'}`}>
                                  {milestone.status.replace('_', ' ')}
                                </span>
                              </div>
                              
                              {milestone.description && (
                                <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '12px' }}>
                                  {milestone.description}
                                </p>
                              )}
                              
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '0.8rem', color: '#475569' }}>
                                <div>
                                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Planned Dates</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 500 }}>
                                    <Calendar size={12} style={{ color: '#94a3b8' }} />
                                    <span>{milestone.planned_start_date} &rarr; {milestone.planned_end_date}</span>
                                  </div>
                                </div>
                                
                                {milestone.responsible && (
                                  <div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Responsible</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 500 }}>
                                      <div className="user-avatar" style={{ width: '16px', height: '16px', fontSize: '0.55rem' }}>
                                        {milestone.responsible.first_name[0].toUpperCase()}
                                      </div>
                                      <span>{milestone.responsible.first_name} {milestone.responsible.last_name}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Delay Warning */}
                              {isDelayed && milestone.delay_days > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                                  <AlertTriangle size={14} />
                                  <span>⚠ Delayed by {milestone.delay_days} {milestone.delay_days === 1 ? 'day' : 'days'}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Actions and Progress Side */}
                            <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <select
                                  className="form-select"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', height: '28px' }}
                                  value={milestone.status}
                                  onChange={(e) => handleStatusChange(milestone.id, e.target.value)}
                                >
                                  <option value="NOT_STARTED">Not Started</option>
                                  <option value="IN_PROGRESS">In Progress</option>
                                  <option value="DELAYED">Delayed</option>
                                  <option value="BLOCKED">Blocked</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                                
                                <button
                                  onClick={() => setViewMilestone(milestone)}
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '4px 6px', height: '28px' }}
                                  title="View Details"
                                >
                                  <Eye size={13} />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setEditingMilestone(milestone);
                                    setEditFormData({
                                      name: milestone.name,
                                      description: milestone.description || '',
                                      planned_start_date: milestone.planned_start_date,
                                      planned_end_date: milestone.planned_end_date,
                                      actual_start_date: milestone.actual_start_date || '',
                                      actual_end_date: milestone.actual_end_date || '',
                                      progress_percentage: milestone.progress_percentage,
                                      status: milestone.status,
                                      priority: milestone.priority,
                                      sequence: milestone.sequence,
                                      responsible_id: milestone.responsible_id || '',
                                    });
                                  }}
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '4px 6px', height: '28px' }}
                                  title="Edit Milestone"
                                >
                                  <Edit2 size={13} />
                                </button>
                                
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteMilestone(milestone.id)}
                                    className="btn btn-outline btn-sm"
                                    style={{ padding: '4px 6px', height: '28px', color: '#dc2626', borderColor: '#fecaca' }}
                                    title="Delete Milestone"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                              
                              <div style={{ width: '100%', marginTop: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#475569' }}>
                                  <span>Progress</span>
                                  <span>{milestone.progress_percentage}%</span>
                                </div>
                                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${milestone.progress_percentage}%`,
                                      height: '100%',
                                      background: isCompleted ? '#16a34a' : '#2563eb',
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
            <Clock size={40} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              No milestones yet
            </h4>
            <p style={{ fontSize: '0.84rem', marginBottom: '16px' }}>
              Add milestones to create your project timeline.
            </p>
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Add Milestone</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Milestone Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Milestone to Project" maxWidth="580px">
        {formError && (
          <div className="alert-box danger" style={{ marginBottom: '16px' }}>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateMilestone}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Milestone Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Site Preparation"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Sequence (Order) *</label>
              <input
                type="number"
                name="sequence"
                className="form-input"
                value={formData.sequence}
                onChange={handleInputChange}
                required
                min="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Planned Start Date *</label>
              <input
                type="date"
                name="planned_start_date"
                className="form-input"
                value={formData.planned_start_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Planned End Date *</label>
              <input
                type="date"
                name="planned_end_date"
                className="form-input"
                value={formData.planned_end_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DELAYED">Delayed</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Responsible Person</label>
            <select
              name="responsible_id"
              className="form-select"
              value={formData.responsible_id}
              onChange={handleInputChange}
            >
              <option value="">Select Responsible Person</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Progress: {formData.progress_percentage}%
            </label>
            <input
              type="range"
              name="progress_percentage"
              min="0"
              max="100"
              style={{ width: '100%' }}
              value={formData.progress_percentage}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              rows={3}
              placeholder="Key specifications or deliverables for this milestone..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Milestone'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Milestone Modal */}
      <Modal isOpen={!!editingMilestone} onClose={() => setEditingMilestone(null)} title="Edit Milestone" maxWidth="580px">
        {formError && (
          <div className="alert-box danger" style={{ marginBottom: '16px' }}>
            <span>{formError}</span>
          </div>
        )}

        {editFormData && (
          <form onSubmit={handleUpdateMilestone}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Milestone Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Sequence (Order) *</label>
                <input
                  type="number"
                  name="sequence"
                  className="form-input"
                  value={editFormData.sequence}
                  onChange={handleEditInputChange}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Planned Start Date *</label>
                <input
                  type="date"
                  name="planned_start_date"
                  className="form-input"
                  value={editFormData.planned_start_date}
                  onChange={handleEditInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Planned End Date *</label>
                <input
                  type="date"
                  name="planned_end_date"
                  className="form-input"
                  value={editFormData.planned_end_date}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={editFormData.status}
                  onChange={handleEditInputChange}
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  name="priority"
                  className="form-select"
                  value={editFormData.priority}
                  onChange={handleEditInputChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Responsible Person</label>
              <select
                name="responsible_id"
                className="form-select"
                value={editFormData.responsible_id}
                onChange={handleEditInputChange}
              >
                <option value="">Select Responsible Person</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Progress: {editFormData.progress_percentage}%
              </label>
              <input
                type="range"
                name="progress_percentage"
                min="0"
                max="100"
                style={{ width: '100%' }}
                value={editFormData.progress_percentage}
                onChange={handleEditInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-textarea"
                rows={3}
                value={editFormData.description}
                onChange={handleEditInputChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" onClick={() => setEditingMilestone(null)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={!!viewMilestone} onClose={() => setViewMilestone(null)} title="Milestone Details" maxWidth="500px">
        {viewMilestone && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: 800,
                }}
              >
                {String(viewMilestone.sequence).padStart(2, '0')}
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {viewMilestone.name}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span className={`badge badge-${viewMilestone.status === 'COMPLETED' ? 'completed' : viewMilestone.status === 'DELAYED' ? 'delayed' : 'in-progress'}`}>
                {viewMilestone.status.replace('_', ' ')}
              </span>
              <span className="badge badge-outline" style={{ border: '1px solid #cbd5e1', color: '#475569' }}>
                {viewMilestone.priority} Priority
              </span>
            </div>

            {viewMilestone.description && (
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.86rem', color: '#475569' }}>
                {viewMilestone.description}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.84rem' }}>
              <div>
                <div style={{ color: '#94a3b8' }}>Planned Start</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>{viewMilestone.planned_start_date}</div>
              </div>
              <div>
                <div style={{ color: '#94a3b8' }}>Planned End</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>{viewMilestone.planned_end_date}</div>
              </div>
              <div>
                <div style={{ color: '#94a3b8' }}>Actual Start</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>{viewMilestone.actual_start_date || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#94a3b8' }}>Actual End</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>{viewMilestone.actual_end_date || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#94a3b8' }}>Delay Days</div>
                <div style={{ color: viewMilestone.delay_days > 0 ? '#b91c1c' : '#0f172a', fontWeight: 700 }}>
                  {viewMilestone.delay_days} {viewMilestone.delay_days === 1 ? 'day' : 'days'}
                </div>
              </div>
              <div>
                <div style={{ color: '#94a3b8' }}>Progress</div>
                <div style={{ color: '#0f172a', fontWeight: 700 }}>{viewMilestone.progress_percentage}%</div>
              </div>
              {viewMilestone.responsible && (
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <div className="user-avatar" style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}>
                    {viewMilestone.responsible.first_name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Responsible Person</div>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                      {viewMilestone.responsible.first_name} {viewMilestone.responsible.last_name} ({viewMilestone.responsible.email})
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setViewMilestone(null)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    {/* Predict Modal */}
      <Modal isOpen={isPredictModalOpen} onClose={() => setIsPredictModalOpen(false)} title="Run AI Delay-Risk Prediction" maxWidth="500px">
        {formError && (
          <div className="alert-box danger" style={{ marginBottom: '16px' }}>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleRunPrediction}>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.85rem', color: '#475569' }}>
            <strong>Project Context Loaded:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
              <li>Type: {project?.project_type || 'Residential'}</li>
              <li>Budget: LKR {Number(project?.budget).toLocaleString()}</li>
            </ul>
          </div>
          {dailyLogs.length > 0 ? (
            <div style={{ marginBottom: '16px', fontSize: '0.8rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} />
              <span>Pre-filled from latest Daily Site Log ({dailyLogs[0].log_date})</span>
            </div>
          ) : (
            <div style={{ marginBottom: '16px', fontSize: '0.8rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} />
              <span>No recent Daily Log found. Please enter conditions manually.</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Weather Condition</label>
            <select name="weather_condition" className="form-select" value={predictFormData.weather_condition} onChange={(e) => setPredictFormData({...predictFormData, weather_condition: e.target.value})}>
              <option value="Clear">Clear</option>
              <option value="Rainy">Rainy</option>
              <option value="Monsoon">Monsoon</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Labourers Count</label>
            <input type="number" name="labourers_count" className="form-input" min="1" value={predictFormData.labourers_count} onChange={(e) => setPredictFormData({...predictFormData, labourers_count: parseInt(e.target.value) || 0})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Material Availability</label>
            <select name="material_availability" className="form-select" value={predictFormData.material_availability} onChange={(e) => setPredictFormData({...predictFormData, material_availability: e.target.value})}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={() => setIsPredictModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={runningPrediction}>
              {runningPrediction ? 'Running AI...' : 'Run Prediction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Daily Log Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title={editingLog ? "Edit Daily Site Log" : "Add Daily Site Log"} maxWidth="580px">
        {formError && (
          <div className="alert-box danger" style={{ marginBottom: '16px' }}>
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSaveLog}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Log Date *</label>
              <input type="date" name="log_date" className="form-input" value={logFormData.log_date} onChange={handleLogInputChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Weather *</label>
              <select name="weather_condition" className="form-select" value={logFormData.weather_condition} onChange={handleLogInputChange}>
                <option value="Clear">Clear</option>
                <option value="Rainy">Rainy</option>
                <option value="Monsoon">Monsoon</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Labour Count *</label>
              <input type="number" name="labour_count" className="form-input" min="0" value={logFormData.labour_count} onChange={handleLogInputChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Material Availability *</label>
              <select name="material_availability" className="form-select" value={logFormData.material_availability} onChange={handleLogInputChange}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Work Completed</label>
            <textarea name="work_completed" className="form-textarea" rows={2} value={logFormData.work_completed} onChange={handleLogInputChange}></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Issues Encountered</label>
            <textarea name="issues_encountered" className="form-textarea" rows={2} value={logFormData.issues_encountered} onChange={handleLogInputChange}></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea name="notes" className="form-textarea" rows={2} value={logFormData.notes} onChange={handleLogInputChange}></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={() => setIsLogModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
