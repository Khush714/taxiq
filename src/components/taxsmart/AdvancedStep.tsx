import { AdvancedProfile } from '@/lib/types';
import { Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

interface AdvancedStepProps {
  advanced: AdvancedProfile;
  onUpdate: (a: AdvancedProfile) => void;
  onNext: () => void;
  onBack: () => void;
}

const AdvancedStep = ({ advanced, onUpdate, onNext, onBack }: AdvancedStepProps) => {
  const toggles: { key: keyof AdvancedProfile; label: string; description: string }[] = [
    { key: 'isStockInvestor', label: 'Stock / Mutual Fund Investor', description: 'Do you actively trade or hold equity investments?' },
    { key: 'hasELSS', label: 'ELSS Investments', description: 'Do you already invest in tax-saving ELSS funds?' },
    { key: 'hasProperty', label: 'Property Owner', description: 'Do you own any residential or commercial property?' },
    { key: 'hasForeignIncome', label: 'Foreign Income', description: 'Do you earn income from outside India?' },
    { key: 'hasHUF', label: 'HUF Exists', description: 'Do you have a Hindu Undivided Family registered?' },
    { key: 'hasBusinessIncome', label: 'Business / Freelance', description: 'Do you have any business or freelance income?' },
  ];

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Settings className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Advanced Profile</h2>
        <p className="text-muted-foreground text-sm">This helps us unlock advanced strategies</p>
      </div>

      <div className="card-premium p-6 space-y-3">
        {toggles.map(t => (
          <button
            key={t.key}
            onClick={() => onUpdate({ ...advanced, [t.key]: !advanced[t.key] })}
            className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
              advanced[t.key]
                ? 'border-primary/40 bg-primary/5'
                : 'border-border bg-secondary/30 hover:border-border'
            }`}
          >
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </div>
            <div className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${
              advanced[t.key] ? 'bg-primary justify-end' : 'bg-border justify-start'
            }`}>
              <div className="w-4 h-4 rounded-full bg-foreground" />
            </div>
          </button>
        ))}

        {advanced.hasProperty && (
          <div className="animate-fade-in pl-4 border-l-2 border-primary/30">
            <label className="block text-sm font-medium mb-1.5 text-foreground">Number of Properties</label>
            <select
              value={advanced.numberOfProperties}
              onChange={(e) => onUpdate({ ...advanced, numberOfProperties: parseInt(e.target.value) })}
              className="input-premium w-full"
            >
              {[0, 1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">Spouse's Annual Income (if applicable)</label>
          <CurrencyInput
            value={advanced.spouseIncome}
            onChange={(val) => onUpdate({ ...advanced, spouseIncome: val })}
            className="w-full"
            placeholder="₹"
          />
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

export default AdvancedStep;
