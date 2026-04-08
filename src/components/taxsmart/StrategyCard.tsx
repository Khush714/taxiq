import { Strategy } from '@/lib/types';
import { TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface StrategyCardProps {
  strategy: Strategy;
  index: number;
  locked?: boolean;
}

const StrategyCard = ({ strategy, index, locked }: StrategyCardProps) => {
  const riskBadge = {
    Safe: 'badge-safe',
    Moderate: 'badge-moderate',
    Advanced: 'badge-advanced',
  }[strategy.riskLevel];

  const riskIcon = {
    Safe: CheckCircle,
    Moderate: AlertTriangle,
    Advanced: TrendingUp,
  }[strategy.riskLevel];

  const RiskIcon = riskIcon;

  if (locked) {
    return (
      <div className="card-premium p-5 relative overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-md bg-background/60 z-10 flex items-center justify-center">
          <div className="text-center">
            <span className="text-2xl">🔒</span>
            <p className="text-sm text-muted-foreground mt-1">Unlock to reveal</p>
          </div>
        </div>
        <div className="opacity-20">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
              <h3 className="font-semibold text-foreground">Strategy Name Hidden</h3>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Details hidden until unlock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium-hover p-5 animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
            {index + 1}
          </span>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{strategy.name}</h3>
            <span className="text-[10px] text-muted-foreground">{strategy.category}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold gold-gradient-text">₹{strategy.estimatedSavings.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-muted-foreground">est. savings</p>
        </div>
      </div>

      <div className="bg-secondary/50 rounded-lg p-3 mb-3">
        <p className="text-xs font-medium text-foreground mb-1">What to do:</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{strategy.whatToDo}</p>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mb-3">
        <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
          <Info className="w-3 h-3" /> Why this works for you:
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{strategy.whyApplicable}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${riskBadge}`}>
          <RiskIcon className="w-3 h-3" /> {strategy.riskLevel}
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border">
          {strategy.difficulty}
        </span>
        {strategy.complianceNote && (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-warning/10 text-warning border border-warning/20">
            ⚠️ Note
          </span>
        )}
      </div>

      {strategy.complianceNote && (
        <div className="mt-3 p-2 rounded bg-warning/5 border border-warning/10">
          <p className="text-[10px] text-warning leading-relaxed">{strategy.complianceNote}</p>
        </div>
      )}
    </div>
  );
};

export default StrategyCard;
