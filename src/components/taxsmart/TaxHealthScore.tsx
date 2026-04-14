import { useState } from 'react';
import { TaxComparison, Strategy, IncomeDetails, DeductionDetails } from '@/lib/types';
import { calculateTaxHealthScore, LockedStrategy } from '@/lib/taxHealthScore';
import { formatCurrency } from '@/lib/taxEngine';
import { Lock, TrendingUp, AlertTriangle, ChevronRight, Zap, Target, Shield, Eye, EyeOff, ArrowRight, Star, CheckCircle, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TaxHealthScoreProps {
  comparison: TaxComparison;
  strategies: Strategy[];
  income?: IncomeDetails;
  deductions?: DeductionDetails;
  onUnlockFull?: () => void;
  isPaid?: boolean;
}

const ScoreRing = ({ score, projected, showProjected }: { score: number; projected?: number; showProjected?: boolean }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const projectedOffset = projected ? circumference - (projected / 100) * circumference : circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'hsl(var(--success))';
    if (s >= 60) return 'hsl(45, 93%, 47%)';
    if (s >= 40) return 'hsl(25, 95%, 53%)';
    return 'hsl(var(--destructive))';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Needs Work';
    return 'Poor';
  };

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
        {showProjected && projected && (
          <circle
            cx="80" cy="80" r={radius} fill="none"
            stroke="hsl(var(--success))"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={projectedOffset}
            opacity={0.25}
            className="transition-all duration-[1500ms] ease-out"
          />
        )}
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={getColor(score)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-[1500ms] ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-serif font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
        <span className="text-[11px] font-semibold mt-1" style={{ color: getColor(score) }}>
          {getLabel(score)}
        </span>
      </div>
    </div>
  );
};

const CategoryBar = ({ label, score, max, status }: { label: string; score: number; max: number; status: string }) => {
  const pct = (score / max) * 100;
  const statusColor = status === 'Good' ? 'text-success' : status === 'Weak' ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">{score}/{max}</span>
          <span className={`text-[10px] font-semibold ${statusColor}`}>{status}</span>
        </div>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
};

const getStatus = (score: number, max: number) => {
  const pct = score / max;
  if (pct >= 0.7) return 'Good';
  if (pct >= 0.4) return 'Weak';
  return 'Poor';
};

const LockedStrategyCard = ({ strategy, index }: { strategy: LockedStrategy; index: number }) => (
  <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-4 animate-slide-up" style={{ animationDelay: `${index * 60}ms` }}>
    {/* Heavy blur overlay - content should NOT be readable */}
    <div className="absolute inset-0 backdrop-blur-[8px] bg-background/70 z-10 flex items-center justify-center">
      <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
        <Lock className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-bold text-primary">Locked</span>
      </div>
    </div>
    <div className="relative z-0 select-none" aria-hidden="true">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{strategy.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{strategy.category}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2.5">
        <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
          +{strategy.scoreImpact} score
        </span>
        <span className="text-[10px] font-bold gold-gradient-text">
          Save {formatCurrency(strategy.estimatedSavings)}
        </span>
      </div>
    </div>
  </div>
);

const TaxHealthScore = ({ comparison, strategies, income, deductions, onUnlockFull, isPaid = false }: TaxHealthScoreProps) => {
  const [showWhyLow, setShowWhyLow] = useState(false);

  const result = calculateTaxHealthScore(comparison, strategies, income, deductions);
  const { totalScore, projectedScore, breakdown, level, nextLevel, pointsToNextLevel, percentile, overpayingAmount, missedDeductions, whyLow, actions, lockedStrategies, totalLockedSavings, totalLockedScoreGain } = result;

  const levelEmoji: Record<string, string> = {
    'Beginner': '🌱',
    'Smart Saver': '💡',
    'Pro Optimizer': '🚀',
    'Tax Master': '👑',
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Main Score Card */}
      <div className="card-premium p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-gold-DEFAULT to-success" />
        <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-wider">Your Tax Health Score</p>
        <ScoreRing score={totalScore} projected={projectedScore} showProjected={!isPaid} />

        {/* Level Badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
          <span className="text-sm">{levelEmoji[level]}</span>
          <span className="text-xs font-bold text-primary">{level}</span>
        </div>

        {/* Percentile */}
        <p className="text-[11px] text-muted-foreground mt-2">
          You're better than <span className="font-semibold text-foreground">{percentile}%</span> of taxpayers
        </p>

        {/* Next level nudge */}
        {pointsToNextLevel > 0 && (
          <div className="mt-3 bg-secondary/50 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{pointsToNextLevel} points</span> away from{' '}
              <span className="font-semibold text-primary">{nextLevel}</span> {levelEmoji[nextLevel]}
            </span>
          </div>
        )}
      </div>

      {/* Loss Visibility */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-premium p-4 border-destructive/20 bg-destructive/5">
          <AlertTriangle className="w-5 h-5 text-destructive mb-2" />
          <p className="text-[10px] text-destructive/70 font-medium uppercase tracking-wide">Tax Overpaid</p>
          <p className="text-lg font-serif font-bold text-destructive">{formatCurrency(overpayingAmount)}</p>
        </div>
        <div className="card-premium p-4 border-warning/20 bg-warning/5">
          <TrendingUp className="w-5 h-5 text-warning mb-2" />
          <p className="text-[10px] text-warning/70 font-medium uppercase tracking-wide">Missed Deductions</p>
          <p className="text-lg font-serif font-bold text-warning">{formatCurrency(missedDeductions)}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card-premium p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Score Breakdown
        </h3>
        <div className="space-y-4">
          <CategoryBar label="Deduction Utilization" score={breakdown.deductionUtilization} max={40} status={getStatus(breakdown.deductionUtilization, 40)} />
          <CategoryBar label="Regime Optimization" score={breakdown.regimeOptimization} max={20} status={getStatus(breakdown.regimeOptimization, 20)} />
          <CategoryBar label="Income Structuring" score={breakdown.incomeStructuring} max={20} status={getStatus(breakdown.incomeStructuring, 20)} />
          <CategoryBar label="Missed Opportunities" score={breakdown.missedOpportunities} max={20} status={getStatus(breakdown.missedOpportunities, 20)} />
        </div>
      </div>

      {/* Progress Nudges */}
      {actions.length > 0 && (
        <div className="card-premium p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-primary" /> Quick Wins
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Complete {Math.min(2, actions.length)} actions to boost your score by +{actions.slice(0, 2).reduce((s, a) => s + a.scoreImpact, 0)}
          </p>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2.5">
                <span className="text-xs text-foreground">{action.label}</span>
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  +{action.scoreImpact} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why is your score low? */}
      {whyLow.length > 0 && (
        <div className="card-premium p-5">
          <button onClick={() => setShowWhyLow(!showWhyLow)} className="flex items-center justify-between w-full">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Why is your score low?
            </h3>
            {showWhyLow ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showWhyLow && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {whyLow.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ENHANCED UNLOCK FULL PLAN ===== */}
      {!isPaid && lockedStrategies.length > 0 && (
        <div className="card-premium border-primary/30 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-gold-DEFAULT to-success" />

          {/* Score Progression Visual */}
          <div className="text-center mb-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Your Score Potential</p>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="text-center">
                <span className="text-3xl font-serif font-bold text-destructive">{totalScore}</span>
                <p className="text-[10px] text-muted-foreground">Current</p>
              </div>
              <ArrowRight className="w-6 h-6 text-primary animate-pulse" />
              <div className="text-center">
                <span className="text-3xl font-serif font-bold text-success">{projectedScore}</span>
                <p className="text-[10px] text-muted-foreground">After Unlock</p>
              </div>
            </div>
            {/* Progress bar showing jump */}
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden mx-4">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-destructive/60 to-primary transition-all duration-1000 rounded-full"
                style={{ width: `${totalScore}%` }}
              />
              <div
                className="absolute left-0 top-0 h-full bg-success/20 rounded-full"
                style={{ width: `${projectedScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-bold text-success">+{totalLockedScoreGain}</span> points unlock available
            </p>
          </div>

          {/* Urgency line */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5 mb-5 text-center">
            <p className="text-xs font-semibold text-destructive">
              💸 You're leaving {formatCurrency(totalLockedSavings)} on the table
            </p>
            <p className="text-[10px] text-destructive/70 mt-0.5">Most users in your income range optimize this</p>
          </div>

          {/* Locked Strategies Preview */}
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> {lockedStrategies.length} Personalized Strategies
          </h3>
          <div className="space-y-2 mb-4">
            {lockedStrategies.map((strategy, i) => (
              <LockedStrategyCard key={i} strategy={strategy} index={i} />
            ))}
          </div>

          {/* Total Impact Summary */}
          <div className="bg-success/5 border border-success/20 rounded-xl p-4 mb-5">
            <p className="text-[10px] text-success/70 font-medium uppercase tracking-wider mb-2">Total Impact if Unlocked</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-serif font-bold text-success">+{totalLockedScoreGain}</p>
                <p className="text-[10px] text-muted-foreground">Score Increase</p>
              </div>
              <div>
                <p className="text-lg font-serif font-bold gold-gradient-text">{formatCurrency(totalLockedSavings)}</p>
                <p className="text-[10px] text-muted-foreground">Potential Savings</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button onClick={onUnlockFull} className="btn-gold w-full text-sm flex items-center justify-center gap-2 py-3.5 mb-3">
            <Sparkles className="w-4 h-4" />
            Unlock {formatCurrency(totalLockedSavings)} in Tax Savings
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[10px] text-center text-muted-foreground mb-5">Get all strategies + full tax optimization report</p>

          {/* Value Stack */}
          <div className="border-t border-border pt-4">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-3">What you'll get</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                '6–10 personalized strategies',
                'Exact tax saving calculations',
                'Regime optimization',
                'AIS + Form 16 analysis',
                'Step-by-step ITR guide',
                'AI tax assistant',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-success shrink-0" />
                  <span className="text-[10px] text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Future hook */}
      <div className="text-center py-2">
        <p className="text-[10px] text-muted-foreground">
          📊 Track your Tax Health Score every year and watch it improve
        </p>
      </div>
    </div>
  );
};

export default TaxHealthScore;
