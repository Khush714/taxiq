import { Sparkles, Shield, TrendingUp, Users, IndianRupee, ChevronRight, CheckCircle, Star, Lock } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const stats = [
  { value: '₹2.4Cr+', label: 'Tax Saved' },
  { value: '12,000+', label: 'Users Trusted' },
  { value: '98%', label: 'Accuracy Rate' },
];

const features = [
  { icon: TrendingUp, title: 'Old vs New Regime', desc: 'AI compares both regimes with 50+ parameters to find your optimal choice' },
  { icon: Users, title: 'Family Structuring', desc: 'HUF, spouse income splitting, and minor clubbing — all considered' },
  { icon: Shield, title: '100% Legal', desc: 'Every strategy is based on Indian Income Tax Act provisions' },
  { icon: IndianRupee, title: 'Personalized Savings', desc: 'Strategies ranked by ₹ impact specific to your profile' },
];

const testimonials = [
  { name: 'Rajesh M.', role: 'CTO, Bangalore', text: 'Saved 3.2L this year. Better than my CA advice.', stars: 5 },
  { name: 'Priya S.', role: 'Consultant, Mumbai', text: 'The HUF strategy alone saved me 1.8L. Incredible tool.', stars: 5 },
  { name: 'Amit K.', role: 'Founder, Delhi', text: 'Worth every rupee. The regime comparison is spot on.', stars: 5 },
];

const LandingPage = ({ onStart }: LandingPageProps) => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.3), transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI-Powered Tax Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight">
            Stop Overpaying<br />
            <span className="gold-gradient-text">Your Taxes</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            India's smartest tax optimization engine for high-income professionals.
            Get CA-level strategies personalized to your income, family, and investments.
          </p>
          <button onClick={onStart} className="btn-gold text-lg px-10 py-4 rounded-xl inline-flex items-center gap-2 group">
            Analyze My Taxes <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-muted-foreground text-xs mt-4">Free analysis • No login required • 2 minutes</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card/50 py-6">
        <div className="max-w-3xl mx-auto flex justify-around">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl md:text-2xl font-serif font-bold gold-gradient-text">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who Is This For */}
      <section className="py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-3">
          Built for <span className="gold-gradient-text">High Earners</span>
        </h2>
        <p className="text-muted-foreground text-sm text-center mb-10 max-w-lg mx-auto">
          If you earn ₹50L–₹2Cr+, generic calculators won't cut it. You need strategies that match your complexity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(f => (
            <div key={f.title} className="card-premium-hover p-5 flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-border">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-10">
          How It <span className="gold-gradient-text">Works</span>
        </h2>
        <div className="max-w-2xl mx-auto space-y-6">
          {[
            { step: '01', title: 'Share Your Profile', desc: 'Income, family, investments — takes 2 minutes' },
            { step: '02', title: 'AI Analyzes', desc: 'Compares regimes, finds strategies, ranks by savings' },
            { step: '03', title: 'Get Your Plan', desc: 'Download personalized report with actionable steps' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{item.step}</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 border-t border-border">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-10">
          Trusted by <span className="gold-gradient-text">Professionals</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {testimonials.map(t => (
            <div key={t.name} className="card-premium p-5">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-primary fill-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-3 leading-relaxed">"{t.text}"</p>
              <p className="text-xs font-medium text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t border-border text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">
            Ready to Save <span className="gold-gradient-text">Lakhs</span>?
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Join thousands of high-income professionals who optimized their taxes with AI.
          </p>
          <button onClick={onStart} className="btn-gold text-lg px-10 py-4 rounded-xl inline-flex items-center gap-2 group">
            Start Free Analysis <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit Encrypted</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> No Login Required</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 100% Legal</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
