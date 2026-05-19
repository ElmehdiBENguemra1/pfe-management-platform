import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, CheckCircle, Clock, FileText, Send, 
  Upload, User, MessageSquare, ChevronRight, AlertCircle, 
  Download, Plus, PenTool, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import API from '../api/axios';
import toast from 'react-hot-toast';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export default function ProjectWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, documents, chat, evaluation, agreement
  const chatContainerRef = useRef(null);
  const stompClientRef = useRef(null);
  
  const [companyGrade, setCompanyGrade] = useState(0);
  const [companyComment, setCompanyComment] = useState('');

  useEffect(() => {
    fetchProject();
    fetchMessages();
    
    // WebSocket setup
    const token = localStorage.getItem('token');
    const socket = new SockJS('http://localhost:8085/ws-chat');
    const stompClient = Stomp.over(socket);
    stompClient.debug = () => {}; // Disable debug logging
    
    stompClient.connect({ 'Authorization': `Bearer ${token}` }, () => {
      stompClient.subscribe(`/topic/project/${id}`, (sdkEvent) => {
        const msg = JSON.parse(sdkEvent.body);
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        
        // Mark as read if not sender
        if (msg.senderId && msg.senderId !== user.id) {
          API.patch(`/messages/${msg.id}/read`).catch(() => {});
        }
      });

      // Subscribe to read receipts
      stompClient.subscribe(`/topic/project/${id}/read`, (sdkEvent) => {
        const updatedMsg = JSON.parse(sdkEvent.body);
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      });
    });

    // Save stompClient to ref if needed to send messages
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

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/projects/${id}`);
      setProject(res.data);
    } catch {
      toast.error(t('project_details.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/projects/${id}/messages?page=0&size=50`);
      // Reverse because backend returns descending (newest first)
      setMessages(res.data.content.reverse());
      
      // Mark all fetched unread messages as read
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
    } catch (err) {
      toast.error(t('project_details.send_error'));
    }
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'REPORT'); // Default to REPORT, or add a selector

    try {
      toast.loading(t('project_details.uploading_doc'), { id: 'upload' });
      await API.post(`/projects/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('project_details.doc_deposited'), { id: 'upload' });
      fetchProject();
    } catch (err) {
      toast.error(t('project_details.deposit_error'), { id: 'upload' });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    maxSize: 20 * 1024 * 1024,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
  });

  const handleSignAgreement = async () => {
    try {
      await API.post(`/projects/${id}/agreement/sign`);
      toast.success(t('project_details.agreement_signed'));
      fetchProject();
    } catch {
      toast.error(t('project_details.sign_error'));
    }
  };

  const student = project?.student;
  const academic = project?.academicSupervisor;
  const company = project?.companySupervisor;

  const handleCompleteMilestone = async (milestoneId) => {
    try {
      await API.patch(`/milestones/${milestoneId}/complete`);
      toast.success(t('project_details.milestone_updated'));
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || t('applications.update_error'));
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/projects/${id}/evaluation/company`, { grade: companyGrade, comment: companyComment });
      toast.success(t('project_details.evaluation_saved'));
      fetchProject();
    } catch {
      toast.error(t('project_details.save_error'));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
    </div>
  );
  if (!project) return <div className="card" style={{ padding: '40px', textAlign: 'center' }}>{t('project_details.project_not_found')}</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', height: 'calc(100vh - 120px)' }}>
      
      {/* Main Content: Timeline & Documents */}
      <div style={{ overflowY: 'auto', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Project Overview Card */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{project.topicTitle || project.title}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="var(--accent-blue)"/> {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'En cours'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} color="var(--accent-blue)"/> {academic?.firstName} {academic?.lastName} ({t('projects.supervisor')})</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)', lineHeight: 1 }}>{project.progress}%</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', fontWeight: 600 }}>Progression</div>
            </div>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-blue), #60a5fa)', borderRadius: '4px' }}
            ></motion.div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
             <button onClick={() => setActiveTab('overview')} className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}>{t('project_details.workspace_dashboard')}</button>
             <button onClick={() => setActiveTab('agreement')} className={`btn btn-sm ${activeTab === 'agreement' ? 'btn-primary' : 'btn-ghost'}`}><PenTool size={14} style={{marginRight: '6px'}}/> {t('project_details.agreement')}</button>
             {user.role === 'COMPANY' && project.topic?.type === 'INTERNSHIP' && project.company?.user?.id === user.id && (
               <button onClick={() => setActiveTab('evaluation')} className={`btn btn-sm ${activeTab === 'evaluation' ? 'btn-primary' : 'btn-ghost'}`}><Award size={14} style={{marginRight: '6px'}}/> {t('project_details.evaluation')}</button>
             )}
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Milestones Timeline */}
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <CheckCircle size={20} color="var(--accent-blue)" /> {t('project_details.timeline')}
              </h2>
              <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border)', marginLeft: '10px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {project.milestones?.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>{t('project_details.no_milestones')}</p>
                )}
                {project.milestones?.map((m, idx) => {
                  const isPast = new Date(m.dueDate) < new Date() && m.status !== 'COMPLETED';
                  const isCompleted = m.status === 'COMPLETED';
                  return (
                    <div key={m.id} style={{ position: 'relative' }}>
                      <div style={{ 
                        position: 'absolute', left: '-31px', top: '0', width: '20px', height: '20px', borderRadius: '50%', 
                        background: isCompleted ? 'var(--accent-green)' : isPast ? 'var(--accent-red)' : 'white',
                        border: `4px solid ${isCompleted ? 'var(--accent-green-soft)' : isPast ? 'var(--accent-red-soft)' : 'var(--border)'}`,
                        zIndex: 2
                      }}></div>
                      
                      <div className="card" style={{ 
                        padding: '20px', background: isCompleted ? 'var(--bg-primary)' : isPast ? '#fffafb' : 'var(--bg-primary)', 
                        border: isPast ? '1px solid var(--accent-red-soft)' : '1px solid var(--border)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'transform 0.2s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{m.title}</h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: 'var(--bg-secondary)', color: isPast ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                            {t('project_details.deadline')}: {new Date(m.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>{m.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <span className={`badge ${m.status.toLowerCase()}`} style={{ fontSize: '0.75rem' }}>{m.status}</span>
                           {user.role === 'STUDENT' && m.status !== 'COMPLETED' && (
                             <button 
                               onClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 handleCompleteMilestone(m.id);
                               }}
                               className="btn btn-sm" 
                               style={{ background: 'var(--accent-green-soft)', color: 'var(--accent-green)', border: 'none' }}
                             >
                               {t('project_details.mark_done')}
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents Section */}
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <FileText size={20} color="var(--accent-blue)" /> {t('project_details.deliverables')}
              </h2>
              
              {user.role === 'STUDENT' && (
                <div {...getRootProps()} style={{
                  border: '2px dashed var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', marginBottom: '24px',
                  background: isDragActive ? 'var(--bg-secondary)' : 'transparent', transition: 'all 0.2s'
                }}>
                  <input {...getInputProps()} />
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Upload size={24} />
                  </div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{t('project_details.drop_new')}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('project_details.max_size')}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {project.documents?.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center' }}>{t('project_details.no_documents')}</p>
                )}
                {project.documents?.map(doc => (
                  <div key={doc.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', background: 'white', color: 'var(--accent-red)' }}>
                        <FileText size={20} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{doc.fileName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button className="btn btn-icon" style={{ color: 'var(--accent-blue)' }} onClick={async () => {
                      try {
                        toast.loading('Téléchargement...', { id: 'dl' });
                        const res = await API.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', doc.fileName);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        toast.success('Téléchargé', { id: 'dl' });
                      } catch {
                        toast.error('Erreur de téléchargement', { id: 'dl' });
                      }
                    }}>
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'agreement' && (
          <div className="card" style={{ padding: '24px' }}>
             <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PenTool size={20} color="var(--accent-blue)" /> {t('project_details.agreement_tracking')}
             </h2>
             <div className="card" style={{ background: 'var(--bg-secondary)', padding: '24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '32px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: project.agreementStatus === 'PENDING' ? 'var(--bg-primary)' : 'var(--accent-green)', color: project.agreementStatus === 'PENDING' ? 'var(--text-muted)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border)' }}>
                         {project.agreementStatus === 'PENDING' ? '1' : <CheckCircle size={24}/>}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('project_details.generation')}</span>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: (project.agreementStatus === 'STUDENT_SIGNED' || project.agreementStatus === 'COMPLETED') ? 'var(--accent-green)' : 'var(--bg-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border)' }}>
                        {(project.agreementStatus === 'STUDENT_SIGNED' || project.agreementStatus === 'COMPLETED') ? <CheckCircle size={24}/> : '2'}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('project_details.student_signature')}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: project.agreementStatus === 'COMPLETED' ? 'var(--accent-green)' : 'var(--bg-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border)' }}>
                         {project.agreementStatus === 'COMPLETED' ? <CheckCircle size={24}/> : '3'}
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {project.companySupervisor != null ? t('project_details.company_signature') : "Signature de l'encadrant"}
                      </span>
                   </div>
                </div>
                
                <p style={{ marginBottom: '24px', fontSize: '0.95rem' }}>{t('project_details.current_status')} : <strong>{project.agreementStatus}</strong></p>
                
                {((user.role === 'STUDENT' && project.student?.id === user.id && project.agreementStatus === 'PENDING') || 
                  (user.role === 'COMPANY' && project.companySupervisor?.id === user.id && project.agreementStatus === 'STUDENT_SIGNED') ||
                  (user.role === 'SUPERVISOR' && project.academicSupervisor?.id === user.id && project.agreementStatus === 'STUDENT_SIGNED')) && (
                  <button onClick={handleSignAgreement} className="btn btn-primary btn-lg">{t('project_details.sign_digital')}</button>
                )}
             </div>
          </div>
        )}

        {activeTab === 'evaluation' && user.role === 'COMPANY' && project.topic?.type === 'INTERNSHIP' && project.company?.user?.id === user.id && (
          <div className="card" style={{ padding: '24px' }}>
             <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={20} color="var(--accent-blue)" /> {t('project_details.trainee_evaluation')}
             </h2>
             <form onSubmit={handleSaveEvaluation}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                   <label className="form-label">{t('project_details.recommended_grade')}</label>
                   <input type="number" step="0.5" className="form-input" value={companyGrade} onChange={e => setCompanyGrade(e.target.value)} />
                </div>
                <div className="form-group">
                   <label className="form-label">{t('project_details.pro_appreciation')}</label>
                   <textarea className="form-input" rows="5" value={companyComment} onChange={e => setCompanyComment(e.target.value)} placeholder={t('project_details.placeholder_evaluation')} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }}>{t('project_details.save_evaluation')}</button>
             </form>
          </div>
        )}
      </div>

      {/* Sidebar: Chat */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--accent-blue)" /> {t('project_details.project_discussion')}
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
          <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                className="form-input" 
                placeholder={t('project_details.type_message')}
                style={{ paddingRight: '45px' }}
              />
              <button type="submit" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)' }}>
                <Send size={20} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
