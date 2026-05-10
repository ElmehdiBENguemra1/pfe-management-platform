import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import { Calendar, FileText, CheckCircle, Clock, Download, Upload, Plus, X, User, Mail, Phone, Briefcase, GraduationCap, Building2, Edit2 } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { getLevelLabel } from '../constants/levels';
import LevelSelect from '../components/common/LevelSelect';

export default function ProjectDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user: currentUser, login } = useAuth(); // needed for profile edit
  const [activeTab, setActiveTab] = useState('overview');
  
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Modals state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  
  // Forms state
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', dueDate: '', status: 'PENDING' });
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('REPORT');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const res = await API.get(`/projects/${id}`);
      setProject(res.data);
      setMilestones(res.data.milestones || []);
      setDocuments(res.data.documents || []);
    } catch {
      toast.error(t('projects.load_error'));
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await API.post(`/projects/${id}/milestones`, milestoneForm);
      toast.success(t('project_details.creation_success'));
      setIsMilestoneModalOpen(false);
      setMilestoneForm({ title: '', description: '', dueDate: '', status: 'PENDING' });
      const res = await API.get(`/projects/${id}/milestones`);
      setMilestones(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create milestone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile) return;
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('type', docType);

    try {
      await API.post(`/projects/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('project_details.upload_success'));
      setIsDocModalOpen(false);
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      const res = await API.get(`/projects/${id}/documents`);
      setDocuments(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const downloadDocument = async (docId, name) => {
    try {
      const res = await API.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Failed to download document');
    }
  };

  if (!project) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
    </div>
  );

  const student = project?.student;
  const academic = project?.academicSupervisor;
  const company = project?.companySupervisor;

  const ProfileCard = ({ roleTitle, userObj, icon }) => {
    if (!userObj) return null;
    return (
      <div style={{ 
        background: 'var(--bg-primary)', 
        border: '1px solid var(--border)', 
        borderRadius: '12px', 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
            {icon}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{roleTitle}</h4>
            <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              {userObj.firstName || ''} {userObj.lastName || ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <Mail size={16} /> {userObj.email || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <Phone size={16} /> {userObj.phone || 'Non renseigné'}
          </div>
          
          <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
          
          {userObj.role === 'STUDENT' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <GraduationCap size={16} /> N° {userObj.studentId || 'N/A'} - {userObj.level ? getLevelLabel(userObj.level) : 'N/A'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Building2 size={16} /> {userObj.department || 'N/A'}
              </div>
            </>
          )}

          {userObj.role === 'SUPERVISOR' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Building2 size={16} /> {userObj.department || 'N/A'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Briefcase size={16} /> Spécialité: {userObj.specialization || 'N/A'}
              </div>
            </>
          )}

          {userObj.role === 'COMPANY' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Building2 size={16} /> {userObj.companyName || 'N/A'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Briefcase size={16} /> Secteur: {userObj.sector || 'N/A'}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header section */}
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 className="academic-heading" style={{ fontSize: '1.75rem', margin: 0 }}>
                {project?.topicTitle || project?.title || 'Projet PFE'}
              </h1>
              <StatusBadge status={project?.status} />
            </div>
            <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Démarrage</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="var(--accent-blue)" /> {project?.startDate || '—'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Échéance</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#7c3aed" /> {project?.endDate || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border)' }}>
        {['overview', 'milestones', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
              background: activeTab === tab ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
            }}
          >
            {tab === 'overview' ? 'Aperçu' : tab === 'milestones' ? 'Étapes' : 'Documents'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="card" style={{ padding: '32px', minHeight: '300px' }}>
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', color: 'var(--text-primary)' }}>
              Les acteurs du projet
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <ProfileCard 
                roleTitle="Étudiant" 
                userObj={student} 
                icon={<User size={20} />} 
              />
              <ProfileCard 
                roleTitle="Encadrant Académique" 
                userObj={academic} 
                icon={<GraduationCap size={20} />} 
              />
              {company && (
                <ProfileCard 
                  roleTitle="Encadrant Entreprise" 
                  userObj={company} 
                  icon={<Briefcase size={20} />} 
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Étapes et Jalons
              </h3>
              {(currentUser?.role === 'SUPERVISOR' || currentUser?.role === 'COMPANY') && (
                <button onClick={() => setIsMilestoneModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Ajouter une étape
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(!milestones || milestones.length === 0) ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aucun jalon défini pour le moment.
                </div>
              ) : milestones.filter(m => m).map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: m.status === 'COMPLETED' ? '#ecfdf5' : '#eff6ff', color: m.status === 'COMPLETED' ? '#059669' : '#1e3a8a' }}>
                       {m.status === 'COMPLETED' ? <CheckCircle size={20} /> : <Clock size={20} />}
                     </div>
                     <div>
                       <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{m.title || 'Jalon'}</h4>
                       <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Échéance: {m.dueDate || '—'}</p>
                     </div>
                   </div>
                   <StatusBadge status={m.status} />
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Documents du projet
              </h3>
              {currentUser?.role === 'STUDENT' && (
                <button onClick={() => setIsDocModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={16} /> Déposer un document
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {(!documents || documents.length === 0) ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aucun document déposé.
                </div>
              ) : documents.filter(doc => doc).map((doc) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', flexShrink: 0 }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{doc.fileName || `Doc_${doc.documentType || ''}`}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>{doc.documentType || 'Autre'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => downloadDocument(doc.id, doc.fileName)}
                    style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-blue)', flexShrink: 0 }}
                  >
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* Milestone Modal */}
      {isMilestoneModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{t('project_details.add_milestone')}</h3>
              <button onClick={() => setIsMilestoneModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            <form onSubmit={handleCreateMilestone} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">{t('project_details.milestone_title')}</label>
                <input required type="text" className="form-input" value={milestoneForm.title} onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value})} />
              </div>
              <div>
                <label className="form-label">{t('project_details.milestone_desc')}</label>
                <textarea required className="form-input" rows="3" value={milestoneForm.description} onChange={e => setMilestoneForm({...milestoneForm, description: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">{t('project_details.due_date')}</label>
                  <input required type="date" className="form-input" value={milestoneForm.dueDate} onChange={e => setMilestoneForm({...milestoneForm, dueDate: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">{t('project_details.status')}</label>
                  <select required className="form-input" value={milestoneForm.status} onChange={e => setMilestoneForm({...milestoneForm, status: e.target.value})}>
                    <option value="PENDING">{t('project_details.status_pending')}</option>
                    <option value="IN_PROGRESS">{t('project_details.status_in_progress')}</option>
                    <option value="COMPLETED">{t('project_details.status_completed')}</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsMilestoneModalOpen(false)} className="btn" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? '...' : t('project_details.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {isDocModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{t('project_details.doc_upload_title')}</h3>
              <button onClick={() => setIsDocModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            <form onSubmit={handleUploadDocument} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">{t('project_details.doc_type')}</label>
                <select required className="form-input" value={docType} onChange={e => setDocType(e.target.value)}>
                  <option value="CV">{t('project_details.doc_type_cv')}</option>
                  <option value="MOTIVATION_LETTER">{t('project_details.doc_type_mot')}</option>
                  <option value="REPORT">{t('project_details.doc_type_rep')}</option>
                  <option value="INTERNSHIP_AGREEMENT">{t('project_details.doc_type_agr')}</option>
                  <option value="OTHER">{t('project_details.doc_type_oth')}</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t('project_details.doc_file')}</label>
                <input required type="file" ref={fileInputRef} onChange={e => setDocFile(e.target.files[0])} style={{ display: 'block', width: '100%', padding: '8px', fontSize: '0.875rem' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>{t('project_details.doc_upload_desc')}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsDocModalOpen(false)} className="btn" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !docFile}>{isSubmitting ? t('project_details.uploading') : t('project_details.upload')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
