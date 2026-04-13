import { useState } from 'react';
import { IncomeDetails } from '@/lib/types';
import { IndianRupee, ChevronRight, ChevronLeft, PenLine, FileUp, CheckCircle2 } from 'lucide-react';
import CurrencyInput from './CurrencyInput';
import AISUploader from './AISUploader';

interface IncomeStepProps {
  income: IncomeDetails;
  onUpdate: (income: IncomeDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

const fields: { key: keyof IncomeDetails; label: string; placeholder: string }[] = [
  { key: 'salary', label: 'Annual Salary (CTC)', placeholder: '₹ e.g. 25,00,000' },
  { key: 'bonus', label: 'Bonus / Variable Pay', placeholder: '₹ e.g. 5,00,000' },
  { key: 'capitalGainsSTCG', label: 'Short-Term Capital Gains', placeholder: '₹' },
  { key: 'capitalGainsLTCG', label: 'Long-Term Capital Gains', placeholder: '₹' },
  { key: 'rentalIncome', label: 'Rental Income', placeholder: '₹' },
  { key: 'interestIncome', label: 'Interest Income (FD, Savings)', placeholder: '₹' },
  { key: 'businessIncome', label: 'Business / Freelance Income', placeholder: '₹' },
  { key: 'otherIncome', label: 'Other Income', placeholder: '₹' },
];

type InputMode = 'select' | 'manual' | 'ais';

const IncomeStep = ({ income, onUpdate, onNext, onBack }: IncomeStepProps) => {
  const [mode, setMode] = useState<InputMode>('select');
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const total = Object.values(income).reduce((a, b) => a + b, 0);

  const handleAutoFill = (extracted: Partial<IncomeDetails>, extractedFields: string[]) => {
    const updated = { ...income, ...extracted };
    onUpdate(updated);
    setAutoFilledFields(extractedFields);
    setMode('manual');
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <IndianRupee className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Your Income</h2>
        <p className="text-muted-foreground text-sm">Tell us about all your income sources</p>
      </div>

      {/* Input method selection */}
      {mode === 'select' && (
        <div className="space-y-4">
          <p className="text-center text-sm font-medium text-foreground mb-4">
            How do you want to enter your income details?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setMode('manual')}
              className="card-premium p-5 text-left hover:border-primary/50 transition-all group"
            >
              <PenLine className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground mb-1">Enter Manually</p>
              <p className="text-xs text-muted-foreground">Fill in your income details step by step</p>
            </button>
            <button
              onClick={() => setMode('ais')}
              className="card-premium p-5 text-left hover:border-primary/50 transition-all group"
            >
              <FileUp className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground mb-1">Auto-Fill using AIS</p>
              <p className="text-xs text-muted-foreground">Upload your AIS PDF to auto-fill income</p>
            </button>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onBack} className="flex-1 p-3 rounded-lg border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      )}

      {/* AIS Upload mode */}
      {mode === 'ais' && (
        <div className="card-premium p-6">
          <AISUploader
            onAutoFill={handleAutoFill}
            onCancel={() => setMode('manual')}
          />
          <button
            onClick={() => setMode('select')}
            className="w-full mt-4 p-2.5 rounded-lg border border-border text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to options
          </button>
        </div>
      )}

      {/* Manual input mode */}
      {mode === 'manual' && (
        <>
          {autoFilledFields.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Auto-filled from AIS</p>
                <p className="text-xs text-muted-foreground">We've auto-filled your income based on AIS. Please review and edit if needed.</p>
              </div>
            </div>
          )}

          <div className="card-premium p-6 space-y-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  {f.label}
                  {autoFilledFields.some(af =>
                    f.label.toLowerCase().includes(af.toLowerCase()) ||
                    af.toLowerCase().includes(f.key.toLowerCase().replace('capitalgains', 'capital gain'))
                  ) && (
                    <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">AIS</span>
                  )}
                </label>
                <CurrencyInput
                  value={income[f.key]}
                  onChange={(val) => onUpdate({ ...income, [f.key]: val })}
                  className="w-full"
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
        </>
      )}
    </div>
  );
};

export default IncomeStep;
