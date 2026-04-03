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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col justify-center sm:py-12 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Modern Login Header */}
        <div className="mb-8 text-center">
          
          {/* Logo & Brand Name Container */}
          <div className="flex flex-col items-center gap-4">
            
            {/* Logo Circle with Enhanced Styling */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-white shadow-lg border border-gray-200/50 flex items-center justify-center ring-4 ring-white/20 backdrop-blur-sm">
              <img 
                src={profile.logo_url || "/custom-logo.svg"} 
                alt={profile.company_name ? `${profile.company_name} Logo` : "Company Logo"}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" 
              />
            </div>

            {/* Company Name with Modern Typography */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-none mb-2">
                {profile.company_name || 'MS DELIVERY'}
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Delivery Management System
              </p>
              {/* Note: Admin/Owner name intentionally omitted for public login security */}
            </div>

          </div>
        </div>

        {/* Enhanced Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-gray-200/50 rounded-2xl sm:px-8 sm:py-10"
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

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all duration-200 text-base"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all duration-200 text-base"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
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
