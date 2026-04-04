'use client';

import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import { useProfile } from '../hooks/useProfile';

const Login: React.FC = () => {
  const { profile, loading: profileLoading } = useProfile();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // --- Hardcoded Admin Credentials ---
    // Note: In production, you'd use supabase.auth.signInWithPassword
    if (username.toLowerCase() === 'admin' && password === 'Admin@123') {
      setTimeout(() => {
        // 1. Save session to localStorage
        localStorage.setItem('ms_admin_session', 'true');
        
        // 2. IMPORTANT: Force App state to recognize change
        // We use window.location.href instead of navigate('/') here 
        // to ensure a clean state reload of Router
        window.location.href = '/'; 
        
        setIsLoading(false);
      }, 1000);
    } else {
      setTimeout(() => {
        setError('Invalid username or password. Please try again.');
        setIsLoading(false);
      }, 600);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f9fc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-8">
      {/* 3D Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Animated Orbs */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4"
        >
          {/* Dynamic Logo */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 flex items-center justify-center mx-auto">
            <img 
              src={profile.logo_url || "/custom-logo.png"} 
              alt="Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          
          {/* Dynamic Heading */}
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {profile.login_heading || 'MS Delivery'}
          </h1>
          
          {/* Dynamic Subheading */}
          <p className="text-gray-600 text-lg">
            {profile.login_subheading || 'Delivery Management System'}
          </p>
        </motion.div>

        {/* Glass Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl p-8"
        >
          <motion.form
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <motion.div
                  className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white mx-auto"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />
              ) : (
                'Sign In'
              )}
            </motion.button>
          </motion.form>

          {/* Error Display */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-100/50 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center space-y-1"
        >
          <p className="text-gray-500 text-sm">
            © 2026 MS Delivery Services
          </p>
          <p className="text-gray-400 text-xs">
            Authorized Personnel Only
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
