import { useState, useEffect } from 'react';
import { 
  Search, X, CheckCircle, XCircle, LayoutGrid, List as ListIcon, 
  Trash2, MessageSquare, Save, Download, User as UserIcon, Award, ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(
    user?.role === 'STUDENT' ? 'grid' : 'list'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await API.get('/applications');
      setApplications(res.data);
    } catch {
      toast.error('Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await API.put(`/applications/${id}/status?status=${status}`);
      toast.success('Statut mis à jour');
      fetchApplications();
      if (selectedApp?.id === id) setSelectedApp(null);
    } catch (err) {
      toast.error('Échec de la mise à jour');
    }
  };

  const handleSaveInternalNotes = async () => {
    try {
      setSavingNotes(true);
      await API.put(`/supervisor/applications/${selectedApp.id}/internal-notes`, { notes: internalNotes });
      toast.success('Notes enregistrées');
      fetchApplications();
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCancelApplication = async (id) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette candidature ?')) return;
    try {
      await API.delete(`/applications/${id}`);
      toast.success('Candidature annulée');
      fetchApplications();
    } catch {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  useEffect(() => {
    if (selectedApp) setInternalNotes(selectedApp.internalNotes || '');
  }, [selectedApp]);

  const filteredApps = applications.filter(a =>
    a.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.topicTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isStudent = user?.role === 'STUDENT';
  const isSupervisor = user?.role === 'SUPERVISOR';
  const isAdminOrOwner = user?.role === 'ADMIN' || isSupervisor || user?.role === 'COMPANY';

  // Mock AI Score calculation (would normally come from backend)
  const getAIScore = (app) => {
    if (!app?.topicTitle) return 0;
    // Logic placeholder: length of skills * 15 mod 100
    return (app.topicTitle.length * 13) % 40 + 60; 
  };

  const kanbanColumns = {
    'PENDING': { title: 'Nouvelles', color: 'var(--accent-blue)' },
    'IN_REVIEW': { title: 'En cours d\'examen', color: 'var(--accent-purple)' },
    'ACCEPTED': { title: 'Acceptées', color: 'var(--accent-green)' },
    'REJECTED': { title: 'Refusées', color: 'var(--accent-red)' }
  };

  const columns = [
    { header: 'Sujet', accessor: 'topicTitle' },
    { header: isStudent ? 'Encadrant' : 'Étudiant', accessor: isStudent ? 'topicCreatedByName' : 'studentName' },
    { 
      header: 'Score IA', 
      accessor: (row) => !isStudent ? (
        <span className="badge" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)', fontWeight: 700 }}>
          {getAIScore(row)}%
        </span>
      ) : '-'
    },
    { header: 'Statut', accessor: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {isStudent && row.status === 'PENDING' && (
            <button onClick={() => handleCancelApplication(row.id)} className="btn btn-sm btn-ghost"><Trash2 size={14} color="var(--accent-red)" /></button>
          )}
          <button onClick={() => setSelectedApp(row)} className="btn btn-sm btn-ghost">Gérer</button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="academic-heading" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{isStudent ? 'Mes Candidatures' : 'Gestion des Candidatures'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{isStudent ? 'Suivez vos demandes.' : 'Évaluez les candidats avec l\'aide de l\'IA.'}</p>
        </div>
        {!isStudent && (
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button onClick={() => setViewMode('list')} className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}><ListIcon size={14} /></button>
            <button onClick={() => setViewMode('kanban')} className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}><LayoutGrid size={14} /></button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={17} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="form-input" style={{ paddingLeft: '40px' }} placeholder="Rechercher..." />
        </div>

        {viewMode === 'list' ? (
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <DataTable columns={columns} data={filteredApps} loading={loading} />
          </div>
        ) : isStudent ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
             {filteredApps.map(app => (
               <div 
                 key={app.id} className="card topic-card" onClick={() => setSelectedApp(app)}
                 style={{ cursor: 'pointer', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
               >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span className="badge" style={{ 
                     background: app.topicType === 'PFE' ? 'var(--accent-blue-soft)' : 'var(--accent-purple-soft)', 
                     color: app.topicType === 'PFE' ? 'var(--accent-blue)' : 'var(--accent-purple)',
                     fontSize: '0.7rem', fontWeight: 700
                   }}>
                     {app.topicType}
                   </span>
                   <StatusBadge status={app.status} />
                 </div>

                 <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                   {app.topicTitle}
                 </h3>

                 <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Postulé le {new Date(app.applicationDate).toLocaleDateString()}</span>
                    {app.status === 'PENDING' && (
                      <button onClick={(e) => { e.stopPropagation(); handleCancelApplication(app.id); }} className="btn btn-xs btn-ghost text-danger">
                        Annuler
                      </button>
                    )}
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="kanban-board">
            {Object.entries(kanbanColumns).map(([status, info]) => (
              <div key={status} className="kanban-column">
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: info.color, marginBottom: '16px' }}>{info.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredApps.filter(a => a.status === status).map(app => (
                    <div key={app.id} className="kanban-item card" onClick={() => setSelectedApp(app)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{app.studentName}</p>
                        {!isStudent && <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 700 }}>{getAIScore(app)}%</span>}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{app.topicTitle}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedApp && (
          <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
              className="card sidebar-modal" 
              style={{ width: '650px', padding: '40px', overflowY: 'auto', maxHeight: '100vh' }} 
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelectedApp(null)} className="btn btn-ghost close-btn" style={{ top: '24px', right: '24px' }}><X size={24} /></button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <StatusBadge status={selectedApp.status} />
                {!isStudent && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.95rem', background: 'var(--accent-blue-soft)', padding: '6px 12px', borderRadius: '100px' }}>
                    <Award size={18} /> Compatibilité IA: {getAIScore(selectedApp)}%
                  </div>
                )}
              </div>

              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>{selectedApp.studentName}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '40px' }}>Candidature pour : <strong style={{ color: 'var(--text-primary)' }}>{selectedApp.topicTitle}</strong></p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div className="card topic-card" style={{ padding: '24px', background: 'var(--bg-primary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '10px', background: 'var(--accent-blue-soft)', borderRadius: '10px' }}>
                      <UserIcon size={20} color="var(--accent-blue)" />
                    </div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profil Étudiant</h4>
                  </div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, paddingLeft: '2px' }}>
                    {selectedApp.studentEmail || 'Non spécifié'}
                  </div>
                </div>

                <div 
                  className="card topic-card" 
                  style={{ 
                    padding: '24px', background: 'var(--bg-primary)', border: '1px solid var(--border)', 
                    boxShadow: 'var(--shadow-sm)', cursor: selectedApp.studentCvUrl ? 'pointer' : 'not-allowed',
                    opacity: selectedApp.studentCvUrl ? 1 : 0.6
                  }} 
                  onClick={() => {
                    if (selectedApp.studentCvUrl) {
                      window.open(`${API.defaults.baseURL}/files/download/${selectedApp.studentCvUrl}`, '_blank');
                    } else {
                      toast.error("Cet étudiant n'a pas encore déposé de CV.");
                    }
                  }}
                >
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '10px', background: 'var(--accent-green-soft)', borderRadius: '10px' }}>
                      <Download size={20} color="var(--accent-green)" />
                    </div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Documents</h4>
                  </div>
                  <div style={{ fontSize: '1rem', color: selectedApp.studentCvUrl ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '2px' }}>
                    {selectedApp.studentCvUrl ? 'Consulter le CV' : 'Aucun CV déposé'} <ArrowRight size={16} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <MessageSquare size={18} color="var(--accent-purple)" /> Lettre de motivation
                </h4>
                <div 
                  className="card" 
                  style={{ 
                    padding: '24px', background: 'var(--bg-secondary)', fontSize: '0.95rem', 
                    lineHeight: 1.7, color: 'var(--text-primary)', borderRadius: '12px',
                    border: '1px solid var(--border)'
                  }} 
                  dangerouslySetInnerHTML={{ __html: selectedApp.motivationText }} 
                />
              </div>

              {isSupervisor && selectedApp.status === 'PENDING' && (
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    Notes internes (Privé)
                    <button onClick={handleSaveInternalNotes} disabled={savingNotes} className="btn btn-sm btn-ghost" style={{ fontSize: '0.7rem' }}>
                      <Save size={12} /> {savingNotes ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </h4>
                  <textarea 
                    className="form-input" rows="4" value={internalNotes} 
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Ajoutez vos impressions sur ce candidat..."
                  />
                </div>
              )}

              {isAdminOrOwner && selectedApp.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => handleUpdateStatus(selectedApp.id, 'ACCEPTED')} className="btn btn-primary" style={{ flex: 1 }}>
                    <CheckCircle size={18} /> Accepter la candidature
                  </button>
                  <button onClick={() => handleUpdateStatus(selectedApp.id, 'REJECTED')} className="btn btn-ghost text-danger" style={{ flex: 1 }}>
                    <XCircle size={18} /> Refuser
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
