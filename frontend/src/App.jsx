import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Topics from './pages/Topics';
import Applications from './pages/Applications';
import ProjectDetails from './pages/ProjectDetails';
import ProjectWorkspace from './pages/ProjectWorkspace';
import ProjectWorkspaceSupervisor from './pages/ProjectWorkspaceSupervisor';
import CompanyPublicProfile from './pages/CompanyPublicProfile';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Projects from './pages/Projects';
import Profile from './pages/Profile';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/reset-password" element={user ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/company/:id" element={<CompanyPublicProfile />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={
          user?.role === 'STUDENT' || user?.role === 'COMPANY' ? <ProjectWorkspace /> : 
          user?.role === 'SUPERVISOR' ? <ProjectWorkspaceSupervisor /> : 
          <ProjectDetails />
        } />
        <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><Users /></ProtectedRoute>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
