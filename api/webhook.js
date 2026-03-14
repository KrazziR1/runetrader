// api/webhook.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const REFERRAL_COUPON = "sAvO4kCM";
const LIFETIME_PRO_THRESHOLD = 10;

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const sig = req.headers["stripe-signature"];
  const rawBody = await getRawBody(req);
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  const { type, data } = event;
  const obj = data.object;

  try {
    if (type === "customer.subscription.created" || type === "customer.subscription.updated") {
      const userId = obj.metadata?.userId;
      if (!userId) return res.status(200).json({ received: true });

      const isActive = ["active", "trialing"].includes(obj.status);
      const expiresAt = obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : null;

      // Check if lifetime pro
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("lifetime_pro, referral_count, referral_discount_used")
        .eq("user_id", userId)
        .single();

      const isLifetimePro = profile?.lifetime_pro || false;

      await supabase.from("user_profiles").upsert({
        user_id: userId,
        is_pro: isActive || isLifetimePro,
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.id,
        pro_expires_at: isLifetimePro ? null : expiresAt,
      }, { onConflict: "user_id" });

      // If this was a new subscription (created event), handle referral rewards
      if (type === "customer.subscription.created" && isActive) {
        // Mark referee's discount as used
        if (!profile?.referral_discount_used) {
          await supabase.from("user_profiles")
            .update({ referral_discount_used: true })
            .eq("user_id", userId);
        }

        // Find if this user was referred by someone
        const { data: referral } = await supabase
          .from("referrals")
          .select("referrer_id, status")
          .eq("referee_id", userId)
          .single();

        if (referral && referral.referrer_id) {
          // Update referral status to converted
          await supabase.from("referrals")
            .update({ status: "converted" })
            .eq("referee_id", userId);

          // Increment referrer's referral count
          const { data: referrerProfile } = await supabase
            .from("user_profiles")
            .select("referral_count, stripe_customer_id, lifetime_pro")
            .eq("user_id", referral.referrer_id)
            .single();

          const newCount = (referrerProfile?.referral_count || 0) + 1;
          const earnedLifetimePro = newCount >= LIFETIME_PRO_THRESHOLD;

          await supabase.from("user_profiles").update({
            referral_count: newCount,
            lifetime_pro: earnedLifetimePro || referrerProfile?.lifetime_pro || false,
            is_pro: true,
          }).eq("user_id", referral.referrer_id);

          // Apply 50% coupon to referrer's next invoice if they have a Stripe customer
          if (referrerProfile?.stripe_customer_id && !referrerProfile?.lifetime_pro) {
            try {
              // Check referrer hasn't already used their referral discount
              const { data: referrerDiscount } = await supabase
                .from("user_profiles")
                .select("referral_discount_used")
                .eq("user_id", referral.referrer_id)
                .single();

              if (!referrerDiscount?.referral_discount_used) {
                await stripe.customers.update(referrerProfile.stripe_customer_id, {
                  coupon: REFERRAL_COUPON,
                });
                await supabase.from("user_profiles")
                  .update({ referral_discount_used: true })
                  .eq("user_id", referral.referrer_id);
              }
            } catch (couponErr) {
              console.error("Coupon apply error:", couponErr.message);
            }
          }

          // If referrer hit 10 referrals, cancel their subscription (now free for life)
          if (earnedLifetimePro && referrerProfile?.stripe_customer_id) {
            try {
              const subs = await stripe.subscriptions.list({
                customer: referrerProfile.stripe_customer_id,
                status: "active",
                limit: 1,
              });
              if (subs.data.length > 0) {
                await stripe.subscriptions.update(subs.data[0].id, {
                  cancel_at_period_end: true,
                });
              }
            } catch (cancelErr) {
              console.error("Lifetime pro sub cancel error:", cancelErr.message);
            }
          }
        }
      }
    }

    if (type === "customer.subscription.deleted") {
      const userId = obj.metadata?.userId;
      if (userId) {
        // Check if lifetime pro — don't revoke if so
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("lifetime_pro")
          .eq("user_id", userId)
          .single();

        if (!profile?.lifetime_pro) {
          await supabase.from("user_profiles").update({
            is_pro: false,
            stripe_subscription_id: null,
            pro_expires_at: null,
          }).eq("user_id", userId);
        }
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err.message);
  }

  res.status(200).json({ received: true });
};
