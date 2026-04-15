import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Shield, Lock, Zap, TrendingUp, Users, BarChart3, Star } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
};

const RevealSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const { ref, visible } = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const LandingPage = ({ onStart }: LandingPageProps) => {
  return (
    <div className="animate-fade-in -mx-4 -mt-6">
      {/* Hero Section */}
      <section className="relative border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-7 p-8 md:p-12 lg:border-r border-border">
            <RevealSection>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-card border border-border rounded-sm mb-6">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[10px] text-primary uppercase tracking-widest">System Active • Mumbai Node</span>
              </div>
            </RevealSection>
            <RevealSection delay={100}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-sans font-bold tracking-tighter leading-none mb-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                TAX LIABILITIES<br />
                <span className="text-muted-foreground">OPTIMIZED.</span>
              </h1>
            </RevealSection>
            <RevealSection delay={200}>
              <p className="max-w-[45ch] text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
                AI-powered tax intelligence for India's high-income professionals. Optimized across Section 80C through 80U with real-time compliance verification.
              </p>
            </RevealSection>
            <RevealSection delay={300}>
              <div className="flex flex-wrap gap-3">
                <button onClick={onStart} className="btn-gold text-base px-8 py-4 rounded-sm inline-flex items-center gap-2 group uppercase tracking-tight font-bold">
                  Start Tax Analysis <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border border-border hover:border-primary px-8 py-4 rounded-sm text-foreground font-bold uppercase tracking-tight text-sm transition-colors">
                  View Benchmarks
                </button>
              </div>
              <p className="text-muted-foreground text-xs mt-4 font-mono uppercase tracking-wider">Free analysis • No login • 2 minutes</p>
            </RevealSection>
          </div>

          <div className="lg:col-span-5 p-8 md:p-12 bg-card/50 flex flex-col justify-center items-center">
            <RevealSection delay={200}>
              <div className="w-full max-w-[280px] mx-auto border border-border p-6 md:p-8">
                {/* HUD Header */}
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[8px] text-primary uppercase tracking-wider">SAVINGS_ACTIVE</span>
                  <span className="font-mono text-[8px] text-muted-foreground">TX_ID: 8847-X</span>
                </div>
                <div className="border-t border-border/50 pt-4 pb-4 text-center">
                  <div className="font-mono text-[10px] text-primary mb-2 uppercase tracking-[0.2em]">Tax Health Score</div>
                  <div className="text-6xl md:text-7xl font-light tabular-nums text-foreground leading-none">98.4</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Top Percentile</div>
                </div>
                <div className="border-t border-border/50 pt-1 flex justify-between">
                  <span className="font-mono text-[8px] text-muted-foreground">SYNC_STABLE</span>
                  <span className="font-mono text-[8px] text-muted-foreground">●  LIVE</span>
                </div>
              </div>
            </RevealSection>
            <RevealSection delay={350}>
              <div className="mt-6 w-full max-w-[280px] mx-auto">
                <div className="flex justify-between font-mono text-[10px] mb-2">
                  <span className="text-muted-foreground">Current Liability</span>
                  <span className="text-foreground">₹12,48,200</span>
                </div>
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[14%] rounded-full" />
                </div>
                <div className="flex justify-between font-mono text-[10px] mt-2">
                  <span className="text-primary">AI Optimized</span>
                  <span className="text-primary">- ₹4,12,000</span>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <RevealSection className="border-b border-border bg-card/30 py-5">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 opacity-40 text-xs md:text-sm">
          <span className="font-mono uppercase tracking-widest text-muted-foreground italic">Validated by:</span>
          <span className="font-bold tracking-tighter text-foreground">CBDT Compliant</span>
          <span className="font-bold tracking-tighter text-foreground">256-bit Encrypted</span>
          <span className="font-bold tracking-tighter text-foreground">ISO 27001</span>
          <span className="font-bold tracking-tighter text-foreground">100% Legal</span>
        </div>
      </RevealSection>

      {/* Stats Bar */}
      <RevealSection className="border-b border-border py-8">
        <div className="flex justify-around max-w-3xl mx-auto">
          {[
            { value: '₹2.4Cr+', label: 'Tax Saved' },
            { value: '12,000+', label: 'Users Trusted' },
            { value: '98%', label: 'Accuracy Rate' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl md:text-2xl font-bold gold-gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* Feature Grid */}
      <section className="border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {[
            { num: '01', tag: 'REGIME_ENGINE', icon: BarChart3, title: 'Old vs New Regime', desc: 'AI compares both regimes with 50+ parameters. Sub-second analysis across Section 80C through 80U.', badge: 'LATENCY: 0.04ms' },
            { num: '02', tag: 'FAMILY_STRUCT', icon: Users, title: 'Family Structuring', desc: 'HUF formation, spouse income splitting, minor clubbing, and trust optimization — all considered.', badge: 'COMPLIANCE: 100%' },
            { num: '03', tag: 'STRATEGY_GEN', icon: TrendingUp, title: 'AI Strategies', desc: 'Personalized, advanced tax-saving strategies ranked by ₹ impact. From SGB exemptions to 54EC bonds.', badge: 'NODE: SECURE' },
          ].map((f, i) => (
            <RevealSection
              key={f.num}
              delay={i * 150}
              className="p-8 md:p-10 border-b md:border-b-0 md:border-r last:border-r-0 border-border hover:bg-primary/5 transition-colors group"
            >
              <div className="font-mono text-primary text-xs mb-6">{f.num} // {f.tag}</div>
              <div className="flex items-center gap-2 mb-4">
                <f.icon className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{f.title}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{f.desc}</p>
              <div className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-1 inline-block rounded-sm">{f.badge}</div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <RevealSection className="py-16 border-b border-border">
        <div className="text-center mb-10">
          <div className="font-mono text-primary text-xs mb-3 uppercase tracking-[0.3em]">Protocol Sequence</div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold">
            How It <span className="gold-gradient-text">Works</span>
          </h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            { step: '01', title: 'Initialize Profile', desc: 'Income, family, investments — takes 2 minutes' },
            { step: '02', title: 'AI Engine Analyzes', desc: 'Compares regimes, finds strategies, ranks by savings' },
            { step: '03', title: 'Extract Results', desc: 'Download personalized report with actionable steps' },
          ].map((item, i) => (
            <RevealSection key={item.step} delay={i * 120}>
              <div className="flex items-start gap-4 p-4 border border-border rounded-sm hover:border-primary/30 transition-colors bg-card/30">
                <div className="w-10 h-10 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-mono font-bold text-primary">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground uppercase tracking-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </RevealSection>

      {/* Testimonials */}
      <section className="py-16 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <RevealSection className="p-8">
            <div className="font-mono text-primary text-xs mb-6 uppercase tracking-wider">// User Feedback</div>
            <p className="text-xl md:text-2xl font-medium tracking-tight italic leading-snug text-foreground mb-6">
              "Saved ₹3.2L this year. The regime comparison and HUF strategy alone were worth it. Better than my CA's advice."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-card border border-border rounded-sm flex items-center justify-center">
                <span className="text-primary font-bold text-sm">RS</span>
              </div>
              <div>
                <div className="font-bold uppercase tracking-widest text-xs text-foreground">Rajesh M.</div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase">CTO, Bangalore</div>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={150} className="bg-card border border-border rounded-sm p-6">
            <div className="font-mono text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.2em]">Live Optimization Feed</div>
            <div className="space-y-3">
              {[
                { label: 'Portfolio_Scan', value: '+₹42,100 SAVED', active: true },
                { label: 'Section_80G_Verify', value: 'VALIDATED', active: false },
                { label: 'ITR-2_Ready', value: 'OPTIMIZED', active: true },
                { label: 'Regime_Compare', value: 'NEW → OLD', active: true },
                { label: 'NPS_80CCD(1B)', value: '+₹15,600', active: true },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-primary' : 'bg-muted-foreground'}`} />
                    <span className={`font-mono text-xs uppercase ${item.active ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
                  </div>
                  <span className={`font-mono text-xs tracking-tighter ${item.active ? 'text-primary' : 'text-muted-foreground'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* More Testimonials */}
      <section className="py-12 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Priya S.', role: 'Consultant, Mumbai', text: 'The HUF strategy alone saved me ₹1.8L. Incredible tool.', stars: 5 },
            { name: 'Amit K.', role: 'Founder, Delhi', text: 'Worth every rupee. The regime comparison is spot on.', stars: 5 },
            { name: 'Neha R.', role: 'VP Finance, Pune', text: 'Finally a tax tool that understands complex income structures.', stars: 5 },
          ].map((t, i) => (
            <RevealSection key={t.name} delay={i * 120} className="card-premium p-5 rounded-sm">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-3 h-3 text-primary fill-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-3 leading-relaxed">"{t.text}"</p>
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">{t.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">{t.role}</p>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <RevealSection className="py-20 text-center">
        <div className="font-mono text-primary text-xs mb-6 uppercase tracking-[0.3em]">Ready to Optimize</div>
        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
          Initialize Your Tax<br /><span className="gold-gradient-text">Operating System</span>
        </h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
          Join thousands of high-income professionals who optimized their taxes with AI.
        </p>
        <button onClick={onStart} className="btn-gold text-lg px-10 py-4 rounded-sm inline-flex items-center gap-2 group uppercase tracking-tight font-bold">
          Start Free Analysis <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
        <div className="flex items-center justify-center gap-6 mt-6 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Encrypted</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 100% Legal</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> No Login</span>
        </div>
      </RevealSection>
    </div>
  );
};

export default LandingPage;
