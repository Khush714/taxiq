import { useState } from 'react';
import { IncomeDetails } from '@/lib/types';
import { IndianRupee, ChevronRight, ChevronLeft, PenLine, FileUp, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import CurrencyInput from './CurrencyInput';
import AISUploader from './AISUploader';
import Form16Uploader from './Form16Uploader';

interface IncomeStepProps {
  income: IncomeDetails;
  onUpdate: (income: IncomeDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

const fields: { key: keyof IncomeDetails; label: string; placeholder: string }[] = [
  { key: 'salary', label: 'Annual Salary (CTC)', placeholder: '₹ e.g. 25,00,000' },
  { key: 'basicSalary', label: 'Basic Salary', placeholder: '₹' },
  { key: 'hra', label: 'HRA Received', placeholder: '₹' },
  { key: 'rentPaid', label: 'Rent Paid (per year)', placeholder: '₹' },
  { key: 'bonus', label: 'Bonus / Variable Pay', placeholder: '₹ e.g. 5,00,000' },
  { key: 'capitalGainsSTCG', label: 'Short-Term Capital Gains', placeholder: '₹' },
  { key: 'capitalGainsLTCG', label: 'Long-Term Capital Gains', placeholder: '₹' },
  { key: 'rentalIncome', label: 'Rental Income', placeholder: '₹' },
  { key: 'interestIncome', label: 'Interest Income (FD, Savings)', placeholder: '₹' },
  { key: 'dividendIncome', label: 'Dividend Income', placeholder: '₹' },
  { key: 'businessIncome', label: 'Business / Freelance Income', placeholder: '₹' },
  { key: 'otherIncome', label: 'Other Income', placeholder: '₹' },
  { key: 'tds', label: 'TDS Already Deducted', placeholder: '₹' },
];

type InputMode = 'select' | 'manual' | 'ais' | 'form16';

interface ReconciliationItem {
  field: string;
  aisValue: number;
  form16Value: number;
  diff: number;
}

const IncomeStep = ({ income, onUpdate, onNext, onBack }: IncomeStepProps) => {
  const [mode, setMode] = useState<InputMode>('select');
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [autoFillSource, setAutoFillSource] = useState<'ais' | 'form16' | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationItem[]>([]);
  const [aisData, setAisData] = useState<Partial<IncomeDetails> | null>(null);
  const [form16Data, setForm16Data] = useState<Partial<IncomeDetails> | null>(null);

  const total = Object.entries(income)
    .filter(([k]) => k !== 'tds')
    .reduce((a, [, b]) => a + b, 0);

  const handleAutoFill = (extracted: Partial<IncomeDetails>, extractedFields: string[], source: 'ais' | 'form16') => {
    const updated = { ...income, ...extracted };
    onUpdate(updated);
    setAutoFilledFields(extractedFields);
    setAutoFillSource(source);

    if (source === 'ais') setAisData(extracted);
    if (source === 'form16') setForm16Data(extracted);

    // Reconcile if both sources available
    const otherData = source === 'ais' ? form16Data : aisData;
    if (otherData) {
      const items: ReconciliationItem[] = [];
      const checkFields: { key: keyof IncomeDetails; label: string }[] = [
        { key: 'salary', label: 'Salary' },
        { key: 'interestIncome', label: 'Interest Income' },
        { key: 'dividendIncome', label: 'Dividend Income' },
      ];
      const currentAis = source === 'ais' ? extracted : aisData!;
      const currentF16 = source === 'form16' ? extracted : form16Data!;
      for (const { key, label } of checkFields) {
        const a = currentAis[key] || 0;
        const f = currentF16[key] || 0;
        if (a > 0 && f > 0 && Math.abs(a - f) > 100) {
          items.push({ field: label, aisValue: a, form16Value: f, diff: a - f });
        }
      }
      setReconciliation(items);
    }

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

      {mode === 'select' && (
        <div className="space-y-4">
          <p className="text-center text-sm font-medium text-foreground mb-4">
            How do you want to enter your income details?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => setMode('manual')}
              className="card-premium p-5 text-left hover:border-primary/50 transition-all group">
              <PenLine className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground mb-1">Enter Manually</p>
              <p className="text-xs text-muted-foreground">Fill in your income details step by step</p>
            </button>
            <button onClick={() => setMode('ais')}
              className="card-premium p-5 text-left hover:border-primary/50 transition-all group">
              <FileUp className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground mb-1">Auto-Fill using AIS</p>
              <p className="text-xs text-muted-foreground">Upload your AIS PDF to auto-fill income</p>
            </button>
            <button onClick={() => setMode('form16')}
              className="card-premium p-5 text-left hover:border-primary/50 transition-all group">
              <FileText className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground mb-1">Auto-Fill using Form 16</p>
              <p className="text-xs text-muted-foreground">Upload Form 16 from your employer</p>
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onBack} className="flex-1 p-3 rounded-lg border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      )}

      {mode === 'ais' && (
        <div className="card-premium p-6">
          <AISUploader
            onAutoFill={(inc, fields) => handleAutoFill(inc, fields, 'ais')}
            onCancel={() => setMode('manual')}
          />
          <button onClick={() => setMode('select')}
            className="w-full mt-4 p-2.5 rounded-lg border border-border text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to options
          </button>
        </div>
      )}

      {mode === 'form16' && (
        <div className="card-premium p-6">
          <Form16Uploader
            onAutoFill={(inc, fields) => handleAutoFill(inc, fields, 'form16')}
            onCancel={() => setMode('manual')}
          />
          <button onClick={() => setMode('select')}
            className="w-full mt-4 p-2.5 rounded-lg border border-border text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to options
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <>
          {autoFilledFields.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Auto-filled from {autoFillSource === 'ais' ? 'AIS' : 'Form 16'}
                </p>
                <p className="text-xs text-muted-foreground">
                  We've auto-filled your income. Please review and edit if needed.
                </p>
              </div>
            </div>
          )}

          {reconciliation.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-foreground">AIS vs Form 16 Mismatch</p>
              </div>
              {reconciliation.map((r, i) => (
                <div key={i} className="text-xs text-muted-foreground pl-7">
                  <span className="font-medium text-foreground">{r.field}:</span>{' '}
                  AIS ₹{r.aisValue.toLocaleString('en-IN')} vs Form 16 ₹{r.form16Value.toLocaleString('en-IN')}{' '}
                  <span className="text-yellow-600">(₹{Math.abs(r.diff).toLocaleString('en-IN')} {r.diff > 0 ? 'more in AIS' : 'more in Form 16'})</span>
                </div>
              ))}
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
                    <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {autoFillSource === 'ais' ? 'AIS' : 'Form 16'}
                    </span>
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
