import { RiskPreference } from '@/lib/types';
import { Shield, ChevronRight, ChevronLeft } from 'lucide-react';

interface RiskStepProps {
  risk: RiskPreference;
  onUpdate: (r: RiskPreference) => void;
  onNext: () => void;
  onBack: () => void;
}

const options: { value: RiskPreference; label: string; desc: string; icon: string }[] = [
  { value: 'conservative', label: 'Conservative', desc: 'Only safe, well-established strategies. No grey areas.', icon: '🛡️' },
  { value: 'moderate', label: 'Moderate', desc: 'Mix of safe strategies with some that require planning.', icon: '⚖️' },
  { value: 'aggressive', label: 'Aggressive', desc: 'All legal strategies including advanced structuring.', icon: '🚀' },
];

const RiskStep = ({ risk, onUpdate, onNext, onBack }: RiskStepProps) => {
  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Risk Preference</h2>
        <p className="text-muted-foreground text-sm">How aggressive should your tax strategies be?</p>
      </div>

      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onUpdate(opt.value)}
            className={`card-premium-hover w-full p-5 text-left flex items-start gap-4 ${
              risk === opt.value ? 'border-primary/40 bg-primary/5' : ''
            }`}
          >
            <span className="text-2xl mt-0.5">{opt.icon}</span>
            <div>
              <p className="text-base font-semibold text-foreground">{opt.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
              risk === opt.value ? 'border-primary' : 'border-border'
            }`}>
              {risk === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 p-3 rounded-lg border border-border text-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} className="flex-[2] btn-gold flex items-center justify-center gap-2">
          Analyze My Taxes <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RiskStep;
