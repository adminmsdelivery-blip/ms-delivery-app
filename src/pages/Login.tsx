'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileData {
  company_name: string;
  owner_name: string;
  email: string;
  logo_url: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    company_name: '',
    owner_name: '',
    email: '',
    logo_url: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Load profile from localStorage for public access
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
      console.error('Error loading profile in Login:', error);
      // Keep default values if localStorage fails
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- Hardcoded Admin Credentials ---
    // Note: In production, you'd use supabase.auth.signInWithPassword
    if (username.toLowerCase() === 'admin' && password === 'Admin@123') {
      setTimeout(() => {
        // 1. Save session to localStorage
        localStorage.setItem('ms_admin_session', 'true');
        
        // 2. IMPORTANT: Force the App state to recognize the change
        // We use window.location.href instead of navigate('/') here 
        // to ensure a clean state reload of the Router
        window.location.href = '/'; 
        
        setLoading(false);
      }, 1000);
    } else {
      setTimeout(() => {
        setError('Invalid username or password. Please try again.');
        setLoading(false);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col justify-center sm:py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Final Dynamic Login Header */}
        <div className="mb-8 text-left">
          
          {/* Logo & Brand Name Container */}
          <div className="flex flex-row items-center gap-4">
            
            {/* Clean Logo Circle - Image Only (Dynamic) */}
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-white border border-gray-100 shadow-sm flex items-center justify-center">
              <img 
                src={profile.logo_url || "/custom-logo.svg"} 
                alt={profile.company_name ? `${profile.company_name} Logo` : "Company Logo"}
                className="w-full h-full object-cover bg-white" 
              />
            </div>

            {/* Restored Text Block - Company Name Only (Dynamic) */}
            <div className="flex flex-col justify-center text-left h-16">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none truncate max-w-[200px] sm:max-w-xs">
                {profile.company_name || 'MS DELIVERY'}
              </h1>
              {/* Note: Admin/Owner name intentionally omitted for public login security */}
            </div>

          </div>
        </div>

        {/* Main Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-[0_2px_4px_rgba(0,0,0,0.02),_0_4px_12px_rgba(0,0,0,0.04)] sm:rounded-xl border border-gray-100 sm:px-10"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent sm:text-sm transition-colors duration-200"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent sm:text-sm transition-colors duration-200"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5A52E6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF] transition-colors duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="mt-6 text-center text-xs text-gray-500">
          &copy; 2026 MS Delivery Services. Authorized Personnel Only.
        </p>
      </div>
    </div>
  );
};

export default Login;
