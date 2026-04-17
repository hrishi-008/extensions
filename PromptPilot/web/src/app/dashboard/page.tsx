'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Settings, 
  CreditCard, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  LayoutDashboard
} from 'lucide-react'
import Link from 'next/link'
import { TIERS, TierId } from '@/lib/tiers'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  if (loading) return <div className="min-h-screen bg-[#030303] flex items-center justify-center text-zinc-500">Loading your pilot suite...</div>
  if (!profile) return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your dashboard</h1>
        <Link href="/auth" className="btn btn-primary px-8">Sign In</Link>
      </div>
    </div>
  )

  const currentTier = TIERS.find(t => t.id === profile.tier) || TIERS[0]

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* ── Header ── */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap size={18} className="text-violet-500" />
            <span className="font-bold tracking-tight">PromptPilot</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>{profile.email}</span>
            <button 
              onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
              className="hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* ── Left Rail: Profile & Tier ── */}
          <div className="flex-1 space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <LayoutDashboard className="text-violet-400" size={24} />
                <h2 className="text-2xl font-bold tracking-tight">Your Dashboard</h2>
              </div>
              
              <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    profile.tier === 'free' ? 'bg-zinc-800 text-zinc-400' : 'bg-violet-500 text-white'
                  }`}>
                    {currentTier.name}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">Welcome back!</h3>
                <p className="text-zinc-400 text-sm mb-6">Your account is active and syncing with the Chrome Extension.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl">
                    <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Today's Enhancements</div>
                    <div className="text-2xl font-bold">{profile.usage_count} <span className="text-sm font-normal text-zinc-600">/ {profile.tier === 'free' ? '3' : '∞'}</span></div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Status</div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 size={16} />
                      <span className="font-bold text-sm">Linked</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-card p-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings size={20} className="text-zinc-400" />
                Extension Configuration
              </h3>
              <p className="text-zinc-500 text-sm mb-6">Settings changed in the extension are automatically synced here.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                      <ExternalLink size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Extension Status</div>
                      <div className="text-xs text-emerald-500">Connected & Ready</div>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-violet-400 hover:text-white transition-colors uppercase tracking-widest">
                    Open Extension
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ── Right Rail: Billing ── */}
          <div className="w-full md:w-[380px] space-y-8">
            <section className="glass-card p-8 border-violet-500/20">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-zinc-400" />
                Subscription
              </h3>
              
              <div className="mb-6">
                <div className="text-sm text-zinc-400 mb-1">Current Plan</div>
                <div className="text-xl font-bold">{currentTier.name}</div>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/20 p-4 rounded-xl mb-8">
                <div className="flex gap-3">
                  <AlertCircle className="text-violet-400 shrink-0" size={18} />
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    {profile.tier === 'free' 
                      ? "You're currently on the limited free tier. Upgrade to unlock unlimited enhancements."
                      : `You have full access to ${currentTier.isMemory ? 'all features including Memory Engine.' : 'all standard enhancement features.'}`}
                  </div>
                </div>
              </div>

              <Link href="/#pricing" className="btn btn-primary w-full py-4">
                {profile.tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
              </Link>
            </section>
          </div>

        </div>
      </main>
    </div>
  )
}
