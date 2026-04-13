import { IncomeDetails, DeductionDetails, TaxResult, TaxComparison, UserProfile, SlabDetail } from './types';

// FY 2024-25 Old Regime Slabs
const OLD_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

const OLD_SLABS_SENIOR = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

const OLD_SLABS_SUPER_SENIOR = [
  { min: 0, max: 500000, rate: 0 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

// FY 2024-25 New Regime Slabs (Budget 2024)
const NEW_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.10 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
];

function getOldSlabs(age: number) {
  if (age >= 80) return OLD_SLABS_SUPER_SENIOR;
  if (age >= 60) return OLD_SLABS_SENIOR;
  return OLD_SLABS;
}

function calculateSlabTax(income: number, slabs: typeof OLD_SLABS): number {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    tax += taxable * slab.rate;
  }
  return tax;
}

function getSlabBreakdown(income: number, slabs: typeof OLD_SLABS): SlabDetail[] {
  const details: SlabDetail[] = [];
  for (const slab of slabs) {
    if (income <= slab.min) {
      details.push({
        range: slab.max === Infinity
          ? `Above ₹${(slab.min / 100000).toFixed(1)}L`
          : `₹${(slab.min / 100000).toFixed(1)}L – ₹${(slab.max / 100000).toFixed(1)}L`,
        rate: slab.rate * 100,
        taxableAmount: 0,
        tax: 0,
      });
      continue;
    }
    const taxable = Math.min(income, slab.max) - slab.min;
    const tax = taxable * slab.rate;
    details.push({
      range: slab.max === Infinity
        ? `Above ₹${(slab.min / 100000).toFixed(1)}L`
        : `₹${(slab.min / 100000).toFixed(1)}L – ₹${(slab.max / 100000).toFixed(1)}L`,
      rate: slab.rate * 100,
      taxableAmount: taxable,
      tax: Math.round(tax),
    });
  }
  return details;
}

function calculateSurcharge(tax: number, income: number, isNewRegime: boolean): number {
  if (income <= 5000000) return 0;
  let rate = 0;
  if (income <= 10000000) rate = 0.10;
  else if (income <= 20000000) rate = 0.15;
  else if (income <= 50000000) rate = 0.25;
  else rate = isNewRegime ? 0.25 : 0.37;

  const surcharge = tax * rate;

  // Marginal relief check
  if (income > 5000000 && income <= 10000000) {
    const slabs = isNewRegime ? NEW_SLABS : OLD_SLABS;
    const taxAt50L = calculateSlabTax(5000000, slabs);
    const excessIncome = income - 5000000;
    const totalWithSurcharge = tax + surcharge;
    const marginalLimit = taxAt50L + excessIncome;
    if (totalWithSurcharge > marginalLimit) {
      return Math.max(0, marginalLimit - tax);
    }
  }

  return surcharge;
}

function getTotalDeductionsOldRegime(deductions: DeductionDetails, profile: UserProfile): { total: number; breakdown: Record<string, number> } {
  const standardDeduction = 50000;
  const sec80C = Math.min(deductions.section80C + deductions.homeLoanPrincipal, 150000);
  const sec80DLimit = profile.age >= 60 ? 50000 : 25000;
  const sec80DParentLimit = 50000;
  const sec80D = Math.min(deductions.section80D, sec80DLimit) + Math.min(deductions.section80DParents, sec80DParentLimit);
  const nps = Math.min(deductions.nps80CCD1B, 50000);
  const homeLoanInterest = Math.min(deductions.homeLoanInterest, 200000);
  const eduLoan = deductions.educationLoanInterest;
  const donations = deductions.donations80G;
  const savings80TTA = Math.min(deductions.savingsInterest80TTA, profile.age >= 60 ? 50000 : 10000);

  const total = standardDeduction + sec80C + sec80D + nps + homeLoanInterest + eduLoan + donations + savings80TTA;

  return {
    total,
    breakdown: {
      'Standard Deduction': standardDeduction,
      'Section 80C': sec80C,
      'Section 80D (Health Insurance)': sec80D,
      'NPS (80CCD1B)': nps,
      'Home Loan Interest (24b)': homeLoanInterest,
      'Education Loan Interest (80E)': eduLoan,
      'Donations (80G)': donations,
      'Savings Interest (80TTA/80TTB)': savings80TTA,
    },
  };
}

function getGrossIncome(income: IncomeDetails): number {
  return income.salary + income.bonus + income.capitalGainsSTCG + income.capitalGainsLTCG +
    income.rentalIncome + income.interestIncome + income.dividendIncome + income.otherIncome + income.businessIncome;
}

export function calculateTax(
  income: IncomeDetails,
  deductions: DeductionDetails,
  profile: UserProfile,
  regime: 'old' | 'new'
): TaxResult {
  const grossIncome = getGrossIncome(income);

  // FY 2024-25: LTCG on listed equity/units taxed at 12.5% above ₹1.25L exemption
  const ltcgExemption = 125000;
  const taxableLTCG = Math.max(0, income.capitalGainsLTCG - ltcgExemption);
  const ltcgTax = taxableLTCG * 0.125;

  // FY 2024-25: STCG on listed equity taxed at 20%
  const stcgTax = income.capitalGainsSTCG * 0.20;

  // Regular income (excluding capital gains taxed at special rates)
  const regularIncome = grossIncome - income.capitalGainsLTCG - income.capitalGainsSTCG;

  let totalDeductions = 0;
  let taxableIncome = regularIncome;
  let deductionBreakdown: Record<string, number> = {};
  let rentalDeduction = 0;

  if (regime === 'old') {
    const dedResult = getTotalDeductionsOldRegime(deductions, profile);
    totalDeductions = dedResult.total;
    deductionBreakdown = dedResult.breakdown;
    taxableIncome = Math.max(0, regularIncome - totalDeductions);

    // Rental income: 30% standard deduction under Section 24
    if (income.rentalIncome > 0) {
      rentalDeduction = Math.round(income.rentalIncome * 0.30);
      totalDeductions += rentalDeduction;
      taxableIncome = Math.max(0, taxableIncome - rentalDeduction);
      deductionBreakdown['Rental Income Std. Deduction (30%)'] = rentalDeduction;
    }
  } else {
    // New regime: only standard deduction of ₹75,000 (Budget 2024)
    totalDeductions = 75000;
    taxableIncome = Math.max(0, regularIncome - totalDeductions);
    deductionBreakdown = { 'Standard Deduction': 75000 };
  }

  const slabs = regime === 'old' ? getOldSlabs(profile.age) : NEW_SLABS;
  let baseTax = calculateSlabTax(taxableIncome, slabs);
  const slabBreakdown = getSlabBreakdown(taxableIncome, slabs);

  // Rebate u/s 87A
  let rebate87A = 0;
  if (regime === 'old' && taxableIncome <= 500000) {
    rebate87A = Math.min(baseTax, 12500);
    baseTax = Math.max(0, baseTax - rebate87A);
  }
  if (regime === 'new' && taxableIncome <= 700000) {
    rebate87A = Math.min(baseTax, 25000);
    baseTax = Math.max(0, baseTax - rebate87A);
  }

  // Add capital gains tax (taxed at special rates, NOT eligible for slab/rebate)
  const capitalGainsTax = Math.round(ltcgTax + stcgTax);
  const totalBaseTax = baseTax + capitalGainsTax;

  const surcharge = calculateSurcharge(totalBaseTax, grossIncome, regime === 'new');
  const cess = Math.round((totalBaseTax + surcharge) * 0.04);
  const totalTax = Math.round(totalBaseTax + surcharge + cess);

  return {
    regime,
    grossIncome,
    totalDeductions,
    taxableIncome,
    baseTax: Math.round(totalBaseTax),
    surcharge: Math.round(surcharge),
    cess,
    totalTax,
    slabBreakdown,
    deductionBreakdown,
    rebate87A: Math.round(rebate87A),
    capitalGainsTax,
    ltcgTax: Math.round(ltcgTax),
    stcgTax: Math.round(stcgTax),
  };
}

export function compareTaxRegimes(
  income: IncomeDetails,
  deductions: DeductionDetails,
  profile: UserProfile
): TaxComparison {
  const oldRegime = calculateTax(income, deductions, profile, 'old');
  const newRegime = calculateTax(income, deductions, profile, 'new');

  const savings = Math.abs(oldRegime.totalTax - newRegime.totalTax);
  const recommended = oldRegime.totalTax <= newRegime.totalTax ? 'old' : 'new';

  let reason = '';
  if (recommended === 'old') {
    reason = `The Old Regime saves you ₹${savings.toLocaleString('en-IN')} due to your deductions of ₹${oldRegime.totalDeductions.toLocaleString('en-IN')}. Your investments in 80C, 80D, NPS, and home loan interest make the Old Regime more beneficial.`;
  } else {
    reason = `The New Regime saves you ₹${savings.toLocaleString('en-IN')}. The lower slab rates outweigh the deductions you claim under the Old Regime. Consider this if you prefer simplicity.`;
  }

  return { oldRegime, newRegime, recommended, savings, reason };
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}
