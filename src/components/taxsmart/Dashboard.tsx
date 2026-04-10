import { useState, useEffect } from 'react';
import { TaxComparison, Strategy, TaxResult, IncomeDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/taxEngine';
import { downloadTaxReport } from '@/lib/pdfGenerator';
import StrategyCard from './StrategyCard';
import RegimeGuidance from './RegimeGuidance';
import FilingGuide from './FilingGuide';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowRight, Download, TrendingDown, TrendingUp, Scale, Sparkles, Mail, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardProps {
  comparison: TaxComparison;
  strategies: Strategy[];
  userName: string;
  income?: IncomeDetails;
}

const StepNumber = ({ num, active = true }: { num: number; active?: boolean }) => (
  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
  }`}>
    {num}
  </div>
);

const StepConnector = () => (
  <div className="w-7 flex justify-center">
    <div className="w-0.5 h-4 bg-primary/20" />
  </div>
);

const RegimeDetail = ({ result, label }: { result: TaxResult; label: string }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleStep = (step: number) => {
    setExpandedStep(expandedStep === step ? null : step);
  };

  // Calculate slab tax (before rebate, before cap gains)
  const slabTax = result.slabBreakdown.reduce((sum, s) => sum + s.tax, 0);

  // Tax after rebate (on slab income only)
  const taxAfterRebate = Math.max(0, slabTax - result.rebate87A);

  // Total base = slab tax after rebate + capital gains tax
  const totalBeforeSurcharge = taxAfterRebate + result.capitalGainsTax;

  return (
    <div className="space-y-0 animate-fade-in">
      {/* Step 1: Gross Income */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <StepNumber num={1} />
          <StepConnector />
        </div>
        <div className="flex-1 pb-3">
          <p className="text-xs font-semibold text-foreground mb-1">Step 1: Gross Total Income</p>
          <p className="text-xs text-muted-foreground mb-2">Sum of all income sources before any deductions</p>
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex justify-between text-sm font-semibold">
              <span>Gross Total Income</span>
              <span className="text-foreground">{formatCurrency(result.grossIncome)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Deductions */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <StepNumber num={2} />
          <StepConnector />
        </div>
        <div className="flex-1 pb-3">
          <p className="text-xs font-semibold text-foreground mb-1">Step 2: Deductions</p>
          <p className="text-xs text-muted-foreground mb-2">
            {label === 'Old Regime'
              ? 'Deductions under 80C, 80D, 24(b), NPS, and standard deduction'
              : 'Only standard deduction of ₹75,000 allowed under New Regime'}
          </p>
          <div className="bg-secondary/50 rounded-lg p-3">
            <button
              onClick={() => toggleStep(2)}
              className="flex justify-between w-full text-sm font-semibold items-center"
            >
              <span className="flex items-center gap-1">
                Total Deductions
                {expandedStep === 2 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </span>
              <span className="text-success">-{formatCurrency(result.totalDeductions)}</span>
            </button>
            {expandedStep === 2 && (
              <div className="mt-2 pt-2 border-t border-border space-y-1.5 animate-fade-in">
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
        </div>
      </div>

      {/* Step 3: Taxable Income */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <StepNumber num={3} />
          <StepConnector />
        </div>
        <div className="flex-1 pb-3">
          <p className="text-xs font-semibold text-foreground mb-1">Step 3: Net Taxable Income</p>
          <p className="text-xs text-muted-foreground mb-2">Gross Income minus Deductions (excluding capital gains taxed separately)</p>
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="text-[11px] text-muted-foreground space-y-1 mb-2">
              <div className="flex justify-between">
                <span>Gross Income</span>
                <span>{formatCurrency(result.grossIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span>− Deductions</span>
                <span className="text-success">-{formatCurrency(result.totalDeductions)}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
              <span>Net Taxable Income</span>
              <span className="text-foreground">{formatCurrency(result.taxableIncome)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Slab-wise Tax */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <StepNumber num={4} />
          <StepConnector />
        </div>
        <div className="flex-1 pb-3">
          <p className="text-xs font-semibold text-foreground mb-1">Step 4: Tax on Slab Rates</p>
          <p className="text-xs text-muted-foreground mb-2">
            Apply {label === 'Old Regime' ? 'Old' : 'New'} Regime tax slabs to your taxable income
          </p>
          <div className="bg-secondary/50 rounded-lg p-3">
            <button
              onClick={() => toggleStep(4)}
              className="flex justify-between w-full text-sm font-semibold items-center"
            >
              <span className="flex items-center gap-1">
                Slab-wise Breakdown
                {expandedStep === 4 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </span>
              <span>{formatCurrency(slabTax)}</span>
            </button>
            {expandedStep === 4 && (
              <div className="mt-2 pt-2 border-t border-border space-y-1.5 animate-fade-in">
                {result.slabBreakdown.map((slab, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      {slab.range} @ {slab.rate}%
                      {slab.taxableAmount > 0 && (
                        <span className="text-muted-foreground/60 ml-1">
                          (on ₹{slab.taxableAmount.toLocaleString('en-IN')})
                        </span>
                      )}
                    </span>
                    <span className={`font-medium ${slab.tax > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      ₹{slab.tax.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 5: Rebate (if applicable) */}
      {result.rebate87A > 0 && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <StepNumber num={5} />
            <StepConnector />
          </div>
          <div className="flex-1 pb-3">
            <p className="text-xs font-semibold text-foreground mb-1">Step 5: Rebate under Section 87A</p>
            <p className="text-xs text-muted-foreground mb-2">
              {label === 'Old Regime'
                ? 'If taxable income ≤ ₹5L, rebate up to ₹12,500'
                : 'If taxable income ≤ ₹7L, rebate up to ₹25,000'}
            </p>
            <div className="bg-success/5 border border-success/20 rounded-lg p-3">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-success">Rebate u/s 87A</span>
                <span className="text-success">-₹{result.rebate87A.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>Tax after rebate</span>
                <span>{formatCurrency(taxAfterRebate)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5/6: Capital Gains Tax */}
      {result.capitalGainsTax > 0 && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <StepNumber num={result.rebate87A > 0 ? 6 : 5} />
            <StepConnector />
          </div>
          <div className="flex-1 pb-3">
            <p className="text-xs font-semibold text-foreground mb-1">
              Step {result.rebate87A > 0 ? 6 : 5}: Capital Gains Tax (Special Rates)
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Capital gains are taxed at flat rates, not through slabs
            </p>
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
              {result.stcgTax > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">STCG @ 20%</span>
                  <span className="font-medium">₹{result.stcgTax.toLocaleString('en-IN')}</span>
                </div>
              )}
              {result.ltcgTax > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">LTCG @ 12.5% (above ₹1.25L exemption)</span>
                  <span className="font-medium">₹{result.ltcgTax.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-semibold border-t border-border pt-1.5">
                <span>Capital Gains Tax</span>
                <span>{formatCurrency(result.capitalGainsTax)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step: Surcharge + Cess */}
      {(() => {
        const stepNum = 4 + (result.rebate87A > 0 ? 1 : 0) + (result.capitalGainsTax > 0 ? 1 : 0) + 1;
        return (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepNumber num={stepNum} />
              <StepConnector />
            </div>
            <div className="flex-1 pb-3">
              <p className="text-xs font-semibold text-foreground mb-1">
                Step {stepNum}: Surcharge & Health Education Cess
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Surcharge on high incomes + 4% cess on total tax
              </p>
              <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Tax before surcharge & cess</span>
                  <span>{formatCurrency(totalBeforeSurcharge)}</span>
                </div>
                {result.surcharge > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">+ Surcharge</span>
                    <span className="font-medium">{formatCurrency(result.surcharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">+ Health & Education Cess (4%)</span>
                  <span className="font-medium">{formatCurrency(result.cess)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Final Step: Total Tax */}
      {(() => {
        const finalStep = 4 + (result.rebate87A > 0 ? 1 : 0) + (result.capitalGainsTax > 0 ? 1 : 0) + 2;
        return (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepNumber num={finalStep} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground mb-1">
                Step {finalStep}: Total Tax Payable
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">Total Tax Payable</span>
                  <span className="text-lg font-bold gold-gradient-text">{formatCurrency(result.totalTax)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Effective Tax Rate: {result.grossIncome > 0 ? ((result.totalTax / result.grossIncome) * 100).toFixed(2) : '0.00'}%
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
const Dashboard = ({ comparison, strategies, userName, income }: DashboardProps) => {
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

      {/* Regime Guidance & Charts */}
      <RegimeGuidance comparison={comparison} />

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

      {/* Filing Guide, CA Finder, Disclaimer */}
      <FilingGuide comparison={comparison} income={income} />
    </div>
  );
};

export default Dashboard;
