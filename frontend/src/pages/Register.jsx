import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, GraduationCap, Building2, Phone, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import LevelSelect from '../components/common/LevelSelect';

const ROLES = ['STUDENT', 'SUPERVISOR', 'COMPANY'];

export default function Register() {
  const [formData, setFormData] = useState({
    email: '', phone: '', password: '', firstName: '', lastName: '',
    role: 'STUDENT', studentId: '', department: '', level: '',
    specialization: '', companyName: '', sector: '', website: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });
  const handleRoleChange = (role) => setFormData({ ...formData, role });

  // Password strength logic
  const isPasswordStrong = useMemo(() => {
    const p = formData.password;
    if (!p) return null; // No password entered yet
    if (p.length < 8) return false;
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNumber = /\d/.test(p);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPasswordStrong === false) {
      toast.error(t('auth.password_strength'));
      return;
    }
    setLoading(true);
    try {
      await register(formData);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputRow = (id, label, type = 'text', placeholder = '', icon = null, required = true) => (
    <div>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>{icon}</span>}
        <input
          id={id}
          type={id === 'password' && showPassword ? 'text' : type}
          required={required}
          value={formData[id]}
          onChange={handleChange}
          className="form-input"
          style={{ 
            paddingLeft: icon ? '40px' : '14px', 
            paddingRight: id === 'password' ? '40px' : '14px',
            borderColor: id === 'password' && isPasswordStrong === false ? '#ef4444' : id === 'password' && isPasswordStrong === true ? '#22c55e' : '' 
          }}
          placeholder={placeholder}
        />
        {id === 'password' && (
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
              justifyContent: 'center'
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {id === 'password' && isPasswordStrong === false && (
        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>
          {t('auth.password_strength')}
        </p>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Left decorative panel */}
      <div style={{
        flex: '0 0 38%',
        background: 'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 70%, #3b82f6 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <GraduationCap size={34} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>PFE Manager</h1>
          <p style={{ opacity: 0.8, lineHeight: 1.6, fontSize: '0.9rem', maxWidth: '260px', margin: '0 auto' }}>
            {t('auth.register_subtitle')}
          </p>

          <div style={{ marginTop: '48px', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Rôles disponibles</p>
            {[['STUDENT', 'Étudiant cherchant un PFE'], ['SUPERVISOR', 'Encadrant académique'], ['COMPANY', 'Entreprise partenaire']].map(([role, desc]) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{role}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.65 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 40px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.02em' }}>
              {t('auth.register_title')}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('auth.role_select')}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Role Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    border: `2px solid ${formData.role === r ? '#1e3a8a' : '#e2e8f0'}`,
                    background: formData.role === r ? '#eff6ff' : 'white',
                    color: formData.role === r ? '#1e3a8a' : '#64748b',
                    fontWeight: formData.role === r ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Common Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {inputRow('firstName', t('auth.first_name'), 'text', 'Jean', <User size={16} />)}
              {inputRow('lastName', t('auth.last_name'), 'text', 'Dupont', <User size={16} />)}
            </div>
            {inputRow('email', t('auth.email'), 'email', 'you@university.edu', <Mail size={16} />)}
            {inputRow('phone', t('auth.phone'), 'tel', '+33 6 12 34 56 78', <Phone size={16} />, false)}
            {inputRow('password', t('auth.password'), 'password', '••••••••', <Lock size={16} />)}

            {/* Student Fields */}
            {formData.role === 'STUDENT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                {inputRow('studentId', t('auth.student_id'), 'text', 'S12345', <GraduationCap size={16} />)}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {inputRow('department', t('auth.department'), 'text', 'Informatique')}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t('auth.level')}
                    </label>
                    <LevelSelect 
                      value={formData.level} 
                      onChange={(e) => setFormData({...formData, level: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Supervisor Fields */}
            {formData.role === 'SUPERVISOR' && (
              <div style={{ paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                {inputRow('specialization', t('auth.specialization'), 'text', 'Intelligence Artificielle', <Briefcase size={16} />)}
              </div>
            )}

            {/* Company Fields */}
            {formData.role === 'COMPANY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                {inputRow('companyName', t('auth.company_name'), 'text', 'Tech Solutions Inc.', <Building2 size={16} />)}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {inputRow('sector', t('auth.sector'), 'text', 'Finance')}
                  {inputRow('website', t('auth.website'), 'text', 'https://', null, false)}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isPasswordStrong === false}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: '4px', opacity: (loading || isPasswordStrong === false) ? 0.7 : 1 }}
            >
              {loading ? t('auth.creating') : t('auth.create_account')}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              {t('auth.have_account')}{' '}
              <Link to="/login" style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}>
                {t('auth.sign_in_link')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
