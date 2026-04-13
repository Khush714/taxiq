/**
 * supabase/functions/parse-ais/index.ts
 *
 * Accepts JSON { text: string } with pre-extracted PDF text.
 * PDF decryption happens client-side via pdfjs-dist.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function cleanAmount(val: string): number {
  return parseFloat(val.replace(/,/g, "").trim()) || 0;
}

function extractAmounts(line: string): number[] {
  const matches = line.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map(cleanAmount).filter((n) => n > 0);
}

interface AISResult {
  salary: number;
  interest_income: number;
  dividend_income: number;
  capital_gains: number;
  other_income: number;
}

function parseAISData(rawText: string): AISResult {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  const result: AISResult = {
    salary: 0,
    interest_income: 0,
    dividend_income: 0,
    capital_gains: 0,
    other_income: 0,
  };

  let inCapitalSection = false;

  const SKIP = [
    "purchase", "remittance", "tds", "tcs",
    "advance tax", "self assessment",
    "tax deducted", "tax collected",
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (SKIP.some((p) => lower.includes(p))) continue;

    if (
      lower.includes("sale of securities") ||
      lower.includes("sale of immovable") ||
      lower.includes("mutual fund")
    ) {
      inCapitalSection = true;
      continue;
    }

    if (inCapitalSection) {
      const amounts = extractAmounts(line);
      if (amounts.length >= 2) {
        const sale = amounts[amounts.length - 2];
        const cost = amounts[amounts.length - 1];
        result.capital_gains += sale - cost;
      }
      if (amounts.length === 0) inCapitalSection = false;
      continue;
    }

    if (lower.includes("salary") || lower.includes("192")) {
      result.salary += extractAmounts(line).reduce((a, b) => a + b, 0);
      continue;
    }

    if (lower.includes("interest")) {
      result.interest_income += extractAmounts(line).reduce((a, b) => a + b, 0);
      continue;
    }

    if (lower.includes("dividend")) {
      result.dividend_income += extractAmounts(line).reduce((a, b) => a + b, 0);
      continue;
    }

    if (
      lower.includes("other income") ||
      lower.includes("business") ||
      lower.includes("profession") ||
      lower.includes("commission") ||
      lower.includes("rent")
    ) {
      result.other_income += extractAmounts(line).reduce((a, b) => a + b, 0);
    }
  }

  for (const key of Object.keys(result) as (keyof AISResult)[]) {
    result[key] = Math.round(result[key] * 100) / 100;
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const text = body?.text;

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "text" field. Send extracted PDF text as JSON.' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "No readable content found. Please re-download your AIS from the IT portal." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = parseAISData(text);

    return new Response(
      JSON.stringify({ success: true, ...parsed, data: parsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[parse-ais]", err);
    return new Response(
      JSON.stringify({ error: "Unexpected server error. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
