import { describe, it, expect } from 'vitest';
import { calculateTax, compareTaxRegimes } from '../lib/taxEngine';
import { IncomeDetails, DeductionDetails, UserProfile } from '../lib/types';

const defaultProfile: UserProfile = {
  fullName: 'Test User',
  age: 30,
  residentialStatus: 'resident',
  maritalStatus: 'single',
  hasChildren: false,
  children: [],
};

const zeroIncome: IncomeDetails = {
  salary: 0, bonus: 0, capitalGainsSTCG: 0, capitalGainsLTCG: 0,
  rentalIncome: 0, interestIncome: 0, otherIncome: 0, businessIncome: 0,
};

const zeroDeductions: DeductionDetails = {
  section80C: 0, section80D: 0, section80DParents: 0, nps80CCD1B: 0,
  homeLoanInterest: 0, homeLoanPrincipal: 0, educationLoanInterest: 0,
  donations80G: 0, savingsInterest80TTA: 0,
};

describe('Tax Engine - Basic Scenarios', () => {
  it('should return zero tax for zero income', () => {
    const result = calculateTax(zeroIncome, zeroDeductions, defaultProfile, 'new');
    expect(result.totalTax).toBe(0);
    expect(result.grossIncome).toBe(0);
  });

  it('should apply 87A rebate in new regime for income ≤ 7L', () => {
    const income = { ...zeroIncome, salary: 700000 };
    const result = calculateTax(income, zeroDeductions, defaultProfile, 'new');
    // Salary 7L - 75K std ded = 6.25L taxable
    // Slab: 0-3L=0, 3-6.25L=3.25L*5%=16250
    // Wait: 3-7L @ 5%, taxable is 6.25L so 3L-6.25L = 3.25L * 5% = 16250
    // Rebate 87A: taxable 6.25L ≤ 7L → rebate up to 25000, so rebate=16250
    expect(result.rebate87A).toBe(16250);
    expect(result.totalTax).toBe(0);
  });

  it('should calculate correct new regime tax for 10L salary', () => {
    const income = { ...zeroIncome, salary: 1000000 };
    const result = calculateTax(income, zeroDeductions, defaultProfile, 'new');
    // 10L - 75K = 9.25L taxable
    // 0-3L: 0
    // 3-7L: 4L * 5% = 20000
    // 7-9.25L: 2.25L * 10% = 22500
    // Total slab = 42500
    // No rebate (taxable > 7L)
    // Cess = 42500 * 4% = 1700
    // Total = 42500 + 1700 = 44200
    expect(result.baseTax).toBe(42500);
    expect(result.cess).toBe(1700);
    expect(result.totalTax).toBe(44200);
  });

  it('should calculate correct old regime tax for 10L salary with 80C', () => {
    const income = { ...zeroIncome, salary: 1000000 };
    const deductions = { ...zeroDeductions, section80C: 150000 };
    const result = calculateTax(income, deductions, defaultProfile, 'old');
    // 10L - 50K (std) - 1.5L (80C) = 8L taxable
    // 0-2.5L: 0
    // 2.5-5L: 2.5L * 5% = 12500
    // 5-8L: 3L * 20% = 60000
    // Total slab = 72500
    // No rebate (taxable > 5L)
    // Cess = 72500 * 4% = 2900
    // Total = 72500 + 2900 = 75400
    expect(result.taxableIncome).toBe(800000);
    expect(result.baseTax).toBe(72500);
    expect(result.cess).toBe(2900);
    expect(result.totalTax).toBe(75400);
  });

  it('should apply 87A rebate in old regime for income ≤ 5L taxable', () => {
    const income = { ...zeroIncome, salary: 550000 };
    const result = calculateTax(income, zeroDeductions, defaultProfile, 'old');
    // 5.5L - 50K std = 5L taxable
    // 0-2.5L: 0, 2.5-5L: 2.5L*5%=12500
    // Rebate: taxable ≤ 5L → rebate = min(12500, 12500) = 12500
    expect(result.rebate87A).toBe(12500);
    expect(result.totalTax).toBe(0);
  });

  it('should calculate STCG at 20% and LTCG at 12.5%', () => {
    const income = { ...zeroIncome, salary: 1500000, capitalGainsSTCG: 200000, capitalGainsLTCG: 325000 };
    const result = calculateTax(income, zeroDeductions, defaultProfile, 'new');
    // STCG: 200000 * 20% = 40000
    // LTCG: (325000 - 125000) * 12.5% = 25000
    expect(result.stcgTax).toBe(40000);
    expect(result.ltcgTax).toBe(25000);
    expect(result.capitalGainsTax).toBe(65000);
  });

  it('should handle senior citizen old regime slabs', () => {
    const senior = { ...defaultProfile, age: 65 };
    const income = { ...zeroIncome, salary: 600000 };
    const result = calculateTax(income, zeroDeductions, senior, 'old');
    // 6L - 50K std = 5.5L taxable
    // Senior slabs: 0-3L: 0, 3-5L: 2L*5%=10000, 5-5.5L: 0.5L*20%=10000
    // Total = 20000, cess = 800
    expect(result.taxableIncome).toBe(550000);
    expect(result.baseTax).toBe(20000);
    expect(result.totalTax).toBe(20800);
  });

  it('should compare regimes and recommend the better one', () => {
    const income = { ...zeroIncome, salary: 1500000 };
    const deductions = { ...zeroDeductions, section80C: 150000, section80D: 25000, nps80CCD1B: 50000 };
    const comparison = compareTaxRegimes(income, deductions, defaultProfile);
    expect(comparison.recommended).toBeDefined();
    expect(comparison.savings).toBeGreaterThanOrEqual(0);
    expect(comparison.oldRegime.totalTax).toBeGreaterThan(0);
    expect(comparison.newRegime.totalTax).toBeGreaterThan(0);
  });

  it('should calculate new regime 15L salary correctly', () => {
    const income = { ...zeroIncome, salary: 1500000 };
    const result = calculateTax(income, zeroDeductions, defaultProfile, 'new');
    // 15L - 75K = 14.25L taxable
    // 0-3L: 0
    // 3-7L: 4L * 5% = 20000
    // 7-10L: 3L * 10% = 30000
    // 10-12L: 2L * 15% = 30000
    // 12-14.25L: 2.25L * 20% = 45000
    // Total = 125000
    // Cess = 5000
    // Total = 130000
    expect(result.baseTax).toBe(125000);
    expect(result.cess).toBe(5000);
    expect(result.totalTax).toBe(130000);
  });
});
