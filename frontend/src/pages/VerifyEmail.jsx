import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { resendVerification, verifyEmail } from '../api/auth';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await verifyEmail({ email: email.trim(), otp });
      setMessage('Email verified successfully. Redirecting to sign in...');
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed. Request a new code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      await resendVerification(email.trim());
      setOtp('');
      setSecondsLeft(120);
      setMessage('A new verification code was sent.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not resend the verification code.');
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', marginBottom: '8px' }}><ShieldCheck size={32} /></div>
          <h2>Verify Your Email</h2>
          <p>Enter the latest six-digit code sent to your email.</p>
        </div>
        {error && <div className="alert-box danger"><AlertCircle size={18} /><span>{error}</span></div>}
        {message && <div className="alert-box success"><CheckCircle2 size={18} /><span>{message}</span></div>}
        <form onSubmit={handleVerify}>
          <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Verification Code</label><input className="form-input" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: secondsLeft ? '#64748b' : '#dc2626', fontSize: '0.85rem', marginBottom: '12px' }}><span>{secondsLeft ? `Code expires in ${minutes}:${seconds}` : 'Code expired'}</span><Mail size={16} /></div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading || otp.length !== 6}><span>{loading ? 'Checking...' : 'Verify Email'}</span><ArrowRight size={16} /></button>
        </form>
        <button type="button" className="btn btn-outline" style={{ width: '100%', marginTop: '12px' }} onClick={handleResend}>Resend Code</button>
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.88rem' }}><Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Back to Sign In</Link></div>
      </div>
    </div>
  );
};

export default VerifyEmail;