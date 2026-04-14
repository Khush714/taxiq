const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaxReportRequest {
  email: string;
  userName: string;
  comparison: {
    recommended: string;
    savings: number;
    reason: string;
    oldRegime: { totalTax: number; grossIncome: number; totalDeductions: number; taxableIncome: number };
    newRegime: { totalTax: number; grossIncome: number; totalDeductions: number; taxableIncome: number };
  };
  strategies: Array<{
    name: string;
    estimatedSavings: number;
    whatToDo: string;
    difficulty: string;
    riskLevel: string;
    category: string;
  }>;
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function generateEmailHTML(data: TaxReportRequest): string {
  const { userName, comparison, strategies } = data;
  const recommended = comparison.recommended === 'old' ? 'Old Regime' : 'New Regime';
  const oldTax = formatCurrency(comparison.oldRegime.totalTax);
  const newTax = formatCurrency(comparison.newRegime.totalTax);
  const savings = formatCurrency(comparison.savings);
  const totalStrategySavings = formatCurrency(strategies.reduce((sum, s) => sum + s.estimatedSavings, 0));

  const strategyRows = strategies.slice(0, 10).map((s, i) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px; font-size: 14px; color: #333;">${i + 1}. ${s.name}</td>
      <td style="padding: 12px 8px; font-size: 14px; color: #16a34a; font-weight: 600; text-align: right;">${formatCurrency(s.estimatedSavings)}</td>
      <td style="padding: 12px 8px; font-size: 12px; color: #666; text-align: center;">${s.difficulty}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px 24px;text-align:center;">
    <h1 style="color:#d4af37;font-size:24px;margin:0;">✨ TaxSmart AI</h1>
    <p style="color:#aaa;font-size:12px;margin:8px 0 0;">Your Personalized Tax Report</p>
  </div>

  <div style="padding:24px;">
    <p style="font-size:16px;color:#333;">Dear <strong>${userName || 'User'}</strong>,</p>
    <p style="font-size:14px;color:#555;line-height:1.6;">Here is your comprehensive tax optimization report prepared by TaxSmart AI.</p>

    <!-- Regime Comparison -->
    <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:20px 0;">
      <h2 style="font-size:16px;color:#333;margin:0 0 16px;">📊 Regime Comparison</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px;font-size:14px;color:#666;">Old Regime Tax</td>
          <td style="padding:8px;font-size:16px;font-weight:700;text-align:right;color:#333;">${oldTax}</td>
        </tr>
        <tr>
          <td style="padding:8px;font-size:14px;color:#666;">New Regime Tax</td>
          <td style="padding:8px;font-size:16px;font-weight:700;text-align:right;color:#333;">${newTax}</td>
        </tr>
        <tr style="border-top:2px solid #d4af37;">
          <td style="padding:12px 8px;font-size:14px;font-weight:700;color:#333;">✅ Recommended: ${recommended}</td>
          <td style="padding:12px 8px;font-size:18px;font-weight:700;text-align:right;color:#16a34a;">Save ${savings}</td>
        </tr>
      </table>
      <p style="font-size:12px;color:#666;margin:12px 0 0;line-height:1.5;">${comparison.reason}</p>
    </div>

    <!-- Strategies -->
    <div style="margin:20px 0;">
      <h2 style="font-size:16px;color:#333;margin:0 0 12px;">🎯 Top Tax-Saving Strategies</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#f0f0f0;">
          <th style="padding:10px 8px;font-size:12px;text-align:left;color:#666;">Strategy</th>
          <th style="padding:10px 8px;font-size:12px;text-align:right;color:#666;">Savings</th>
          <th style="padding:10px 8px;font-size:12px;text-align:center;color:#666;">Difficulty</th>
        </tr>
        ${strategyRows}
        <tr style="background:#f0fdf4;">
          <td style="padding:12px 8px;font-size:14px;font-weight:700;color:#333;">Total Potential Savings</td>
          <td style="padding:12px 8px;font-size:16px;font-weight:700;text-align:right;color:#16a34a;">${totalStrategySavings}</td>
          <td></td>
        </tr>
      </table>
    </div>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="font-size:12px;color:#92400e;margin:0;line-height:1.5;">
        <strong>⚠️ Disclaimer:</strong> This report is generated using AI-based analysis and is for informational purposes only. 
        Please consult a qualified Chartered Accountant before making tax decisions.
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f5f5f5;padding:20px 24px;text-align:center;">
    <p style="font-size:11px;color:#999;margin:0;">Generated by TaxSmart AI · Based on Indian Income Tax Act</p>
  </div>
</div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: TaxReportRequest = await req.json();

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Valid email address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = generateEmailHTML(body);

    // Use Supabase's built-in email or return the HTML for client-side handling
    // For now, we'll generate and return success - email delivery can be wired to Lovable Emails later
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Tax report prepared for ${body.email}`,
        html 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate report email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
