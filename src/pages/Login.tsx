'use client';

import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, User, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f9fc] px-4 py-8">
      {/* 3D Background */}
      <Suspense fallback={null}>
        <AnimatedBackground />
      </Suspense>

      {/* Header Section - Left Aligned */}
      <div className="w-full max-w-md mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-left"
        >
          {/* Dynamic Logo */}
          <div className="mb-6 flex items-center">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200">
              <img src={companyLogoUrl || "/custom-logo.png"} alt="Brand Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          
          {/* Dynamic Company Name */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {companyName || 'MS Delivery'}
          </h1>
          <p className="text-sm text-gray-600">Kanchan</p>
        </motion.div>
      </div>

      {/* Login Card - Stripe Style */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02),_0_4px_12px_rgba(0,0,0,0.04)] p-10"
      >
        {/* Form */}
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent transition-colors"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#635BFF] text-white font-semibold py-3 rounded-lg hover:bg-[#5A52E6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </motion.div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-8 text-center text-sm text-gray-500"
      >
        Authorized Personnel Only
      </motion.p>
    </div>
  );
};

export default Login;
