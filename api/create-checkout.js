// api/create-checkout.js
// Creates a Stripe Checkout session and returns the URL.
// Called from the frontend when a user clicks "Upgrade to Pro".

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PRICE_ID = "price_1TAk4ECNKvvsYZxGopi1ANmE";
const SITE_URL = "https://www.runetrader.gg";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, email } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${SITE_URL}?upgrade=success`,
      cancel_url: `${SITE_URL}?upgrade=cancelled`,
      client_reference_id: userId,
      customer_email: email || undefined,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
        trial_period_days: 0,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
