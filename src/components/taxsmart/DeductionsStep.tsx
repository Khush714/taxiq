import { DeductionDetails } from '@/lib/types';
import { Receipt, ChevronRight, ChevronLeft, Info } from 'lucide-react';

interface DeductionsStepProps {
  deductions: DeductionDetails;
  onUpdate: (d: DeductionDetails) => void;
  onNext: () => void;
  onBack: () => void;
  isSenior: boolean;
}

const DeductionsStep = ({ deductions, onUpdate, onNext, onBack, isSenior }: DeductionsStepProps) => {
  const fields: { key: keyof DeductionDetails; label: string; limit: string; max?: number }[] = [
    { key: 'section80C', label: 'Section 80C (ELSS, PPF, EPF, LIC, etc.)', limit: 'Max ₹1,50,000', max: 150000 },
    { key: 'homeLoanPrincipal', label: 'Home Loan Principal (also under 80C)', limit: 'Part of 80C limit' },
    { key: 'section80D', label: 'Health Insurance – Self & Family (80D)', limit: isSenior ? 'Max ₹50,000' : 'Max ₹25,000', max: isSenior ? 50000 : 25000 },
    { key: 'section80DParents', label: 'Health Insurance – Parents (80D)', limit: 'Max ₹50,000', max: 50000 },
    { key: 'nps80CCD1B', label: 'NPS Additional (80CCD(1B))', limit: 'Max ₹50,000', max: 50000 },
    { key: 'homeLoanInterest', label: 'Home Loan Interest (Sec 24)', limit: 'Max ₹2,00,000', max: 200000 },
    { key: 'educationLoanInterest', label: 'Education Loan Interest (80E)', limit: 'No limit' },
    { key: 'donations80G', label: 'Donations (80G)', limit: 'Varies by institution' },
    { key: 'savingsInterest80TTA', label: 'Savings Interest (80TTA/80TTB)', limit: isSenior ? 'Max ₹50,000' : 'Max ₹10,000', max: isSenior ? 50000 : 10000 },
  ];

  const total = Object.values(deductions).reduce((a, b) => a + b, 0);

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Deductions</h2>
        <p className="text-muted-foreground text-sm">Applicable under Old Tax Regime</p>
      </div>

      <div className="card-premium p-4 mb-4 flex items-start gap-2 border-primary/20">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          These deductions apply under the Old Regime. We'll compare both regimes to recommend the best one for you.
        </p>
      </div>

      <div className="card-premium p-6 space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-sm font-medium text-foreground">{f.label}</label>
              <span className="text-[10px] text-muted-foreground">{f.limit}</span>
            </div>
            <input
              type="number"
              value={deductions[f.key] || ''}
              onChange={(e) => {
                let val = parseFloat(e.target.value) || 0;
                if (f.max) val = Math.min(val, f.max);
                onUpdate({ ...deductions, [f.key]: val });
              }}
              className="input-premium w-full"
              placeholder="₹"
            />
            {f.max && deductions[f.key] >= f.max && (
              <p className="text-primary text-[10px] mt-0.5">✓ Maximum limit reached</p>
            )}
          </div>
        ))}

        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Total Deductions Claimed</span>
            <span className="text-lg font-bold gold-gradient-text">₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 p-3 rounded-lg border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} className="flex-[2] btn-gold flex items-center justify-center gap-2">
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DeductionsStep;
