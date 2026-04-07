// PricingPage.js
import { useState } from "react";

const STYLES = `
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  .pricing-page { max-width:920px; margin:0 auto; padding:48px 24px 80px; animation:fadeUp 0.3s ease; }

  /* Header */
  .pricing-eyebrow { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:3px; color:#8a6f2e; font-family:'Cinzel',serif; margin-bottom:12px; }
  .pricing-heading { font-family:'Cinzel',serif; font-size:clamp(28px,4vw,40px); font-weight:800; color:#e8e8e8; line-height:1.15; margin-bottom:14px; }
  .pricing-sub { font-size:15px; color:#8fa0b0; line-height:1.7; max-width:480px; margin:0 auto; }

  /* Cards */
  .pricing-cards { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:48px; }

  .plan-card { border-radius:14px; padding:32px; display:flex; flex-direction:column; gap:24px; position:relative; overflow:hidden; }
  .plan-card.free { background:#111620; border:1px solid #1c2a3a; }
  .plan-card.pro { background:linear-gradient(160deg,#14201a 0%,#111620 60%,#1a1408 100%); border:2px solid rgba(201,168,76,0.4); }
  .plan-card.pro::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#8a6f2e,#c9a84c,#e8c96a,#c9a84c,#8a6f2e); }

  .plan-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; width:fit-content; }
  .plan-badge.free { background:rgba(255,255,255,0.05); color:#8fa0b0; border:1px solid #1c2a3a; }
  .plan-badge.popular { background:rgba(201,168,76,0.15); color:#c9a84c; border:1px solid rgba(201,168,76,0.3); }

  .plan-price { font-family:'Cinzel',serif; font-size:52px; font-weight:800; line-height:1; }
  .plan-price.free { color:#e8e8e8; }
  .plan-price.pro { background:linear-gradient(135deg,#b8922e,#e8c96a); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .plan-period { font-size:13px; color:#8fa0b0; margin-top:6px; }

  .plan-divider { height:1px; background:#1c2a3a; }

  .plan-features { display:flex; flex-direction:column; gap:10px; flex:1; }
  .plan-feature { display:flex; align-items:flex-start; gap:10px; font-size:14px; }
  .plan-feature-check { flex-shrink:0; margin-top:1px; font-size:13px; }
  .plan-feature-text { color:#ccd8e0; line-height:1.5; }
  .plan-feature-text.dim { color:#8fa0b0; }

  .plan-cta { width:100%; padding:15px; border-radius:10px; font-size:15px; font-weight:700; font-family:'Cinzel',serif; letter-spacing:0.5px; cursor:pointer; transition:all 0.2s; border:none; }
  .plan-cta.free { background:transparent; border:1px solid #1c2a3a; color:#8fa0b0; cursor:default; }
  .plan-cta.upgrade { background:linear-gradient(135deg,#8a6f2e,#c9a84c); color:#000; }
  .plan-cta.upgrade:hover { opacity:0.88; transform:translateY(-1px); }
  .plan-cta.active { background:rgba(46,204,113,0.12); color:#2ecc71; border:1px solid rgba(46,204,113,0.25); cursor:default; }
  .plan-cta-sub { text-align:center; font-size:12px; color:#6a7d90; margin-top:8px; }

  /* Referral banner */
  .ref-banner { margin-top:28px; background:#111620; border:1px solid rgba(201,168,76,0.25); border-radius:14px; padding:28px 32px; position:relative; overflow:hidden; }
  .ref-banner::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent); }
  .ref-banner-title { font-family:'Cinzel',serif; font-size:18px; font-weight:700; color:#c9a84c; margin-bottom:8px; }
  .ref-banner-sub { font-size:14px; color:#8fa0b0; line-height:1.7; margin-bottom:20px; }
  .ref-banner-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:22px; }
  .ref-banner-card { background:#0c1018; border:1px solid #1c2a3a; border-radius:10px; padding:16px; display:flex; gap:12px; }
  .ref-banner-card-emoji { font-size:20px; flex-shrink:0; }
  .ref-banner-card-title { font-size:14px; font-weight:600; color:#e8e8e8; margin-bottom:4px; }
  .ref-banner-card-desc { font-size:13px; color:#8fa0b0; line-height:1.5; }
  .ref-cta-btn { display:inline-flex; align-items:center; gap:8px; padding:11px 24px; border-radius:8px; border:1px solid rgba(201,168,76,0.3); background:rgba(201,168,76,0.08); color:#c9a84c; font-size:14px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.15s; }
  .ref-cta-btn:hover { background:rgba(201,168,76,0.14); border-color:rgba(201,168,76,0.5); }
  .ref-cta-note { font-size:12px; color:#6a7d90; margin-left:12px; }

  /* FAQ */
  .faq { margin-top:56px; }
  .faq-heading { font-family:'Cinzel',serif; font-size:20px; font-weight:700; color:#e8e8e8; text-align:center; margin-bottom:28px; }
  .faq-item { border-top:1px solid #1c2a3a; padding:20px 0; }
  .faq-item:last-child { border-bottom:1px solid #1c2a3a; }
  .faq-q { font-size:15px; font-weight:600; color:#e8e8e8; margin-bottom:8px; }
  .faq-a { font-size:14px; color:#8fa0b0; line-height:1.7; }
`;

const FREE_FEATURES = [
  "Live market data \u2014 4,525 items",
  "Price history charts",
  "Watchlist with price alerts",
  "Smart alerts \u2014 dumps, spikes, crashes",
  "Tracker \u2014 flip history & profit",
  "Shareable item URLs",
  "AI Advisor (limited context)",
];

const PRO_FEATURES = [
  { text: "Everything in Free", dim: true },
  { text: "Trading Terminal (Merchant Mode)" },
  { text: "Live GE slot tracking via RuneLite" },
  { text: "AI Advisor with full slot context" },
  { text: "Advanced filters & sorting" },
  { text: "CSV export" },
  { text: "Custom alert thresholds" },
  { text: "Sparkline trend charts" },
  { text: "Rotation picks & flip queue" },
  { text: "Autopilot rules per position" },
  { text: "Daily GP goal tracker" },
  { text: "Shareable flip cards" },
  { text: "Priority support" },
];

export default function PricingPage({ user, onSignIn, isPro, onGoToReferral }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleUpgrade() {
    if (!user) { onSignIn(); return; }
    if (isPro) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError("Something went wrong. Please try again.");
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="pricing-page">
      <style>{STYLES}</style>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:"8px" }}>
        <div className="pricing-eyebrow">Pricing</div>
        <div className="pricing-heading">Simple, transparent pricing</div>
        <div className="pricing-sub">Start free. Upgrade when you're ready to trade at full speed.</div>
      </div>

      {/* Plan cards */}
      <div className="pricing-cards">

        {/* FREE */}
        <div className="plan-card free">
          <div>
            <div className="plan-badge free">Free</div>
            <div style={{ marginTop:"16px" }}>
              <div className="plan-price free">$0</div>
              <div className="plan-period">Forever free</div>
            </div>
          </div>
          <div className="plan-divider" />
          <div className="plan-features">
            {FREE_FEATURES.map((f, i) => (
              <div key={i} className="plan-feature">
                <span className="plan-feature-check" style={{ color:"#2ecc71" }}>\u2713</span>
                <span className="plan-feature-text">{f}</span>
              </div>
            ))}
          </div>
          <div>
            <button className="plan-cta free" disabled>
              {user ? "Current plan" : "Get started free"}
            </button>
          </div>
        </div>

        {/* PRO */}
        <div className="plan-card pro">
          <div>
            <div className="plan-badge popular">\u2726 Most Popular</div>
            <div style={{ marginTop:"16px" }}>
              <div className="plan-price pro">$9.99</div>
              <div className="plan-period">per month · cancel any time</div>
            </div>
          </div>
          <div className="plan-divider" />
          <div className="plan-features">
            {PRO_FEATURES.map((f, i) => (
              <div key={i} className="plan-feature">
                <span className="plan-feature-check" style={{ color: f.dim ? "#8fa0b0" : "#c9a84c" }}>\u25C6</span>
                <span className={`plan-feature-text${f.dim ? " dim" : ""}`}>{f.text}</span>
              </div>
            ))}
          </div>
          {error && <div style={{ fontSize:"13px", color:"#e74c3c", textAlign:"center" }}>{error}</div>}
          <div>
            <button
              className={`plan-cta ${isPro ? "active" : "upgrade"}`}
              onClick={handleUpgrade}
              disabled={loading || isPro}
            >
              {isPro ? "\u2713 You're on Pro" : loading ? "Redirecting to Stripe..." : !user ? "Sign up to upgrade \u2192" : "Upgrade to Pro \u2192"}
            </button>
            {!isPro && <div className="plan-cta-sub">Secured by Stripe · Cancel any time</div>}
          </div>
        </div>
      </div>

      {/* Referral banner */}
      <div className="ref-banner">
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
          <span style={{ fontSize:"22px" }}>\uD83D\uDC51</span>
          <div className="ref-banner-title">Refer a friend \u2014 both get 50% off. Refer 3 \u2192 Pro for life.</div>
        </div>
        <div className="ref-banner-sub">
          Share your referral link. When a friend signs up and upgrades to Pro, <strong style={{ color:"#e8e8e8" }}>you both get 50% off your first month</strong>. Refer <strong style={{ color:"#c9a84c" }}>3 paying friends</strong> and get RuneTrader Pro free forever.
        </div>
        <div className="ref-banner-grid">
          <div className="ref-banner-card">
            <div className="ref-banner-card-emoji">\uD83C\uDF81</div>
            <div>
              <div className="ref-banner-card-title">You get</div>
              <div className="ref-banner-card-desc">50% off your first month when your friend upgrades. Refer 3 paying friends \u2192 <span style={{ color:"#c9a84c", fontWeight:600 }}>Pro free for life</span>.</div>
            </div>
          </div>
          <div className="ref-banner-card">
            <div className="ref-banner-card-emoji">\uD83D\uDC4B</div>
            <div>
              <div className="ref-banner-card-title">Your friend gets</div>
              <div className="ref-banner-card-desc">50% off their first month of Pro \u2014 automatically applied when they checkout via your link.</div>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:"8px" }}>
          {user ? (
            <button className="ref-cta-btn" onClick={onGoToReferral}>Get my referral link \u2192</button>
          ) : (
            <button className="ref-cta-btn" onClick={onSignIn}>Sign up to get your referral link \u2192</button>
          )}
          <span className="ref-cta-note">50% off is a one-time reward per account</span>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq">
        <div className="faq-heading">Common questions</div>
        {[
          ["What is the Trading Terminal?", "The Trading Terminal (formerly Merchant Mode) is RuneTrader's flagship Pro feature \u2014 a dedicated screen that manages all your GE slots, tracks live P&L, suggests what to flip next based on your idle GP, and lets you set per-position autopilot rules."],
          ["Do I need the RuneLite plugin?", "Yes for live slot tracking \u2014 the plugin syncs your GE offers to RuneTrader in real time. Without it, the market data, AI advisor and watchlist still work fully. The plugin is free and takes about 2 minutes to install."],
          ["Can I cancel any time?", "Yes. Cancel your Pro subscription any time from your Stripe billing portal. You keep Pro access until the end of your billing period."],
          ["Is there a free trial?", "New signups get a 3-day Pro trial automatically \u2014 no credit card needed. After that, the free tier remains generous with full market access and AI advisor."],
          ["What happens to my data if I cancel?", "All your flip history, watchlist, and alerts stay in your account. You just lose access to Pro-gated features."],
        ].map(([q, a], i) => (
          <div key={i} className="faq-item">
            <div className="faq-q">{q}</div>
            <div className="faq-a">{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
