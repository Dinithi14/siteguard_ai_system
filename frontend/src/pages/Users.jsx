import React, { useState, useEffect } from 'react';
import { listUsers, adminUpdateUser, deleteUser } from '../api/users';
import { createUser } from '../api/users';
import { listProjects } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/common/Toast';
import Modal from '../components/common/Modal';
import {
  Users as UsersIcon,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  FolderKanban,
  MapPin,
} from 'lucide-react';

export const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ text: '', type: 'success' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', email: '', role_id: 2 });
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '' });

  const fetchUsersList = async () => {
    try {
      setLoading(true);
      const res = await listUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsList = async () => {
    try {
      const res = await listProjects();
      setProjects(res.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  useEffect(() => {
    fetchUsersList();
    fetchProjectsList();
  }, []);

  const showToast = (text, type = 'success') => setToast({ text, type });

  const handleCreateUser = async (event) => {
    event.preventDefault();
    try {
      await createUser({ ...newUser, role_id: Number(newUser.role_id) });
      setNewUser({ first_name: '', last_name: '', email: '', role_id: 2 });
      setShowCreateForm(false);
      showToast('User created. A verification code and temporary password were emailed to them.');
      await fetchUsersList();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create user.', 'danger');
    }
  };

  const handleToggleActive = async (user) => {
    if (user.id === currentUser?.id) {
      showToast("You can't deactivate your own account while logged in.", 'danger');
      return;
    }

    try {
      const newStatus = !user.is_active;
      await adminUpdateUser(user.id, { is_active: newStatus });
      showToast(`User ${user.email} is now ${newStatus ? 'active' : 'deactivated'}.`);
      await fetchUsersList();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update user status.', 'danger');
    }
  };

  const handleRoleChange = async (user, newRoleName) => {
    if (user.id === currentUser?.id) {
      showToast("You can't change your own role while logged in.", 'danger');
      return;
    }

    try {
      // Role 1 = ADMIN, 2 = USER
      const roleId = newRoleName === 'ADMIN' ? 1 : 2;
      await adminUpdateUser(user.id, { role_id: roleId });
      showToast(`Updated role for ${user.email} to ${newRoleName}.`);
      await fetchUsersList();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update role.', 'danger');
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      showToast("You can't delete your own account while logged in.", 'danger');
      return;
    }

    if (window.confirm(`Delete ${user.first_name} ${user.last_name}? This cannot be undone.`)) {
      try {
        await deleteUser(user.id);
        showToast(`User ${user.email} was deleted.`);
        await fetchUsersList();
      } catch (err) {
        showToast(err.response?.data?.detail || 'Failed to delete user.', 'danger');
      }
    }
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditForm({ first_name: user.first_name, last_name: user.last_name, email: user.email });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    try {
      await adminUpdateUser(editUser.id, editForm);
      showToast(`Updated details for ${editForm.email}.`);
      setEditUser(null);
      await fetchUsersList();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update user.', 'danger');
    }
  };

  const getSupervisedProjects = (user) => projects.filter((p) => p.supervisor_id === user.id);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          User & Access Administration
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Manage user accounts, assign ADMIN/USER roles, and control application security permissions
        </p>
      </div>

      <Toast message={toast.text} type={toast.type} onClose={() => setToast({ text: '', type: toast.type })} />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Registered Accounts ({users.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(true)}>
            Create User
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            Loading users...
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Access Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                          {u.first_name ? u.first_name[0].toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#475569' }}>{u.email}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ width: '110px', padding: '4px 8px', fontSize: '0.8rem' }}
                        value={u.role || 'USER'}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? "You can't change your own role" : undefined}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-completed' : 'badge-delayed'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setViewUser(u)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="View full details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Edit user"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-outline'}`}
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? "You can't deactivate your own account" : (u.is_active ? 'Deactivate' : 'Activate')}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="btn btn-sm btn-danger"
                          style={{ padding: '5px 8px' }}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? "You can't delete your own account" : 'Delete user'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title="Create User Account" maxWidth="520px">
        <form onSubmit={handleCreateUser}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" placeholder="First name" required minLength="2" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" placeholder="Last name" required minLength="2" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" placeholder="Email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Role *</label>
            <select className="form-select" value={newUser.role_id} onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}>
              <option value="2">USER</option>
              <option value="1">ADMIN</option>
            </select>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '-4px', marginBottom: '16px' }}>
            A temporary password and email verification code will be sent to this address.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Account
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Details" maxWidth="560px">
        {viewUser && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div className="user-avatar" style={{ width: '52px', height: '52px', fontSize: '1.2rem' }}>
                {viewUser.first_name ? viewUser.first_name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {viewUser.first_name} {viewUser.last_name}
                </h3>
                <span className={`badge ${viewUser.role === 'ADMIN' ? 'badge-primary' : 'badge-completed'}`}>
                  {viewUser.role || 'USER'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} /> Email
                </div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>{viewUser.email}</div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Status</div>
                <span className={`badge ${viewUser.is_active ? 'badge-completed' : 'badge-delayed'}`}>
                  {viewUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} /> Joined Date
                </div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>
                  {viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString() : '—'}
                </div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Password Status</div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>
                  {viewUser.must_change_password ? 'Must change on next login' : 'Set by user'}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderKanban size={16} /> Assigned Projects ({getSupervisedProjects(viewUser).length})
            </h4>

            {getSupervisedProjects(viewUser).length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No projects assigned to this user yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                {getSupervisedProjects(viewUser).map((p) => (
                  <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{p.name}</span>
                      <span className="badge badge-primary">{p.status}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem' }}>
                      <MapPin size={12} /> {p.location}
                      <span style={{ marginLeft: '8px' }}>{p.start_date} → {p.expected_end_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User" maxWidth="480px">
        {editUser && (
          <form onSubmit={handleEditSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" required minLength="2" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" required minLength="2" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" onClick={() => setEditUser(null)} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Users;
