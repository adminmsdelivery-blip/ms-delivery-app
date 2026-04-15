import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RegisterOrder from './pages/RegisterOrder';
import AllOrders from './pages/AllOrders';
import Clients from './pages/Clients';
import OutsourceManagement from './pages/OutsourceManagement';
import Settlements from './pages/Settlements';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { Plus } from 'lucide-react';

// Floating Action Button Component
const FloatingActionButton = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  
  if (!isAuthenticated) return null;
  
  return (
    <a 
      href="/register" 
      className="hover:scale-110 transition-transform cursor-pointer"
      style={{ 
        position: 'fixed', 
        bottom: '2rem', 
        right: '2rem', 
        zIndex: 9999,
        backgroundColor: '#2563eb', /* Tailwind blue-600 */
        color: '#ffffff', 
        borderRadius: '50%', 
        width: '3.5rem', 
        height: '3.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </a>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem('ms_admin_session') === 'true'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem('ms_admin_session') === 'true');
      setLoading(false);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
return () => window.removeEventListener('storage', checkAuth);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/register" element={isAuthenticated ? <Layout><RegisterOrder /></Layout> : <Navigate to="/login" />} />
        <Route path="/orders" element={isAuthenticated ? <Layout><AllOrders /></Layout> : <Navigate to="/login" />} />
        <Route path="/settlements" element={isAuthenticated ? <Layout><Settlements /></Layout> : <Navigate to="/login" />} />
        <Route path="/clients" element={isAuthenticated ? <Layout><Clients /></Layout> : <Navigate to="/login" />} />
        <Route path="/outsource" element={isAuthenticated ? <Layout><OutsourceManagement /></Layout> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Layout><Profile /></Layout> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <FloatingActionButton isAuthenticated={isAuthenticated} />
    </Router>
  );
}
