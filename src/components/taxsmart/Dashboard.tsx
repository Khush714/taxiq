import { useState, useEffect } from 'react';
import { TaxComparison, Strategy } from '@/lib/types';
import { formatCurrency } from '@/lib/taxEngine';
import StrategyCard from './StrategyCard';
import { ArrowRight, Download, TrendingDown, TrendingUp, Scale, Sparkles } from 'lucide-react';

interface DashboardProps {
  comparison: TaxComparison;
  strategies: Strategy[];
  userName: string;
}

const Dashboard = ({ comparison, strategies, userName }: DashboardProps) => {
  const [visibleStrategies, setVisibleStrategies] = useState(10);
  const [showUpsell, setShowUpsell] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && strategies.length > 10) {
      const timer = setTimeout(() => setShowUpsell(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, strategies.length]);

  const totalSavings = strategies.slice(0, visibleStrategies).reduce((acc, s) => acc + s.estimatedSavings, 0);
  const hiddenCount = strategies.length - visibleStrategies;

  if (loading) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-serif font-bold mb-2">Analyzing Your Profile…</h2>
        <p className="text-sm text-muted-foreground mb-8">Running {strategies.length}+ tax strategies against your profile</p>
        <div className="space-y-3 max-w-sm mx-auto">
          {['Calculating tax under both regimes', 'Matching strategies to your profile', 'Ranking by savings impact'].map((text, i) => (
            <div key={i} className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 600}ms` }}>
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shimmer">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-bold mb-1">Your Tax Report</h2>
        <p className="text-sm text-muted-foreground">Prepared for {userName}</p>
      </div>

      {/* Regime Comparison */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`card-premium p-4 ${comparison.recommended === 'old' ? 'border-primary/40' : ''}`}>
          {comparison.recommended === 'old' && (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2 inline-block">
              ✓ Recommended
            </span>
          )}
          <p className="text-xs text-muted-foreground mb-1">Old Regime Tax</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(comparison.oldRegime.totalTax)}</p>
          <p className="text-[10px] text-muted-foreground">Deductions: {formatCurrency(comparison.oldRegime.totalDeductions)}</p>
        </div>
        <div className={`card-premium p-4 ${comparison.recommended === 'new' ? 'border-primary/40' : ''}`}>
          {comparison.recommended === 'new' && (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2 inline-block">
              ✓ Recommended
            </span>
          )}
          <p className="text-xs text-muted-foreground mb-1">New Regime Tax</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(comparison.newRegime.totalTax)}</p>
          <p className="text-[10px] text-muted-foreground">Std. Deduction: ₹75,000</p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="card-premium p-4 mb-4 border-primary/20">
        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {comparison.recommended === 'old' ? 'Old' : 'New'} Regime saves you {formatCurrency(comparison.savings)}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{comparison.reason}</p>
          </div>
        </div>
      </div>

      {/* Tax breakdown */}
      <div className="card-premium p-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Tax Breakdown ({comparison.recommended === 'old' ? 'Old' : 'New'} Regime)</h3>
        {(() => {
          const r = comparison.recommended === 'old' ? comparison.oldRegime : comparison.newRegime;
          return (
            <div className="space-y-2">
              {[
                { label: 'Gross Income', value: r.grossIncome, color: 'text-foreground' },
                { label: 'Deductions', value: -r.totalDeductions, color: 'text-success' },
                { label: 'Taxable Income', value: r.taxableIncome, color: 'text-foreground' },
                { label: 'Base Tax', value: r.baseTax, color: 'text-destructive' },
                { label: 'Surcharge', value: r.surcharge, color: 'text-destructive' },
                { label: 'Health & Education Cess (4%)', value: r.cess, color: 'text-destructive' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={`font-medium ${item.color}`}>
                    {item.value < 0 ? '-' : ''}{formatCurrency(Math.abs(item.value))}
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-sm font-semibold text-foreground">Total Tax Payable</span>
                <span className="text-sm font-bold gold-gradient-text">{formatCurrency(r.totalTax)}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Savings summary */}
      <div className="card-premium p-5 mb-6 border-success/20 bg-success/5">
        <div className="flex items-center gap-3">
          <TrendingDown className="w-6 h-6 text-success" />
          <div>
            <p className="text-xs text-success font-medium">Total Potential Savings from Strategies</p>
            <p className="text-2xl font-serif font-bold text-success">{formatCurrency(totalSavings)}</p>
          </div>
        </div>
      </div>

      {/* Strategies */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif font-bold text-foreground">
            Top {Math.min(visibleStrategies, strategies.length)} Strategies
          </h3>
          <span className="text-xs text-muted-foreground">{strategies.length} total analyzed</span>
        </div>

        <div className="space-y-3">
          {strategies.slice(0, visibleStrategies).map((s, i) => (
            <StrategyCard key={s.id} strategy={s} index={i} />
          ))}
        </div>
      </div>

      {/* Upsell */}
      {showUpsell && hiddenCount > 0 && (
        <div className="card-premium border-primary/30 p-6 text-center mb-6 animate-slide-up">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-gold-dark" />
          <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">
            You have {hiddenCount} more strategies available
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Based on your profile, we found additional advanced strategies
          </p>

          {/* Preview locked */}
          <div className="space-y-2 mb-5">
            {strategies.slice(visibleStrategies, visibleStrategies + 3).map((s, i) => (
              <StrategyCard key={s.id} strategy={s} index={visibleStrategies + i} locked />
            ))}
          </div>

          <button
            onClick={() => setVisibleStrategies(prev => prev + 10)}
            className="btn-gold w-full flex items-center justify-center gap-2"
          >
            Unlock {Math.min(10, hiddenCount)} More Strategies · ₹199 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Download */}
      <button className="w-full card-premium p-4 flex items-center justify-center gap-2 text-sm font-medium text-foreground hover:border-primary/30 transition-all">
        <Download className="w-4 h-4 text-primary" />
        Download PDF Report
      </button>

      <p className="text-center text-[10px] text-muted-foreground mt-6 mb-10">
        Disclaimer: This report is for informational purposes only. Consult a qualified Chartered Accountant before making tax decisions.
        All strategies are based on the Indian Income Tax Act and commonly accepted interpretations.
      </p>
    </div>
  );
};

export default Dashboard;
