import { TaxComparison } from '@/lib/types';
import { Lock, Shield, Check, Zap, FileText, Star, ArrowRight, AlertTriangle, TrendingDown, IndianRupee } from 'lucide-react';
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

  const missedDeductions = comparison.oldRegime.totalDeductions;
  const effectiveRate = comparison.recommended === 'old'
    ? ((comparison.oldRegime.totalTax / comparison.oldRegime.grossIncome) * 100)
    : ((comparison.newRegime.totalTax / comparison.newRegime.grossIncome) * 100);

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* HERO: Tax Overpayment Alert - Very prominent */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/20 via-destructive/10 to-orange-500/10" />
        <div className="relative p-6 md:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-destructive uppercase tracking-wider mb-2">
            ⚠️ Tax Overpayment Detected
          </p>
          <p className="text-4xl md:text-5xl font-serif font-bold text-destructive mb-2">
            {formatCurrency(savings)}
          </p>
          <p className="text-base text-destructive/80 font-medium mb-4">
            You are paying more tax than you should
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-destructive/60 text-xs">Without Optimization</p>
              <p className="text-lg font-bold text-destructive line-through">{formatCurrency(currentTax)}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-destructive/40" />
            <div className="text-center">
              <p className="text-success/80 text-xs">With Optimization</p>
              <p className="text-lg font-bold text-success">{formatCurrency(optimizedTax)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loss Visibility Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card-premium p-4 border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-destructive" />
            <span className="text-xs font-semibold text-destructive">Tax Overpaid</span>
          </div>
          <p className="text-xl font-bold text-destructive">{formatCurrency(savings)}</p>
          <p className="text-[10px] text-destructive/60 mt-1">Every year you delay</p>
        </div>
        <div className="card-premium p-4 border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-semibold text-orange-600">Effective Rate</span>
          </div>
          <p className="text-xl font-bold text-orange-600">{effectiveRate.toFixed(1)}%</p>
          <p className="text-[10px] text-orange-600/60 mt-1">Can be reduced further</p>
        </div>
      </div>

      {/* Quick Comparison - Enhanced */}
      <div className="card-premium p-5 mb-6 border-primary/20">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Your Tax Optimization Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Tax Liability</span>
            <span className="text-sm font-semibold text-destructive">{formatCurrency(currentTax)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Optimized Tax</span>
            <span className="text-sm font-semibold text-success">{formatCurrency(optimizedTax)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Recommended Regime</span>
            <span className="text-sm font-semibold text-primary">
              {comparison.recommended === 'old' ? 'Old Regime' : 'New Regime'}
            </span>
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">💰 Your Potential Savings</span>
              <span className="text-xl font-bold gold-gradient-text">{formatCurrency(savings)}</span>
            </div>
            {/* Progress bar showing savings as percentage */}
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((savings / currentTax) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {((savings / currentTax) * 100).toFixed(0)}% reduction possible
            </p>
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
        <p className="text-xs text-destructive font-medium mb-2">
          You're leaving {formatCurrency(savings)} on the table
        </p>
        <p className="text-xs text-muted-foreground line-through mb-1">₹9,999</p>
        <p className="text-4xl font-serif font-bold gold-gradient-text mb-1">₹499</p>
        <p className="text-xs text-muted-foreground mb-5">One-time payment · Instant access</p>

        <button onClick={onUnlock} className="btn-gold w-full text-base flex items-center justify-center gap-2">
          Unlock {formatCurrency(savings)} in Savings <ArrowRight className="w-5 h-5" />
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
