const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AmountMatch { value: number; context: string; }

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
  return matches.length === 0 ? 0 : Math.max(...matches.map(m => m.value));
}

function parseForm16(rawText: string) {
  const fullText = rawText.replace(/\u0000/g, ' ').replace(/\s{2,}/g, ' ').trim();

  const salary = largest(extractAmounts(fullText, [
    /gross\s*salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /total\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /income\s*under.*?salaries[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]));

  const basic_salary = largest(extractAmounts(fullText, [
    /basic\s*salary[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /basic\s*pay[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]));

  const hra = largest(extractAmounts(fullText, [
    /house\s*rent\s*allowance[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /\bhra\b[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]));

  const tds = largest(extractAmounts(fullText, [
    /tax\s*deducted\s*at\s*source[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /total\s*tax\s*deducted[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /tds[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]));

  const standard_deduction = largest(extractAmounts(fullText, [
    /standard\s*deduction[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]));

  const deductions_80c = largest(extractAmounts(fullText, [
    /80\s*c\b[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /section\s*80c[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]));

  const deductions_80d = largest(extractAmounts(fullText, [
    /80\s*d\b[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
    /section\s*80d[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]));

  const interest_income = largest(extractAmounts(fullText, [
    /interest\s*income[^\d]*?(?:₹\s*)?(\d[\d,]*\.?\d*)/gi,
  ]));

  return { salary, basic_salary, hra, tds, standard_deduction, deductions_80c, deductions_80d, interest_income };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  try {
    const body = await req.json();
    const text = body?.text;
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing "text" field.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const normalized = text.replace(/\u0000/g, ' ').replace(/\s{2,}/g, ' ').trim();
    const letterCount = (normalized.match(/[A-Za-z]/g) || []).length;
    if (normalized.length < 80 || letterCount < 30) {
      return new Response(JSON.stringify({ error: 'No readable content found in Form 16.' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const parsed = parseForm16(normalized);
    return new Response(JSON.stringify({ success: true, ...parsed, data: parsed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('[parse-form16]', err);
    return new Response(JSON.stringify({ error: 'Unexpected server error.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
