import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, createProject, updateProject, deleteProject } from '../api/projects';
import { listUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/common/Toast';
import Modal from '../components/common/Modal';
import LocationAutocomplete from '../components/common/LocationAutocomplete';
import {

  FolderKanban,
  Plus,
  Search,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  ArrowRight,
  BrainCircuit,
  Filter,
  Pencil,
  Trash2,
} from 'lucide-react';

export const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'Residential',
    location: '',
    latitude: null,
    longitude: null,
    client_name: '',
    budget: '',
    labourers_count: '',
    start_date: '',
    expected_end_date: '',
    supervisor_id: '',
  });
  
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ text: '', type: 'success' });
  const [editingProject, setEditingProject] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await listProjects();
      setProjects(res.data || []);
      setFilteredProjects(res.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await listUsers();
      const usersList = res.data || [];
      // Keep USER role accounts as potential supervisors
      const userSupervisors = usersList.filter((u) => u.role === 'USER');
      setSupervisors(userSupervisors);
    } catch (err) {
      console.error('Failed to fetch supervisors:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (isAdmin) {
      fetchSupervisors();
    }
  }, [isAdmin]);

  useEffect(() => {
    let result = [...projects];

    if (statusFilter !== 'ALL') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.location.toLowerCase().includes(term) ||
          p.project_type.toLowerCase().includes(term)
      );
    }

    setFilteredProjects(result);
  }, [searchTerm, statusFilter, projects]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await createProject({
        ...formData,
        budget: parseFloat(formData.budget),
        labourers_count: parseInt(formData.labourers_count),
        latitude: formData.latitude,
        longitude: formData.longitude,
        supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id) : null,
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        project_type: 'Residential',
        location: '',
        latitude: null,
        longitude: null,
        client_name: '',
        budget: '',
        labourers_count: '',
        start_date: '',
        expected_end_date: '',
        supervisor_id: '',
      });
      await fetchProjects();
    } catch (err) {
      console.error('Create project error:', err);
      let errorMessage = 'Failed to create project.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = Array.isArray(err.response.data.detail)
            ? err.response.data.detail.map(d => `${d.loc[d.loc.length-1]}: ${d.msg}`).join(', ')
            : err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-completed">Completed</span>;
      case 'ACTIVE':
        return <span className="badge badge-in-progress">Active</span>;
      case 'PLANNED':
        return <span className="badge badge-planned">Planned</span>;
      case 'ON_HOLD':
        return <span className="badge badge-delayed">On Hold</span>;
      case 'ARCHIVED':
        return <span className="badge badge-archived" style={{ background: '#cbd5e1', color: '#475569' }}>Archived</span>;
      default:
        return <span className="badge badge-delayed">{status}</span>;
    }
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setEditFormData({
      name: project.name,
      description: project.description || '',
      project_type: project.project_type,
      location: project.location,
      latitude: project.latitude || null,
      longitude: project.longitude || null,
      client_name: project.client_name || '',
      budget: project.budget,
      labourers_count: project.labourers_count || '',
      start_date: project.start_date,
      expected_end_date: project.expected_end_date,
      supervisor_id: project.supervisor_id || '',
    });
  };

  const handleEditInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      await updateProject(editingProject.id, {
        ...editFormData,
        budget: parseFloat(editFormData.budget),
        labourers_count: parseInt(editFormData.labourers_count),
        latitude: editFormData.latitude,
        longitude: editFormData.longitude,
        supervisor_id: editFormData.supervisor_id ? parseInt(editFormData.supervisor_id) : null,
      });
      setEditingProject(null);
      setToast({ text: 'Project updated successfully.', type: 'success' });
      await fetchProjects();
    } catch (err) {
      console.error(err);
      let errorMessage = 'Failed to update project.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(d => `${d.loc[d.loc.length-1]}: ${d.msg}`).join(', ');
        } else {
          errorMessage = err.response.data.detail;
        }
      }
      setToast({ text: errorMessage, type: 'danger' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteProject(project.id);
      setToast({ text: `Project "${project.name}" was deleted.`, type: 'success' });
      await fetchProjects();
    } catch (err) {
      setToast({ text: err.response?.data?.detail || 'Failed to delete project.', type: 'danger' });
    }
  };

  return (
    <div>
      <Toast message={toast.text} type={toast.type} onClose={() => setToast({ text: '', type: toast.type })} />

      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Construction Projects</h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Manage site profiles, milestones, and monitor delay forecasts</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ gap: '8px' }}>
            <Plus size={18} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by project name, location, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#64748b' }} />
            <select
              className="form-select"
              style={{ width: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748b' }}>Loading projects...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredProjects.map((project) => (
            <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-primary">{project.project_type}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusBadge(project.status)}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '5px 7px' }}
                          title="Edit project"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project)}
                          className="btn btn-sm btn-danger"
                          style={{ padding: '5px 7px' }}
                          title="Delete project"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  {project.name}
                </h3>
                {project.description && (
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.4 }}>
                    {project.description}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '16px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                    <MapPin size={15} style={{ color: '#94a3b8' }} />
                    <span>{project.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                    <Building size={15} style={{ color: '#94a3b8' }} />
                    <span>Client: {project.client_name || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 600 }}>
                    <DollarSign size={15} style={{ color: '#16a34a' }} />
                    <span>LKR {Number(project.budget).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                    <Calendar size={15} style={{ color: '#94a3b8' }} />
                    <span>{project.start_date} → {project.expected_end_date}</span>
                  </div>
                  {project.supervisor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', marginTop: '4px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                      <div className="user-avatar" style={{ width: '20px', height: '20px', fontSize: '0.65rem', minWidth: '20px' }}>
                        {project.supervisor.first_name[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.8rem' }}>
                        Supervisor: <strong>{project.supervisor.first_name} {project.supervisor.last_name}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: '0.82rem' }}
                >
                  Milestones
                </button>
                <button
                  onClick={() => navigate('/predictions', { state: { selectedProjectId: project.id } })}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '0.82rem', gap: '4px' }}
                >
                  <BrainCircuit size={14} />
                  <span>AI Predict</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <FolderKanban size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>No Projects Found</h3>
          <p style={{ fontSize: '0.88rem', marginBottom: '20px' }}>
            {isAdmin 
              ? 'Create your first construction project to get started with SiteGuard AI.' 
              : 'You do not have any assigned projects at the moment. Please contact an administrator.'
            }
          </p>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Create New Project</span>
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Construction Project" maxWidth="600px">
        {formError && (
          <div className="alert-box danger" style={{ marginBottom: '16px' }}>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateProject}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Kandy Shopping Mall"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Project Type *</label>
              <select
                name="project_type"
                className="form-select"
                value={formData.project_type}
                onChange={handleInputChange}
                required
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location *</label>
              <LocationAutocomplete 
                value={formData.location}
                onChange={(loc) => setFormData(prev => ({ ...prev, location: loc }))}
                onCoordinatesSelect={(lat, lon) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }))}
              />
              {!formData.latitude && formData.location && (
                <div style={{ fontSize: '0.75rem', color: '#ea580c', marginTop: '4px' }}>
                  ⚠ Please select a valid location from the dropdown for automatic weather detection.
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Client Name</label>
              <input
                type="text"
                name="client_name"
                className="form-input"
                placeholder="e.g. ABC Holdings"
                value={formData.client_name}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contract Budget (LKR) *</label>
              <input
                type="number"
                name="budget"
                className="form-input"
                placeholder="e.g. 45000000"
                value={formData.budget}
                onChange={handleInputChange}
                required
                min="1000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Labourers Count *</label>
              <input
                type="number"
                name="labourers_count"
                className="form-input"
                placeholder="e.g. 20"
                value={formData.labourers_count}
                onChange={handleInputChange}
                required
                min="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                name="start_date"
                className="form-input"
                value={formData.start_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected End Date *</label>
              <input
                type="date"
                name="expected_end_date"
                className="form-input"
                value={formData.expected_end_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project Supervisor (User)</label>
            <select
              name="supervisor_id"
              className="form-select"
              value={formData.supervisor_id}
              onChange={handleInputChange}
            >
              <option value="">None (Assign Later)</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Scope</label>
            <textarea
              name="description"
              className="form-textarea"
              rows={3}
              placeholder="Brief outline of the construction project deliverables..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal isOpen={!!editingProject} onClose={() => setEditingProject(null)} title="Edit Project" maxWidth="600px">
        {editFormData && (
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={editFormData.name}
                onChange={handleEditInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Project Type *</label>
                <select
                  name="project_type"
                  className="form-select"
                  value={editFormData.project_type}
                  onChange={handleEditInputChange}
                  required
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <LocationAutocomplete 
                  value={editFormData.location}
                  onChange={(loc) => setEditFormData(prev => ({ ...prev, location: loc }))}
                  onCoordinatesSelect={(lat, lon) => setEditFormData(prev => ({ ...prev, latitude: lat, longitude: lon }))}
                />
                {!editFormData.latitude && editFormData.location && (
                  <div style={{ fontSize: '0.75rem', color: '#ea580c', marginTop: '4px' }}>
                    ⚠ Please select a valid location from the dropdown for automatic weather detection.
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input
                  type="text"
                  name="client_name"
                  className="form-input"
                  value={editFormData.client_name}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contract Budget (LKR) *</label>
                <input
                  type="number"
                  name="budget"
                  className="form-input"
                  value={editFormData.budget}
                  onChange={handleEditInputChange}
                  required
                  min="1000"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Labourers Count *</label>
                <input
                  type="number"
                  name="labourers_count"
                  className="form-input"
                  value={editFormData.labourers_count}
                  onChange={handleEditInputChange}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  className="form-input"
                  value={editFormData.start_date}
                  onChange={handleEditInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expected End Date *</label>
                <input
                  type="date"
                  name="expected_end_date"
                  className="form-input"
                  value={editFormData.expected_end_date}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Project Status *</label>
                <select
                  name="status"
                  className="form-select"
                  value={editFormData.status}
                  onChange={handleEditInputChange}
                  required
                >
                  <option value="PLANNED">Planned</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Project Supervisor (User)</label>
                <select
                  name="supervisor_id"
                  className="form-select"
                  value={editFormData.supervisor_id}
                  onChange={handleEditInputChange}
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Scope</label>
              <textarea
                name="description"
                className="form-textarea"
                rows={3}
                value={editFormData.description}
                onChange={handleEditInputChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" onClick={() => setEditingProject(null)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Projects;
