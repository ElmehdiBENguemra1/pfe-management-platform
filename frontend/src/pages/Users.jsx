import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { 
  Search, Users as UsersIcon, UserPlus, Filter, 
  MoreVertical, Shield, UserX, UserCheck, Eye, Ghost, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import UserDetailsModal from '../components/common/UserDetailsModal';

const roleBadgeColors = {
  ADMIN:      { bg: '#eff6ff', color: '#1e3a8a', border: '#bfdbfe' },
  STUDENT:    { bg: '#f0fdf4', color: '#065f46', border: '#bbf7d0' },
  SUPERVISOR: { bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' },
  COMPANY:    { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
};

export default function Users() {
  const { user: currentUser, login } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewTab, setViewTab] = useState('ACTIVE'); // 'ACTIVE' or 'DELETED'
  const [selectedUser, setSelectedUser] = useState(null);
  
  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedIds.length === 0) return;
    try {
      await API.put('/admin/users/status', { ids: selectedIds, status });
      toast.success(`Statut mis à jour pour ${selectedIds.length} utilisateurs`);
      setSelectedIds([]);
      fetchUsers();
    } catch {
      toast.error('Échec de la mise à jour groupée');
    }
  };

  const handleSingleStatusUpdate = async (id, status) => {
    try {
      await API.put('/admin/users/status', { ids: [id], status });
      toast.success('Statut mis à jour avec succès');
      fetchUsers();
    } catch {
      toast.error('Échec de la mise à jour du statut');
    }
  };

  const handleImpersonate = async (id) => {
    try {
      const res = await API.post(`/admin/users/${id}/impersonate`);
      const { token } = res.data;
      // In a real app, we might want to store the original token to "switch back"
      localStorage.setItem('original_token', localStorage.getItem('token'));
      localStorage.setItem('token', token);
      window.location.href = '/dashboard'; // Hard reload to reset context
    } catch {
      toast.error("Échec de l'impersonnification");
    }
  };

  const columns = [
    {
      header: (
        <input 
          type="checkbox" 
          onChange={(e) => setSelectedIds(e.target.checked ? users.map(u => u.id) : [])}
          checked={selectedIds.length === users.length && users.length > 0}
        />
      ),
      accessor: (row) => (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(row.id)}
          onChange={() => {
            setSelectedIds(prev => prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id]);
          }}
        />
      )
    },
    { 
      header: 'Utilisateur', 
      accessor: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '50%', 
            background: 'var(--bg-active)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700
          }}>
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{row.firstName} {row.lastName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Rôle',
      accessor: (row) => {
        const c = roleBadgeColors[row.role] || roleBadgeColors.ADMIN;
        return (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: 'uppercase' }}>
            {row.role}
          </span>
        );
      }
    },
    { header: 'Dernière Connexion', accessor: (row) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : 'Jamais' },
    { header: 'Statut', accessor: (row) => <StatusBadge status={row.status || (row.enabled ? 'ACTIVE' : 'INACTIVE')} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {viewTab === 'ACTIVE' ? (
            <>
              <button onClick={() => handleImpersonate(row.id)} title="Incarner" style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>
                <Ghost size={16} />
              </button>
              <button onClick={() => setSelectedUser(row)} title="Détails" style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>
                <Eye size={16} />
              </button>
              <button onClick={() => handleSingleStatusUpdate(row.id, 'SUSPENDED')} title="Suspendre" style={{ color: '#f59e0b', border: 'none', background: 'none', cursor: 'pointer' }}>
                <UserX size={16} />
              </button>
              <button onClick={() => handleSingleStatusUpdate(row.id, 'DELETED')} title="Supprimer" style={{ color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <button onClick={() => handleSingleStatusUpdate(row.id, 'ACTIVE')} title="Restaurer" className="btn btn-sm btn-primary">
              Restaurer
            </button>
          )}
        </div>
      )
    }
  ];

  const filteredUsers = users.filter(u => {
    if (u.id === currentUser?.id) return false; // Do not show self
    
    const inCorrectTab = viewTab === 'DELETED' ? u.status === 'DELETED' : u.status !== 'DELETED';
    if (!inCorrectTab) return false;

    const matchesSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Header */}
      <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UsersIcon size={20} color="white" />
          </div>
          <div>
            <h1 className="academic-heading" style={{ fontSize: '1.5rem', marginBottom: '2px' }}>Utilisateurs</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Gérez les comptes, les rôles et les permissions.</p>
          </div>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={16} /> Nouvel Utilisateur
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setViewTab('ACTIVE')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: viewTab === 'ACTIVE' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            color: viewTab === 'ACTIVE' ? 'var(--accent-blue)' : 'var(--text-muted)',
            fontWeight: viewTab === 'ACTIVE' ? 600 : 500
          }}
        >
          Comptes Actifs/Suspendus
        </button>
        <button 
          onClick={() => setViewTab('DELETED')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: viewTab === 'DELETED' ? '2px solid var(--accent-red)' : '2px solid transparent',
            color: viewTab === 'DELETED' ? 'var(--accent-red)' : 'var(--text-muted)',
            fontWeight: viewTab === 'DELETED' ? 600 : 500
          }}
        >
          Corbeille
        </button>
      </div>

      {/* Filters & Bulk Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Rechercher par nom, email..."
            />
          </div>
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className="form-select" style={{ maxWidth: '200px' }}>
            <option value="ALL">Tous les rôles</option>
            <option value="ADMIN">Administrateurs</option>
            <option value="STUDENT">Étudiants</option>
            <option value="SUPERVISOR">Encadrants</option>
            <option value="COMPANY">Entreprises</option>
          </select>
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ display: 'flex', gap: '8px', background: '#eff6ff', padding: '8px 16px', borderRadius: '10px', border: '1px solid #bfdbfe', alignItems: 'center' }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e40af', marginRight: '8px' }}>{selectedIds.length} sélectionnés</span>
              {viewTab === 'ACTIVE' ? (
                <>
                  <button onClick={() => handleBulkStatusUpdate('ACTIVE')} className="btn btn-sm" style={{ background: 'white', color: '#059669' }}>Activer</button>
                  <button onClick={() => handleBulkStatusUpdate('SUSPENDED')} className="btn btn-sm" style={{ background: 'white', color: '#f59e0b' }}>Suspendre</button>
                  <button onClick={() => handleBulkStatusUpdate('DELETED')} className="btn btn-sm" style={{ background: 'white', color: '#dc2626' }}>Supprimer</button>
                </>
              ) : (
                <button onClick={() => handleBulkStatusUpdate('ACTIVE')} className="btn btn-sm" style={{ background: 'white', color: '#059669' }}>Restaurer</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <DataTable columns={columns} data={filteredUsers} loading={loading} />
        </div>
      </div>

      {selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </motion.div>
  );
}
