import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      const profile = await login(email.trim(), password);
      navigate(profile?.must_change_password ? '/change-password' : '/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setError('Cannot connect to backend server. Make sure FastAPI is running on port 8000.');
      } else {
        const detail = err.response?.data?.detail || 'Invalid email or password. Please try again.';
        setError(detail);
        setNeedsVerification(detail.toLowerCase().includes('verify'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', marginBottom: '8px' }}>
            <ShieldCheck size={32} />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your SiteGuard AI workspace</p>
        </div>

        {error && (
          <div className="alert-box danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>
              {error}
              {needsVerification && (
                <>
                  {' '}
                  <Link to={`/verify-email?email=${encodeURIComponent(email.trim())}`} style={{ color: '#b91c1c', fontWeight: 700, textDecoration: 'underline' }}>
                    Verify Email
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            Create Account
          </Link>
        </div>

        <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
          Need to verify your email?{' '}
          <Link to={`/verify-email${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
            Verify Email
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
