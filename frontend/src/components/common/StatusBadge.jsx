import { formatStatus } from '../../utils/helpers';

const colorMap = {
  PENDING:     { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  ACCEPTED:    { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  APPROVED:    { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  REJECTED:    { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  IN_PROGRESS: { bg: '#eff6ff', color: '#1e3a8a', border: '#bfdbfe' },
  COMPLETED:   { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  NOT_STARTED: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  ACTIVE:      { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  INACTIVE:    { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  LATE:        { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  VALIDATED:   { bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' },
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const c = colorMap[status] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '5px',
      fontSize: '0.7rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {formatStatus(status)}
    </span>
  );
}
