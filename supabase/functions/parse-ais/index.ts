/**
 * supabase/functions/parse-ais/index.ts
 *
 * Supabase Edge Function — AIS PDF parser
 * Uses unpdf for Deno-compatible PDF text extraction
 */

import { extractText } from "npm:unpdf";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ─── Amount helpers ─── */

function cleanAmount(val: string): number {
  return parseFloat(val.replace(/,/g, "").trim()) || 0;
}

function extractAmounts(line: string): number[] {
  const matches = line.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map(cleanAmount).filter((n) => n > 0);
}

/* ─── Core AIS parser ─── */

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

/* ─── Extract text from PDF using unpdf ─── */

async function extractTextFromPDF(bytes: Uint8Array): Promise<string> {
  const { text } = await extractText(bytes, { mergePages: true });
  return text;
}

/* ─── Main handler ─── */

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
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid form data. Send multipart/form-data with a 'file' field." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileField = formData.get("file");
    if (!fileField || typeof fileField === "string") {
      return new Response(
        JSON.stringify({ error: "No PDF file uploaded." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const file = fileField as File;

    if (file.size > 15 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 15 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    let rawText: string;
    try {
      rawText = await extractTextFromPDF(bytes);
    } catch (pdfErr: unknown) {
      console.error("[parse-ais] PDF extraction error:", pdfErr);
      const msg = pdfErr instanceof Error ? pdfErr.message.toLowerCase() : "";
      if (msg.includes("password") || msg.includes("encrypted")) {
        return new Response(
          JSON.stringify({
            error:
              "This PDF appears to be password-protected. " +
              "Please decrypt it first using your PAN + DOB, then re-upload.",
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          error: "Could not read the PDF. Please make sure it is a valid AIS document from incometax.gov.in.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!rawText || rawText.trim().length < 50) {
      return new Response(
        JSON.stringify({
          error:
            "No readable text found in this PDF. " +
            "Please re-download your AIS from the IT portal.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = parseAISData(rawText);

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
