export interface ChildInfo {
  isMinor: boolean;
}

export interface UserProfile {
  fullName: string;
  age: number;
  residentialStatus: 'resident' | 'rnor' | 'nri';
  maritalStatus: 'single' | 'married';
  hasChildren: boolean;
  children: ChildInfo[];
}

export interface IncomeDetails {
  salary: number;
  basicSalary: number;
  hra: number;
  rentPaid: number;
  bonus: number;
  capitalGainsSTCG: number;
  capitalGainsLTCG: number;
  rentalIncome: number;
  interestIncome: number;
  dividendIncome: number;
  otherIncome: number;
  businessIncome: number;
  tds: number;
}

export interface DeductionDetails {
  section80C: number;
  section80D: number;
  section80DParents: number;
  nps80CCD1B: number;
  homeLoanInterest: number;
  homeLoanPrincipal: number;
  educationLoanInterest: number;
  donations80G: number;
  savingsInterest80TTA: number;
}

export interface AdvancedProfile {
  isStockInvestor: boolean;
  hasELSS: boolean;
  hasProperty: boolean;
  numberOfProperties: number;
  hasForeignIncome: boolean;
  hasHUF: boolean;
  hasBusinessIncome: boolean;
  spouseIncome: number;
}

export type RiskPreference = 'conservative' | 'moderate' | 'aggressive';

export interface SlabDetail {
  range: string;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface TaxResult {
  regime: 'old' | 'new';
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  baseTax: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  slabBreakdown: SlabDetail[];
  deductionBreakdown: Record<string, number>;
  rebate87A: number;
  capitalGainsTax: number;
  ltcgTax: number;
  stcgTax: number;
}

export interface TaxComparison {
  oldRegime: TaxResult;
  newRegime: TaxResult;
  recommended: 'old' | 'new';
  savings: number;
  reason: string;
}

export interface Strategy {
  id: string;
  name: string;
  whatToDo: string;
  whyApplicable: string;
  estimatedSavings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  riskLevel: 'Safe' | 'Moderate' | 'Advanced';
  complianceNote?: string;
  category: string;
  priority: number;
}

export interface AppState {
  currentStep: number;
  profile: UserProfile;
  income: IncomeDetails;
  deductions: DeductionDetails;
  advancedProfile: AdvancedProfile;
  riskPreference: RiskPreference;
  taxComparison: TaxComparison | null;
  strategies: Strategy[];
  isPaid: boolean;
  unlockedPacks: number;
}
