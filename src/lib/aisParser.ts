import { IncomeDetails } from './types';

export interface AISParseResult {
  success: boolean;
  income: Partial<IncomeDetails>;
  extractedFields: string[];
  warnings: string[];
  rawAmounts: Record<string, number>; // all detected amounts for transparency
}

// AIS PDFs typically have tabular data with columns like:
// SFT Code | Information Description | ... | Amount Reported | Amount Derived
// We need to sum ALL amounts for each category, not just grab the first match.

interface AmountMatch {
  value: number;
  context: string; // surrounding text for debugging
}

/**
 * Extract all monetary amounts near a keyword, summing multiple entries.
 * AIS has multiple rows per category (e.g., multiple salary entries from different employers).
 */
function findAllAmounts(text: string, patterns: RegExp[]): AmountMatch[] {
  const matches: AmountMatch[] = [];
  for (const pattern of patterns) {
    // Use matchAll for global patterns, or scan line-by-line
    const globalPattern = new RegExp(pattern.source, 'gi');
    let m;
    while ((m = globalPattern.exec(text)) !== null) {
      const raw = m[1].replace(/,/g, '').replace(/₹/g, '').trim();
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        matches.push({ value: Math.round(num), context: m[0].slice(0, 80) });
      }
    }
  }
  return matches;
}

/**
 * Sum all amounts, deduplicating exact duplicates that appear in
 * "Amount Reported" and "Amount Derived" columns (same value = one entry).
 */
function sumUniqueAmounts(matches: AmountMatch[]): number {
  if (matches.length === 0) return 0;
  // AIS often repeats the same amount in "reported" and "derived" columns.
  // Group consecutive duplicates and take max from each pair.
  let total = 0;
  let i = 0;
  while (i < matches.length) {
    const current = matches[i].value;
    // Look ahead for consecutive same-value matches (reported vs derived duplicate)
    let j = i + 1;
    while (j < matches.length && matches[j].value === current) {
      j++;
    }
    // Count this as one entry regardless of how many times the same value appeared consecutively
    total += current;
    i = j;
  }
  return total;
}

/**
 * Find the single largest amount for a category (useful when AIS shows
 * a summary/total row alongside individual entries).
 */
function findLargestAmount(matches: AmountMatch[]): number {
  if (matches.length === 0) return 0;
  return Math.max(...matches.map(m => m.value));
}

/**
 * Line-by-line parsing: scan each line for category keywords,
 * then extract ALL amounts from that line and nearby lines.
 */
function parseByLines(lines: string[]): Record<string, AmountMatch[]> {
  const categories: Record<string, { patterns: RegExp[]; found: AmountMatch[] }> = {
    salary: {
      patterns: [
        /salary/i, /salaries/i, /wages/i, /employer/i,
        /section\s*192/i, /tds\s*on\s*salary/i,
      ],
      found: [],
    },
    savingsInterest: {
      patterns: [
        /savings\s*account/i, /interest\s*on\s*savings/i,
        /sft.*?005/i, /sft-005/i,
      ],
      found: [],
    },
    fdInterest: {
      patterns: [
        /fixed\s*deposit/i, /term\s*deposit/i, /recurring\s*deposit/i,
        /interest\s*other\s*than.*?securities/i, /interest\s*income/i,
        /section\s*194a/i, /194a/i,
      ],
      found: [],
    },
    stcg: {
      patterns: [
        /short[\s-]*term\s*capital/i, /stcg/i,
        /sale\s*of.*?equity.*?short/i,
        /section\s*111a/i,
      ],
      found: [],
    },
    ltcg: {
      patterns: [
        /long[\s-]*term\s*capital/i, /ltcg/i,
        /section\s*112a/i, /section\s*112/i,
      ],
      found: [],
    },
    dividend: {
      patterns: [
        /dividend/i, /section\s*194/i,
      ],
      found: [],
    },
    rental: {
      patterns: [
        /rent\s*received/i, /rental\s*income/i, /house\s*property/i,
        /section\s*194[- ]?i\b/i, /194i/i,
      ],
      found: [],
    },
    businessIncome: {
      patterns: [
        /business\s*income/i, /professional\s*income/i, /freelance/i,
        /section\s*194j/i, /194j/i, /contract/i, /commission/i,
        /section\s*194c/i, /194h/i,
      ],
      found: [],
    },
  };

  const amountPattern = /(?:₹\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    // Check which category this line belongs to
    for (const [catKey, cat] of Object.entries(categories)) {
      const isMatch = cat.patterns.some(p => p.test(line));
      if (!isMatch) continue;

      // Extract all amounts from this line and the next 2 lines (table row context)
      const contextLines = lines.slice(idx, Math.min(idx + 3, lines.length)).join(' ');
      let m;
      const localPattern = new RegExp(amountPattern.source, 'g');
      while ((m = localPattern.exec(contextLines)) !== null) {
        const raw = m[1].replace(/,/g, '');
        const num = parseFloat(raw);
        // Filter out tiny numbers that are likely codes/dates (e.g., 192, 194)
        // and numbers that look like section codes
        if (!isNaN(num) && num >= 100 && !isSectionCode(num, contextLines)) {
          cat.found.push({ value: Math.round(num), context: contextLines.slice(0, 100) });
        }
      }
    }
  }

  return Object.fromEntries(
    Object.entries(categories).map(([key, cat]) => [key, cat.found])
  );
}

/**
 * Check if a number is likely a section code (e.g., 192, 194, 194A) rather than an amount.
 */
function isSectionCode(num: number, context: string): boolean {
  const sectionCodes = [192, 194, 195, 196, 197, 206, 111, 112, 115];
  if (sectionCodes.includes(num)) return true;
  // Small numbers near "section" keyword
  if (num < 1000 && /section/i.test(context)) return true;
  return false;
}

/**
 * Parse extracted text from AIS PDF and map to income fields.
 * Uses amount-based parsing: sums all monetary values per category.
 */
export function parseAISText(text: string): AISParseResult {
  const income: Partial<IncomeDetails> = {};
  const extractedFields: string[] = [];
  const warnings: string[] = [];
  const rawAmounts: Record<string, number> = {};

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // === Strategy 1: Line-by-line category detection + amount extraction ===
  const lineResults = parseByLines(lines);

  // === Strategy 2: Regex-based extraction from full text (fallback) ===
  const regexFallback: Record<string, RegExp[]> = {
    salary: [
      /salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
      /gross\s*salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
      /income\s*under.*?salaries[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    ],
    savingsInterest: [
      /savings\s*account\s*interest[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    ],
    fdInterest: [
      /fixed\s*deposit.*?interest[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
      /interest\s*other\s*than\s*securities[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    ],
    stcg: [
      /short[\s-]*term\s*capital\s*gain[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    ],
    ltcg: [
      /long[\s-]*term\s*capital\s*gain[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    ],
    dividend: [
      /dividend[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    ],
    rental: [
      /rent\s*received[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
      /rental\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    ],
    businessIncome: [
      /business\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
      /professional\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    ],
  };

  // Merge results: prefer line-based parsing, fall back to regex
  const resolveCategory = (key: string): number => {
    const lineMatches = lineResults[key] || [];
    if (lineMatches.length > 0) {
      // For salary, take the largest (usually the total/gross figure)
      if (key === 'salary') return findLargestAmount(lineMatches);
      // For others, sum unique entries
      return sumUniqueAmounts(lineMatches);
    }
    // Fallback to regex
    const fallbackMatches = findAllAmounts(fullText, regexFallback[key] || []);
    if (key === 'salary') return findLargestAmount(fallbackMatches);
    return sumUniqueAmounts(fallbackMatches);
  };

  // === Map to income fields ===

  // Salary
  const salaryAmount = resolveCategory('salary');
  if (salaryAmount > 0) {
    income.salary = salaryAmount;
    rawAmounts['Salary'] = salaryAmount;
    extractedFields.push('Salary');
  }

  // Interest income = savings + FD
  const savingsAmount = resolveCategory('savingsInterest');
  const fdAmount = resolveCategory('fdInterest');
  const totalInterest = savingsAmount + fdAmount;
  if (totalInterest > 0) {
    income.interestIncome = totalInterest;
    rawAmounts['Interest Income'] = totalInterest;
    if (savingsAmount > 0) rawAmounts['Savings Interest'] = savingsAmount;
    if (fdAmount > 0) rawAmounts['FD/Deposit Interest'] = fdAmount;
    extractedFields.push('Interest Income');
  }

  // STCG
  const stcgAmount = resolveCategory('stcg');
  if (stcgAmount > 0) {
    income.capitalGainsSTCG = stcgAmount;
    rawAmounts['Short-Term Capital Gains'] = stcgAmount;
    extractedFields.push('Short-Term Capital Gains');
  }

  // LTCG
  const ltcgAmount = resolveCategory('ltcg');
  if (ltcgAmount > 0) {
    income.capitalGainsLTCG = ltcgAmount;
    rawAmounts['Long-Term Capital Gains'] = ltcgAmount;
    extractedFields.push('Long-Term Capital Gains');
  }

  // Dividend → other income
  const dividendAmount = resolveCategory('dividend');
  if (dividendAmount > 0) {
    income.otherIncome = (income.otherIncome || 0) + dividendAmount;
    rawAmounts['Dividend Income'] = dividendAmount;
    extractedFields.push('Dividend Income');
  }

  // Rental
  const rentalAmount = resolveCategory('rental');
  if (rentalAmount > 0) {
    income.rentalIncome = rentalAmount;
    rawAmounts['Rental Income'] = rentalAmount;
    extractedFields.push('Rental Income');
  }

  // Business/Freelance
  const businessAmount = resolveCategory('businessIncome');
  if (businessAmount > 0) {
    income.businessIncome = businessAmount;
    rawAmounts['Business/Freelance Income'] = businessAmount;
    extractedFields.push('Business/Freelance Income');
  }

  // Warnings
  if (extractedFields.length === 0) {
    warnings.push('Could not extract any income data from the AIS. Please fill details manually.');
  } else {
    // Check for suspiciously small salary
    if (income.salary && income.salary < 10000) {
      warnings.push('Salary amount seems low. Please verify the extracted value.');
    }
  }

  return {
    success: extractedFields.length > 0,
    income,
    extractedFields,
    warnings,
    rawAmounts,
  };
}
