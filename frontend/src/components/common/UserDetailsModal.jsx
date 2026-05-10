import { X, User, Briefcase, GraduationCap, MapPin, Globe, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLevelLabel } from '../../constants/levels';

export default function UserDetailsModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card"
        style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '0', background: 'var(--bg-primary)' }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Détails du Profil</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px' }}><X size={20} /></button>
        </div>
        
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Info */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: 'var(--bg-active)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px 0' }}>{user.firstName} {user.lastName}</h3>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {user.email} 
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <span className="badge" style={{ padding: '4px 10px' }}>{user.role}</span>
                {user.phone && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '12px' }}>📞 {user.phone}</span>}
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

          {/* Role Specific Details */}
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--accent-blue)" /> Informations Spécifiques
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date de création</span>
                <div style={{ fontWeight: 500 }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dernière connexion</span>
                <div style={{ fontWeight: 500 }}>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Jamais'}</div>
              </div>

              {user.role === 'STUDENT' && (
                <>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><GraduationCap size={14} style={{display:'inline', marginRight:'4px'}}/>Matricule</span>
                    <div style={{ fontWeight: 500 }}>{user.studentId || 'N/A'}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Briefcase size={14} style={{display:'inline', marginRight:'4px'}}/>Département</span>
                    <div style={{ fontWeight: 500 }}>{user.department || 'N/A'}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none', gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Niveau</span>
                    <div style={{ fontWeight: 500 }}>{getLevelLabel(user.level) || 'N/A'}</div>
                  </div>
                </>
              )}

              {user.role === 'SUPERVISOR' && (
                <>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Briefcase size={14} style={{display:'inline', marginRight:'4px'}}/>Département</span>
                    <div style={{ fontWeight: 500 }}>{user.department || 'N/A'}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Spécialité</span>
                    <div style={{ fontWeight: 500 }}>{user.specialization || 'N/A'}</div>
                  </div>
                </>
              )}

              {user.role === 'COMPANY' && (
                <>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none', gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Building size={14} style={{display:'inline', marginRight:'4px'}}/>Nom de l'entreprise</span>
                    <div style={{ fontWeight: 500 }}>{user.companyName || 'N/A'}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secteur</span>
                    <div style={{ fontWeight: 500 }}>{user.sector || 'N/A'}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Globe size={14} style={{display:'inline', marginRight:'4px'}}/>Site web</span>
                    <div style={{ fontWeight: 500 }}>{user.website ? <a href={user.website} target="_blank" rel="noreferrer" style={{color:'var(--accent-blue)'}}>{user.website}</a> : 'N/A'}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: 'none', gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><MapPin size={14} style={{display:'inline', marginRight:'4px'}}/>Adresse</span>
                    <div style={{ fontWeight: 500 }}>{user.address || 'N/A'}</div>
                  </div>
                </>
              )}
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
