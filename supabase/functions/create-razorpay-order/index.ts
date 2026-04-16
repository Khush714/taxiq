import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({
          error: "Razorpay not configured",
          message: "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in backend secrets.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const amountInPaise = 29900; // ₹299
    const currency = "INR";

    const auth = btoa(`${keyId}:${keySecret}`);
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: `taxsmart_${Date.now()}`,
        notes: {
          product: "TaxSmart AI – Top 10 Strategies Unlock",
          userName: body?.userName ?? "",
          userEmail: body?.userEmail ?? "",
        },
      }),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error("Razorpay order create failed:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to create order", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await orderRes.json();
    return new Response(
      JSON.stringify({ orderId: order.id, amount: order.amount, currency: order.currency, keyId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-razorpay-order error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
