import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, Users, Briefcase, CheckCircle, Clock, 
  AlertCircle, Activity, Filter, Plus, PieChart, 
  CheckSquare, ArrowRight, TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import StatCard from '../components/common/StatCard';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get('/supervisor/stats');
      setStats(res.data);
    } catch {
      toast.error('Erreur de chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
    </div>
  );

  const workloadColor = stats.workload > 80 ? 'var(--accent-red)' : stats.workload > 50 ? 'var(--accent-yellow)' : 'var(--accent-green)';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="academic-heading" style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Tableau de bord Encadrant</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez vos sujets et suivez vos étudiants en temps réel.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/topics" className="btn btn-primary"><Plus size={16} /> Nouveau sujet</Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Sujets Approuvés" value={stats.activeTopics} icon={FileText} color="var(--accent-blue)" />
        <StatCard label="Sujets en attente" value={stats.pendingTopics} icon={Clock} color="var(--accent-yellow)" />
        <StatCard label="Candidatures à traiter" value={stats.pendingApplications} icon={Filter} color="var(--accent-red)" />
        <StatCard label="Projets en cours" value={stats.activeProjects} icon={Briefcase} color="var(--accent-green)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Workload Gauge */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} color="var(--accent-blue)" /> Charge de supervision
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Projets actifs: <strong>{stats.activeProjects}</strong> / {stats.capacity}</span>
                  <span style={{ fontWeight: 700, color: workloadColor }}>{stats.workload.toFixed(0)}%</span>
                </div>
                <div className="progress-bar" style={{ height: '12px', background: 'var(--bg-secondary)' }}>
                  <div className="progress-bar-fill" style={{ width: `${stats.workload}%`, background: workloadColor }}></div>
                </div>
              </div>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `8px solid ${workloadColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: workloadColor }}>
                {stats.activeProjects}/{stats.capacity}
              </div>
            </div>
            <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {stats.workload > 80 ? 'Attention : Vous approchez de votre capacité maximale.' : 'Votre charge de travail est optimale.'}
            </p>
          </div>

          {/* Quick Tasks / Notifications */}
          <div className="card" style={{ padding: '24px' }}>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Alertes Prioritaires</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.pendingApplications > 0 && (
                  <div className="card activity-item" style={{ borderLeft: '4px solid var(--accent-red)', background: 'var(--bg-secondary)' }} onClick={() => navigate('/applications')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AlertCircle size={20} color="var(--accent-red)" />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{stats.pendingApplications} candidatures non traitées</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Certaines demandes attendent depuis plus de 3 jours.</p>
                      </div>
                    </div>
                    <ArrowRight size={16} />
                  </div>
                )}
                <div className="card activity-item" style={{ borderLeft: '4px solid var(--accent-blue)', background: 'var(--bg-secondary)' }} onClick={() => navigate('/projects')}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckSquare size={20} color="var(--accent-blue)" />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Documents à valider</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vérifiez les derniers rapports déposés par vos étudiants.</p>
                      </div>
                   </div>
                   <ArrowRight size={16} />
                </div>
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Raccourcis rapides</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <Link to="/topics" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Plus size={16} /> Créer un sujet</Link>
                 <Link to="/applications" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Filter size={16} /> Candidatures reçues</Link>
                 <Link to="/projects" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Briefcase size={16} /> Mes projets encadrés</Link>
              </div>
           </div>
           
           <div className="card" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Besoin d'aide pour évaluer un candidat ? Utilisez le <strong>Score IA</strong> dans la gestion des candidatures.
              </p>
           </div>
        </div>

      </div>
    </motion.div>
  );
}
