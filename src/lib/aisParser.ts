import { IncomeDetails } from './types';

export interface AISParseResult {
  success: boolean;
  income: Partial<IncomeDetails>;
  extractedFields: string[];
  warnings: string[];
}

/**
 * Parse extracted text from AIS PDF and map to income fields.
 */
export function parseAISText(text: string): AISParseResult {
  const income: Partial<IncomeDetails> = {};
  const extractedFields: string[] = [];
  const warnings: string[] = [];

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // Helper: find amount near a keyword
  const findAmount = (patterns: RegExp[]): number | null => {
    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match) {
        const raw = match[1].replace(/,/g, '').replace(/₹/g, '').trim();
        const num = parseFloat(raw);
        if (!isNaN(num) && num > 0) return Math.round(num);
      }
    }
    return null;
  };

  // Salary
  const salary = findAmount([
    /salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /gross\s*salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /income\s*under.*?salaries[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /salary.*?received[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
  ]);
  if (salary) {
    income.salary = salary;
    extractedFields.push('Salary');
  }

  // Interest income (savings + FD)
  const savingsInterest = findAmount([
    /savings\s*account\s*interest[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /interest\s*on\s*savings[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
  ]);
  const fdInterest = findAmount([
    /fixed\s*deposit.*?interest[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /interest\s*on.*?deposit[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /interest\s*other\s*than\s*securities[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
  ]);
  const totalInterest = (savingsInterest || 0) + (fdInterest || 0);
  if (totalInterest > 0) {
    income.interestIncome = totalInterest;
    extractedFields.push('Interest Income');
  }

  // Capital gains - STCG
  const stcg = findAmount([
    /short\s*term\s*capital\s*gain[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /stcg[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /sale\s*of\s*equity\s*share.*?listed.*?short[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
  ]);
  if (stcg) {
    income.capitalGainsSTCG = stcg;
    extractedFields.push('Short-Term Capital Gains');
  }

  // Capital gains - LTCG
  const ltcg = findAmount([
    /long\s*term\s*capital\s*gain[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /ltcg[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
  ]);
  if (ltcg) {
    income.capitalGainsLTCG = ltcg;
    extractedFields.push('Long-Term Capital Gains');
  }

  // Dividend / Other income
  const dividend = findAmount([
    /dividend[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
  ]);
  if (dividend) {
    income.otherIncome = (income.otherIncome || 0) + dividend;
    extractedFields.push('Dividend Income');
  }

  // Rental income
  const rental = findAmount([
    /rent\s*received[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /rental\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
    /income\s*from\s*house\s*property[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/i,
  ]);
  if (rental) {
    income.rentalIncome = rental;
    extractedFields.push('Rental Income');
  }

  if (extractedFields.length === 0) {
    warnings.push('Could not extract any income data from the AIS. Please fill details manually.');
  }

  return {
    success: extractedFields.length > 0,
    income,
    extractedFields,
    warnings,
  };
}
