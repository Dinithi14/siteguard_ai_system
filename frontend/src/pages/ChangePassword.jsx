import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { changePassword, skipPasswordChange } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export const ChangePassword = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.new_password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(formData);
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setError('');
    setSkipping(true);
    try {
      await skipPasswordChange();
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to continue with the current password.');
    } finally {
      setSkipping(false);
    }
  };


  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', marginBottom: '8px' }}>
            <KeyRound size={32} />
          </div>
          <h2>Set a New Password</h2>
          <p>
            {user?.must_change_password
              ? 'Your account was created by an administrator. Set your own password to continue.'
              : 'Update your account password.'}
          </p>
        </div>

        {error && (
          <div className="alert-box danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current / Temporary Password</label>
            <input
              type="password"
              name="current_password"
              className="form-input"
              placeholder="••••••••"
              value={formData.current_password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              name="new_password"
              className="form-input"
              placeholder="At least 8 characters"
              value={formData.new_password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              name="confirm_password"
              className="form-input"
              placeholder="Re-enter new password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={loading || skipping}
          >
            {loading ? 'Updating...' : 'Change Password'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {user?.must_change_password && (
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            onClick={handleSkip}
            disabled={loading || skipping}
          >
            {skipping ? 'Continuing...' : 'Skip for now, keep current password'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
