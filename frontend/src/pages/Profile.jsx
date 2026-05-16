import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  User, Phone, Mail, Book, Award, Github, 
  Linkedin, Globe, Save, Upload, FileText, Plus, X, Check
} from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import LevelSelect from '../components/common/LevelSelect';

import { Navigate } from 'react-router-dom';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  const countries = [
    { code: '+212', name: 'Maroc', flag: '🇲🇦' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+34', name: 'Espagne', flag: '🇪🇸' },
    { code: '+39', name: 'Italie', flag: '🇮🇹' },
    { code: '+49', name: 'Allemagne', flag: '🇩🇪' },
    { code: '+32', name: 'Belgique', flag: '🇧🇪' },
    { code: '+41', name: 'Suisse', flag: '🇨🇭' },
    { code: '+213', name: 'Algérie', flag: '🇩🇿' },
    { code: '+216', name: 'Tunisie', flag: '🇹🇳' },
    { code: '+221', name: 'Sénégal', flag: '🇸🇳' },
    { code: '+225', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: '+222', name: 'Mauritanie', flag: '🇲🇷' },
    { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+966', name: 'Arabie Saoudite', flag: '🇸🇦' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+974', name: 'Qatar', flag: '🇶🇦' },
    { code: '+90', name: 'Turquie', flag: '🇹🇷' },
    { code: '+86', name: 'Chine', flag: '🇨🇳' },
    { code: '+20', name: 'Égypte', flag: '🇪🇬' },
    { code: '+212', name: 'Maroc', flag: '🇲🇦' },
  ];

  // Helper to extract country code and number
  const parsePhone = (fullPhone) => {
    if (!fullPhone) return { prefix: '+212', num: '' };
    const country = countries.find(c => fullPhone.startsWith(c.code));
    if (country) {
      return { prefix: country.code, num: fullPhone.replace(country.code, '') };
    }
    return { prefix: '+212', num: fullPhone };
  };

  const initialPhone = parsePhone(user?.phone);
  const [countryCode, setCountryCode] = useState(initialPhone.prefix);
  const [phoneNum, setPhoneNum] = useState(initialPhone.num);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    skills: user?.skills || '',
    githubUrl: user?.githubUrl || '',
    linkedinUrl: user?.linkedinUrl || '',
    department: user?.department || '',
    level: user?.level || '',
    specialization: user?.specialization || '',
    companyName: user?.companyName || '',
  });

  const [newSkill, setNewSkill] = useState('');

  const skillsList = formData.skills ? formData.skills.split(',').filter(Boolean) : [];

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const updatedSkills = [...skillsList, newSkill.trim()].join(',');
    setFormData({ ...formData, skills: updatedSkills });
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    const updatedSkills = skillsList.filter(s => s !== skill).join(',');
    setFormData({ ...formData, skills: updatedSkills });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Strip leading zero if present and concatenate with country code
      let formattedNum = phoneNum.trim();
      if (formattedNum.startsWith('0')) {
        formattedNum = formattedNum.substring(1);
      }
      const fullPhone = countryCode + formattedNum;
      
      const res = await API.put('/auth/me', { ...formData, phone: fullPhone });
      await refreshUser();
      toast.success('Profil mis à jour !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', fontSize: '2rem', fontWeight: 700 }}>
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{user?.firstName} {user?.lastName}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{user?.role} • {user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* General Info */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--accent-blue)" /> Informations personnelles
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input type="text" className="form-input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input type="text" className="form-input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Téléphone (WhatsApp)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    className="form-input" 
                    style={{ width: '120px' }}
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                  >
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ex: 612345678"
                    value={phoneNum} 
                    onChange={e => setPhoneNum(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Note: Ne pas commencer par le chiffre 0.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Filière / Département</label>
                <input type="text" className="form-input" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
              {user?.role === 'STUDENT' && (
                <div className="form-group">
                  <label className="form-label">Niveau d'études</label>
                  <LevelSelect 
                    value={formData.level} 
                    onChange={e => setFormData({...formData, level: e.target.value})} 
                  />
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows="3" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Parlez-nous de vous..." />
            </div>
          </div>

          {/* Professional Links */}
          {user?.role !== 'ADMIN' && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Liens professionnels</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Github size={18} color="var(--text-muted)" />
                    <input type="text" className="form-input" placeholder="Lien GitHub" value={formData.githubUrl} onChange={e => setFormData({...formData, githubUrl: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Linkedin size={18} color="var(--text-muted)" />
                    <input type="text" className="form-input" placeholder="Lien LinkedIn" value={formData.linkedinUrl} onChange={e => setFormData({...formData, linkedinUrl: e.target.value})} />
                 </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Skills Tagging */}
          {user?.role !== 'ADMIN' && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Compétences</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {skillsList.map(skill => (
                  <span key={skill} className="badge" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {skill}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeSkill(skill)} />
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Java" 
                  value={newSkill} 
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddSkill(e)}
                />
                <button type="button" onClick={handleAddSkill} className="btn btn-ghost"><Plus size={18} /></button>
              </div>
            </div>
          )}

          {/* CV Upload */}
          {user?.role === 'STUDENT' && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>CV (PDF)</h3>
              <div 
                style={{ 
                  border: '1px dashed var(--border)', 
                  borderRadius: '8px', 
                  padding: '16px', 
                  textAlign: 'center',
                  background: user?.cvUrl ? 'var(--bg-active)' : 'transparent'
                }}
              >
                {user?.cvUrl ? (
                  <>
                    <Check size={24} color="var(--accent-green)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>CV déjà déposé</p>
                    <a 
                      href={`${API.defaults.baseURL}/files/download/${user.cvUrl}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-xs btn-ghost"
                      style={{ marginTop: '8px' }}
                    >
                      Voir le CV
                    </a>
                  </>
                ) : (
                  <FileText size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                )}
                
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  {user?.cvUrl ? 'Mettre à jour votre CV' : 'Déposez votre CV au format PDF'}
                </p>
                
                <input
                  type="file"
                  id="cv-upload"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    try {
                      setLoading(true);
                      await API.post('/files/upload-cv', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      toast.success('CV mis à jour !');
                      await refreshUser();
                    } catch {
                      toast.error('Échec du téléversement');
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="btn btn-sm btn-ghost" 
                  style={{ marginTop: '12px' }}
                  onClick={() => document.getElementById('cv-upload').click()}
                  disabled={loading}
                >
                  <Upload size={14} style={{ marginRight: '6px' }} />
                  Parcourir
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            <Save size={18} /> Sauvegarder les modifications
          </button>
        </div>
      </form>
    </div>
  );
}
