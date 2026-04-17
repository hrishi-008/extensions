'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleAuth = async (type: 'login' | 'signup') => {
    setLoading(true)
    setMessage('')
    
    const { error } = type === 'signup' 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) setMessage(`Error: ${error.message}`)
    else setMessage(type === 'signup' ? 'Check your email for the confirmation link!' : 'Logged in successfully!')
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 text-white">
      <div className="absolute top-10 left-10">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center mb-4">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to PromptPilot</h1>
          <p className="text-zinc-500 text-sm mt-2 text-center">
            Sign in to sync your prompts and unlock premium features.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="email" 
                className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-10 pr-4 outline-none focus:border-violet-500 transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="password" 
                className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-10 pr-4 outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className={`text-sm p-3 rounded-lg ${message.startsWith('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={() => handleAuth('login')}
              disabled={loading}
              className="btn btn-primary h-12"
            >
              {loading ? '...' : 'Sign In'}
            </button>
            <button 
              onClick={() => handleAuth('signup')}
              disabled={loading}
              className="btn btn-outline h-12"
            >
              Sign Up
            </button>
          </div>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0b0b0b] px-3 text-zinc-500">Or continue with</span></div>
          </div>

          <button className="w-full btn btn-outline h-12 flex items-center justify-center gap-3">
             <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
             Google
          </button>
        </div>
      </motion.div>
    </div>
  )
}
