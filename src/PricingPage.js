// PricingPage.js
import { useState } from "react";

const FREE_FEATURES = [
  "Live market data — 4,525 items",
  "Price history charts",
  "Watchlist with price alerts",
  "Smart alerts — dumps, spikes, crashes",
  "Tracker — flip history & profit",
  "Shareable item URLs",
  "AI Advisor (limited context)",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Merchant Mode trading terminal",
  "Live GE slot tracking via RuneLite",
  "AI Advisor with full slot context",
  "Advanced filters & sorting",
  "CSV export",
  "Custom alert thresholds",
  "Sparkline trend charts",
  "Rotation picks & flip queue",
  "Autopilot rules per position",
  "Daily GP goal tracker",
  "Shareable flip cards",
  "Priority support",
];

export default function PricingPage({ user, onSignIn, isPro }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleUpgrade() {
    if (!user) {
      onSignIn();
      return;
    }
    if (isPro) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "var(--gold-dim)", fontFamily: "Cinzel, serif", marginBottom: "12px" }}>Pricing</div>
        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 700, color: "var(--text)", marginBottom: "16px", lineHeight: 1.2 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-dim)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
          Start free. Upgrade when you're ready to trade at full speed.
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* FREE */}
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "16px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-dim)", fontFamily: "Cinzel, serif", marginBottom: "8px" }}>Free</div>
            <div style={{ fontFamily: "Cinzel, serif", fontSize: "42px", fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>$0</div>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "6px" }}>Forever free</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
            {FREE_FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "var(--text-dim)" }}>
                <span style={{ color: "var(--green)", flexShrink: 0, marginTop: "1px" }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>

          <button
            disabled
            style={{ width: "100%", padding: "13px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "14px", fontWeight: 600, fontFamily: "Inter, sans-serif", cursor: "default" }}
          >
            {user ? "Current plan" : "Get started free"}
          </button>
        </div>

        {/* PRO */}
        <div style={{ background: "var(--bg2)", border: "2px solid var(--gold-dim)", borderRadius: "16px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px", position: "relative", overflow: "hidden" }}>
          {/* Glow */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-dim))" }} />

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--gold)", fontFamily: "Cinzel, serif" }}>Pro</div>
              <span style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", border: "1px solid var(--gold-dim)", borderRadius: "20px", padding: "2px 10px", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>Most Popular</span>
            </div>
            <div style={{ fontFamily: "Cinzel, serif", fontSize: "42px", fontWeight: 700, color: "var(--gold)", lineHeight: 1 }}>$9.99</div>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "6px" }}>per month · cancel any time</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
            {PRO_FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: i === 0 ? "var(--text-dim)" : "var(--text)" }}>
                <span style={{ color: "var(--gold)", flexShrink: 0, marginTop: "1px" }}>◆</span>
                <span>{f}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ fontSize: "13px", color: "var(--red)", textAlign: "center" }}>{error}</div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading || isPro}
            style={{
              width: "100%", padding: "14px", borderRadius: "8px", border: "none",
              background: isPro ? "rgba(46,204,113,0.15)" : "linear-gradient(135deg, var(--gold-dim), var(--gold))",
              color: isPro ? "var(--green)" : "#000",
              fontSize: "14px", fontWeight: 700, fontFamily: "Cinzel, serif",
              letterSpacing: "1px", cursor: isPro ? "default" : "pointer",
              transition: "all 0.2s", opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={e => { if (!isPro && !loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {isPro ? "✓ You're on Pro" : loading ? "Redirecting to Stripe..." : !user ? "Sign up to upgrade →" : "Upgrade to Pro →"}
          </button>

          {!isPro && (
            <div style={{ textAlign: "center", fontSize: "12px", color: "var(--text-dim)" }}>
              Secured by Stripe · Cancel any time from your account
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginTop: "64px", display: "flex", flexDirection: "column", gap: "0" }}>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "24px", textAlign: "center" }}>
          Common questions
        </div>
        {[
          ["What is Merchant Mode?", "Merchant Mode is RuneTrader's flagship trading terminal — a dedicated screen that manages all your GE slots, tracks live P&L, suggests what to flip next based on your idle GP, and lets you set per-position autopilot rules. It's built for players actively flipping multiple items at once."],
          ["Do I need the RuneLite plugin?", "Yes — the plugin is what syncs your live GE slot data to RuneTrader. Without it, the market data and AI advisor still work, but Merchant Mode and live slot tracking require the plugin. It's free and takes about 2 minutes to install."],
          ["Can I cancel any time?", "Yes. You can cancel your Pro subscription at any time from your Stripe billing portal. You'll keep Pro access until the end of your current billing period."],
          ["Is there a free trial?", "Not currently — but the free tier is generous enough to evaluate whether Pro is worth it. Everything except Merchant Mode and the locked features is free."],
          ["What happens to my data if I cancel?", "All your flip history, watchlist, and alerts stay in your account. You just lose access to Pro features."],
        ].map(([q, a], i) => (
          <div key={i} style={{ borderTop: "1px solid var(--border)", padding: "20px 0" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>{q}</div>
            <div style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.7 }}>{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
