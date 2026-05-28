import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, Activity, Zap, ShieldAlert, Sparkles, Box } from 'lucide-react';

export default function MarketingLanding({ onEnterApp }: { onEnterApp: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* Glassmorphic Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between glass-nav ${scrolled ? 'scrolled shadow-sm' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-black tracking-tighter lowercase ${scrolled ? 'text-stone-900' : 'text-white'}`}>
            billables
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] self-end mb-1.5"></span>
        </div>
        <div className="flex items-center gap-4">
          <button className={`text-sm font-semibold transition-colors ${scrolled ? 'text-stone-600 hover:text-stone-900' : 'text-stone-300 hover:text-white'}`}>Log In</button>
          <button 
            onClick={onEnterApp}
            className="bg-[var(--primary)] hover:bg-orange-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-orange-500/25"
          >
            Enter Dashboard
          </button>
        </div>
      </nav>

      {/* Layered Hero Section */}
      <header className="hero-bg-layered pt-48 pb-32 px-6 flex flex-col items-center text-center relative">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Pulse dot badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold mb-8 backdrop-blur-md animate-slide-up">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot"></span>
            Terminal v2.0 is live
          </div>

          <h1 className="text-[52px] md:text-[76px] leading-[1.05] tracking-[-0.045em] font-black text-white mb-6 animate-slide-up reveal-d1">
            Financial clarity,<br />without the corporate bloat.
          </h1>
          <p className="text-lg md:text-[20px] text-stone-400 max-w-2xl mb-10 animate-slide-up reveal-d2 font-medium">
            Generate precise invoices, manage recurring catalogs, and audit your real-time analytics layer. All locked inside a brutally fast, localized vault.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up reveal-d3">
            <button 
              onClick={onEnterApp}
              className="bg-[var(--primary)] hover:bg-orange-600 text-white px-8 py-4 rounded-full text-[15px] font-bold transition-all shadow-xl hover:shadow-orange-500/30 flex items-center justify-center gap-2 group"
            >
              Start Building <ArrowRight className="w-4 h-4 group-hover:transtone-x-1 transition-transform" />
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full text-[15px] font-bold transition-all backdrop-blur-md">
              View Documentation
            </button>
          </div>
        </div>
      </header>

      {/* Mockup Section */}
      <section className="relative z-20 -mt-24 px-6 max-w-5xl mx-auto animate-slide-up reveal-d4">
        <div className="phone-mockup aspect-video bg-[#09090B] flex flex-col pt-4">
           {/* Faked top header inside the mockup */}
           <div className="px-6 py-4 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-stone-500 text-xs font-mono bg-stone-900 px-4 py-1 rounded-full">billables.app/overview</div>
              <div className="w-12"></div>
           </div>
           {/* Faked inner dashboard content */}
           <div className="flex-1 p-8 grid grid-cols-3 gap-6 bg-stone-50 rounded-b-[35px] overflow-hidden">
             <div className="col-span-2 space-y-4">
                <div className="h-48 rounded-2xl bg-white border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
                   <div className="w-32 h-4 bg-stone-200 rounded-full"></div>
                   <div className="w-full h-24 flex items-end gap-2">
                      <div className="w-1/6 bg-stone-100 rounded-t h-[40%]"></div>
                      <div className="w-1/6 bg-stone-100 rounded-t h-[60%]"></div>
                      <div className="w-1/6 bg-stone-100 rounded-t h-[30%]"></div>
                      <div className="w-1/6 bg-orange-100 rounded-t h-[80%]"></div>
                      <div className="w-1/6 bg-[var(--primary)] rounded-t h-[100%] shadow-[0_0_20px_rgba(229,74,19,0.3)]"></div>
                   </div>
                </div>
                <div className="h-24 rounded-2xl bg-white border border-stone-200 shadow-sm p-5">
                  <div className="w-48 h-4 bg-stone-200 rounded-full mb-4"></div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-green-500"></div>
                  </div>
                </div>
             </div>
             <div className="space-y-4">
               <div className="h-24 rounded-2xl bg-white border border-stone-200 shadow-sm"></div>
               <div className="h-24 rounded-2xl bg-white border border-stone-200 shadow-sm"></div>
             </div>
           </div>
        </div>
      </section>

      {/* Feature Section 1 */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="mb-16 md:text-center flex flex-col md:items-center">
          <span className="text-[13px] tracking-[0.06em] text-[var(--primary)] uppercase font-bold mb-4 block">Engineered for Scale</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-[-0.035em] text-stone-900 mb-5">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-[18px] text-stone-500 max-w-2xl font-medium">
            We stripped away the noise to build a pristine, high-performance ledger environment. Say goodbye to bloated dashboards and confusing analytics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm feature-card cursor-pointer group">
            <div className="w-12 h-12 bg-orange-50 text-[var(--primary)] rounded-2xl flex items-center justify-center mb-6 border border-orange-100 group-hover:scale-110 transition-transform duration-500 ease-out">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">Instant Generation</h3>
            <p className="text-stone-500 leading-relaxed text-[15px]">Compile compliant invoices in milliseconds. Choose from deeply crafted templates, append recurring services, and securely distribute.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm feature-card cursor-pointer group">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 group-hover:scale-110 transition-transform duration-500 ease-out">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">Live Analytics</h3>
            <p className="text-stone-500 leading-relaxed text-[15px]">Real-time telemetry on every outstanding balance. Granular pie charts and monthly trajectory mapping out of the box.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm feature-card cursor-pointer group">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 border border-green-100 group-hover:scale-110 transition-transform duration-500 ease-out">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">Robust State</h3>
            <p className="text-stone-500 leading-relaxed text-[15px]">Data never leaves your proximity. Powered by localized ledger storage, guaranteeing privacy and offline resilience.</p>
          </div>
        </div>
      </section>

      {/* Step Process Section */}
      <section className="py-32 px-6 bg-white border-y border-stone-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <span className="text-[13px] tracking-[0.06em] text-[var(--primary)] uppercase font-bold mb-4 block">The Workflow</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-[-0.035em] text-stone-900 mb-5">
              From quote to cash in 3 steps.
            </h2>
            <p className="text-[18px] text-stone-500 max-w-2xl font-medium">
              We optimized the critical path of getting paid.
            </p>
          </div>

          <div className="relative">
             {/* Step line that fills on scroll - simplified using basic CSS for now */}
             <div className="absolute top-1/2 left-0 w-full h-[2px] bg-stone-100 -transtone-y-1/2 hidden md:block"></div>
             
             <div className="grid md:grid-cols-3 gap-12 relative z-10">
                <div className="bg-stone-50/80 backdrop-blur-sm p-8 rounded-3xl border border-stone-200 feature-card">
                  <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-600 font-bold flex items-center justify-center mb-6 transition-colors duration-700 ease-out group-hover:bg-[var(--primary)] group-hover:text-white">1</div>
                  <h3 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">Define Catalog</h3>
                  <p className="text-stone-500 text-[15px]">Pre-load your services and physical products. Define unit prices and applicable VAT once.</p>
                </div>
                <div className="bg-stone-50/80 backdrop-blur-sm p-8 rounded-3xl border border-stone-200 feature-card">
                  <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-600 font-bold flex items-center justify-center mb-6 transition-colors duration-700 ease-out group-hover:bg-[var(--primary)] group-hover:text-white">2</div>
                  <h3 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">Generate</h3>
                  <p className="text-stone-500 text-[15px]">Insert clients, append catalog items, and hit print. Secure PDFs compiled structurally.</p>
                </div>
                <div className="bg-stone-50/80 backdrop-blur-sm p-8 rounded-3xl border border-stone-200 feature-card">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white font-bold flex items-center justify-center mb-6 ring-4 ring-orange-50">3</div>
                  <h3 className="text-xl font-bold text-stone-900 mb-3 tracking-tight">Get Paid</h3>
                  <p className="text-stone-500 text-[15px]">Log incoming receipts, reconcile expenses, and watch your analytics dashboard light up.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Testimonial & FAQ Section */}
      <section className="py-32 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[13px] tracking-[0.06em] text-[var(--primary)] uppercase font-bold mb-4 block">Knowledge Base</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-[-0.035em] text-stone-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            { q: "Is my financial data secure?", a: "Absolutely. We utilize sophisticated localized structured storage, meaning your data never even touches an external server." },
            { q: "Can I use multiple devices?", a: "To ensure maximal structural integrity and privacy, workspaces are partitioned strictly per-device. Import/export functionalities provide safe bridges." },
            { q: "Does this export to standard formats?", a: "Yes. Every invoice compiles directly to a high-fidelity, print-ready PDF matching strict European and global structural paradigms." }
          ].map((faq, i) => (
            <details key={i} className="faq-accordion group bg-white border border-stone-200 rounded-2xl overflow-hidden transition-all duration-300 ease-out">
              <summary className="px-6 py-5 cursor-pointer flex justify-between items-center font-bold text-stone-900 text-[17px] select-none">
                {faq.q}
                <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center transition-transform duration-300 ease-out group-open:rotate-45 group-open:bg-orange-50 group-open:text-[var(--primary)]">
                  <PlusIcon />
                </span>
              </summary>
              <div className="px-6 pb-6 text-stone-500 pt-1 leading-relaxed border-t border-stone-100">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-32 px-6 bg-[#09090B] text-center border-t border-stone-800">
        <h2 className="text-4xl md:text-5xl font-black tracking-[-0.035em] text-white mb-6">
          Ready to shift gears?
        </h2>
        <p className="text-stone-400 max-w-xl mx-auto mb-10 text-[18px]">
          Join thousands of independent contractors who threw out their convoluted Excel sheets.
        </p>
        <button 
          onClick={onEnterApp}
          className="bg-[var(--primary)] hover:bg-orange-600 text-white px-10 py-5 rounded-full text-[16px] font-bold transition-all shadow-[0_0_40px_rgba(229,74,19,0.4)] hover:shadow-[0_0_60px_rgba(229,74,19,0.6)]"
        >
          Initialize Workspace
        </button>
      </footer>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
