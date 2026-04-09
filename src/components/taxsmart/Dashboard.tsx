import { useState, useEffect } from 'react';
import { TaxComparison, Strategy, TaxResult } from '@/lib/types';
import { formatCurrency } from '@/lib/taxEngine';
import { downloadTaxReport } from '@/lib/pdfGenerator';
import StrategyCard from './StrategyCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowRight, Download, TrendingDown, TrendingUp, Scale, Sparkles, Mail, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardProps {
  comparison: TaxComparison;
  strategies: Strategy[];
  userName: string;
}

const RegimeDetail = ({ result, label }: { result: TaxResult; label: string }) => {
  const [showDeductions, setShowDeductions] = useState(false);

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Income & Deductions */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Gross Income</span>
          <span className="font-medium text-foreground">{formatCurrency(result.grossIncome)}</span>
        </div>

        <div>
          <button
            onClick={() => setShowDeductions(!showDeductions)}
            className="flex justify-between w-full text-xs items-center"
          >
            <span className="text-muted-foreground flex items-center gap-1">
              Total Deductions
              {showDeductions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
            <span className="font-medium text-success">-{formatCurrency(result.totalDeductions)}</span>
          </button>
          {showDeductions && (
            <div className="ml-3 mt-1 space-y-1 border-l-2 border-primary/20 pl-3 animate-fade-in">
              {Object.entries(result.deductionBreakdown)
                .filter(([, v]) => v > 0)
                .map(([key, val]) => (
                  <div key={key} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="text-success">₹{val.toLocaleString('en-IN')}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs font-semibold border-t border-border pt-2">
          <span className="text-foreground">Taxable Income</span>
          <span className="text-foreground">{formatCurrency(result.taxableIncome)}</span>
        </div>
      </div>

      {/* Slab-wise Breakdown */}
      <div className="bg-secondary/50 rounded-lg p-3">
        <p className="text-[11px] font-semibold text-foreground mb-2">Slab-wise Tax Calculation</p>
        <div className="space-y-1.5">
          {result.slabBreakdown.map((slab, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">
                {slab.range} @ {slab.rate}%
              </span>
              <span className={`font-medium ${slab.tax > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                ₹{slab.tax.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Capital Gains */}
      {result.capitalGainsTax > 0 && (
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-foreground mb-2">Capital Gains Tax</p>
          <div className="space-y-1.5">
            {result.stcgTax > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">STCG @ 20%</span>
                <span className="font-medium text-foreground">₹{result.stcgTax.toLocaleString('en-IN')}</span>
              </div>
            )}
            {result.ltcgTax > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">LTCG @ 12.5% (above ₹1.25L)</span>
                <span className="font-medium text-foreground">₹{result.ltcgTax.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="space-y-2 pt-1">
        {result.rebate87A > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-success">Rebate u/s 87A</span>
            <span className="font-medium text-success">-₹{result.rebate87A.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Income Tax</span>
          <span className="font-medium text-foreground">{formatCurrency(result.baseTax)}</span>
        </div>
        {result.surcharge > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Surcharge</span>
            <span className="font-medium text-foreground">{formatCurrency(result.surcharge)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Health & Education Cess (4%)</span>
          <span className="font-medium text-foreground">{formatCurrency(result.cess)}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="text-sm font-semibold text-foreground">Total Tax Payable</span>
          <span className="text-sm font-bold gold-gradient-text">{formatCurrency(result.totalTax)}</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ comparison, strategies, userName }: DashboardProps) => {
  const [visibleStrategies, setVisibleStrategies] = useState(10);
  const [showUpsell, setShowUpsell] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  const handleDownload = () => {
    setDownloading(true);
    try {
      downloadTaxReport(userName, comparison, strategies.slice(0, visibleStrategies));
      toast.success('PDF report downloaded successfully!');
    } catch {
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSent(true);
      toast.success(`Report will be sent to ${email}`, {
        description: 'Enable Lovable Cloud for live email delivery.',
      });
    }, 1500);
  };

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
    <div className="animate-fade-in max-w-2xl mx-auto relative z-10">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-serif font-bold mb-1">Your Tax Report</h2>
        <p className="text-sm text-muted-foreground">Prepared for {userName} · FY 2024-25</p>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`card-premium p-4 ${comparison.recommended === 'old' ? 'border-primary/40' : ''}`}>
          {comparison.recommended === 'old' && (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2 inline-block">
              ✓ Recommended
            </span>
          )}
          <p className="text-xs text-muted-foreground mb-1">Old Regime Tax</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(comparison.oldRegime.totalTax)}</p>
        </div>
        <div className={`card-premium p-4 ${comparison.recommended === 'new' ? 'border-primary/40' : ''}`}>
          {comparison.recommended === 'new' && (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2 inline-block">
              ✓ Recommended
            </span>
          )}
          <p className="text-xs text-muted-foreground mb-1">New Regime Tax</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(comparison.newRegime.totalTax)}</p>
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

      {/* Detailed Regime Breakdown with Tabs */}
      <div className="card-premium p-4 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Detailed Tax Breakdown</h3>
        <Tabs defaultValue={comparison.recommended}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="old" className="flex-1 text-xs">
              Old Regime
              {comparison.recommended === 'old' && <Check className="w-3 h-3 ml-1 text-primary" />}
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1 text-xs">
              New Regime
              {comparison.recommended === 'new' && <Check className="w-3 h-3 ml-1 text-primary" />}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="old">
            <RegimeDetail result={comparison.oldRegime} label="Old Regime" />
          </TabsContent>
          <TabsContent value="new">
            <RegimeDetail result={comparison.newRegime} label="New Regime" />
          </TabsContent>
        </Tabs>
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
          <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">
            You have {hiddenCount} more strategies available
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Based on your profile, we found additional advanced strategies
          </p>
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

      {/* Download & Email */}
      <div className="card-premium p-5 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          Get Your Report
        </h3>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-gold w-full flex items-center justify-center gap-2 mb-4"
        >
          {downloading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
          ) : (
            <><Download className="w-4 h-4" /> Download PDF Report</>
          )}
        </button>
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Or receive via email
          </p>
          {emailSent ? (
            <div className="flex items-center gap-2 text-success text-sm p-3 bg-success/10 rounded-lg">
              <Check className="w-4 h-4" />
              Report queued for delivery to {email}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-premium flex-1 text-sm"
              />
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="btn-gold px-4 flex items-center gap-1.5 text-sm shrink-0"
              >
                {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send</>}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-6 mb-10">
        Disclaimer: This report is for informational purposes only. Consult a qualified Chartered Accountant before making tax decisions.
        All strategies are based on the Indian Income Tax Act and commonly accepted interpretations.
      </p>
    </div>
  );
};

export default Dashboard;
