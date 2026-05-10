import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ShieldCheck, Mail, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token');

  const [form, setForm] = useState({
    token: tokenFromUrl || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password strength validation
  const passwordCriteria = {
    length: form.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(form.newPassword),
    lowercase: /[a-z]/.test(form.newPassword),
    number: /[0-9]/.test(form.newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(form.newPassword)
  };

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!isPasswordStrong) {
      toast.error("Password does not meet criteria");
      return;
    }

    setIsSubmitting(true);
    try {
      await API.post('/auth/reset-password', {
        token: form.token,
        newPassword: form.newPassword
      });
      setIsSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password. The token may be invalid or expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '40px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: '#ecfdf5', color: '#10b981', borderRadius: '50%', marginBottom: '16px' }}>
            <CheckCircle2 size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Password Reset!</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Your password has been updated successfully. You will be redirected to login shortly.</p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none' }}>Go to Login Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', borderRadius: '12px', marginBottom: '16px' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>New Password</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Please choose a secure password to protect your account.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!tokenFromUrl && (
            <div>
              <label className="form-label">Reset Token</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} size={18} color="var(--text-muted)" />
                <input
                  required
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Enter 6-char token"
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} size={18} color="var(--text-muted)" />
              <input
                required
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                placeholder="••••••••"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} size={18} color="var(--text-muted)" />
              <input
                required
                type={showConfirm ? "text" : "password"}
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Validation Checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordCriteria.length ? '#10b981' : '#94a3b8' }}>
              <CheckCircle2 size={14} /> 8+ Characters
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordCriteria.uppercase ? '#10b981' : '#94a3b8' }}>
              <CheckCircle2 size={14} /> Uppercase
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordCriteria.lowercase ? '#10b981' : '#94a3b8' }}>
              <CheckCircle2 size={14} /> Lowercase
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordCriteria.number ? '#10b981' : '#94a3b8' }}>
              <CheckCircle2 size={14} /> Number
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordCriteria.special ? '#10b981' : '#94a3b8' }}>
              <CheckCircle2 size={14} /> Special Char
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '48px' }}
            disabled={isSubmitting || !isPasswordStrong}
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>

          <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
