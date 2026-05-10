import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, BookOpen, FileText,
  FolderKanban, Users, Bell, LogOut, GraduationCap, User
} from 'lucide-react';

const navItems = {
  ADMIN: [
    { path: '/dashboard', label: 'common.dashboard', icon: LayoutDashboard },
    { path: '/topics', label: 'common.topics', icon: BookOpen },
    { path: '/applications', label: 'common.applications', icon: FileText },
    { path: '/projects', label: 'common.projects', icon: FolderKanban },
    { path: '/users', label: 'common.users', icon: Users },
    { path: '/notifications', label: 'common.notifications', icon: Bell },
  ],
  STUDENT: [
    { path: '/dashboard', label: 'common.dashboard', icon: LayoutDashboard },
    { path: '/topics', label: 'common.browse_topics', icon: BookOpen },
    { path: '/applications', label: 'common.my_applications', icon: FileText },
    { path: '/projects', label: 'common.my_projects', icon: FolderKanban },
    { path: '/notifications', label: 'common.notifications', icon: Bell },
    { path: '/profile', label: 'common.profile', icon: User },
  ],
  SUPERVISOR: [
    { path: '/dashboard', label: 'common.dashboard', icon: LayoutDashboard },
    { path: '/topics', label: 'common.my_topics', icon: BookOpen },
    { path: '/applications', label: 'common.applications', icon: FileText },
    { path: '/projects', label: 'common.projects', icon: FolderKanban },
    { path: '/notifications', label: 'common.notifications', icon: Bell },
    { path: '/profile', label: 'common.profile', icon: User },
  ],
  COMPANY: [
    { path: '/dashboard', label: 'common.dashboard', icon: LayoutDashboard },
    { path: '/topics', label: 'common.my_topics', icon: BookOpen },
    { path: '/applications', label: 'common.applications', icon: FileText },
    { path: '/projects', label: 'common.projects', icon: FolderKanban },
    { path: '/notifications', label: 'common.notifications', icon: Bell },
    { path: '/profile', label: 'common.profile', icon: User },
  ],
};

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = navItems[user?.role] || navItems.STUDENT;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: collapsed ? '64px' : '240px',
      minWidth: collapsed ? '64px' : '240px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'all 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? t(item.label) : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '10px' : '9px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-active)' : 'transparent',
              transition: 'all 0.15s ease',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
            })}
          >
            <item.icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{t(item.label)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          title={t('common.logout')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: collapsed ? '10px' : '9px 12px',
            borderRadius: '8px', border: 'none', background: 'none',
            cursor: 'pointer', width: '100%',
            color: 'var(--text-secondary)', fontSize: '0.875rem',
            justifyContent: collapsed ? 'center' : 'flex-start',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>{t('common.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
