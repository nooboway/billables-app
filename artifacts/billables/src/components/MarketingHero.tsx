import { useEffect, useState } from 'react';
import { ArrowRight, Shield, Zap, Globe, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export default function MarketingHero({ onEnterApp }: { onEnterApp: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0C0A09] text-stone-50 font-sans selection:bg-primary selection:text-white">
      <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-[#0C0A09]/80 backdrop-blur-xl border-b border-stone-800/50' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary"></div>
          <span className="font-bold tracking-tight text-lg">Billable.</span>
        </div>
        <button 
          onClick={onEnterApp}
          className="px-5 py-2 rounded-full bg-white text-stone-950 text-xs font-bold hover:bg-stone-200 transition-colors"
        >
          Enter Workspace
        </button>
      </nav>

      <main className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-medium text-stone-400 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Terminal v2.0 Online
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          >
            The private command center<br />for <span className="text-primary">operators.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Tight, fast, and quietly powerful. Manage multiple businesses, track expenses, and send world-class invoices from a single offline-first vault.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={onEnterApp}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-[#C13A0E] transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(229,74,19,0.3)] hover:shadow-[0_0_60px_rgba(229,74,19,0.4)]"
            >
              Initialize Workspace <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Abstract UI Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-6xl mx-auto mt-24 relative"
        >
          <div className="aspect-[16/10] md:aspect-[21/9] rounded-2xl bg-[#111110] border border-stone-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="h-10 bg-[#1C1917] border-b border-stone-800 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-stone-700"></div>
              <div className="w-3 h-3 rounded-full bg-stone-700"></div>
              <div className="w-3 h-3 rounded-full bg-stone-700"></div>
            </div>
            <div className="flex-1 p-8 flex gap-6">
              <div className="w-48 hidden md:flex flex-col gap-3">
                <div className="h-8 rounded bg-stone-800/50 w-full"></div>
                <div className="h-8 rounded bg-stone-800/50 w-3/4"></div>
                <div className="h-8 rounded bg-stone-800/50 w-5/6"></div>
              </div>
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="h-24 rounded-xl bg-stone-800/50 flex-1 border border-stone-800"></div>
                  <div className="h-24 rounded-xl bg-stone-800/50 flex-1 border border-stone-800"></div>
                  <div className="h-24 rounded-xl bg-stone-800/50 flex-1 border border-stone-800"></div>
                </div>
                <div className="flex-1 rounded-xl bg-stone-800/30 border border-stone-800 p-6 flex items-end gap-4">
                  {[40, 70, 45, 90, 60, 100].map((h, i) => (
                    <div key={i} className="w-full bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }}>
                      <div className="w-full bg-primary rounded-t-sm" style={{ height: '4px' }}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <section className="py-32 px-6 border-t border-stone-900 bg-[#111110]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-[#1C1917] border border-stone-800">
            <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 mb-6">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Local First</h3>
            <p className="text-sm text-stone-400 leading-relaxed">Your financial data never leaves your device. Uncompromising privacy built on local storage architecture.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#1C1917] border border-stone-800">
            <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 mb-6">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Business</h3>
            <p className="text-sm text-stone-400 leading-relaxed">Run a studio, a consultancy, and a side-hustle from one terminal. Context-isolated workspaces.</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#1C1917] border border-stone-800">
            <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 mb-6">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">World-Class Output</h3>
            <p className="text-sm text-stone-400 leading-relaxed">Generate pristine, editorial-grade PDF invoices that command respect and higher rates.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
