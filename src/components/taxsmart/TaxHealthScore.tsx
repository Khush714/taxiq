import { useState } from 'react';
import { TaxComparison, Strategy, IncomeDetails, DeductionDetails } from '@/lib/types';
import { calculateTaxHealthScore, TaxHealthResult } from '@/lib/taxHealthScore';
import { formatCurrency } from '@/lib/taxEngine';
import { Lock, TrendingUp, AlertTriangle, ChevronRight, Zap, Target, Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TaxHealthScoreProps {
  comparison: TaxComparison;
  strategies: Strategy[];
  income?: IncomeDetails;
  deductions?: DeductionDetails;
  onUnlockFull?: () => void;
  isPaid?: boolean;
}

const ScoreRing = ({ score }: { score: number }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

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

const TaxHealthScore = ({ comparison, strategies, income, deductions, onUnlockFull, isPaid = false }: TaxHealthScoreProps) => {
  const [showWhyLow, setShowWhyLow] = useState(false);

  const result = calculateTaxHealthScore(comparison, strategies, income, deductions);
  const { totalScore, breakdown, level, nextLevel, pointsToNextLevel, percentile, overpayingAmount, missedDeductions, whyLow, actions } = result;

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
        <ScoreRing score={totalScore} />

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

      {/* Loss Visibility - MOST IMPORTANT */}
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
          <button
            onClick={() => setShowWhyLow(!showWhyLow)}
            className="flex items-center justify-between w-full"
          >
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

      {/* Locked Insights + CTA */}
      {!isPaid && (
        <div className="card-premium border-primary/30 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-gold-dark" />

          {/* Blurred preview */}
          <div className="relative mb-4">
            <div className="blur-sm pointer-events-none select-none space-y-2">
              <div className="bg-secondary/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">Restructure salary to save ₹XX,XXX</div>
              <div className="bg-secondary/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">Invest in NPS for additional ₹XX,XXX savings</div>
              <div className="bg-secondary/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">Claim HRA exemption worth ₹XX,XXX</div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-2 border border-border shadow-lg">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">6 hidden improvements</span>
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold text-foreground mb-1">
            Increase your score from <span className="text-destructive">{totalScore}</span> → <span className="text-success">{Math.min(100, totalScore + 23)}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Unlock personalized strategies to reach <span className="font-semibold text-primary">{nextLevel}</span> level
          </p>

          <button onClick={onUnlockFull} className="btn-gold w-full text-sm flex items-center justify-center gap-2">
            Unlock Full Plan <ArrowRight className="w-4 h-4" />
          </button>
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
