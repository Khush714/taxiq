import { IncomeDetails } from './types';

export interface Form16ParseResult {
  success: boolean;
  income: Partial<IncomeDetails>;
  extractedFields: string[];
  warnings: string[];
  rawAmounts: Record<string, number>;
}

interface AmountMatch {
  value: number;
  context: string;
}

function extractAmounts(text: string, patterns: RegExp[]): AmountMatch[] {
  const matches: AmountMatch[] = [];
  for (const pattern of patterns) {
    const gp = new RegExp(pattern.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = gp.exec(text)) !== null) {
      const raw = m[1].replace(/,/g, '').replace(/₹/g, '').trim();
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        matches.push({ value: Math.round(num), context: m[0].slice(0, 80) });
      }
    }
  }
  return matches;
}

function largest(matches: AmountMatch[]): number {
  if (matches.length === 0) return 0;
  return Math.max(...matches.map(m => m.value));
}

function sumAll(matches: AmountMatch[]): number {
  return matches.reduce((s, m) => s + m.value, 0);
}

export function parseForm16Text(text: string): Form16ParseResult {
  const income: Partial<IncomeDetails> = {};
  const extractedFields: string[] = [];
  const warnings: string[] = [];
  const rawAmounts: Record<string, number> = {};

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // Salary / Gross salary
  const salaryMatches = extractAmounts(fullText, [
    /gross\s*salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /total\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /income\s*under.*?salaries[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /salary\s*as\s*per[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]);
  const salaryVal = largest(salaryMatches);
  if (salaryVal > 0) {
    income.salary = salaryVal;
    rawAmounts['Salary'] = salaryVal;
    extractedFields.push('Salary');
  }

  // Basic Salary
  const basicMatches = extractAmounts(fullText, [
    /basic\s*salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /basic\s*pay[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]);
  const basicVal = largest(basicMatches);
  if (basicVal > 0) {
    income.basicSalary = basicVal;
    rawAmounts['Basic Salary'] = basicVal;
    extractedFields.push('Basic Salary');
  }

  // HRA
  const hraMatches = extractAmounts(fullText, [
    /house\s*rent\s*allowance[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /\bhra\b[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]);
  const hraVal = largest(hraMatches);
  if (hraVal > 0) {
    income.hra = hraVal;
    rawAmounts['HRA'] = hraVal;
    extractedFields.push('HRA');
  }

  // TDS
  const tdsMatches = extractAmounts(fullText, [
    /tax\s*deducted\s*at\s*source[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /total\s*tax\s*deducted[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /tds[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]);
  const tdsVal = largest(tdsMatches);
  if (tdsVal > 0) {
    income.tds = tdsVal;
    rawAmounts['TDS'] = tdsVal;
    extractedFields.push('TDS');
  }

  // Standard Deduction
  const stdDedMatches = extractAmounts(fullText, [
    /standard\s*deduction[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]);
  const stdDedVal = largest(stdDedMatches);
  if (stdDedVal > 0) {
    rawAmounts['Standard Deduction'] = stdDedVal;
    extractedFields.push('Standard Deduction');
  }

  // 80C
  const _80cMatches = extractAmounts(fullText, [
    /80\s*c\b[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /section\s*80c[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]);
  const _80cVal = largest(_80cMatches);
  if (_80cVal > 0) {
    rawAmounts['Section 80C'] = _80cVal;
    extractedFields.push('Section 80C');
  }

  // 80D
  const _80dMatches = extractAmounts(fullText, [
    /80\s*d\b[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /section\s*80d[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]);
  const _80dVal = largest(_80dMatches);
  if (_80dVal > 0) {
    rawAmounts['Section 80D'] = _80dVal;
    extractedFields.push('Section 80D');
  }

  // Interest income
  const intMatches = extractAmounts(fullText, [
    /interest\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /income\s*from\s*other\s*sources[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]);
  const intVal = largest(intMatches);
  if (intVal > 0) {
    income.interestIncome = intVal;
    rawAmounts['Interest Income'] = intVal;
    extractedFields.push('Interest Income');
  }

  if (extractedFields.length === 0) {
    warnings.push('Could not extract data from Form 16. Please fill details manually.');
  }

  return { success: extractedFields.length > 0, income, extractedFields, warnings, rawAmounts };
}
