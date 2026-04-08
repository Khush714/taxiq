import { TaxComparison, Strategy } from '@/lib/types';
import { Lock, Shield, Check, Zap, FileText, Star, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/taxEngine';

interface PaywallPageProps {
  comparison: TaxComparison;
  totalStrategies: number;
  onUnlock: () => void;
}

const PaywallPage = ({ comparison, totalStrategies, onUnlock }: PaywallPageProps) => {
  const savings = comparison.oldRegime.totalTax > comparison.newRegime.totalTax
    ? comparison.oldRegime.totalTax - comparison.newRegime.totalTax
    : comparison.newRegime.totalTax - comparison.oldRegime.totalTax;

  const currentTax = Math.max(comparison.oldRegime.totalTax, comparison.newRegime.totalTax);
  const optimizedTax = Math.min(comparison.oldRegime.totalTax, comparison.newRegime.totalTax);

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Alert banner */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 text-center mb-6">
        <p className="text-sm text-destructive font-medium mb-1">⚠️ Tax Overpayment Detected</p>
        <p className="text-3xl font-serif font-bold text-destructive">
          You're overpaying {formatCurrency(savings)}
        </p>
        <p className="text-xs text-destructive/70 mt-1">Based on your income and current deductions</p>
      </div>

      {/* Mini Breakdown */}
      <div className="card-premium p-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Quick Comparison</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Tax (without optimization)</span>
            <span className="text-sm font-semibold text-destructive">{formatCurrency(currentTax)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Optimized Tax</span>
            <span className="text-sm font-semibold text-success">{formatCurrency(optimizedTax)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Your Potential Savings</span>
            <span className="text-lg font-bold gold-gradient-text">{formatCurrency(savings)}</span>
          </div>
        </div>
      </div>

      {/* Value stack */}
      <div className="card-premium p-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">What You'll Get</h3>
        <div className="space-y-2.5">
          {[
            { icon: FileText, text: 'Personalized tax-saving report' },
            { icon: Star, text: `Top 10 strategies from ${totalStrategies} analyzed` },
            { icon: Zap, text: 'Capital gains optimization tactics' },
            { icon: Shield, text: 'Income structuring recommendations' },
            { icon: Check, text: 'Old vs New regime recommendation with reasoning' },
            { icon: Lock, text: 'Risk-rated strategy classification' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="card-premium border-primary/30 p-6 text-center mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-gold-dark" />
        <p className="text-xs text-muted-foreground line-through mb-1">₹9,999</p>
        <p className="text-4xl font-serif font-bold gold-gradient-text mb-1">₹499</p>
        <p className="text-xs text-muted-foreground mb-5">One-time payment · Instant access</p>

        <button onClick={onUnlock} className="btn-gold w-full text-base flex items-center justify-center gap-2">
          Unlock Full Report <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Shield, text: 'Razorpay Secured' },
          { icon: Lock, text: '256-bit Encryption' },
          { icon: Check, text: '100% Legal' },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="card-premium p-3 flex flex-col items-center gap-1.5 text-center">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-[10px] text-muted-foreground font-medium">{text}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-[10px] text-muted-foreground">
          Based on Indian Income Tax Act · Designed using CA-level logic · 100% legal strategies only
        </p>
      </div>
    </div>
  );
};

export default PaywallPage;
