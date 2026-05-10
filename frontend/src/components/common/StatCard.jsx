export default function StatCard({ icon: Icon, label, value, color = 'var(--accent-blue)' }) {
  const iconBg = color.startsWith('#')
    ? color + '18'
    : 'rgba(30, 58, 138, 0.08)';

  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'border-color 0.2s ease',
      cursor: 'default',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px',
        background: iconBg, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: color,
      }}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: color, lineHeight: 1, marginBottom: '4px' }}>
          {value ?? 0}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          {label}
        </div>
      </div>
    </div>
  );
}
