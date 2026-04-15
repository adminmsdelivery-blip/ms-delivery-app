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
    <button
      onClick={() => navigate('/register')}
      className="fixed bottom-8 right-8 z-[99999] flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 hover:scale-110 transition-all cursor-pointer border-2 border-white"
    >
      <Plus className="w-6 h-6" />
    </button>
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
