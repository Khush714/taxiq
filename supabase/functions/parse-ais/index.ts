import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "text" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse AIS text to extract income components
    const result = parseAISText(text)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to parse AIS data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function parseAISText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const amounts: Record<string, number> = {
    salary: 0,
    savingsInterest: 0,
    fdInterest: 0,
    dividends: 0,
    capitalGainsSTCG: 0,
    capitalGainsLTCG: 0,
    rentalIncome: 0,
    otherIncome: 0,
  }

  const currencyRegex = /(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi
  const plainNumberRegex = /\b(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)\b/g

  function extractAmounts(line: string): number[] {
    const vals: number[] = []
    let match: RegExpExecArray | null

    const crx = new RegExp(currencyRegex.source, 'gi')
    while ((match = crx.exec(line)) !== null) {
      const v = parseFloat(match[1].replace(/,/g, ''))
      if (v > 0 && v < 1e10) vals.push(v)
    }

    if (vals.length === 0) {
      const prx = new RegExp(plainNumberRegex.source, 'g')
      while ((match = prx.exec(line)) !== null) {
        const v = parseFloat(match[1].replace(/,/g, ''))
        if (v >= 1000 && v < 1e10 && !isSectionCode(v)) vals.push(v)
      }
    }
    return vals
  }

  function isSectionCode(n: number): boolean {
    const codes = [192, 194, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949, 19410, 80]
    return n < 500 || codes.includes(n)
  }

  const categories: Record<string, { keywords: RegExp; target: string; mode: 'max' | 'sum' }> = {
    salary: { keywords: /salary|wages|employer|tds on salary|section 192|gross salary/i, target: 'salary', mode: 'max' },
    savings: { keywords: /saving|savings account|sbi|bank interest|80tta/i, target: 'savingsInterest', mode: 'sum' },
    fd: { keywords: /fixed deposit|fd|term deposit|recurring deposit|194a|deposit interest/i, target: 'fdInterest', mode: 'sum' },
    dividend: { keywords: /dividend|194k|mutual fund dividend/i, target: 'dividends', mode: 'sum' },
    stcg: { keywords: /short.?term|stcg|111a/i, target: 'capitalGainsSTCG', mode: 'sum' },
    ltcg: { keywords: /long.?term|ltcg|112a|112/i, target: 'capitalGainsLTCG', mode: 'sum' },
    rental: { keywords: /rent|rental|property income|house property/i, target: 'rentalIncome', mode: 'sum' },
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const context = [lines[i - 1] || '', line, lines[i + 1] || ''].join(' ')

    for (const cat of Object.values(categories)) {
      if (cat.keywords.test(context)) {
        const vals = extractAmounts(line)
        if (vals.length > 0) {
          const unique = [...new Set(vals)]
          if (cat.mode === 'max') {
            amounts[cat.target] = Math.max(amounts[cat.target], ...unique)
          } else {
            amounts[cat.target] += unique.reduce((a, b) => a + b, 0)
          }
        }
      }
    }
  }

  return {
    salary: amounts.salary,
    interestIncome: amounts.savingsInterest + amounts.fdInterest,
    capitalGainsSTCG: amounts.capitalGainsSTCG,
    capitalGainsLTCG: amounts.capitalGainsLTCG,
    rentalIncome: amounts.rentalIncome,
    otherIncome: amounts.dividends + amounts.otherIncome,
    breakdown: {
      savingsInterest: amounts.savingsInterest,
      fdInterest: amounts.fdInterest,
      dividends: amounts.dividends,
    },
  }
}
