import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, CheckCircle, Clock, FileText, Send, 
  Upload, User, MessageSquare, ChevronRight, AlertCircle, 
  Download, Plus, Edit3, Trash2, Check, X, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export default function ProjectWorkspaceSupervisor() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [revisionComment, setRevisionComment] = useState('');
  const chatContainerRef = useRef(null);
  const stompClientRef = useRef(null);
  
  const [docPreviewUrl, setDocPreviewUrl] = useState(null);

  // Grading state
  const [grades, setGrades] = useState({
    report: 0, presentation: 0, technical: 0, attendance: 0, comment: ''
  });

  useEffect(() => {
    fetchProject();
    fetchMessages();
    
    // WebSocket setup
    const token = localStorage.getItem('token');
    const socket = new SockJS('http://localhost:8085/ws-chat');
    const stompClient = Stomp.over(socket);
    stompClient.debug = () => {};
    
    stompClient.connect({ 'Authorization': `Bearer ${token}` }, () => {
      stompClient.subscribe(`/topic/project/${id}`, (sdkEvent) => {
        const msg = JSON.parse(sdkEvent.body);
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (msg.senderId && msg.senderId !== user.id) {
          API.patch(`/messages/${msg.id}/read`).catch(() => {});
        }
      });

      stompClient.subscribe(`/topic/project/${id}/read`, (sdkEvent) => {
        const updatedMsg = JSON.parse(sdkEvent.body);
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      });
    });

    stompClientRef.current = stompClient;

    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect();
      }
    };
  }, [id, user.id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedDoc) {
      toast.loading('Chargement du document...', { id: 'preview' });
      API.get(`/documents/${selectedDoc.id}/download`, { responseType: 'blob' })
        .then(res => {
          setDocPreviewUrl(window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' })));
          toast.success('Prêt', { id: 'preview' });
        })
        .catch(() => {
          toast.error('Erreur de chargement', { id: 'preview' });
        });
    } else {
      if (docPreviewUrl) {
        window.URL.revokeObjectURL(docPreviewUrl);
        setDocPreviewUrl(null);
      }
    }
  }, [selectedDoc]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/projects/${id}`);
      setProject(res.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/projects/${id}/messages?page=0&size=50`);
      setMessages(res.data.content.reverse());

      res.data.content.forEach(msg => {
        if (msg.senderId && msg.senderId !== user.id && (!msg.readBy || !msg.readBy.includes(user.id))) {
          API.patch(`/messages/${msg.id}/read`).catch(() => {});
        }
      });
    } catch { /* silent */ }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || user.role === 'ADMIN') return;
    try {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.send(`/app/project/${id}/chat`, {}, JSON.stringify({
          content: newMessage,
          type: 'TEXT'
        }));
        setNewMessage('');
      } else {
        toast.error("Connexion chat perdue");
      }
    } catch {
      toast.error('Erreur d\'envoi');
    }
  };

  const handleDownloadDoc = async (docId, fileName) => {
    try {
      toast.loading('Téléchargement...', { id: 'dl' });
      const res = await API.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Téléchargé', { id: 'dl' });
    } catch {
      toast.error('Erreur de téléchargement', { id: 'dl' });
    }
  };

  const handleReviewDoc = async (docId, status) => {
    try {
      await API.put(`/documents/${docId}/review`, { status, comment: revisionComment });
      toast.success(status === 'VALIDATED' ? 'Document validé' : 'Demande de révision envoyée');
      setRevisionComment('');
      setSelectedDoc(null);
      fetchProject();
    } catch {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/projects/${id}/grade`, grades);
      toast.success('Évaluation finale soumise ! Projet clôturé.');
      setIsEvaluationModalOpen(false);
      fetchProject();
    } catch {
      toast.error('Erreur lors de la soumission');
    }
  };

  if (loading || !project) return <div className="loading-state">Chargement du workspace...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', height: 'calc(100vh - 120px)' }}>
      
      <div style={{ overflowY: 'auto', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Project Header */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className={`badge ${project.status.toLowerCase()}`}>{project.status}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: #{project.id}</span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>{project.topicTitle}</h1>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14}/> Étudiant: <strong>{project.student?.firstName} {project.student?.lastName}</strong></span>
              </div>
            </div>
            <button onClick={() => setIsEvaluationModalOpen(true)} className="btn btn-primary" disabled={project.status === 'COMPLETED'}>
              <Award size={18} /> Évaluation finale
            </button>
          </div>
        </div>

        {/* Milestones Management */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
             <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="var(--accent-blue)" /> Jalons & Échéances
             </h2>
             <button onClick={() => toast.success('Milestone creation next step')} className="btn btn-sm btn-ghost"><Plus size={16} /> Ajouter un jalon</button>
          </div>
          <div className="timeline">
            {project.milestones?.map((m) => (
              <div key={m.id} className="timeline-item">
                <div className={`timeline-dot ${m.status === 'COMPLETED' ? 'completed' : ''}`}></div>
                <div className="timeline-content card" style={{ padding: '16px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontWeight: 600 }}>{m.title}</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                       <button className="btn btn-sm btn-ghost"><Edit3 size={14}/></button>
                       <button className="btn btn-sm btn-ghost"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents Review */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="var(--accent-blue)" /> Documents à valider
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {project.documents?.map(doc => (
              <div key={doc.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: doc.status === 'PENDING' ? 'var(--bg-primary)' : 'var(--bg-secondary)', border: doc.status === 'PENDING' ? '1px solid var(--accent-blue)' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} color="var(--text-muted)" />
                   </div>
                   <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{doc.fileName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Soumis le {new Date(doc.uploadedAt).toLocaleDateString()} • <span className={`badge ${doc.status.toLowerCase()}`}>{doc.status}</span></div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <button onClick={() => handleDownloadDoc(doc.id, doc.fileName)} className="btn btn-sm btn-ghost"><Download size={16} /></button>
                   <button onClick={() => setSelectedDoc(doc)} className="btn btn-sm btn-ghost"><Eye size={16} /> Voir</button>
                   {doc.status === 'PENDING' && (
                     <>
                        <button onClick={() => handleReviewDoc(doc.id, 'VALIDATED')} className="btn btn-sm btn-success"><Check size={16} /></button>
                        <button onClick={() => { setSelectedDoc(doc); setRevisionComment(''); }} className="btn btn-sm btn-danger"><X size={16} /></button>
                     </>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sidebar: Chat */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--accent-blue)" /> Discussion Projet
          </h3>
        </div>
        <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(msg => {
            const isMe = msg.senderId === user.id;
            const isSystem = msg.type === 'SYSTEM' || msg.type === 'DOCUMENT_REF' || msg.type === 'MILESTONE_REF';
            
            if (isSystem) {
              return (
                <div key={msg.id} style={{ alignSelf: 'center', margin: '10px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ 
                    background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '20px', 
                    fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    {msg.type === 'DOCUMENT_REF' && <FileText size={14} />}
                    {msg.type === 'MILESTONE_REF' && <CheckCircle size={14} />}
                    {msg.type === 'SYSTEM' && <AlertCircle size={14} />}
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textAlign: isMe ? 'right' : 'left' }}>
                  {!isMe && <span style={{ fontWeight: 600, marginRight: '6px', color: 'var(--accent-blue)' }}>{msg.senderRole}</span>}
                  {msg.senderName} • {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ 
                  padding: '10px 14px', borderRadius: '12px', fontSize: '0.9rem', lineHeight: 1.4,
                  background: isMe ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                  color: isMe ? 'white' : 'var(--text-primary)',
                  borderTopRightRadius: isMe ? '2px' : '12px',
                  borderTopLeftRadius: isMe ? '12px' : '2px',
                }}>
                  {msg.content}
                </div>
                {isMe && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                    {msg.readBy && msg.readBy.length > 0 ? (
                      <span style={{ color: 'var(--accent-green)' }}><CheckCircle size={10} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }}/> Lu</span>
                    ) : (
                      <span>Envoyé</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {user.role !== 'ADMIN' && (
          <form onSubmit={handleSendMessage} style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                className="form-input" 
                placeholder="Message..."
                style={{ paddingRight: '45px' }}
              />
              <button type="submit" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)' }}>
                <Send size={20} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Evaluation Modal */}
      {isEvaluationModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
             <h3 style={{ fontWeight: 700, marginBottom: '24px' }}>Évaluation finale du projet</h3>
             <form onSubmit={handleSubmitEvaluation}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                   <div className="form-group">
                      <label className="form-label">Note Rapport (/20)</label>
                      <input type="number" step="0.5" className="form-input" value={grades.report} onChange={e => setGrades({...grades, report: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label className="form-label">Présentation (/20)</label>
                      <input type="number" step="0.5" className="form-input" value={grades.presentation} onChange={e => setGrades({...grades, presentation: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label className="form-label">Technique (/20)</label>
                      <input type="number" step="0.5" className="form-input" value={grades.technical} onChange={e => setGrades({...grades, technical: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label className="form-label">Assiduité (/20)</label>
                      <input type="number" step="0.5" className="form-input" value={grades.attendance} onChange={e => setGrades({...grades, attendance: e.target.value})} />
                   </div>
                </div>
                <div className="form-group">
                   <label className="form-label">Commentaire global</label>
                   <textarea className="form-input" rows="3" value={grades.comment} onChange={e => setGrades({...grades, comment: e.target.value})} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                   <button type="button" onClick={() => setIsEvaluationModalOpen(false)} className="btn btn-ghost">Annuler</button>
                   <button type="submit" className="btn btn-primary">Valider la note finale</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Doc Preview / Review Modal */}
      {selectedDoc && (
        <div className="modal-overlay">
           <div className="modal-content card" style={{ maxWidth: '900px', width: '90%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                 <h3 style={{ fontWeight: 700 }}>Révision : {selectedDoc.fileName}</h3>
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <button onClick={() => handleDownloadDoc(selectedDoc.id, selectedDoc.fileName)} className="btn btn-ghost"><Download size={20}/></button>
                   <button onClick={() => setSelectedDoc(null)} className="btn btn-ghost"><X size={20}/></button>
                 </div>
              </div>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {docPreviewUrl ? (
                   <iframe src={docPreviewUrl} width="100%" height="100%" style={{ border: 'none' }} title="PDF Preview" />
                 ) : (
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                 )}
              </div>
              <div className="form-group">
                 <label className="form-label">Commentaire de révision (si rejet)</label>
                 <textarea className="form-input" rows="2" value={revisionComment} onChange={e => setRevisionComment(e.target.value)} placeholder="Indiquez les corrections nécessaires..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                 <button onClick={() => handleReviewDoc(selectedDoc.id, 'REVISION_REQUESTED')} className="btn btn-danger">Demander révision</button>
                 <button onClick={() => handleReviewDoc(selectedDoc.id, 'VALIDATED')} className="btn btn-success">Valider le document</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function Eye({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
