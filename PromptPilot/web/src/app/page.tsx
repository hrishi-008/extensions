'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Shield, 
  Cpu, 
  Brain, 
  Check, 
  X, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  Globe
} from 'lucide-react'
import { TIERS, PricingTier } from '@/lib/tiers'
import { detectRegion, Region } from '@/lib/geo'
import Link from 'next/link'

export default function LandingPage() {
  const [region, setRegion] = React.useState<Region>('GLOBAL')

  React.useEffect(() => {
    detectRegion().then(setRegion)
  }, [])
  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap size={22} className="text-white fill-white/20" />
            </div>
            <span className="text-xl font-bold tracking-tight">PromptPilot</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="text-sm font-medium hover:text-violet-400 transition-colors">Login</Link>
            <Link href="/auth" className="btn btn-primary px-6 py-2.5 text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-violet-400 mb-8">
              <Sparkles size={14} />
              <span>Version 1.0 is now live</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
              Your Prompts, <br />
              <span className="premium-gradient">Reimagined by AI.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed">
              Turn a single sentence into an expert-level query. Detect domains, inject personal context, and sync across every AI chat.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="btn btn-primary h-14 px-10 text-lg group">
                Add to Chrome 
                <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#pricing" className="btn btn-outline h-14 px-10 text-lg">
                View Pricing
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful by default.</h2>
            <p className="text-zinc-500">Everything you need to master AI communication.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Cpu className="text-violet-400" />}
              title="Domain Detection"
              description="Automatically detects if you're writing code, researching, or creating content to apply the perfect profile."
            />
            <FeatureCard 
              icon={<Brain className="text-fuchsia-400" />}
              title="Contextual Memory"
              description="Seamlessly sync your personal preferences and projects to ensure AI always knows who you are."
            />
            <FeatureCard 
              icon={<Shield className="text-cyan-400" />}
              title="Managed Privacy"
              description="Secure local-first processing with optional encrypted cloud sync for Pro power users."
            />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Choose your power.</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              From casual enthusiasts to high-performance professionals. 
              <span className="flex items-center justify-center gap-2 text-violet-400 mt-4 text-xs font-semibold bg-violet-400/5 py-2 px-4 rounded-full border border-violet-400/10">
                <Globe size={14} />
                Detected {region === 'IN' ? 'India' : 'International'} — Using {region === 'IN' ? 'Razorpay' : 'Stripe'}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {TIERS.map((tier) => (
              <PricingCard key={tier.id} tier={tier} region={region} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass-card p-12 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-4xl font-bold mb-8">Ready to elevate your prompts?</h2>
            <button className="btn btn-primary h-14 px-12 text-lg">
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-white/5 text-center text-zinc-500 text-sm">
        <div className="mb-6 flex justify-center gap-8">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
        </div>
        <p>© 2026 PromptPilot. Built for the era of intelligence.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-8 group">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{description}</p>
    </div>
  )
}

function PricingCard({ tier, region }: { tier: PricingTier, region: Region }) {
  const isHighTier = tier.id === 'pro_memory' || tier.id === 'pro';
  const handleUpgrade = () => {
    // Navigate to checkout API with tier ID and region
    window.location.href = `/api/checkout?tier=${tier.id}&region=${region}`;
  };
  
  return (
    <div className={`glass-card p-6 flex flex-col relative ${isHighTier ? 'border-violet-500/50 scale-105 z-10' : ''}`}>
      {isHighTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest text-white shadow-lg shadow-violet-500/30">
          Recommended
        </div>
      )}
      
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-1">{tier.name}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">${tier.price}</span>
          <span className="text-zinc-500 text-sm">/mo</span>
        </div>
      </div>

      <div className="text-xs font-semibold text-violet-400 mb-6 bg-violet-400/10 px-3 py-1.5 rounded-lg inline-block self-start">
        {tier.limit}
      </div>

      <ul className="space-y-4 mb-8 flex-grow">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex gap-3 text-sm text-zinc-400">
            <Check size={16} className="text-violet-500 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
        {tier.isMemory ? (
          <li className="flex gap-3 text-sm text-fuchsia-400 font-medium">
            <Layers size={16} className="shrink-0" />
            <span>Memory Engine Enabled</span>
          </li>
        ) : (
          <li className="flex gap-3 text-sm text-zinc-600">
            <Lock size={16} className="shrink-0" />
            <span>Memory Locked</span>
          </li>
        )}
      </ul>

      <button 
        onClick={handleUpgrade}
        className={`btn w-full py-3 text-sm ${isHighTier ? 'btn-primary' : 'btn-outline'}`}
      >
        {tier.cta}
      </button>
    </div>
  )
}
