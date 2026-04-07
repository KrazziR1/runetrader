// src/ReferralPage.js
import { useState, useEffect } from "react";

const STYLES = `
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .ref-page { display:flex; flex-direction:column; gap:20px; max-width:680px; animation:fadeUp 0.3s ease; }

  .ref-hero {
    border-radius:14px; padding:32px 28px; position:relative; overflow:hidden;
    background:linear-gradient(135deg, #0f1a10 0%, #111620 50%, #1a1408 100%);
    border:1px solid rgba(201,168,76,0.25);
  }
  .ref-hero::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse 60% 80% at 90% 50%, rgba(201,168,76,0.07) 0%, transparent 70%);
  }
  .ref-hero-crown { font-size:36px; margin-bottom:12px; display:block; }
  .ref-hero-title {
    font-family:'Cinzel',serif; font-size:24px; font-weight:800;
    background:linear-gradient(135deg,#b8922e,#e8c96a,#c9a84c);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    letter-spacing:1px; margin-bottom:8px;
  }
  .ref-hero-sub { font-size:15px; color:#99aabb; line-height:1.7; max-width:480px; }
  .ref-hero-sub strong { color:#e8e8e8; }
  .ref-hero-sub .gold { color:#c9a84c; font-weight:600; }

  .ref-rewards { display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; }
  .ref-reward-pill {
    display:flex; align-items:center; gap:8px; padding:10px 16px;
    border-radius:8px; border:1px solid rgba(201,168,76,0.2);
    background:rgba(201,168,76,0.06);
  }
  .ref-reward-pill-icon { font-size:16px; }
  .ref-reward-pill-text { color:#c9a84c; font-weight:600; font-size:14px; }
  .ref-reward-pill-sub { color:#8fa0b0; font-size:13px; margin-left:2px; }

  .ref-link-card {
    background:#111620; border:1px solid #1c2a3a; border-radius:12px;
    padding:22px; display:flex; flex-direction:column; gap:14px;
  }
  .ref-link-card-title { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:2px; color:#6a7d90; }
  .ref-link-row { display:flex; gap:10px; align-items:stretch; }
  .ref-link-box {
    flex:1; background:#0c1018; border:1px solid #1c2a3a; border-radius:8px;
    padding:12px 16px; font-size:14px; color:#8fa0b0; font-family:monospace;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center;
  }
  .ref-link-prefix { color:#3d5060; margin-right:2px; }
  .ref-link-code { color:#c9a84c; font-weight:600; }
  .ref-copy-btn {
    padding:12px 22px; border-radius:8px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#8a6f2e,#c9a84c); color:#000;
    font-size:14px; font-weight:700; font-family:'Inter',sans-serif;
    white-space:nowrap; flex-shrink:0; transition:opacity 0.15s; letter-spacing:0.3px;
  }
  .ref-copy-btn:hover { opacity:0.88; }
  .ref-share-row { display:flex; gap:8px; flex-wrap:wrap; }
  .ref-share-btn {
    padding:8px 16px; border-radius:6px; border:1px solid #1c2a3a;
    background:transparent; color:#8fa0b0; font-size:13px; cursor:pointer;
    font-family:'Inter',sans-serif; transition:all 0.15s;
  }
  .ref-share-btn:hover { border-color:rgba(201,168,76,0.3); color:#c9a84c; background:rgba(201,168,76,0.05); }

  .ref-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .ref-stat {
    background:#111620; border:1px solid #1c2a3a; border-radius:10px;
    padding:18px; display:flex; flex-direction:column; gap:5px; transition:border-color 0.2s;
  }
  .ref-stat:hover { border-color:#28394d; }
  .ref-stat-label { font-size:12px; color:#6a7d90; text-transform:uppercase; letter-spacing:1px; font-weight:500; }
  .ref-stat-value { font-family:'Cinzel',serif; font-size:28px; font-weight:700; line-height:1.1; }
  .ref-stat-sub { font-size:13px; color:#6a7d90; margin-top:2px; }

  .ref-progress-card {
    background:#111620; border:1px solid #1c2a3a; border-radius:12px;
    padding:22px; display:flex; flex-direction:column; gap:16px;
  }
  .ref-progress-header { display:flex; justify-content:space-between; align-items:flex-start; }
  .ref-progress-title { font-family:'Cinzel',serif; font-size:17px; font-weight:700; color:#e8e8e8; }
  .ref-progress-subtitle { font-size:13px; color:#6a7d90; margin-top:4px; }
  .ref-progress-count { font-family:'Cinzel',serif; font-size:20px; font-weight:700; color:#c9a84c; white-space:nowrap; }
  .ref-progress-track { background:#0c1018; border-radius:6px; height:10px; overflow:hidden; border:1px solid #1c2a3a; }
  .ref-progress-fill { height:100%; border-radius:6px; transition:width 0.6s ease; background:linear-gradient(90deg,#8a6f2e,#c9a84c,#e8c96a); }
  .ref-milestones { display:flex; gap:10px; }
  .ref-milestone {
    flex:1; display:flex; flex-direction:column; align-items:center; gap:8px;
    padding:14px 10px; border-radius:8px; border:1px solid #1c2a3a;
    background:#0c1018; text-align:center;
  }
  .ref-milestone.done { border-color:rgba(201,168,76,0.3); background:rgba(201,168,76,0.05); }
  .ref-milestone-num {
    width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:700; font-family:'Cinzel',serif;
    border:1px solid #1c2a3a; color:#6a7d90; background:#111620;
  }
  .ref-milestone.done .ref-milestone-num { background:rgba(201,168,76,0.15); border-color:rgba(201,168,76,0.4); color:#c9a84c; }
  .ref-milestone-label { font-size:12px; color:#6a7d90; line-height:1.5; }
  .ref-milestone.done .ref-milestone-label { color:#99aabb; }

  .ref-history { background:#111620; border:1px solid #1c2a3a; border-radius:12px; overflow:hidden; }
  .ref-history-header { padding:14px 20px; border-bottom:1px solid #1c2a3a; display:flex; align-items:center; justify-content:space-between; }
  .ref-history-title { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:2px; color:#6a7d90; }
  .ref-history-row { display:flex; justify-content:space-between; align-items:center; padding:13px 20px; border-bottom:1px solid #0f1820; font-size:14px; }
  .ref-history-row:last-child { border-bottom:none; }
  .ref-history-date { color:#6a7d90; }
  .ref-status-converted { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; background:rgba(46,204,113,0.1); color:#2ecc71; border:1px solid rgba(46,204,113,0.2); }
  .ref-status-pending { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; background:rgba(201,168,76,0.08); color:#8a6f2e; border:1px solid rgba(201,168,76,0.15); }

  .ref-lifetime {
    display:flex; align-items:center; gap:16px; padding:22px 26px;
    background:linear-gradient(135deg,rgba(201,168,76,0.12),rgba(201,168,76,0.06));
    border:1px solid rgba(201,168,76,0.35); border-radius:12px;
  }
  .ref-lifetime-icon { font-size:32px; flex-shrink:0; }
  .ref-lifetime-title { font-family:'Cinzel',serif; font-size:18px; font-weight:700; color:#c9a84c; }
  .ref-lifetime-sub { font-size:14px; color:#99aabb; margin-top:4px; }

  .ref-skeleton { background:linear-gradient(90deg,#0c1018 25%,#111620 50%,#0c1018 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:6px; }
  .ref-no-link { font-size:14px; color:#6a7d90; padding:8px 0; }
`;

export default function ReferralPage({ user, supabase, showToast, userRefCode }) {
  const [refCode, setRefCode] = useState(userRefCode || null);
  const [referralCount, setReferralCount] = useState(0);
  const [lifetimePro, setLifetimePro] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Seed from App.js prop immediately — avoids the "generating" flash
  useEffect(() => {
    if (userRefCode && !refCode) setRefCode(userRefCode);
  }, [userRefCode]); // eslint-disable-line

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
        setRefCode(profile.ref_code || userRefCode || null);
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

  const refLink = refCode ? `https://www.runetrader.gg?ref=${refCode}` : null;
  const converted = referrals.filter(r => r.status === "converted").length;
  const pending = referrals.filter(r => r.status === "signed_up").length;
  const progressPct = Math.min((referralCount / 3) * 100, 100);

  function copyLink() {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      showToast("Referral link copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyDiscord() {
    navigator.clipboard.writeText(
      `Hey! Check out RuneTrader.gg — it's an AI-powered GE flipping tool for OSRS. Use my link for 50% off your first month: ${refLink}`
    ).then(() => showToast("Discord message copied!", "success"));
  }

  if (!user) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", padding:"80px 20px", textAlign:"center", color:"var(--text-dim)" }}>
      <div style={{ fontSize:"40px", opacity:0.4 }}>🔗</div>
      <p style={{ fontSize:"15px" }}>Sign in to access your referral link</p>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="ref-page">

        {lifetimePro && (
          <div className="ref-lifetime">
            <div className="ref-lifetime-icon">👑</div>
            <div>
              <div className="ref-lifetime-title">Pro for Life — Unlocked</div>
              <div className="ref-lifetime-sub">You referred 3 friends. RuneTrader Pro is yours forever, free of charge.</div>
            </div>
          </div>
        )}

        <div className="ref-hero">
          <span className="ref-hero-crown">👑</span>
          <div className="ref-hero-title">Refer & Earn</div>
          <div className="ref-hero-sub">
            Share RuneTrader with friends and both get <strong>50% off your first month</strong> of Pro.
            Refer <span className="gold">3 paying friends</span> and unlock Pro free for life.
          </div>
          <div className="ref-rewards">
            <div className="ref-reward-pill">
              <span className="ref-reward-pill-icon">🤝</span>
              <span className="ref-reward-pill-text">50% off</span>
              <span className="ref-reward-pill-sub">for you &amp; your friend</span>
            </div>
            <div className="ref-reward-pill">
              <span className="ref-reward-pill-icon">👑</span>
              <span className="ref-reward-pill-text">Pro for life</span>
              <span className="ref-reward-pill-sub">at 3 conversions</span>
            </div>
            <div className="ref-reward-pill">
              <span className="ref-reward-pill-icon">⚡</span>
              <span className="ref-reward-pill-text">Instant</span>
              <span className="ref-reward-pill-sub">discount applied at checkout</span>
            </div>
          </div>
        </div>

        <div className="ref-link-card">
          <div className="ref-link-card-title">Your referral link</div>
          {loading && !refCode ? (
            <div className="ref-skeleton" style={{ height:"48px" }} />
          ) : refLink ? (
            <>
              <div className="ref-link-row">
                <div className="ref-link-box">
                  <span className="ref-link-prefix">runetrader.gg?ref=</span>
                  <span className="ref-link-code">{refCode}</span>
                </div>
                <button className="ref-copy-btn" onClick={copyLink}>
                  {copied ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
              <div className="ref-share-row">
                <button className="ref-share-btn" onClick={() => window.open(`https://reddit.com/submit?url=${encodeURIComponent(refLink)}&title=Try RuneTrader — AI-powered OSRS flipping tool (50% off first month)`, "_blank")}>
                  Share on Reddit
                </button>
                <button className="ref-share-btn" onClick={copyDiscord}>
                  Copy Discord message
                </button>
              </div>
            </>
          ) : (
            <div className="ref-no-link">
              {loading ? "Loading your referral link..." : "No referral code found — try signing out and back in."}
            </div>
          )}
        </div>

        <div className="ref-stats">
          {[
            { label:"Total Referrals",    value: referralCount, color:"#c9a84c", sub:"all time" },
            { label:"Converted to Pro",   value: converted,     color:"#2ecc71", sub:"paying friends" },
            { label:"Signed Up",          value: pending,       color:"#8fa0b0", sub:"pending upgrade" },
          ].map((s, i) => (
            <div key={i} className="ref-stat">
              <div className="ref-stat-label">{s.label}</div>
              <div className="ref-stat-value" style={{ color: s.color }}>
                {loading ? <span className="ref-skeleton" style={{ display:"inline-block", width:"40px", height:"28px" }} /> : s.value}
              </div>
              <div className="ref-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {!lifetimePro && (
          <div className="ref-progress-card">
            <div className="ref-progress-header">
              <div>
                <div className="ref-progress-title">Progress to Pro for Life</div>
                <div className="ref-progress-subtitle">
                  {referralCount >= 3
                    ? "You've hit the target — lifetime Pro incoming!"
                    : `${3 - referralCount} more conversion${3 - referralCount !== 1 ? "s" : ""} to go`}
                </div>
              </div>
              <div className="ref-progress-count">{referralCount} / 3</div>
            </div>
            <div className="ref-progress-track">
              <div className="ref-progress-fill" style={{ width:`${progressPct}%` }} />
            </div>
            <div className="ref-milestones">
              {[1, 2, 3].map(n => {
                const done = referralCount >= n;
                return (
                  <div key={n} className={`ref-milestone${done ? " done" : ""}`}>
                    <div className="ref-milestone-num">{done ? "✓" : n}</div>
                    <div className="ref-milestone-label">
                      {n === 1 ? "First friend converts" : n === 2 ? "Second friend converts" : "Pro for life 👑"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {referrals.length > 0 && (
          <div className="ref-history">
            <div className="ref-history-header">
              <div className="ref-history-title">Referral History</div>
              <div style={{ fontSize:"13px", color:"#6a7d90" }}>{referrals.length} total</div>
            </div>
            {referrals.slice(0, 10).map((r, i) => (
              <div key={i} className="ref-history-row">
                <div className="ref-history-date">
                  {new Date(r.created_at).toLocaleDateString([], { month:"short", day:"numeric", year:"numeric" })}
                </div>
                <span className={r.status === "converted" ? "ref-status-converted" : "ref-status-pending"}>
                  {r.status === "converted" ? "✓ Upgraded to Pro" : "Signed up"}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
