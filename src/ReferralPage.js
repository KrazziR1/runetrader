// src/ReferralPage.js
import { useState, useEffect } from "react";

export default function ReferralPage({ user, supabase, showToast }) {
  const [refCode, setRefCode] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [lifetimePro, setLifetimePro] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadReferralData();
  }, [user]); // eslint-disable-line

  async function loadReferralData() {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("ref_code, referral_count, lifetime_pro")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setRefCode(profile.ref_code);
        setReferralCount(profile.referral_count || 0);
        setLifetimePro(profile.lifetime_pro || false);
      }

      const { data: refs } = await supabase
        .from("referrals")
        .select("status, created_at")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      setReferrals(refs || []);
    } catch (err) {
      console.error("Referral load error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const refLink = refCode
    ? `https://www.runetrader.gg?ref=${refCode}`
    : null;

  const converted = referrals.filter(r => r.status === "converted").length;
  const pending = referrals.filter(r => r.status === "signed_up").length;
  const progressPct = Math.min((referralCount / 10) * 100, 100);

  function copyLink() {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink).then(() => {
      showToast("Referral link copied! Share it with friends 🔗", "success");
    });
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "80px 20px", textAlign: "center", color: "var(--text-dim)" }}>
        <div style={{ fontSize: "40px", opacity: 0.4 }}>🔗</div>
        <p style={{ fontSize: "15px" }}>Sign in to access your referral link</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "640px" }}>

      {/* Lifetime Pro badge */}
      {lifetimePro && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(201,168,76,0.1)", border: "1px solid var(--gold-dim)", borderRadius: "12px", padding: "16px 20px" }}>
          <span style={{ fontSize: "24px" }}>👑</span>
          <div>
            <div style={{ fontFamily: "Cinzel, serif", fontSize: "14px", fontWeight: 700, color: "var(--gold)" }}>Pro for Life — Unlocked</div>
            <div style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "2px" }}>You referred 10 friends. RuneTrader Pro is yours forever, free of charge.</div>
          </div>
        </div>
      )}

      {/* Your referral link */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: "13px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1px" }}>
          Your Referral Link
        </div>
        <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.6, margin: 0 }}>
          Share your link with friends. When they sign up and upgrade to Pro, you both get <strong style={{ color: "var(--text)" }}>50% off your first month</strong>. Refer 10 paying friends and get <strong style={{ color: "var(--gold)" }}>Pro free for life</strong>.
        </p>

        {loading ? (
          <div style={{ height: "44px", background: "var(--bg4)", borderRadius: "8px", animation: "shimmer 1.5s infinite" }} />
        ) : refLink ? (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ flex: 1, background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "var(--text-dim)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {refLink}
            </div>
            <button
              onClick={copyLink}
              style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Copy Link
            </button>
          </div>
        ) : (
          <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>Generating your referral link...</div>
        )}

        {/* Share shortcuts */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { label: "Share on Reddit", url: `https://reddit.com/submit?url=${encodeURIComponent(refLink || "")}&title=Try RuneTrader — AI-powered OSRS flipping tool (50% off first month)` },
            { label: "Share on Discord", onClick: () => { navigator.clipboard.writeText(`Hey! Check out RuneTrader.gg — it's an AI-powered GE flipping tool for OSRS. Use my link for 50% off your first month: ${refLink}`).then(() => showToast("Discord message copied!", "success")); } },
          ].map((btn, i) => (
            <button key={i}
              onClick={btn.onClick || (() => window.open(btn.url, "_blank"))}
              style={{ padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "var(--gold-dim)"; e.currentTarget.style.color = "var(--gold)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        {[
          { label: "Total Referrals", value: referralCount, color: "var(--gold)" },
          { label: "Converted to Pro", value: converted, color: "var(--green)" },
          { label: "Signed Up (pending)", value: pending, color: "var(--text-dim)" },
        ].map((s, i) => (
          <div key={i} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            <div style={{ fontFamily: "Cinzel, serif", fontSize: "24px", fontWeight: 700, color: s.color }}>{loading ? "—" : s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress to Pro for Life */}
      {!lifetimePro && (
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "Cinzel, serif", fontSize: "13px", fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: "1px" }}>
              👑 Pro for Life Progress
            </div>
            <div style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 600 }}>
              {referralCount} / 10 referrals
            </div>
          </div>
          <div style={{ background: "var(--bg4)", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, var(--gold-dim), var(--gold))", borderRadius: "6px", transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>
            {10 - referralCount > 0
              ? `Refer ${10 - referralCount} more friend${10 - referralCount !== 1 ? "s" : ""} who upgrade to Pro and get RuneTrader Pro free for life.`
              : "You're almost there!"}
          </div>
        </div>
      )}

      {/* Referral history */}
      {referrals.length > 0 && (
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontFamily: "Cinzel, serif", fontSize: "12px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Referral History
          </div>
          {referrals.slice(0, 10).map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: i < referrals.length - 1 ? "1px solid var(--border)" : "none", fontSize: "13px" }}>
              <div style={{ color: "var(--text-dim)" }}>
                {new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </div>
              <span style={{
                padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                background: r.status === "converted" ? "rgba(46,204,113,0.12)" : "rgba(201,168,76,0.1)",
                color: r.status === "converted" ? "var(--green)" : "var(--text-dim)",
                border: `1px solid ${r.status === "converted" ? "var(--green-dim)" : "var(--border)"}`,
              }}>
                {r.status === "converted" ? "✓ Upgraded to Pro" : "Signed up"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
