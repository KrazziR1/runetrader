// api/create-checkout.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const PRICE_ID = "price_1TAk4ECNKvvsYZxGopi1ANmE";
const REFERRAL_COUPON = "sAvO4kCM";
const SITE_URL = "https://www.runetrader.gg";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, email } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    // Check if this user was referred AND hasn't used their discount yet
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("referral_discount_used")
      .eq("user_id", userId)
      .single();

    // Check if a referral exists for this user as a referee
    const { data: referral } = await supabase
      .from("referrals")
      .select("id, status")
      .eq("referee_id", userId)
      .eq("status", "signed_up")
      .single();

    const applyDiscount = referral && profile && !profile.referral_discount_used;

    const sessionParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${SITE_URL}?upgrade=success`,
      cancel_url: `${SITE_URL}?upgrade=cancelled`,
      client_reference_id: userId,
      customer_email: email || undefined,
      metadata: { userId, applyDiscount: applyDiscount ? "true" : "false" },
      subscription_data: {
        metadata: { userId },
      },
    };

    // Apply 50% off coupon if eligible
    if (applyDiscount) {
      sessionParams.discounts = [{ coupon: REFERRAL_COUPON }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.status(200).json({ url: session.url, discountApplied: applyDiscount });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
