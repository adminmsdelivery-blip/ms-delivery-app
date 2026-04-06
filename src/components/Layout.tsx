import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  Users, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,
  Truck,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

interface ProfileData {
  company_name: string;
  owner_name: string;
  email: string;
  logo_url: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>({
    company_name: '',
    owner_name: '',
    email: '',
    logo_url: ''
  });

  useEffect(() => {
    // Load profile from localStorage with error handling
    try {
      const savedProfile = localStorage.getItem('ms_delivery_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          company_name: parsed.company_name || '',
          owner_name: parsed.owner_name || '',
          email: parsed.email || '',
          logo_url: parsed.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile in Layout:', error);
      // Keep default values if localStorage fails
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ms_admin_session');
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Register Order', path: '/register', icon: PlusCircle },
    { name: 'All Orders', path: '/orders', icon: ClipboardList },
    { name: 'Settlements', path: '/settlements', icon: Wallet },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Outsource', path: '/outsource', icon: Truck },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-50 to-white">
      {/* Mobile Header */}
      <header className="md:hidden bg-white/95 backdrop-blur-lg border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm animate-slide-in">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-2 rounded-xl shadow-lg hover-lift">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt="Company Logo" className="w-6 h-6 object-cover rounded-lg animate-fade-in" />
            ) : (
              <Truck className="w-6 h-6 text-white animate-pulse" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-neutral-900 text-lg tracking-tight">
              {profile.company_name || profile.owner_name || 'MS Delivery'}
            </span>
            {profile.owner_name && (
              <span className="text-sm text-neutral-500 animate-fade-in">
                {profile.owner_name}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-neutral-600 hover:bg-neutral-100 hover:text-primary-600 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: isSidebarOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.div>
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop, hidden on mobile */}
      <aside className="hidden md:flex flex-col w-80 fixed inset-y-0 left-0 z-50 bg-white border-r border-neutral-200 shadow-xl">
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-r from-primary-600 to-primary-500 p-3 rounded-2xl shadow-xl hover-lift"
            >
              {profile.logo_url ? (
                <motion.img 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={profile.logo_url} alt="Company Logo" className="w-8 h-8 object-cover rounded-xl" />
              ) : (
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Truck className="w-8 h-8 text-white" />
                </motion.div>
              )}
            </motion.div>
            <div className="flex flex-col space-y-2">
              <motion.span 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-bold text-2xl text-neutral-900 tracking-tight"
              >
                {profile.company_name || 'MS Delivery'}
              </motion.span>
              {profile.owner_name && (
                <motion.span 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-sm text-neutral-500"
                >
                  {profile.owner_name}
                </motion.span>
              )}
            </div>
          </div>

          <nav className="flex-1 px-6 space-y-2 mt-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group hover-lift",
                    isActive(item.path) 
                      ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg" 
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-primary-600"
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className={cn(
                      "w-6 h-6 transition-colors duration-300",
                      isActive(item.path) ? "text-white" : "text-neutral-400 group-hover:text-primary-600"
                    )} />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium"
                  >
                    {item.name}
                  </motion.span>
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="p-6 border-t border-neutral-200">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-5 py-4 text-neutral-600 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all duration-300 group"
            >
              <motion.div
                whileHover={{ rotate: 15 }}
                transition={{ duration: 0.2 }}
              >
                <LogOut className="w-5 h-5 text-neutral-400 group-hover:text-red-600 transition-colors duration-300" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="font-medium"
              >
                Logout
              </motion.span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar - Drawer style */}
      <motion.aside 
        initial={{ x: -320 }}
        animate={{ x: isSidebarOpen ? 0 : -320 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-neutral-200 shadow-xl transform transition-transform duration-300 ease-in-out md:hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-4">
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-3 rounded-2xl shadow-xl">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Company Logo" className="w-8 h-8 object-cover rounded-xl" />
              ) : (
                <Truck className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <span className="font-bold text-2xl text-neutral-900 tracking-tight">
                {profile.company_name || 'MS Delivery'}
              </span>
              {profile.owner_name && (
                <span className="text-sm text-neutral-500">
                  {profile.owner_name}
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 px-6 space-y-2 mt-8">
            {navItems.map((item, index) => (
              <div key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group",
                    isActive(item.path) 
                      ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg" 
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-primary-600"
                  )}
                >
                  <item.icon className={cn(
                    "w-6 h-6 transition-colors duration-300",
                    isActive(item.path) ? "text-white" : "text-neutral-400 group-hover:text-primary-600"
                  )} />
                  <span className="font-medium">
                    {item.name}
                  </span>
                </Link>
              </div>
            ))}
          </nav>

          <div className="p-6 border-t border-neutral-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-5 py-4 text-neutral-600 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5 text-neutral-400 group-hover:text-red-600 transition-colors duration-300" />
              <span className="font-medium">
                Logout
              </span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content - Takes up remaining space, adds left margin ONLY on desktop */}
      <main className="flex-1 w-full md:ml-80">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
