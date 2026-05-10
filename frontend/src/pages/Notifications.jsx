import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const { t } = useTranslation();

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch {
      toast.error('Failed to load notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { toast.error('Failed'); }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch { toast.error('Failed'); }
  };

  const deleteNotification = (id) => setNotifications(notifications.filter(n => n.id !== id));

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={20} color="white" />
          </div>
          <div>
            <h1 className="academic-heading" style={{ fontSize: '1.5rem', marginBottom: '2px' }}>{t('common.notifications')}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Stay updated with your latest activity.</p>
          </div>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllAsRead} className="btn btn-ghost btn-sm">
            <Check size={14} /> {t('common.mark_all_read')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={40} color="var(--border)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: '0.95rem' }}>{t('common.no_notifications')}</p>
          </div>
        ) : notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              display: 'flex', gap: '14px', padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              background: !notif.read ? '#f0f5ff' : 'white',
              alignItems: 'flex-start',
            }}
          >
            {/* Unread dot */}
            <div style={{
              marginTop: '6px', width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              background: notif.read ? 'var(--border)' : 'var(--accent-blue)',
            }} />

            {/* Content */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{notif.content}</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {new Date(notif.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginTop: '2px' }}>
              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  title="Mark as read"
                  style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', color: '#059669', display: 'flex' }}
                >
                  <Check size={14} />
                </button>
              )}
              <button
                onClick={() => deleteNotification(notif.id)}
                title="Delete"
                style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', color: '#dc2626', display: 'flex' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
