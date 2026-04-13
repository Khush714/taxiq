import { TaxComparison, Strategy, IncomeDetails, DeductionDetails } from './types';

export interface ScoreBreakdown {
  deductionUtilization: number; // out of 40
  regimeOptimization: number;   // out of 20
  incomeStructuring: number;    // out of 20
  missedOpportunities: number;  // out of 20
}

export interface TaxHealthResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  level: string;
  nextLevel: string;
  pointsToNextLevel: number;
  percentile: number;
  overpayingAmount: number;
  missedDeductions: number;
  whyLow: string[];
  actions: { label: string; scoreImpact: number }[];
}

const LEVELS = [
  { name: 'Beginner', min: 0 },
  { name: 'Smart Saver', min: 40 },
  { name: 'Pro Optimizer', min: 60 },
  { name: 'Tax Master', min: 80 },
];

function getLevel(score: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }
  const pointsToNext = current === next ? 0 : next.min - score;
  return { level: current.name, nextLevel: next.name, pointsToNextLevel: Math.max(0, pointsToNext) };
}

function estimatePercentile(score: number): number {
  // Simulated distribution curve
  if (score >= 85) return 95;
  if (score >= 75) return 85;
  if (score >= 65) return 70;
  if (score >= 55) return 55;
  if (score >= 45) return 40;
  if (score >= 35) return 25;
  return 15;
}

export function calculateTaxHealthScore(
  comparison: TaxComparison,
  strategies: Strategy[],
  income?: IncomeDetails,
  deductions?: DeductionDetails,
): TaxHealthResult {
  const recommended = comparison.recommended === 'old' ? comparison.oldRegime : comparison.newRegime;
  const nonRecommended = comparison.recommended === 'old' ? comparison.newRegime : comparison.oldRegime;

  // 1. Deduction Utilization (out of 40)
  const maxDeductions = 150000 + 50000 + 50000 + 200000 + 25000; // 80C + 80D + NPS + HomeLoan + 80TTA
  const actualDeductions = comparison.oldRegime.totalDeductions;
  const deductionRatio = Math.min(actualDeductions / maxDeductions, 1);
  const deductionUtilization = Math.round(deductionRatio * 40);

  // 2. Regime Optimization (out of 20)
  const regimeSavings = comparison.savings;
  const isOptimalRegime = true; // They always get the recommendation
  const regimeOptimization = regimeSavings > 0
    ? Math.min(20, Math.round(10 + (regimeSavings / recommended.grossIncome) * 200))
    : 15; // If both regimes are equal, decent score

  // 3. Income Structuring (out of 20)
  let incomeStructuring = 10; // base
  if (income) {
    if (income.hra > 0 && income.rentPaid > 0) incomeStructuring += 4;
    if (income.basicSalary > 0 && income.basicSalary < income.salary * 0.6) incomeStructuring += 3;
    if (income.tds > 0) incomeStructuring += 3;
  }
  incomeStructuring = Math.min(20, incomeStructuring);

  // 4. Missed Opportunities (out of 20) - inversely scored
  const totalPossibleSavings = strategies.reduce((s, st) => s + st.estimatedSavings, 0);
  const missedRatio = recommended.grossIncome > 0
    ? Math.min(totalPossibleSavings / recommended.grossIncome, 0.3) / 0.3
    : 0;
  const missedOpportunities = Math.round((1 - missedRatio) * 20);

  const totalScore = Math.min(100, deductionUtilization + regimeOptimization + incomeStructuring + missedOpportunities);

  // Overpaying amount = difference between current worst and best
  const overpayingAmount = nonRecommended.totalTax - recommended.totalTax;

  // Missed deductions estimate
  const missedDeductions = Math.max(0, maxDeductions - actualDeductions);

  // Why is score low?
  const whyLow: string[] = [];
  if (deductionUtilization < 25) whyLow.push('You are not utilizing available deductions (80C, 80D, NPS, etc.)');
  if (regimeOptimization < 12) whyLow.push('Your regime choice could be better optimized');
  if (incomeStructuring < 14) whyLow.push('Your income structure needs optimization (HRA, salary split)');
  if (missedOpportunities < 12) whyLow.push('Multiple tax-saving opportunities remain unused');

  // Actions with score impact
  const actions: { label: string; scoreImpact: number }[] = [];
  if (deductionUtilization < 35) actions.push({ label: 'Max out Section 80C investments', scoreImpact: Math.min(10, 40 - deductionUtilization) });
  if (incomeStructuring < 17) actions.push({ label: 'Optimize salary structure with HRA', scoreImpact: Math.min(6, 20 - incomeStructuring) });
  if (missedOpportunities < 16) actions.push({ label: 'Implement top strategies', scoreImpact: Math.min(8, 20 - missedOpportunities) });

  const { level, nextLevel, pointsToNextLevel } = getLevel(totalScore);

  return {
    totalScore,
    breakdown: { deductionUtilization, regimeOptimization, incomeStructuring, missedOpportunities },
    level,
    nextLevel,
    pointsToNextLevel,
    percentile: estimatePercentile(totalScore),
    overpayingAmount,
    missedDeductions,
    whyLow,
    actions,
  };
}
