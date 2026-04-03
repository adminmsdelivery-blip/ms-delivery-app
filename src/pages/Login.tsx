'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, User, Lock, ArrowRight, AlertCircle, Loader2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Preserve real authentication logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- Real Admin Credentials (Preserved from original) ---
    // Note: In production, you'd use supabase.auth.signInWithPassword
    if (username.toLowerCase() === 'admin' && password === 'Admin@123') {
      setTimeout(() => {
        // 1. Save session to localStorage
        localStorage.setItem('ms_admin_session', 'true');
        
        // 2. IMPORTANT: Force App state to recognize the change
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
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8">
      {/* 3D Background - New Lovable UI */}
      <AnimatedBackground />

      {/* Gradient orbs - New Lovable UI */}
      <div className="glow-orb w-[500px] h-[500px] -top-40 -left-40" style={{ background: 'hsl(250, 85%, 55%)' }} />
      <div className="glow-orb w-[400px] h-[400px] -bottom-32 -right-32" style={{ background: 'hsl(170, 80%, 45%)' }} />

      {/* Login Card - New Lovable UI with Real Logic */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="login-card relative z-10 w-full max-w-[400px] rounded-2xl p-8 sm:p-10"
      >
        {/* Logo & Title - New Lovable UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--gradient-primary)' }}>
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            MS Delivery
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Logistics Management Portal</p>
        </motion.div>

        {/* Error Display */}
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

        {/* Form - New Lovable UI with Real Logic */}
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
                placeholder="Enter admin username"
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
            disabled={loading}
            className="btn-login flex items-center justify-center gap-2"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
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

        {/* Footer - New Lovable UI */}
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
