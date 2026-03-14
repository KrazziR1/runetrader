// api/webhook.js
// Handles Stripe webhook events.
// On successful subscription payment, marks the user as Pro in Supabase.
//
// Setup:
//   1. In Stripe Dashboard → Developers → Webhooks → Add endpoint
//   2. URL: https://www.runetrader.gg/api/webhook
//   3. Events to listen for:
//      - customer.subscription.created
//      - customer.subscription.updated
//      - customer.subscription.deleted
//   4. Copy the Webhook Signing Secret → add to Vercel as STRIPE_WEBHOOK_SECRET
//
// Supabase setup (run once):
//   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
//   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
//   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
//   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service role key — NOT the anon key
);

// Disable body parsing so we can verify the raw Stripe signature
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const sig = req.headers["stripe-signature"];
  const rawBody = await getRawBody(req);
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  const { type, data } = event;
  const obj = data.object;

  try {
    if (type === "customer.subscription.created" || type === "customer.subscription.updated") {
      const userId = obj.metadata?.userId;
      if (!userId) {
        console.warn("No userId in subscription metadata");
        return res.status(200).json({ received: true });
      }

      const isActive = ["active", "trialing"].includes(obj.status);
      const expiresAt = obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : null;

      await supabase.from("user_profiles").upsert({
        user_id: userId,
        is_pro: isActive,
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.id,
        pro_expires_at: expiresAt,
      }, { onConflict: "user_id" });

      console.log(`User ${userId} pro status: ${isActive}`);
    }

    if (type === "customer.subscription.deleted") {
      const userId = obj.metadata?.userId;
      if (userId) {
        await supabase.from("user_profiles").update({
          is_pro: false,
          stripe_subscription_id: null,
          pro_expires_at: null,
        }).eq("user_id", userId);

        console.log(`User ${userId} subscription cancelled`);
      }
    }
  } catch (err) {
    console.error("Supabase update error:", err.message);
    // Still return 200 so Stripe doesn't retry
  }

  res.status(200).json({ received: true });
};
