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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f9fc] p-4 sm:p-8">
      {/* Central Column Constraint */}
      <div className="w-full max-w-[400px] flex flex-col">
        
        {/* 1. Header (Left-aligned above the card) */}
        <div className="mb-6 flex flex-col items-start text-left">
          {/* Dynamic Logo */}
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
            <img 
              src={companyLogoUrl || "/custom-logo.png"} 
              alt="Brand" 
              className="w-full h-full object-cover" 
            />
          </div>
          {/* Dynamic Text */}
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {companyName || 'MS Delivery'}
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Kanchan</p>
        </div>

        {/* 2. The Form Card */}
        <div className="bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02),_0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-8">
          
          {/* !!! WINDSURF NOTE: Keep the existing <form> here. Do not rewrite the inputs or button logic. Just ensure the inputs have clean borders and padding. !!! */}
          <motion.form
            onSubmit={handleLogin}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="space-y-5"
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
        </div>

        {/* 3. Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          © 2026 MS Delivery Services. Authorized Personnel Only.
        </div>

      </div>
    </div>
  );
};

export default Login;
