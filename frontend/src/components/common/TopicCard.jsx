import { useTranslation } from 'react-i18next';
import { getLevelLabel } from '../../constants/levels';
import { Clock, User, Tag, Heart } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function TopicCard({ topic, onToggleFavorite, isFavorite, onClick }) {
  const { t } = useTranslation();

  return (
    <div className="card topic-card" onClick={onClick} style={{ 
      cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease',
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '20px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
    }}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(topic.id); }}
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 2, padding: '4px', borderRadius: '50%', transition: 'background 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Heart size={20} fill={isFavorite ? 'var(--accent-red)' : 'none'} color={isFavorite ? 'var(--accent-red)' : 'var(--text-muted)'} />
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge" style={{ 
            background: topic.type === 'PFE' ? 'var(--accent-blue-soft)' : 'var(--accent-purple-soft)', 
            color: topic.type === 'PFE' ? 'var(--accent-blue)' : 'var(--accent-purple)', 
            fontWeight: 700, fontSize: '0.7rem', padding: '6px 12px', letterSpacing: '0.5px' 
          }}>
            {topic.type}
          </span>
          <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 700, fontSize: '0.7rem', padding: '6px 12px' }}>
            {getLevelLabel(topic.requiredLevel)}
          </span>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, marginTop: '2px', paddingRight: '28px' }}>
          {topic.title}
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
          {topic.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {topic.requiredSkills?.split(',').map((skill, idx) => (
            <span key={idx} className="badge" style={{ fontSize: '0.65rem' }}>
              {skill.trim()}
            </span>
          )) || null}
        </div>

        <div style={{ 
          marginTop: 'auto', 
          padding: '16px 20px', 
          margin: 'auto -20px -20px -20px',
          borderTop: '1px solid var(--border)', 
          background: 'var(--bg-primary)',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
              <User size={12} />
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{topic.createdByName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
            <Clock size={14} color="var(--accent-blue)" />
            <span>{topic.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
