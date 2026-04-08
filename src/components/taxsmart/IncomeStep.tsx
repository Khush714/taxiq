import { IncomeDetails } from '@/lib/types';
import { IndianRupee, ChevronRight, ChevronLeft } from 'lucide-react';

interface IncomeStepProps {
  income: IncomeDetails;
  onUpdate: (income: IncomeDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

const fields: { key: keyof IncomeDetails; label: string; placeholder: string }[] = [
  { key: 'salary', label: 'Annual Salary (CTC)', placeholder: '₹ e.g. 2500000' },
  { key: 'bonus', label: 'Bonus / Variable Pay', placeholder: '₹ e.g. 500000' },
  { key: 'capitalGainsSTCG', label: 'Short-Term Capital Gains', placeholder: '₹' },
  { key: 'capitalGainsLTCG', label: 'Long-Term Capital Gains', placeholder: '₹' },
  { key: 'rentalIncome', label: 'Rental Income', placeholder: '₹' },
  { key: 'interestIncome', label: 'Interest Income (FD, Savings)', placeholder: '₹' },
  { key: 'businessIncome', label: 'Business / Freelance Income', placeholder: '₹' },
  { key: 'otherIncome', label: 'Other Income', placeholder: '₹' },
];

const IncomeStep = ({ income, onUpdate, onNext, onBack }: IncomeStepProps) => {
  const total = Object.values(income).reduce((a, b) => a + b, 0);

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <IndianRupee className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Your Income</h2>
        <p className="text-muted-foreground text-sm">Tell us about all your income sources</p>
      </div>

      <div className="card-premium p-6 space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium mb-1.5 text-foreground">{f.label}</label>
            <input
              type="number"
              value={income[f.key] || ''}
              onChange={(e) => onUpdate({ ...income, [f.key]: parseFloat(e.target.value) || 0 })}
              className="input-premium w-full"
              placeholder={f.placeholder}
            />
          </div>
        ))}

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Gross Total Income</span>
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

export default IncomeStep;
