import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import FloatingChatBot from '../chatbot/FloatingChatBot';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user: currentUser } = useAuth();

  return (
    <div className="app-layout">
      {/* Impersonation Banner */}
      {localStorage.getItem('original_token') && (
        <div style={{ 
          background: '#ef4444', color: 'white', padding: '10px 20px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.85rem', fontWeight: 600, zIndex: 2000 
        }}>
          <span>Vous agissez actuellement en tant que <strong>{currentUser?.firstName} {currentUser?.lastName}</strong>.</span>
          <button 
            onClick={() => {
              localStorage.setItem('token', localStorage.getItem('original_token'));
              localStorage.removeItem('original_token');
              window.location.href = '/dashboard';
            }}
            style={{ background: 'white', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Quitter l'impersonnification
          </button>
        </div>
      )}
      <Navbar onToggleSidebar={() => setCollapsed(!collapsed)} />

      {/* Body below the navbar: Sidebar + Content side by side */}
      <div className="layout-body">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <FloatingChatBot />
    </div>
  );
}
