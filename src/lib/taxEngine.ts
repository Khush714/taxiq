import { IncomeDetails, DeductionDetails, TaxResult, TaxComparison, UserProfile } from './types';

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

function calculateSurcharge(tax: number, income: number, isNewRegime: boolean): number {
  if (income <= 5000000) return 0;
  let rate = 0;
  if (income <= 10000000) rate = 0.10;
  else if (income <= 20000000) rate = 0.15;
  else if (income <= 50000000) rate = isNewRegime ? 0.25 : 0.25;
  else rate = isNewRegime ? 0.25 : 0.37;

  const surcharge = tax * rate;

  // Marginal relief
  if (income <= 10000000) {
    const excessIncome = income - 5000000;
    const taxAt50L = calculateSlabTax(5000000, isNewRegime ? NEW_SLABS : OLD_SLABS);
    const marginalRelief = tax + surcharge - (taxAt50L + excessIncome);
    if (marginalRelief > 0) return surcharge - marginalRelief;
  }

  return surcharge;
}

function getTotalDeductionsOldRegime(deductions: DeductionDetails, profile: UserProfile): number {
  const standardDeduction = 50000;
  const sec80C = Math.min(deductions.section80C + deductions.homeLoanPrincipal, 150000);
  const sec80DLimit = profile.age >= 60 ? 50000 : 25000;
  const sec80DParentLimit = 50000; // assuming parents are senior
  const sec80D = Math.min(deductions.section80D, sec80DLimit) + Math.min(deductions.section80DParents, sec80DParentLimit);
  const nps = Math.min(deductions.nps80CCD1B, 50000);
  const homeLoanInterest = Math.min(deductions.homeLoanInterest, 200000);
  const eduLoan = deductions.educationLoanInterest;
  const donations = deductions.donations80G;
  const savings80TTA = Math.min(deductions.savingsInterest80TTA, profile.age >= 60 ? 50000 : 10000);

  return standardDeduction + sec80C + sec80D + nps + homeLoanInterest + eduLoan + donations + savings80TTA;
}

function getGrossIncome(income: IncomeDetails): number {
  return income.salary + income.bonus + income.capitalGainsSTCG + income.capitalGainsLTCG +
    income.rentalIncome + income.interestIncome + income.otherIncome + income.businessIncome;
}

export function calculateTax(
  income: IncomeDetails,
  deductions: DeductionDetails,
  profile: UserProfile,
  regime: 'old' | 'new'
): TaxResult {
  const grossIncome = getGrossIncome(income);

  // LTCG on equity taxed separately at 10% above 1L exemption
  const ltcgExemption = 100000;
  const taxableLTCG = Math.max(0, income.capitalGainsLTCG - ltcgExemption);
  const ltcgTax = taxableLTCG * 0.10;

  // STCG on equity taxed at 15%
  const stcgTax = income.capitalGainsSTCG * 0.15;

  // Regular income (excluding capital gains taxed separately)
  const regularIncome = grossIncome - income.capitalGainsLTCG - income.capitalGainsSTCG;

  let totalDeductions = 0;
  let taxableIncome = regularIncome;

  if (regime === 'old') {
    totalDeductions = getTotalDeductionsOldRegime(deductions, profile);
    taxableIncome = Math.max(0, regularIncome - totalDeductions);
    // Rental income: 30% standard deduction
    if (income.rentalIncome > 0) {
      totalDeductions += income.rentalIncome * 0.30;
      taxableIncome = Math.max(0, taxableIncome - income.rentalIncome * 0.30);
    }
  } else {
    // New regime: only standard deduction of 75,000
    totalDeductions = 75000;
    taxableIncome = Math.max(0, regularIncome - totalDeductions);
  }

  const slabs = regime === 'old' ? getOldSlabs(profile.age) : NEW_SLABS;
  let baseTax = calculateSlabTax(taxableIncome, slabs);

  // Add capital gains tax
  baseTax += ltcgTax + stcgTax;

  // Rebate u/s 87A
  if (regime === 'old' && taxableIncome <= 500000) {
    baseTax = Math.max(0, baseTax - 12500);
  }
  if (regime === 'new' && taxableIncome <= 700000) {
    baseTax = Math.max(0, baseTax - 25000);
  }

  const totalForSurcharge = grossIncome;
  const surcharge = calculateSurcharge(baseTax, totalForSurcharge, regime === 'new');
  const cess = (baseTax + surcharge) * 0.04;
  const totalTax = Math.round(baseTax + surcharge + cess);

  return {
    regime,
    grossIncome,
    totalDeductions,
    taxableIncome,
    baseTax: Math.round(baseTax),
    surcharge: Math.round(surcharge),
    cess: Math.round(cess),
    totalTax,
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
