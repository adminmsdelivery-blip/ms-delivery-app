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
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f6f9fc] px-4 py-8">
      {/* 3D Background */}
      <Suspense fallback={null}>
        <AnimatedBackground />
      </Suspense>

      {/* Glowing Background Orbs */}
      <div className="absolute w-[500px] h-[500px] -top-40 -left-40 rounded-full blur-[100px] opacity-50 pointer-events-none" style={{ background: 'hsl(250, 85%, 55%)' }} />
      <div className="absolute w-[400px] h-[400px] -bottom-32 -right-32 rounded-full blur-[100px] opacity-50 pointer-events-none" style={{ background: 'hsl(170, 80%, 45%)' }} />

      {/* Animated Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[400px] rounded-2xl bg-white/80 backdrop-blur-xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50"
      >
        {/* Dynamic Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-white shadow-sm flex items-center justify-center border border-gray-100 mb-4">
            <img src={companyLogoUrl || "/custom-logo.png"} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 truncate w-full">
            {companyName || 'MS DELIVERY'}
          </h1>
        </motion.div>

        {/* Form linked to existing state */}
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent sm:text-sm bg-white/70 backdrop-blur-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent sm:text-sm bg-white/70 backdrop-blur-sm"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5A52E6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#635BFF] transition-colors duration-200"
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <motion.div
                className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              />
            ) : (
              <>
                Secure Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;
