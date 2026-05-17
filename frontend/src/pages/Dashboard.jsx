import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Users, Briefcase, CheckCircle, Clock, ArrowRight, 
  TrendingUp, AlertCircle, Calendar, Activity, Filter, 
  Search, Heart, Send, Plus, BookOpen, Star, FolderKanban, Bell
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import SupervisorDashboard from './SupervisorDashboard';
import CompanyDashboard from './CompanyDashboard';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [studentApps, setStudentApps] = useState([]);
  const [studentProject, setStudentProject] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    if (!user) return;
    
    if (user.role === 'STUDENT') {
      fetchStudentDashboardData();
    } else if (user.role === 'ADMIN') {
      fetchAdminDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes] = await Promise.all([
        API.get('/dashboard/stats'),
        API.get('/admin/audit-logs?limit=6')
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data || []);
    } catch {
      toast.error('Erreur lors du chargement des stats admin');
    } finally {
      setLoading(false);
    }
  };

  const handleExploreInvitation = async (inv) => {
    try {
      await API.delete(`/notifications/${inv.id}`);
      setInvitations(prev => prev.filter(n => n.id !== inv.id));
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
    }

    let query = '';
    let isCompany = false;
    if (inv.content.startsWith("L'entreprise ")) {
      query = inv.content.split("L'entreprise ")[1]?.split(" vous invite")[0] || '';
      isCompany = true;
    } else if (inv.content.startsWith("L'encadrant ")) {
      query = inv.content.split("L'encadrant ")[1]?.split(" vous invite")[0] || '';
    }
    
    if (!query) {
      const match = inv.content.match(/"([^"]+)"/);
      query = match ? match[1] : '';
    }

    navigate('/topics', { 
      state: { 
        initialSearch: query,
        initialFilter: isCompany ? 'INTERNSHIP' : 'ALL'
      } 
    });
  };

  const fetchStudentDashboardData = async () => {
    try {
      setLoading(true);
      const [appsRes, projectsRes, topicsRes, notifsRes] = await Promise.all([
        API.get('/applications'),
        API.get('/projects'),
        API.get('/topics'),
        API.get('/notifications')
      ]);
      setStudentApps(appsRes.data || []);
      const myProject = projectsRes.data?.find?.(p => p.student?.id === user?.id) || null;
      setStudentProject(myProject);
      setRecommendations(topicsRes.data?.slice(0, 3) || []);

      const filteredInvites = (notifsRes.data || []).filter(n => 
        n.content?.toLowerCase().includes('invite') || 
        n.content?.toLowerCase().includes('invitation')
      );
      setInvitations(filteredInvites);
    } catch (err) {
      console.error('Student Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="loading-state">Initialisation...</div>;
  if (user.role === 'SUPERVISOR') return <SupervisorDashboard />;
  if (user.role === 'COMPANY') return <CompanyDashboard />;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
    </div>
  );

  // --- STUDENT VIEW ---
  if (user.role === 'STUDENT') {
    const latestApp = studentApps.length > 0 ? studentApps[0] : null;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="academic-heading" style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Mon Espace PFE</h1>
            <p style={{ color: 'var(--text-muted)' }}>Bienvenue, <strong>{user.firstName}</strong>. Suivez l'avancement de vos stages.</p>
          </div>
          <Link to="/topics" className="btn btn-primary">
            <Search size={16} /> Explorer les sujets
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {studentProject ? (
              <div className="card topic-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-blue)', cursor: 'pointer' }} onClick={() => navigate(`/projects/${studentProject.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                   <span className="badge" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)', fontSize: '0.7rem', fontWeight: 700 }}>PROJET ACTIF</span>
                   <StatusBadge status={studentProject.status} />
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>{studentProject.topicTitle || 'Projet en cours'}</h4>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Progression globale</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{studentProject.progress || 0}%</span>
                </div>
                <div className="progress-bar" style={{ height: '10px' }}>
                  <div className="progress-bar-fill" style={{ width: `${studentProject.progress || 0}%` }}></div>
                </div>
              </div>
            ) : latestApp ? (
              <div className="card topic-card" style={{ padding: '24px', cursor: 'pointer' }} onClick={() => navigate('/applications')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 700 }}>DERNIÈRE CANDIDATURE</span>
                  <StatusBadge status={latestApp.status} />
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>{latestApp.topicTitle || 'Sans titre'}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Soumis le {latestApp.applicationDate ? new Date(latestApp.applicationDate).toLocaleDateString() : 'Date inconnue'}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <BookOpen size={48} color="var(--accent-blue-soft)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>Aucune candidature active</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Commencez par explorer les sujets proposés par les encadrants.</p>
                <Link to="/topics" className="btn btn-primary" style={{ margin: '0 auto' }}>Voir le catalogue</Link>
              </div>
            )}

            {invitations.length > 0 && (
              <div className="card animate-fade-in" style={{ padding: '24px', borderLeft: '4px solid var(--accent-yellow)', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', margin: 0 }}>
                  <Bell size={18} color="var(--accent-yellow)" style={{ animation: 'pulse 2s infinite' }} /> Invitations à postuler ({invitations.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {invitations.map(inv => (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '0.85rem', margin: 0, flex: 1, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{inv.content}</p>
                      <button onClick={() => handleExploreInvitation(inv)} className="btn btn-xs btn-primary" style={{ marginLeft: '16px', fontSize: '0.7rem' }}>Explorer</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '12px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={20} color="var(--accent-yellow)" fill="var(--accent-yellow)" /> Suggestions pour vous
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {recommendations.slice(0, 3).map(rec => (
                  <div key={rec.id} className="card" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => navigate('/topics')}>
                    <h5 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{rec.title}</h5>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.type} • {rec.domain}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>Raccourcis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <Link to="/topics" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Search size={16}/> Catalogue des sujets</Link>
                   <Link to="/applications" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><FileText size={16}/> Mes candidatures</Link>
                   <Link to="/profile" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Users size={16}/> Mon Profil & CV</Link>
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- ADMIN VIEW ---
  const registrationData = stats ? Object.entries(stats.registrationTrend || {}).map(([date, count]) => ({
    date: date.split('-').slice(1).join('/'),
    count
  })) : [];

  const applicationData = stats ? Object.entries(stats.applicationTrend || {}).map(([date, count]) => ({
    date: date.split('-').slice(1).join('/'),
    count
  })) : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="academic-heading" style={{ fontSize: '1.75rem', marginBottom: '4px' }}>{t('dashboard.admin_console')}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.platform_management')}</p>
        </div>
        <button onClick={fetchAdminDashboardData} className="btn btn-ghost" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
          <Activity size={16} style={{marginRight: '8px'}}/> {t('dashboard.refresh_data')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label={t('dashboard.total_users')} value={stats?.totalUsers || 0} icon={Users} color="#1e3a8a" />
        <StatCard label={t('dashboard.proposed_topics')} value={stats?.totalTopics || 0} icon={FileText} color="#7c3aed" />
        <StatCard label={t('common.applications')} value={stats?.totalApplications || 0} icon={Filter} color="#d97706" />
        <StatCard label={t('dashboard.active_projects')} value={stats?.activeProjects || 0} icon={Briefcase} color="#059669" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
             <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <TrendingUp size={18} color="var(--accent-blue)" /> {t('dashboard.activity_trends')}
             </h3>
             <div style={{ height: '300px' }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={registrationData}>
                   <defs>
                     <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                     </linearGradient>Reg
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                   <XAxis dataKey="date" tick={{fontSize: 12}} />
                   <YAxis tick={{fontSize: 12}} />
                   <Tooltip />
                   <Area type="monotone" dataKey="count" stroke="#1e3a8a" fillOpacity={1} fill="url(#colorReg)" name={t('auth.signing_in')} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
             <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '16px' }}>{t('dashboard.topic_status')}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('dashboard.approved')}</span>
                      <span style={{ fontWeight: 600 }}>{stats?.approvedTopics || 0}</span>
                   </div>
                   <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
                      <div style={{ width: `${(stats?.approvedTopics/stats?.totalTopics)*100 || 0}%`, height: '100%', background: 'var(--accent-green)', borderRadius: '3px' }}></div>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('dashboard.pending')}</span>
                      <span style={{ fontWeight: 600 }}>{stats?.pendingTopics || 0}</span>
                   </div>
                   <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
                      <div style={{ width: `${(stats?.pendingTopics/stats?.totalTopics)*100 || 0}%`, height: '100%', background: 'var(--accent-yellow)', borderRadius: '3px' }}></div>
                   </div>
                </div>
             </div>
             <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '16px' }}>{t('dashboard.project_status')}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('dashboard.completed')}</span>
                      <span style={{ fontWeight: 600 }}>{stats?.completedProjects || 0}</span>
                   </div>
                   <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
                      <div style={{ width: `${(stats?.completedProjects/stats?.totalProjects)*100 || 0}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: '3px' }}></div>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('dashboard.archived')}</span>
                      <span style={{ fontWeight: 600 }}>{stats?.archivedProjects || 0}</span>
                   </div>
                   <div style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
                      <div style={{ width: `${(stats?.archivedProjects/stats?.totalProjects)*100 || 0}%`, height: '100%', background: 'var(--text-muted)', borderRadius: '3px' }}></div>
                   </div>
                </div>
             </div>
          </div>

          {stats?.anomalies?.length > 0 && (
            <div className="card" style={{ padding: '24px', border: '1px solid #fee2e2', background: '#fef2f2' }}>
               <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <AlertCircle size={18} /> {t('dashboard.anomalies_alerts')}
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.anomalies.map((anom, i) => (
                    <div key={i} style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#991b1b' }}>{anom.type}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{anom.message}</div>
                       </div>
                       <button className="btn btn-sm btn-ghost" style={{ color: 'var(--accent-blue)' }} onClick={() => navigate(`/${anom.entityType.toLowerCase()}s`)}>{t('common.view')}</button>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
             <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>{t('dashboard.quick_actions')}</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link to="/users" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Users size={16}/> {t('common.users')}</Link>
                <Link to="/topics" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><FileText size={16}/> {t('common.topics')}</Link>
                <Link to="/applications" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Filter size={16}/> {t('common.applications')}</Link>
                <Link to="/export" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Activity size={16}/> Rapports & Exports</Link>
             </div>
          </div>

          <div className="card" style={{ padding: '24px', flex: 1 }}>
             <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--accent-blue)" /> {t('dashboard.recent_activity')}
             </h3>
             <div className="activity-feed" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {logs.length > 0 ? logs.map((log, i) => (
                 <div key={i} style={{ borderLeft: '2px solid var(--border)', paddingLeft: '16px', position: 'relative' }}>
                   <div style={{ position: 'absolute', left: '-5px', top: '0', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border)' }}></div>
                   <p style={{ fontSize: '0.85rem', margin: '0 0 4px 0', lineHeight: 1.4 }}>
                     <strong style={{ color: 'var(--text-primary)' }}>{log.user?.firstName}</strong> {log.details}
                   </p>
                   <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
                 </div>
               )) : (
                 <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>{t('common.no_activity')}</p>
               )}
             </div>
             {logs.length > 0 && (
               <button className="btn btn-sm btn-ghost" style={{ marginTop: '20px', width: '100%' }}>{t('dashboard.all_logs')}</button>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
