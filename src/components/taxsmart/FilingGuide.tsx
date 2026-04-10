import { useState } from 'react';
import { TaxComparison, IncomeDetails } from '@/lib/types';
import { formatCurrency } from '@/lib/taxEngine';
import {
  Clock, Briefcase, FileText, MapPin, Search, CheckCircle2,
  AlertCircle, ExternalLink, ChevronDown, ChevronUp, Flag,
  MessageSquare, IndianRupee, BookOpen
} from 'lucide-react';

interface FilingGuideProps {
  comparison: TaxComparison;
  income?: IncomeDetails;
}

const FilingGuide = ({ comparison, income }: FilingGuideProps) => {
  const [caCity, setCaCity] = useState('');
  const [expandedFiling, setExpandedFiling] = useState(false);

  const grossIncome = comparison.oldRegime.grossIncome;

  // Determine income sources
  const incomeSources: { name: string; amount: number }[] = [];
  if (income) {
    if (income.salary > 0) incomeSources.push({ name: 'Salary', amount: income.salary });
    if (income.bonus > 0) incomeSources.push({ name: 'Bonus', amount: income.bonus });
    if (income.capitalGainsSTCG > 0) incomeSources.push({ name: 'STCG', amount: income.capitalGainsSTCG });
    if (income.capitalGainsLTCG > 0) incomeSources.push({ name: 'LTCG', amount: income.capitalGainsLTCG });
    if (income.rentalIncome > 0) incomeSources.push({ name: 'Rental', amount: income.rentalIncome });
    if (income.interestIncome > 0) incomeSources.push({ name: 'Interest', amount: income.interestIncome });
    if (income.businessIncome > 0) incomeSources.push({ name: 'Business', amount: income.businessIncome });
    if (income.otherIncome > 0) incomeSources.push({ name: 'Other', amount: income.otherIncome });
  }

  const primarySource = incomeSources.length > 0
    ? incomeSources.reduce((a, b) => a.amount > b.amount ? a : b).name
    : 'Salary';

  const filingSteps = [
    { step: 1, title: 'Gather Documents', desc: 'Collect Form 16, bank statements, investment proofs, rent receipts, and Form 26AS.' },
    { step: 2, title: 'Choose Tax Regime', desc: `Based on our analysis, the ${comparison.recommended === 'old' ? 'Old' : 'New'} Regime is better for you, saving ${formatCurrency(comparison.savings)}.` },
    { step: 3, title: 'Register on e-Filing Portal', desc: 'Go to incometax.gov.in and register/login with your PAN card.' },
    { step: 4, title: 'Select Correct ITR Form', desc: grossIncome > 5000000 ? 'With your income level, you may need ITR-2 or ITR-3.' : 'ITR-1 (Sahaj) is suitable for most salaried individuals with income up to ₹50L.' },
    { step: 5, title: 'Fill Income Details', desc: 'Enter salary, other income sources, deductions, and TDS details carefully.' },
    { step: 6, title: 'Verify & Submit', desc: 'Cross-check all entries with Form 26AS. Submit and e-verify using Aadhaar OTP or net banking.' },
    { step: 7, title: 'Pay Remaining Tax', desc: 'If any tax is due after TDS, pay via Challan 280 on the e-Filing portal before filing.' },
    { step: 8, title: 'Keep Records', desc: 'Save ITR acknowledgment and keep challan receipt for records. Update payment details in ITR before filing.' },
  ];

  const filingTips = [
    'File early to avoid last-minute rush and technical issues',
    'Double-check all bank account numbers and IFSC codes',
    'Keep digital copies of all supporting documents',
    grossIncome > 5000000 ? 'With income exceeding ₹50 lakhs, audit may be required' : 'If income exceeds ₹50 lakhs, audit may be required',
    'Set up advance tax payments if applicable for next year',
    'Check Form 26AS to ensure all TDS is reflected',
  ];

  const usefulLinks = [
    { label: 'Income Tax e-Filing Portal', url: 'https://www.incometax.gov.in/' },
    { label: 'How to File ITR Guide', url: 'https://www.incometax.gov.in/iec/foportal/help/how-to-file-itr' },
    { label: 'View Form 26AS', url: 'https://www.tdscpc.gov.in/app/login.xhtml' },
    { label: 'Pay Tax Online (Challan)', url: 'https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp' },
  ];

  const taxTreatments = [
    { type: 'Salary', desc: 'Taxed as per applicable slab rates after standard deduction' },
    { type: 'Bonus', desc: 'Fully taxable as salary income in the year received' },
    { type: 'Capital Gains', desc: 'LTCG and STCG have different tax rates and exemptions' },
    { type: 'Other Income', desc: 'Taxable as per income type (interest, rental, etc.)' },
  ];

  const handleSearchCA = () => {
    if (caCity.trim()) {
      window.open(`https://www.google.com/search?q=chartered+accountant+near+${encodeURIComponent(caCity.trim())}+tax+filing`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Important Deadlines */}
      <div className="card-premium p-4 border-[hsl(45,80%,70%)]/30 bg-[hsl(45,100%,96%)]/5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Important Deadlines</h4>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>• Advance tax Q4: March 15, 2026</li>
          <li>• Investment deadline: March 31, 2026</li>
          <li>• Tax filing deadline: July 31, 2026</li>
        </ul>
      </div>

      {/* Income Breakdown */}
      <div className="card-premium p-4">
        <h4 className="text-sm font-semibold text-foreground mb-1">Income Breakdown</h4>
        <p className="text-xs text-muted-foreground mb-3">Detailed analysis of your income sources</p>

        {/* Gradient hero card */}
        <div className="rounded-xl p-5 mb-4" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(280, 70%, 55%))' }}>
          <p className="text-xs text-white/80 mb-1">Total Gross Income</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(grossIncome)}</p>
          <p className="text-xs text-white/70 mt-1">For Financial Year 2025-26</p>
        </div>

        {/* Source stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Income Sources</p>
            <p className="text-lg font-bold text-foreground">{incomeSources.length || 1}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Primary Source</p>
            <p className="text-sm font-bold text-foreground">{primarySource}</p>
          </div>
        </div>

        {/* Income bars */}
        {incomeSources.length > 0 && (
          <div className="space-y-2 mb-4">
            {incomeSources.map((src) => {
              const pct = grossIncome > 0 ? (src.amount / grossIncome) * 100 : 0;
              return (
                <div key={src.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {src.name}
                    </span>
                    <span className="text-foreground font-medium">{formatCurrency(src.amount)} <span className="text-muted-foreground">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(280, 70%, 55%))' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tax Treatment */}
        <div className="bg-[hsl(45,100%,96%)]/5 border border-[hsl(45,80%,70%)]/20 rounded-lg p-3">
          <h5 className="text-xs font-semibold text-primary mb-2">Tax Treatment by Income Type</h5>
          <ul className="space-y-1.5">
            {taxTreatments.map((t) => (
              <li key={t.type} className="text-[11px] text-muted-foreground">
                • <span className="font-semibold text-foreground">{t.type}:</span> {t.desc}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* How to File Your ITR */}
      <div className="card-premium p-4">
        <button
          onClick={() => setExpandedFiling(!expandedFiling)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">How to File Your ITR</h4>
          </div>
          {expandedFiling ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {expandedFiling && (
          <div className="mt-4 space-y-3 animate-fade-in">
            {filingSteps.map((s) => (
              <div key={s.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Filing Tips */}
      <div className="card-premium p-4 border-[hsl(200,70%,80%)]/20 bg-[hsl(200,80%,96%)]/5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-[hsl(200,70%,50%)]" />
          <h4 className="text-sm font-semibold text-foreground">Quick Filing Tips</h4>
        </div>
        <ul className="space-y-1.5">
          {filingTips.map((tip, i) => (
            <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
          ))}
        </ul>
      </div>

      {/* Useful Links */}
      <div className="card-premium p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Useful Links</h4>
        <div className="grid grid-cols-2 gap-2">
          {usefulLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Find a CA */}
      <div className="card-premium p-5 bg-secondary/30">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-primary" />
          <h4 className="text-base font-semibold text-foreground">Need Professional Help?</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Connect with verified Chartered Accountants in your area for tax filing and planning</p>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={caCity}
              onChange={(e) => setCaCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchCA()}
              placeholder="Enter your city (e.g., Mumbai, Delhi, Bangalore)"
              className="input-premium w-full pl-9 text-sm"
            />
          </div>
          <button
            onClick={handleSearchCA}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 rounded-lg text-sm font-medium shrink-0 transition-colors"
          >
            Search CAs
          </button>
        </div>

        {/* Why consult a CA */}
        <div className="bg-secondary/50 rounded-lg p-4">
          <h5 className="text-xs font-semibold text-foreground mb-2">Why consult a CA?</h5>
          <ul className="space-y-1.5">
            {[
              'Professional guidance on complex tax matters and compliance',
              'Help with accurate tax filing and documentation',
              'Personalized tax planning strategies for your financial situation',
              'Representation in case of IT notices or scrutiny',
            ].map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="card-premium p-4 border-destructive/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Disclaimer</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This tool provides tax insights for educational purposes only. Tax laws are complex and subject to change.
              Please consult a chartered accountant before implementing any strategies. TaxSmart AI is not liable for any
              financial decisions made based on this report. All calculations are based on the Indian Income Tax Act
              (FY 2025-26) and commonly accepted interpretations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilingGuide;
