import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { Search, FolderKanban, Download, FileSpreadsheet, FileJson, LayoutGrid, List as ListIcon, User } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState(user?.role === 'STUDENT' ? 'grid' : 'list');

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast.error(t('projects.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await API.get(`/admin/export/projects/${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `projets.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Échec de l'exportation");
    }
  };

  const columns = [
    { header: 'Sujet', accessor: 'topicTitle' },
    { header: 'Étudiant', accessor: (row) => `${row.student?.firstName} ${row.student?.lastName}` },
    { header: 'Encadrant', accessor: (row) => `${row.academicSupervisor?.firstName} ${row.academicSupervisor?.lastName}` },
    { 
      header: 'Progression', 
      accessor: (row) => (
        <div style={{ width: '120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px', fontWeight: 600 }}>
            <span>{row.progress || 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${row.progress || 0}%` }}></div>
          </div>
        </div>
      )
    },
    { header: 'Statut', accessor: (row) => <StatusBadge status={row.status} /> },
    {
      header: t('common.actions'),
      accessor: (row) => (
        <button onClick={() => navigate(`/projects/${row.id}`)} className="btn btn-ghost btn-sm">
          {t('projects.view_details')}
        </button>
      )
    }
  ];

  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderKanban size={20} color="white" />
          </div>
          <div>
            <h1 className="academic-heading" style={{ fontSize: '1.5rem', marginBottom: '2px' }}>{t('projects.title')}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('projects.subtitle')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isStudent && (
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button onClick={() => setViewMode('grid')} className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}><LayoutGrid size={14} /></button>
              <button onClick={() => setViewMode('list')} className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}><ListIcon size={14} /></button>
            </div>
          )}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleExport('excel')} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button onClick={() => handleExport('csv')} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
                <Download size={16} /> CSV
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder={t('projects.search_placeholder')}
          />
        </div>
        {viewMode === 'list' ? (
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <DataTable 
              columns={columns} 
              data={projects.filter(p => 
                (p.topicTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                (`${p.student?.firstName} ${p.student?.lastName}`).toLowerCase().includes(searchQuery.toLowerCase())
              )} 
              loading={loading} 
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {projects.filter(p => 
              (p.topicTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (`${p.student?.firstName} ${p.student?.lastName}`).toLowerCase().includes(searchQuery.toLowerCase())
            ).map(project => (
              <div 
                key={project.id} className="card topic-card" onClick={() => navigate(`/projects/${project.id}`)}
                style={{ cursor: 'pointer', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span className="badge" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)', fontSize: '0.7rem', fontWeight: 700 }}>PROJET</span>
                   <StatusBadge status={project.status} />
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {project.topicTitle}
                </h3>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progression</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{project.progress || 0}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '8px' }}>
                    <div className="progress-bar-fill" style={{ width: `${project.progress || 0}%` }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                   <User size={14} />
                   <span>Encadrant: <strong>{project.academicSupervisor?.firstName} {project.academicSupervisor?.lastName}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
