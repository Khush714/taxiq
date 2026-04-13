/**
 * supabase/functions/parse-ais/index.ts
 *
 * Accepts JSON { text: string } with pre-extracted PDF text.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AmountMatch {
  value: number;
  context: string;
}

interface AISResult {
  salary: number;
  interest_income: number;
  dividend_income: number;
  capital_gains: number;
  other_income: number;
  rental_income: number;
  business_income: number;
}

function findAllAmounts(text: string, patterns: RegExp[]): AmountMatch[] {
  const matches: AmountMatch[] = [];
  for (const pattern of patterns) {
    const globalPattern = new RegExp(pattern.source, 'gi');
    let m: RegExpExecArray | null;
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

function sumUniqueAmounts(matches: AmountMatch[]): number {
  if (matches.length === 0) return 0;
  let total = 0;
  let i = 0;
  while (i < matches.length) {
    const current = matches[i].value;
    let j = i + 1;
    while (j < matches.length && matches[j].value === current) j++;
    total += current;
    i = j;
  }
  return total;
}

function findLargestAmount(matches: AmountMatch[]): number {
  if (matches.length === 0) return 0;
  return Math.max(...matches.map((m) => m.value));
}

function isSectionCode(num: number, context: string): boolean {
  const sectionCodes = [192, 194, 195, 196, 197, 206, 111, 112, 115];
  if (sectionCodes.includes(num)) return true;
  if (num < 1000 && /section/i.test(context)) return true;
  return false;
}

function parseByLines(lines: string[]): Record<string, AmountMatch[]> {
  const categories: Record<string, { patterns: RegExp[]; found: AmountMatch[] }> = {
    salary: {
      patterns: [/salary/i, /salaries/i, /wages/i, /employer/i, /section\s*192/i, /tds\s*on\s*salary/i],
      found: [],
    },
    savingsInterest: {
      patterns: [/savings\s*account/i, /interest\s*on\s*savings/i, /sft.*?005/i, /sft-005/i],
      found: [],
    },
    fdInterest: {
      patterns: [/fixed\s*deposit/i, /term\s*deposit/i, /recurring\s*deposit/i, /interest\s*other\s*than.*?securities/i, /interest\s*income/i, /section\s*194a/i, /194a/i],
      found: [],
    },
    stcg: {
      patterns: [/short[\s-]*term\s*capital/i, /stcg/i, /sale\s*of.*?equity.*?short/i, /section\s*111a/i],
      found: [],
    },
    ltcg: {
      patterns: [/long[\s-]*term\s*capital/i, /ltcg/i, /section\s*112a/i, /section\s*112/i],
      found: [],
    },
    dividend: {
      patterns: [/dividend/i, /section\s*194/i],
      found: [],
    },
    rental: {
      patterns: [/rent\s*received/i, /rental\s*income/i, /house\s*property/i, /section\s*194[- ]?i\b/i, /194i/i],
      found: [],
    },
    businessIncome: {
      patterns: [/business\s*income/i, /professional\s*income/i, /freelance/i, /section\s*194j/i, /194j/i, /contract/i, /commission/i, /section\s*194c/i, /194h/i],
      found: [],
    },
  };

  const amountPattern = /(?:₹\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    for (const [catKey, cat] of Object.entries(categories)) {
      const isMatch = cat.patterns.some((p) => p.test(line));
      if (!isMatch) continue;

      const contextLines = lines.slice(idx, Math.min(idx + 3, lines.length)).join(' ');
      let m: RegExpExecArray | null;
      const localPattern = new RegExp(amountPattern.source, 'g');
      while ((m = localPattern.exec(contextLines)) !== null) {
        const raw = m[1].replace(/,/g, '');
        const num = parseFloat(raw);
        if (!isNaN(num) && num >= 100 && !isSectionCode(num, contextLines)) {
          cat.found.push({ value: Math.round(num), context: contextLines.slice(0, 100) });
        }
      }
    }
  }

  return Object.fromEntries(Object.entries(categories).map(([key, cat]) => [key, cat.found]));
}

function parseAISData(rawText: string): AISResult {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');
  const lineResults = parseByLines(lines);

  const regexFallback: Record<string, RegExp[]> = {
    salary: [/salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi, /gross\s*salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi, /income\s*under.*?salaries[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi],
    savingsInterest: [/savings\s*account\s*interest[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi],
    fdInterest: [/fixed\s*deposit.*?interest[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi, /interest\s*other\s*than\s*securities[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi],
    stcg: [/short[\s-]*term\s*capital\s*gain[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi],
    ltcg: [/long[\s-]*term\s*capital\s*gain[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi],
    dividend: [/dividend[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi],
    rental: [/rent\s*received[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi, /rental\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi],
    businessIncome: [/business\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi, /professional\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi],
  };

  const resolveCategory = (key: string): number => {
    const lineMatches = lineResults[key] || [];
    if (lineMatches.length > 0) {
      if (key === 'salary') return findLargestAmount(lineMatches);
      return sumUniqueAmounts(lineMatches);
    }
    const fallbackMatches = findAllAmounts(fullText, regexFallback[key] || []);
    if (key === 'salary') return findLargestAmount(fallbackMatches);
    return sumUniqueAmounts(fallbackMatches);
  };

  const salary = resolveCategory('salary');
  const savingsInterest = resolveCategory('savingsInterest');
  const fdInterest = resolveCategory('fdInterest');
  const dividend = resolveCategory('dividend');
  const stcg = resolveCategory('stcg');
  const ltcg = resolveCategory('ltcg');
  const rental = resolveCategory('rental');
  const businessIncome = resolveCategory('businessIncome');

  return {
    salary,
    interest_income: savingsInterest + fdInterest,
    dividend_income: dividend,
    capital_gains: stcg + ltcg,
    other_income: 0,
    rental_income: rental,
    business_income: businessIncome,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const text = body?.text;

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid "text" field. Send extracted PDF text as JSON.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedText = text.replace(/\u0000/g, ' ').replace(/\s{2,}/g, ' ').trim();
    const letterCount = (normalizedText.match(/[A-Za-z]/g) || []).length;

    if (normalizedText.length < 120 || letterCount < 40) {
      return new Response(JSON.stringify({ error: 'No readable content found. This AIS PDF may be image-based or unreadable.' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = parseAISData(normalizedText);

    return new Response(JSON.stringify({ success: true, ...parsed, data: parsed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('[parse-ais]', err);
    return new Response(JSON.stringify({ error: 'Unexpected server error. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
