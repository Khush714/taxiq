import { TaxComparison, Strategy, IncomeDetails, DeductionDetails } from './types';

export interface ScoreBreakdown {
  deductionUtilization: number;
  regimeOptimization: number;
  incomeStructuring: number;
  missedOpportunities: number;
}

export interface LockedStrategy {
  title: string;
  scoreImpact: number;
  estimatedSavings: number;
  category: string;
}

export interface TaxHealthResult {
  totalScore: number;
  projectedScore: number;
  breakdown: ScoreBreakdown;
  level: string;
  nextLevel: string;
  pointsToNextLevel: number;
  percentile: number;
  overpayingAmount: number;
  missedDeductions: number;
  whyLow: string[];
  actions: { label: string; scoreImpact: number }[];
  lockedStrategies: LockedStrategy[];
  totalLockedSavings: number;
  totalLockedScoreGain: number;
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
  if (score >= 85) return 95;
  if (score >= 75) return 85;
  if (score >= 65) return 70;
  if (score >= 55) return 55;
  if (score >= 45) return 40;
  if (score >= 35) return 25;
  return 15;
}

function generateLockedStrategies(
  income?: IncomeDetails,
  deductions?: DeductionDetails,
  breakdown?: ScoreBreakdown,
): LockedStrategy[] {
  const strategies: LockedStrategy[] = [];
  const salary = income?.salary || 0;
  const grossIncome = salary + (income?.interestIncome || 0) + (income?.rentalIncome || 0) + (income?.dividendIncome || 0) + (income?.businessIncome || 0);

  // 80C gap
  const used80C = deductions?.section80C || 0;
  if (used80C < 150000) {
    const gap = 150000 - used80C;
    strategies.push({
      title: 'Maximize 80C via ELSS + PPF + Sukanya',
      scoreImpact: Math.min(10, Math.round((gap / 150000) * 12)),
      estimatedSavings: Math.round(gap * 0.312),
      category: 'Deductions',
    });
  }

  // NPS 80CCD(1B)
  const usedNPS = deductions?.nps80CCD1B || 0;
  if (usedNPS < 50000) {
    strategies.push({
      title: 'Add NPS Tier-I for extra ₹50K deduction',
      scoreImpact: 6,
      estimatedSavings: Math.round((50000 - usedNPS) * 0.312),
      category: 'Deductions',
    });
  }

  // HRA optimization
  if (income && income.hra > 0 && income.rentPaid === 0) {
    strategies.push({
      title: 'Claim HRA exemption with rent receipts',
      scoreImpact: 5,
      estimatedSavings: Math.round(Math.min(income.hra, salary * 0.1) * 0.312),
      category: 'Income Structuring',
    });
  }

  // 80D health insurance
  const used80D = (deductions?.section80D || 0) + (deductions?.section80DParents || 0);
  if (used80D < 75000) {
    strategies.push({
      title: 'Health insurance for self + parents (80D)',
      scoreImpact: 4,
      estimatedSavings: Math.round((75000 - used80D) * 0.312),
      category: 'Deductions',
    });
  }

  // Salary restructuring - advanced
  if (salary > 1000000) {
    strategies.push({
      title: 'Restructure CTC: add meal vouchers + LTA',
      scoreImpact: 5,
      estimatedSavings: Math.round(salary * 0.03),
      category: 'Income Structuring',
    });
  }

  // Home loan interest
  if ((deductions?.homeLoanInterest || 0) === 0 && grossIncome > 800000) {
    strategies.push({
      title: 'Leverage Sec 24(b) home loan interest ₹2L',
      scoreImpact: 7,
      estimatedSavings: Math.round(200000 * 0.312),
      category: 'Deductions',
    });
  }

  // Capital gains harvesting
  if ((income?.capitalGainsLTCG || 0) > 125000) {
    strategies.push({
      title: 'Tax-loss harvest to offset LTCG above ₹1.25L',
      scoreImpact: 5,
      estimatedSavings: Math.round((income!.capitalGainsLTCG - 125000) * 0.125),
      category: 'Capital Gains',
    });
  }

  // Dividend to growth funds
  if ((income?.dividendIncome || 0) > 50000) {
    strategies.push({
      title: 'Switch dividend plans to growth (defer tax)',
      scoreImpact: 4,
      estimatedSavings: Math.round(income!.dividendIncome * 0.312),
      category: 'Investment',
    });
  }

  // Education loan
  if ((deductions?.educationLoanInterest || 0) === 0 && grossIncome > 600000) {
    strategies.push({
      title: 'Claim Sec 80E education loan interest',
      scoreImpact: 3,
      estimatedSavings: Math.round(50000 * 0.208),
      category: 'Deductions',
    });
  }

  // Sort by score impact descending, take top 6
  strategies.sort((a, b) => b.scoreImpact - a.scoreImpact);
  return strategies.slice(0, 6);
}

export function calculateTaxHealthScore(
  comparison: TaxComparison,
  strategies: Strategy[],
  income?: IncomeDetails,
  deductions?: DeductionDetails,
): TaxHealthResult {
  const recommended = comparison.recommended === 'old' ? comparison.oldRegime : comparison.newRegime;
  const nonRecommended = comparison.recommended === 'old' ? comparison.newRegime : comparison.oldRegime;

  const maxDeductions = 150000 + 50000 + 50000 + 200000 + 25000;
  const actualDeductions = comparison.oldRegime.totalDeductions;
  const deductionRatio = Math.min(actualDeductions / maxDeductions, 1);
  const deductionUtilization = Math.round(deductionRatio * 40);

  const regimeSavings = comparison.savings;
  const regimeOptimization = regimeSavings > 0
    ? Math.min(20, Math.round(10 + (regimeSavings / recommended.grossIncome) * 200))
    : 15;

  let incomeStructuring = 10;
  if (income) {
    if (income.hra > 0 && income.rentPaid > 0) incomeStructuring += 4;
    if (income.basicSalary > 0 && income.basicSalary < income.salary * 0.6) incomeStructuring += 3;
    if (income.tds > 0) incomeStructuring += 3;
  }
  incomeStructuring = Math.min(20, incomeStructuring);

  const totalPossibleSavings = strategies.reduce((s, st) => s + st.estimatedSavings, 0);
  const missedRatio = recommended.grossIncome > 0
    ? Math.min(totalPossibleSavings / recommended.grossIncome, 0.3) / 0.3
    : 0;
  const missedOpportunities = Math.round((1 - missedRatio) * 20);

  const totalScore = Math.min(100, deductionUtilization + regimeOptimization + incomeStructuring + missedOpportunities);
  const breakdown = { deductionUtilization, regimeOptimization, incomeStructuring, missedOpportunities };

  const overpayingAmount = nonRecommended.totalTax - recommended.totalTax;
  const missedDeductions = Math.max(0, maxDeductions - actualDeductions);

  const whyLow: string[] = [];
  if (deductionUtilization < 25) whyLow.push('You are not utilizing available deductions (80C, 80D, NPS, etc.)');
  if (regimeOptimization < 12) whyLow.push('Your regime choice could be better optimized');
  if (incomeStructuring < 14) whyLow.push('Your income structure needs optimization (HRA, salary split)');
  if (missedOpportunities < 12) whyLow.push('Multiple tax-saving opportunities remain unused');

  const actions: { label: string; scoreImpact: number }[] = [];
  if (deductionUtilization < 35) actions.push({ label: 'Max out Section 80C investments', scoreImpact: Math.min(10, 40 - deductionUtilization) });
  if (incomeStructuring < 17) actions.push({ label: 'Optimize salary structure with HRA', scoreImpact: Math.min(6, 20 - incomeStructuring) });
  if (missedOpportunities < 16) actions.push({ label: 'Implement top strategies', scoreImpact: Math.min(8, 20 - missedOpportunities) });

  const { level, nextLevel, pointsToNextLevel } = getLevel(totalScore);

  // Generate personalized locked strategies
  const lockedStrategies = generateLockedStrategies(income, deductions, breakdown);
  const totalLockedScoreGain = lockedStrategies.reduce((s, l) => s + l.scoreImpact, 0);
  const totalLockedSavings = lockedStrategies.reduce((s, l) => s + l.estimatedSavings, 0);
  const projectedScore = Math.min(100, totalScore + totalLockedScoreGain);

  return {
    totalScore,
    projectedScore,
    breakdown,
    level,
    nextLevel,
    pointsToNextLevel,
    percentile: estimatePercentile(totalScore),
    overpayingAmount,
    missedDeductions,
    whyLow,
    actions,
    lockedStrategies,
    totalLockedSavings,
    totalLockedScoreGain,
  };
}
