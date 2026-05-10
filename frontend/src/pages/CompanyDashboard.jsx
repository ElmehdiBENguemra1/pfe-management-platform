import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, Users, FileText, CheckCircle, Clock, 
  Search, Filter, Plus, ArrowRight, LayoutGrid, 
  List as ListIcon, Star, Send, UserCheck, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import API from '../api/axios';
import toast from 'react-hot-toast';
import StatCard from '../components/common/StatCard';
import { getLevelLabel } from '../constants/levels';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, sugRes, appsRes, topicsRes] = await Promise.all([
        API.get('/company/stats'),
        API.get('/company/suggestions'),
        API.get('/applications'),
        API.get('/topics/my')
      ]);
      setStats(statsRes.data);
      setSuggestions(sugRes.data);
      setApplications(appsRes.data);
      setTopics(topicsRes.data);
    } catch {
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await API.put(`/applications/${id}/status?status=${status}`);
      toast.success('Statut mis à jour');
      fetchDashboardData();
    } catch {
      toast.error('Échec de la mise à jour');
    }
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    handleUpdateStatus(draggableId, destination.droppableId);
  };

  if (loading || !stats || !isReady) return <div className="loading-state">Chargement du dashboard partenaire...</div>;

  const kanbanColumns = {
    PENDING: { title: 'Candidatures reçues', color: 'var(--accent-yellow)' },
    UNDER_REVIEW: { title: 'En examen', color: 'var(--accent-blue)' },
    ACCEPTED: { title: 'Acceptées', color: 'var(--accent-green)' },
    REJECTED: { title: 'Refusées', color: 'var(--accent-red)' }
  };

  // Add UNDER_REVIEW to enum-like logic if needed, but for now I'll use PENDING/ACCEPTED/REJECTED as per existing enums
  // Let's check ApplicationStatus enum.
  
  const filteredApps = applications.filter(a => selectedTopicId === 'ALL' || a.topicId === parseInt(selectedTopicId));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="academic-heading" style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Espace Partenaire : {user.company?.companyName}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez vos offres de stage et votre pipeline de recrutement.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/topics" className="btn btn-primary"><Plus size={16} /> Publier une offre</Link>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <StatCard label="Offres Actives" value={stats.activeOffers} icon={Briefcase} color="var(--accent-blue)" />
        <StatCard label="Candidatures" value={stats.pendingApplications} icon={Users} color="var(--accent-yellow)" />
        <StatCard label="Stagiaires en poste" value={stats.activeInterns} icon={UserCheck} color="var(--accent-green)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>
        
        {/* Pipeline Recruitment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pipeline de recrutement</h3>
               <select 
                  className="form-input" style={{ width: 'auto', fontSize: '0.85rem' }}
                  value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)}
                >
                 <option value="ALL">Toutes les offres</option>
                 {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
               </select>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {['PENDING', 'ACCEPTED', 'REJECTED'].map(status => (
                    <div key={status} className="kanban-column" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', color: status === 'PENDING' ? 'var(--accent-yellow)' : status === 'ACCEPTED' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {status === 'PENDING' ? 'À traiter' : status === 'ACCEPTED' ? 'Acceptés' : 'Refusés'} ({filteredApps.filter(a => a.status === status).length})
                      </h4>
                      <Droppable droppableId={status}>
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredApps.filter(a => a.status === status).map((app, index) => (
                              <Draggable key={app.id.toString()} draggableId={app.id.toString()} index={index}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => navigate('/applications')}>
                                     <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{app.studentName}</p>
                                     <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{app.topicTitle}</p>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
               </div>
            </DragDropContext>
          </div>
        </div>

        {/* Suggestions Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
             <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} color="var(--accent-yellow)" fill="var(--accent-yellow)" /> Profils suggérés
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {suggestions.map(student => (
                  <div key={student.id} className="card activity-item" style={{ padding: '12px', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {student?.firstName?.[0] || ''}{student?.lastName?.[0] || ''}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{student?.firstName || 'Utilisateur'} {student?.lastName || ''}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getLevelLabel(student.studentProfile?.level)} • {student.studentProfile?.department}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                       {student.studentProfile?.skills?.split(',').slice(0, 3).map(s => (
                         <span key={s} className="badge" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{s.trim()}</span>
                       ))}
                    </div>
                    <button onClick={() => toast.success('Invitation envoyée !')} className="btn btn-xs btn-primary" style={{ width: '100%', fontSize: '0.7rem' }}>Inviter à postuler</button>
                  </div>
                ))}
             </div>
          </div>

          <div className="card" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}>
             <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>Actions rapides</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/profile" className="btn btn-sm btn-ghost" style={{ justifyContent: 'flex-start' }}><LayoutGrid size={14} /> Gérer mon profil public</Link>
                <Link to="/projects" className="btn btn-sm btn-ghost" style={{ justifyContent: 'flex-start' }}><UserCheck size={14} /> Voir mes stagiaires</Link>
             </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
