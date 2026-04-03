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
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8">
      {/* 3D Background */}
      <Suspense fallback={null}>
        <AnimatedBackground />
      </Suspense>

      {/* Gradient orbs */}
      <div className="glow-orb w-[500px] h-[500px] -top-40 -left-40" style={{ background: 'hsl(250, 85%, 55%)' }} />
      <div className="glow-orb w-[400px] h-[400px] -bottom-32 -right-32" style={{ background: 'hsl(170, 80%, 45%)' }} />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="login-card relative z-10 w-full max-w-[400px] rounded-2xl p-8 sm:p-10"
      >
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 text-center"
        >
          {/* Dynamic Logo Replacement */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full overflow-hidden bg-white shadow-sm border border-gray-100">
            <img src={companyLogoUrl || "/custom-logo.png"} alt="Brand Logo" className="w-full h-full object-cover" />
          </div>
          
          {/* Dynamic Company Name Replacement */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate px-2" style={{ fontFamily: 'var(--font-display)' }}>
            {companyName || 'MS Delivery'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Admin Console</p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="login-input pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="login-input pl-10"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="btn-login flex items-center justify-center gap-2"
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <motion.div
                className="h-5 w-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              />
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 text-center text-xs text-muted-foreground"
        >
          © 2026 MS Delivery Services. Authorized Personnel Only.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;
