import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userName,
      userEmail,
    } = body ?? {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    const valid = expected === razorpay_signature;

    if (valid) {
      // Fetch authoritative payment details from Razorpay (amount/currency/status)
      let amount = 29900;
      let currency = "INR";
      let status = "paid";
      try {
        if (keyId) {
          const auth = btoa(`${keyId}:${keySecret}`);
          const pr = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (pr.ok) {
            const p = await pr.json();
            amount = p.amount ?? amount;
            currency = p.currency ?? currency;
            status = p.status ?? status;
          }
        }
      } catch (e) {
        console.warn("Could not fetch payment details from Razorpay:", (e as Error).message);
      }

      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const { error: insertErr } = await supabase.from("payments").insert({
          user_name: userName ?? null,
          user_email: userEmail ?? null,
          razorpay_order_id,
          razorpay_payment_id,
          amount,
          currency,
          status,
        });
        if (insertErr) {
          // Don't fail verification on logging issues (e.g., duplicate inserts)
          console.error("Failed to log payment:", insertErr.message);
        }
      } catch (e) {
        console.error("Payment logging error:", (e as Error).message);
      }
    }

    return new Response(
      JSON.stringify({ valid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-razorpay-payment error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
