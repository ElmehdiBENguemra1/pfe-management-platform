import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, GraduationCap, X, Key, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import API from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [forgotMode, setForgotMode] = useState('NONE'); // NONE, REQUEST, RESET
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in');
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error(t('auth.invalid_credentials'));
      } else {
        toast.error(error.response?.data?.message || t('auth.invalid_credentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { identifier: resetIdentifier });
      toast.success(t('auth.reset_link_sent') || 'Code envoyé !');
      setForgotMode('RESET');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error requesting reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token: resetToken, newPassword });
      toast.success(t('auth.reset_success'));
      setForgotMode('NONE');
      // Autofill email for convenience
      if (resetIdentifier.includes('@')) {
        setEmail(resetIdentifier);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Left panel - decorative */}
      <div style={{
        flex: '0 0 45%',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '-60px', transform: 'translateY(-50%)', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <GraduationCap size={38} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.03em' }}>
            PFE Manager
          </h1>
          <p style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
            La plateforme académique pour gérer les projets de fin d'études
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '48px', textAlign: 'left' }}>
            {['Gestion des candidatures', 'Suivi des projets', 'Administration des sujets'].map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              {t('auth.login_title')}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{t('auth.login_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('auth.email')}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={17} />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="you@university.edu"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('auth.password')}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={17} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                  placeholder="••••••••"
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
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <button type="button" onClick={() => setForgotMode('REQUEST')} style={{ background: 'none', border: 'none', color: '#1e3a8a', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                  {t('auth.forgot_pass')}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t('auth.signing_in') : t('auth.sign_in')}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              {t('auth.no_account')}{' '}
              <Link to="/register" style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}>
                {t('auth.sign_up')}
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotMode !== 'NONE' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setForgotMode('NONE')} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="#64748b" />
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>{t('auth.forgot_pass_title')}</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              {t('auth.forgot_pass_desc')}
            </p>

            {forgotMode === 'REQUEST' && (
              <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">{t('auth.forgot_pass_id')}</label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={17} />
                    <input 
                      required type="text" 
                      className="form-input" 
                      style={{ paddingLeft: '42px' }}
                      value={resetIdentifier} onChange={(e) => setResetIdentifier(e.target.value)} 
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                  {loading ? t('auth.send_reset_loading') : t('auth.send_reset')}
                </button>
              </form>
            )}

            {forgotMode === 'RESET' && (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">{t('auth.reset_token')}</label>
                  <div style={{ position: 'relative' }}>
                     <Key style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={17} />
                    <input 
                      required type="text" 
                      className="form-input" 
                      style={{ paddingLeft: '42px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
                      value={resetToken} onChange={(e) => setResetToken(e.target.value)} 
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">{t('auth.new_password')}</label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={17} />
                    <input 
                      required 
                      type={showResetPassword ? "text" : "password"} 
                      className="form-input" 
                      style={{ paddingLeft: '42px', paddingRight: '42px' }}
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                    >
                      {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                  {loading ? t('auth.confirm_reset_loading') : t('auth.confirm_reset')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
