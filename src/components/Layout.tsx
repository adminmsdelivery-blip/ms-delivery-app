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

  // Listen for profile changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ms_delivery_profile' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setProfile({
            company_name: parsed.company_name || '',
            owner_name: parsed.owner_name || '',
            email: parsed.email || '',
            logo_url: parsed.logo_url || ''
          });
        } catch (error) {
          console.error('Error parsing updated profile:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className={cn(
          "w-8 h-8 flex-shrink-0 overflow-hidden flex items-center justify-center",
          profile.logo_url ? "rounded-full" : "bg-[#5b52f6] rounded-lg"
        )}>
          <img 
            src={profile.logo_url || '/logo.svg'} 
            alt="Logo" 
            className="w-full h-full object-cover" 
          />
        </div>
        <span className="font-bold text-gray-900">
          {profile.company_name || profile.owner_name || 'MS Delivery'}
        </span>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="flex flex-row items-center gap-3 p-4 mb-4 hidden md:flex">
            {/* Icon Box */}
            <div className={cn(
              "w-12 h-12 flex-shrink-0 overflow-hidden flex items-center justify-center",
              profile.logo_url ? "rounded-full" : "bg-[#5b52f6] rounded-xl"
            )}>
              <img 
                src={profile.logo_url || '/logo.svg'} 
                alt="Logo" 
                className="w-full h-full object-cover" 
              />
              {/* Note to Windsurf: If the image path is broken, fallback to a text icon temporarily, but KEEP this div strictly w-12 h-12 */}
            </div>

            {/* Text Container */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <h1 className="text-xl font-extrabold text-gray-900 leading-none tracking-tight truncate">
                {profile.company_name || 'MS DELIVERY'}
              </h1>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1 truncate">
                {profile.owner_name || 'KANCHAN'}
              </p>
              {/* Note: Removed 'Logistics Management Portal' to keep the UI clean, or place it elsewhere if strictly required */}
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4 md:mt-0">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive(item.path) 
                    ? "bg-indigo-50 text-indigo-600 font-semibold" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive(item.path) ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                )} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
