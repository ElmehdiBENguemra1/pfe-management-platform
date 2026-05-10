import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { Bell, Menu, ChevronDown, Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { timeAgo } from '../../utils/helpers';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLangs, setShowLangs] = useState(false);
  const notifRef = useRef(null);
  const langRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' }
  ];

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (langRef.current && !langRef.current.contains(e.target)) setShowLangs(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch { /* silent */ }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.slice(0, 8));
    } catch { /* silent */ }
  };

  const toggleNotifs = () => {
    if (!showNotifs) fetchNotifications();
    setShowNotifs(!showNotifs);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    setShowLangs(false);
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const currentLang = languages.find(l => l.code === (i18n.language || 'en').split('-')[0]) || languages[0];

  return (
    <header style={{
      height: '60px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
    }}>
      {/* Left: Toggle + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleSidebar}
          style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
        >
          <Menu size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-blue)', letterSpacing: '-0.02em' }}>
          PFE Manager
        </span>
      </div>

      {/* Right: Lang + Bell + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Language Selector */}
        <div ref={langRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLangs(!showLangs)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--bg-primary)',
              cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600,
              fontFamily: 'inherit'
            }}
          >
            <Globe size={15} />
            <span>{currentLang.flag} {currentLang.label}</span>
            <ChevronDown size={13} style={{ transform: showLangs ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showLangs && (
            <div style={{
              position: 'absolute', top: '44px', right: 0,
              width: '170px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', borderRadius: '10px',
              zIndex: 200, overflow: 'hidden'
            }}>
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '10px 14px', border: 'none',
                    background: i18n.language?.startsWith(lang.code) ? 'var(--bg-active)' : 'none',
                    color: i18n.language?.startsWith(lang.code) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.875rem', fontWeight: i18n.language?.startsWith(lang.code) ? 600 : 400,
                    fontFamily: 'inherit', textAlign: 'left'
                  }}
                >
                  <span>{lang.flag}</span>
                  <span style={{ flex: 1 }}>{lang.label}</span>
                  {i18n.language?.startsWith(lang.code) && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            id="notifications-bell"
            onClick={toggleNotifs}
            style={{ position: 'relative', padding: '8px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                minWidth: '16px', height: '16px', borderRadius: '8px',
                background: 'var(--accent-red)', color: 'white',
                fontSize: '0.65rem', fontWeight: 700, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '0 3px'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', top: '46px', right: 0,
              width: '360px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', borderRadius: '12px',
              zIndex: 200, overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('common.notifications')}</h3>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                    <Check size={13} /> {t('common.mark_all_read')}
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {t('common.no_notifications')}
                  </p>
                ) : notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    style={{
                      display: 'flex', gap: '12px', padding: '12px 18px',
                      borderBottom: '1px solid var(--border)',
                      background: !notif.read ? '#f0f5ff' : 'transparent',
                      cursor: notif.read ? 'default' : 'pointer'
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: notif.read ? 'var(--border)' : 'var(--accent-blue)', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.83rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>{notif.content}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeAgo(notif.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setShowNotifs(false); navigate('/notifications'); }}
                style={{ width: '100%', padding: '12px', border: 'none', borderTop: '1px solid var(--border)', background: 'none', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('common.view_all')}
              </button>
            </div>
          )}
        </div>

        {/* User Chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 10px', borderRadius: '8px',
          border: '1px solid var(--border)', background: 'var(--bg-primary)'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'var(--accent-blue)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.7rem', fontWeight: 700
          }}>
            {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.firstName} {user?.lastName}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
