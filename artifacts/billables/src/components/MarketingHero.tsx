import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Building2, LayoutTemplate, Link as LinkIcon, FileText, PieChart, Bell, ArrowRight } from 'lucide-react';

const BG = '#0C0A09';
const BG2 = '#111110';
const BORDER = '#292524';
const TEXT_PRIMARY = '#f5f5f4';
const TEXT_MUTED = '#a8a29e';
const TEXT_DIM = '#78716c';
const ACCENT = '#E54A13';
const ACCENT_DARK = '#C13A0E';

const features = [
  { Icon: Building2,     title: 'Multi-business',         desc: 'One tool for all your businesses. Isolated data, no cross-contamination.' },
  { Icon: LayoutTemplate, title: '5 Invoice templates',   desc: 'Minimal, Executive, Studio, Classic, Stripe — pick what fits.' },
  { Icon: LinkIcon,      title: 'Paystack & Stripe',      desc: 'Embed payment links directly into invoices. Get paid in one click.' },
  { Icon: FileText,      title: 'PDF export',             desc: 'Generate pristine PDFs instantly. Download or share as-is.' },
  { Icon: PieChart,      title: 'Expense tracking',       desc: 'Log and categorize expenses per business. Know your numbers.' },
  { Icon: Bell,          title: 'Send reminders',         desc: 'Follow up on unpaid invoices without leaving the app.' },
];

const steps = [
  { n: '1', title: 'Create invoice',    desc: 'Client details, line items, VAT — done in under a minute.',  accent: false },
  { n: '2', title: 'Add payment link',  desc: 'Attach your Stripe or Paystack link so clients can pay instantly.',  accent: false },
  { n: '3', title: 'Get paid',          desc: 'Clients pay via your gateway. You get notified.',  accent: true },
];

export default function MarketingHero({ onEnterApp }: { onEnterApp: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: BG, color: TEXT_PRIMARY, fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.3s, border-color 0.3s',
        background: scrolled ? 'rgba(12,10,9,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: ACCENT, flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', color: TEXT_PRIMARY }}>Billable.</span>
        </div>
        <button
          onClick={onEnterApp}
          style={{
            padding: '8px 20px', borderRadius: 9999, border: `1px solid ${BORDER}`,
            background: 'transparent', color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = BORDER; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; }}
        >
          Enter Workspace →
        </button>
      </nav>

      {/* Hero */}
      <main style={{ paddingTop: 160, paddingBottom: 96, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 9999,
              border: `1px solid ${BORDER}`, background: BG2,
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: TEXT_DIM, marginBottom: 32,
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }} />
            Invoicing for operators
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            style={{
              fontSize: 'clamp(40px, 8vw, 80px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.03,
              color: TEXT_PRIMARY,
              marginBottom: 24,
            }}
          >
            Invoice faster.<br />Get paid sooner.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            style={{
              fontSize: 18, lineHeight: 1.65,
              color: TEXT_MUTED,
              maxWidth: 520, margin: '0 auto 40px',
            }}
          >
            One workspace per business. Professional templates.
            Payment links. All offline.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}
          >
            <button
              onClick={onEnterApp}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: ACCENT, color: '#fff',
                fontSize: 14, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).closest('button')!.style.background = ACCENT_DARK; }}
              onMouseLeave={e => { (e.target as HTMLElement).closest('button')!.style.background = ACCENT; }}
            >
              Start Now <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </main>

      {/* Divider line */}
      <div style={{ height: 1, background: BORDER, margin: '0 24px' }} />

      {/* Features */}
      <section style={{ padding: '80px 24px', background: BG2 }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: TEXT_DIM,
              textAlign: 'center', marginBottom: 52,
            }}
          >
            Everything you need
          </motion.p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px 48px',
          }}>
            {features.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <Icon size={20} color={ACCENT} />
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{title}</div>
                <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>{desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: BORDER }} />

      {/* How it works */}
      <section style={{ padding: '80px 24px', background: BG }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_DIM, marginBottom: 16 }}>
              How it works
            </p>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', color: TEXT_PRIMARY }}>
              Three steps. Zero friction.
            </h2>
          </motion.div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24, position: 'relative',
          }}>
            {steps.map(({ n, title, desc, accent }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: '28px 24px', borderRadius: 16,
                  border: `1px solid ${accent ? ACCENT + '44' : BORDER}`,
                  background: accent ? `${ACCENT}0D` : BG2,
                  display: 'flex', flexDirection: 'column', gap: 16,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: accent ? ACCENT : BORDER,
                  color: accent ? '#fff' : TEXT_MUTED,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800,
                }}>
                  {n}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: BORDER }} />

      {/* Final CTA */}
      <section style={{ padding: '96px 24px', background: BG, textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              fontSize: 'clamp(30px, 6vw, 52px)',
              fontWeight: 900, letterSpacing: '-0.04em',
              color: TEXT_PRIMARY, marginBottom: 12, lineHeight: 1.08,
            }}
          >
            Your businesses,<br />one command center.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{ color: TEXT_MUTED, fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}
          >
            Free, offline-first, no account required.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            onClick={onEnterApp}
            style={{
              padding: '14px 36px', borderRadius: 12,
              background: TEXT_PRIMARY, color: BG,
              fontSize: 14, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            Start Now <ArrowRight size={16} />
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${BORDER}`,
        padding: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: ACCENT }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>Billable.</span>
        </div>
        <span style={{ fontSize: 12, color: TEXT_DIM }}>Offline-first · No account · All data stays in your browser</span>
      </div>
    </div>
  );
}
