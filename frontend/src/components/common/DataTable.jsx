import { Inbox, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DataTable({ columns, data, loading, emptyMessage }) {
  const { t } = useTranslation();
  const empty = emptyMessage || t('common.no_data');

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <Loader2 size={32} color="var(--accent-blue)" style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.875rem' }}>{t('common.loading')}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <Inbox size={48} color="var(--border)" style={{ marginBottom: '12px' }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{empty}</p>
        <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Items will appear here once available.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
            {columns.map((col, idx) => (
              <th key={idx} style={{
                padding: '11px 16px', textAlign: 'left',
                fontSize: '0.72rem', fontWeight: 700,
                color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.06em', whiteSpace: 'nowrap',
              }}>
                {col.header || col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map((col, colIdx) => {
                const cellValue = typeof col.accessor === 'function'
                  ? col.accessor(row)
                  : row[col.accessor || col.key];
                return (
                  <td key={colIdx} style={{
                    padding: '13px 16px', fontSize: '0.875rem',
                    color: 'var(--text-primary)', whiteSpace: 'nowrap',
                  }}>
                    {cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
