import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import DataTable from '../components/common/DataTable';
import { useLocation } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import TopicCard from '../components/common/TopicCard';
import ApplicationModal from '../components/common/ApplicationModal';
import { Plus, Search, Filter, LayoutGrid, List, Heart, X, CheckCircle, XCircle, Archive, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import TopicFormModal from '../components/common/TopicFormModal';
import { Copy, Plus as PlusIcon, FileText as DocIcon, Trash2 as DeleteIcon, Eye, Tag, Bookmark } from 'lucide-react';
import { getLevelLabel } from '../constants/levels';

export default function Topics() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [topics, setTopics] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filterType, setFilterType] = useState('ALL');
  
  // Modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState(null);

  useEffect(() => { 
    fetchTopics();
    if (user?.role === 'STUDENT') fetchFavorites();
    if (location.state?.initialSearch) {
      setSearchQuery(location.state.initialSearch);
    }
    if (location.state?.initialFilter) {
      setFilterType(location.state.initialFilter);
    }
  }, [location.state]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      let endpoint;
      if (user?.role === 'ADMIN') {
        endpoint = '/topics/all';
      } else if (user?.role === 'SUPERVISOR' || user?.role === 'COMPANY') {
        endpoint = '/topics/my';
      } else {
        endpoint = '/topics'; // STUDENT: sees all approved topics
      }
      const res = await API.get(endpoint);
      setTopics(res.data);
    } catch {
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await API.get('/student/topics/favorites');
      setFavorites(res.data.map(f => f.id));
    } catch (err) { /* silent */ }
  };

  const toggleFavorite = async (id) => {
    try {
      await API.post(`/student/topics/${id}/favorite`);
      setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
    } catch {
      toast.error('Error toggling list');
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/topics/${id}/approve?approved=true`);
      toast.success('Sujet approuvé');
      fetchTopics();
    } catch {
      toast.error('Échec de l\'approbation');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/topics/${rejectId}/approve?approved=false&comment=${rejectionComment}`);
      toast.success('Sujet rejeté');
      setIsRejectModalOpen(false);
      setRejectionComment('');
      fetchTopics();
    } catch {
      toast.error('Échec du rejet');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await API.post(`/topics/${id}/duplicate`);
      toast.success('Sujet dupliqué');
      fetchTopics();
    } catch {
      toast.error('Erreur lors de la duplication');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce sujet ?')) return;
    try {
      await API.delete(`/topics/${id}`);
      toast.success('Sujet supprimé');
      fetchTopics();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const cleanText = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredTopics = topics.filter(t => {
    if (!searchQuery.trim()) {
      const matchesType = filterType === 'ALL' || t.type === filterType;
      const matchesFav = filterType !== 'TO_CONSULT' || favorites.includes(t.id);
      return matchesType && matchesFav;
    }

    const cleanQuery = cleanText(searchQuery);
    const keywords = cleanQuery.split(/\s+/).filter(w => w.length > 0);

    const matchesSearch = keywords.every(kw => {
      const cleanTitle = cleanText(t.title);
      const cleanSkills = cleanText(t.requiredSkills);
      const cleanCreator = cleanText(t.createdByName);
      const cleanDomain = cleanText(t.domain);
      const cleanDescription = cleanText(t.description);

      return cleanTitle.includes(kw) || 
             cleanSkills.includes(kw) || 
             cleanCreator.includes(kw) ||
             cleanDomain.includes(kw) ||
             cleanDescription.includes(kw);
    });

    if (filterType === 'TO_CONSULT') {
      return matchesSearch && favorites.includes(t.id);
    }
    const matchesType = filterType === 'ALL' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const columns = [
    { header: 'Titre', accessor: 'title' },
    { header: 'Type', accessor: 'type' },
    { header: 'Auteur', accessor: 'createdByName' },
    { header: 'Statut', accessor: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {isAdmin && row.status === 'PENDING' && (
            <>
              <button onClick={() => handleApprove(row.id)} className="btn btn-sm btn-success">
                <CheckCircle size={14} />
              </button>
              <button onClick={() => { setRejectId(row.id); setIsRejectModalOpen(true); }} className="btn btn-sm btn-danger">
                <XCircle size={14} />
              </button>
            </>
          )}
          {(user?.role === 'SUPERVISOR' || user?.role === 'COMPANY' || isAdmin) && (
            <>
              <button onClick={() => { setTopicToEdit(row); setIsFormModalOpen(true); }} className="btn btn-sm btn-ghost" title="Modifier"><Edit3 size={14} /></button>
              <button onClick={() => handleDuplicate(row.id)} className="btn btn-sm btn-ghost" title="Dupliquer"><Copy size={14} /></button>
              <button onClick={() => handleDelete(row.id)} className="btn btn-sm btn-ghost text-danger" title="Supprimer"><DeleteIcon size={14} color="var(--accent-red)" /></button>
            </>
          )}
          <button onClick={() => setSelectedTopic(row)} className="btn btn-sm btn-ghost" title="Détails"><Eye size={14} /></button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Controls */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{isStudent ? 'Trouvez le sujet idéal pour votre PFE ou stage.' : 'Gérez les propositions de sujets et les candidatures.'}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(user?.role === 'SUPERVISOR' || user?.role === 'COMPANY') && (
              <button onClick={() => { setTopicToEdit(null); setIsFormModalOpen(true); }} className="btn btn-primary">
                <PlusIcon size={16} /> Nouveau sujet
              </button>
            )}
            {isStudent && (
              <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <button onClick={() => setViewMode('grid')} className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}>
                  <LayoutGrid size={16} />
                </button>
                <button onClick={() => setViewMode('list')} className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}>
                  <List size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Rechercher par titre ou technologie..."
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {['ALL', 'PFE', 'INTERNSHIP'].map(type => (
              <button 
                key={type} 
                onClick={() => setFilterType(type)}
                className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-ghost'}`}
              >
                {type === 'ALL' ? 'Tous' : type}
              </button>
            ))}
            {isStudent && (
              <button 
                onClick={() => setFilterType(filterType === 'TO_CONSULT' ? 'ALL' : 'TO_CONSULT')}
                className={`btn btn-sm ${filterType === 'TO_CONSULT' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Bookmark size={14} fill={filterType === 'TO_CONSULT' ? 'white' : 'none'} color={filterType === 'TO_CONSULT' ? 'white' : 'var(--text-muted)'} /> À consulter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isStudent && viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          <AnimatePresence>
            {filteredTopics.map(topic => (
              <motion.div key={topic.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <TopicCard 
                  topic={topic} 
                  isFavorite={favorites.includes(topic.id)} 
                  onToggleFavorite={toggleFavorite}
                  onClick={() => setSelectedTopic(topic)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card" style={{ padding: '24px' }}>
          <DataTable columns={columns} data={filteredTopics} loading={loading} />
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '450px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Rejeter le sujet</h3>
            <form onSubmit={handleRejectSubmit}>
              <textarea 
                required className="form-input" rows="4" 
                placeholder="Raison du rejet..."
                value={rejectionComment}
                onChange={e => setRejectionComment(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsRejectModalOpen(false)} className="btn btn-ghost">Annuler</button>
                <button type="submit" className="btn btn-danger">Confirmer le rejet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topic Detail Sidebar / Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="modal-overlay" onClick={() => setSelectedTopic(null)}>
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="card sidebar-modal"
              onClick={e => e.stopPropagation()}
              style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '550px', maxWidth: '100%', borderRadius: 0, padding: '48px', overflowY: 'auto', zIndex: 1000 }}
            >
              <button onClick={() => setSelectedTopic(null)} className="btn btn-ghost close-btn" style={{ top: '24px', right: '24px' }}>
                <X size={24} />
              </button>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <span className="badge" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)', fontWeight: 700 }}>{selectedTopic.type}</span>
                <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>{getLevelLabel(selectedTopic.requiredLevel)}</span>
              </div>
              
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)', lineHeight: 1.3 }}>{selectedTopic.title}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
                <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Auteur</p>
                   <p style={{ fontWeight: 600 }}>{selectedTopic.createdByName}</p>
                </div>
                <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Durée</p>
                   <p style={{ fontWeight: 600 }}>{selectedTopic.duration}</p>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DocIcon size={18} color="var(--accent-blue)" /> Description du sujet
                </h4>
                <div className="card" style={{ padding: '24px', background: 'var(--bg-secondary)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  {selectedTopic.description}
                </div>
              </div>

              <div style={{ marginBottom: '40px' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={18} color="var(--accent-purple)" /> Compétences cibles
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {selectedTopic.requiredSkills?.split(',').map((s, idx) => (
                    <span key={idx} className="badge" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', padding: '6px 14px', fontSize: '0.85rem' }}>{s.trim()}</span>
                  ))}
                </div>
              </div>

              {isStudent && selectedTopic.status === 'APPROVED' && (
                <button onClick={() => setIsApplyModalOpen(true)} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  Postuler maintenant
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isApplyModalOpen && (
        <ApplicationModal 
          topic={selectedTopic} 
          onClose={() => setIsApplyModalOpen(false)} 
          onSuccess={fetchTopics}
        />
      )}

      {isFormModalOpen && (
        <TopicFormModal 
          topic={topicToEdit} 
          onClose={() => setIsFormModalOpen(false)} 
          onSuccess={fetchTopics} 
        />
      )}
    </div>
  );
}
