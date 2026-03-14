import { useState, useMemo } from "react";
import Sparkline from "./Sparkline";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatGP(n) {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (Math.abs(n) >= 1_000_000)     return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000)         return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

function formatVol(v) {
  if (!v) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + "k";
  return v.toLocaleString();
}

function timeAgo(ts) {
  if (!ts) return "—";
  const sec = Math.floor(Date.now() / 1000 - ts);
  if (sec < 60)    return `${sec}s ago`;
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function freshnessAge(ts) {
  if (!ts) return Infinity;
  return Math.floor(Date.now() / 1000 - ts);
}

function itemIconUrl(name) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(
    name.replace(/ /g, "_")
  )}.png?format=png`;
}

function parseCash(str) {
  if (!str || str.trim() === "") return Infinity;
  const s = str.trim().toLowerCase().replace(/,/g, "");
  if (s.endsWith("b")) return parseFloat(s) * 1_000_000_000;
  if (s.endsWith("m")) return parseFloat(s) * 1_000_000;
  if (s.endsWith("k")) return parseFloat(s) * 1_000;
  const n = parseFloat(s);
  return isNaN(n) ? Infinity : n;
}

function calcGpPerFill(item) {
  const lim    = item.buyLimit > 0 ? item.buyLimit : 500;
  const mkt4hr = (item.volume || 0) / 6;
  let expFill;
  if      (item.volume >= 500_000) expFill = Math.min(lim, mkt4hr);
  else if (item.volume >= 100_000) expFill = Math.min(lim, mkt4hr * 0.6);
  else if (item.volume >= 20_000)  expFill = Math.min(lim, mkt4hr * 0.2);
  else if (item.volume >= 5_000)   expFill = Math.min(lim, mkt4hr * 0.08);
  else                             expFill = Math.min(lim, mkt4hr * 0.03);
  return Math.round((item.margin || 0) * Math.max(expFill, 1));
}

// ── Tier Qualification ────────────────────────────────────────────────────────
// LOW:    vol/limit ≥ 70×  |  margin > 0       |  freshness ≤ 15min
// MEDIUM: vol/limit ≥ 15×  |  buy 200k–10M     |  margin ≥ 30k   |  freshness ≤ 45min
// HIGH:   vol/limit ≥ 8×   |  buy ≥ 10M        |  margin ≥ 90k   |  freshness ≤ 1hr
// ROI is never used — vol/limit ratio + absolute margin is the signal.

function qualifiesLow(item) {
  if (!item.hasPrice || item.margin <= 0) return false;
  const vol = item.volume   || 0;
  const lim = item.buyLimit || 0;
  if (lim <= 0) return false;
  if (freshnessAge(item.lastTradeTime) > 900) return false;
  return (vol / lim) >= 70;
}

function qualifiesMedium(item) {
  if (!item.hasPrice || item.margin <= 0) return false;
  if (freshnessAge(item.lastTradeTime) > 2700) return false;
  const vol = item.volume   || 0;
  const lim = item.buyLimit || 0;
  if (lim <= 0) return false;
  if ((item.low    || 0) <  200_000)    return false;
  if ((item.low    || 0) >= 10_000_000) return false;
  if ((item.margin || 0) <  30_000)     return false;
  if ((vol / lim)        <  15)         return false;
  return true;
}

function qualifiesHigh(item) {
  if (!item.hasPrice || item.margin <= 0) return false;
  if (freshnessAge(item.lastTradeTime) > 3600) return false;
  const vol = item.volume   || 0;
  const lim = item.buyLimit || 0;
  if (lim <= 0) return false;
  if ((item.low    || 0) < 10_000_000) return false;
  if ((item.margin || 0) < 90_000)     return false;
  if ((vol / lim)        < 8)          return false;
  return true;
}

// ── Flip Speed filter — overlaid on top of risk tier ──────────────────────────
// fast:   vol/limit ≥ 50× (fills quickly, in and out within minutes)
// medium: vol/limit ≥ 15× (standard fill time)
// slow:   no extra vol/limit restriction, but margin ≥ 50k (worth the wait)
function passesFlipSpeed(item, speed) {
  const vol = item.volume   || 0;
  const lim = item.buyLimit || 1;
  const ratio = vol / lim;
  if (speed === "fast")   return ratio >= 50;
  if (speed === "medium") return ratio >= 15;
  if (speed === "slow")   return (item.margin || 0) >= 50_000;
  return true; // "any"
}

// ── Risk Tag ──────────────────────────────────────────────────────────────────
function RiskTag({ item }) {
  if (qualifiesLow(item))
    return <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(46,204,113,0.12)", color: "var(--green)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>Low Risk</span>;
  if (qualifiesMedium(item))
    return <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(201,168,76,0.12)", color: "var(--gold)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>Med Risk</span>;
  return <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(231,76,60,0.12)", color: "var(--red)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>High Risk</span>;
}

// ── Sort Button ───────────────────────────────────────────────────────────────
function SortBtn({ col, label, sortCol, sortDir, onSort, tip }) {
  const active = sortCol === col;
  return (
    <button
      className={`sort-btn${active ? " active" : ""}`}
      onClick={() => onSort(col)}
      style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}
    >
      {label}
      {active && <span className="sort-arrow">{sortDir === "desc" ? "▼" : "▲"}</span>}
      {tip && (
        <span className="stat-tooltip-wrap" onClick={e => e.stopPropagation()}>
          <span className="stat-help">?</span>
          <span className="stat-tooltip">{tip}</span>
        </span>
      )}
    </button>
  );
}

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_PREFS = {
  cashStack:  "",
  risk:       "low",
  membership: "members",
  flipSpeed:  "any",
};
const DEFAULT_ADV = { minMargin: "", maxMargin: "", minRoi: "", maxRoi: "", minVolume: "", maxVolume: "" };
const STORAGE_KEY = "rt_picks_prefs_v4";
const ONBOARDED_KEY = "rt_picks_onboarded_v4";

// ── Login Gate ────────────────────────────────────────────────────────────────
function LoginGate({ onSignIn }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "52px" }}>⭐</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", fontWeight: 700, color: "var(--gold)" }}>Personalised Flip Picks</div>
      <div style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.7, maxWidth: "400px" }}>
        Sign in to get flip recommendations filtered to your cash stack, risk tolerance, and how you like to trade.
      </div>
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "360px" }}>
        {[
          "Low / Medium / High risk — real qualification rules",
          "Cash stack filter — only see what you can afford",
          "Flip speed — fast scalps to slow high-margin holds",
          "Sortable columns — margin, ROI, volume and more",
          "\"You've flipped this\" badges from your history",
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text)" }}>
            <span style={{ color: "var(--gold)", fontSize: "11px", flexShrink: 0 }}>◆</span>{f}
          </div>
        ))}
      </div>
      <button
        onClick={onSignIn}
        style={{ padding: "13px 36px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, var(--gold-dim), var(--gold))", color: "#000", fontSize: "16px", fontWeight: 700, cursor: "pointer", fontFamily: "'Cinzel', serif", letterSpacing: "0.5px", transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(201,168,76,0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      >
        Sign In Free →
      </button>
    </div>
  );
}

// ── Onboarding Wizard ─────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    key: "cashStack",
    icon: "💰",
    title: "What's your cash stack?",
    subtitle: "We'll only show items you can actually afford to flip.",
    type: "text",
    placeholder: "e.g. 500k, 10m, 2b",
    hint: "Type 0 or leave blank to show all items",
    options: null,
  },
  {
    key: "risk",
    icon: "⚖️",
    title: "What's your risk tolerance?",
    subtitle: "This controls how liquid and reliable the picks need to be.",
    type: "choice",
    options: [
      {
        value: "low",
        label: "Low Risk",
        color: "var(--green)",
        border: "rgba(46,204,113,0.35)",
        bg: "rgba(46,204,113,0.07)",
        desc: "Ultra-high volume items. Vol/limit ≥ 70×. Fills are nearly instant.",
        emoji: "🛡️",
      },
      {
        value: "medium",
        label: "Medium Risk",
        color: "var(--gold)",
        border: "rgba(201,168,76,0.35)",
        bg: "rgba(201,168,76,0.07)",
        desc: "200k–10M items. Vol/limit ≥ 15×. Solid margins, reliable fills.",
        emoji: "⚔️",
      },
      {
        value: "high",
        label: "High Risk",
        color: "var(--red)",
        border: "rgba(231,76,60,0.35)",
        bg: "rgba(231,76,60,0.07)",
        desc: "≥10M buy-in, ≥90k margin. High reward, fills not guaranteed.",
        emoji: "🐉",
      },
    ],
  },
  {
    key: "flipSpeed",
    icon: "⚡",
    title: "How often do you check your GE?",
    subtitle: "We'll match picks to how actively you trade.",
    type: "choice",
    options: [
      {
        value: "fast",
        label: "Constantly",
        color: "var(--green)",
        border: "rgba(46,204,113,0.35)",
        bg: "rgba(46,204,113,0.07)",
        desc: "You babysit your GE. Want fast scalps — vol/limit ≥ 50×.",
        emoji: "🔥",
      },
      {
        value: "medium",
        label: "Every few hours",
        color: "var(--gold)",
        border: "rgba(201,168,76,0.35)",
        bg: "rgba(201,168,76,0.07)",
        desc: "Standard flipping pace. Vol/limit ≥ 15× for reliable 4hr fills.",
        emoji: "⏱️",
      },
      {
        value: "slow",
        label: "Once or twice a day",
        color: "#a855f7",
        border: "rgba(168,85,247,0.35)",
        bg: "rgba(168,85,247,0.07)",
        desc: "Set and forget. Higher margins worth the wait — ≥ 50k margin.",
        emoji: "🌙",
      },
      {
        value: "any",
        label: "Show me everything",
        color: "var(--text-dim)",
        border: "rgba(255,255,255,0.12)",
        bg: "rgba(255,255,255,0.03)",
        desc: "No speed filter — show all qualifying picks.",
        emoji: "🌐",
      },
    ],
  },
  {
    key: "membership",
    icon: "🗺️",
    title: "F2P or Members?",
    subtitle: "Filter items based on your account type.",
    type: "choice",
    options: [
      {
        value: "members",
        label: "Members",
        color: "var(--gold)",
        border: "rgba(201,168,76,0.35)",
        bg: "rgba(201,168,76,0.07)",
        desc: "Full access — all 4,000+ items available to flip.",
        emoji: "⭐",
      },
      {
        value: "f2p",
        label: "F2P",
        color: "var(--green)",
        border: "rgba(46,204,113,0.35)",
        bg: "rgba(46,204,113,0.07)",
        desc: "Free-to-play only. Smaller pool but still profitable.",
        emoji: "🆓",
      },
    ],
  },
];

// Progress dots
function ProgressDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? "22px" : "8px",
            height: "8px",
            borderRadius: "4px",
            background: i < current
              ? "rgba(201,168,76,0.4)"
              : i === current
              ? "var(--gold)"
              : "rgba(255,255,255,0.1)",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({ cashStack: "", risk: "low", flipSpeed: "any", membership: "both" });
  const [textVal, setTextVal] = useState("");
  const [animDir, setAnimDir] = useState("in"); // "in" | "out"

  const current = ONBOARDING_STEPS[step];
  const isLast  = step === ONBOARDING_STEPS.length - 1;

  function advance(val) {
    const updated = { ...draft, [current.key]: val !== undefined ? val : (current.type === "text" ? textVal : draft[current.key]) };
    setDraft(updated);

    if (isLast) {
      // Fade out and complete
      setAnimDir("out");
      setTimeout(() => onComplete(updated), 300);
      return;
    }

    // Slide out then in
    setAnimDir("out");
    setTimeout(() => {
      if (current.type === "text") setTextVal("");
      setStep(s => s + 1);
      setAnimDir("in");
    }, 220);
  }

  function goBack() {
    setAnimDir("out");
    setTimeout(() => {
      setStep(s => s - 1);
      setAnimDir("in");
    }, 220);
  }

  const slideStyle = {
    transition: "opacity 0.22s ease, transform 0.22s ease",
    opacity: animDir === "out" ? 0 : 1,
    transform: animDir === "out" ? "translateY(12px)" : "translateY(0)",
  };

  return (
    <>
      <style>{`
        @keyframes wizardFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes wizardSlideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .onboard-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(0,0,0,0.88);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: wizardFadeIn 0.25s ease;
        }
        .onboard-card {
          background: #0f1218;
          border: 1px solid #2a3340;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          padding: 40px 36px 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          animation: wizardSlideUp 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .onboard-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .onboard-choice-btn {
          width: 100%;
          padding: 14px 18px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          transition: all 0.15s ease;
          font-family: 'Inter', sans-serif;
        }
        .onboard-choice-btn:hover {
          border-color: rgba(201,168,76,0.35);
          background: rgba(201,168,76,0.07);
          transform: translateX(3px);
        }
        .onboard-text-input {
          width: 100%;
          background: #161b24;
          border: 1px solid #2a3340;
          border-radius: 10px;
          padding: 14px 16px;
          color: #e8e8e8;
          font-size: 18px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .onboard-text-input:focus {
          border-color: rgba(201,168,76,0.5);
        }
        .onboard-text-input::placeholder {
          color: #3a4a5a;
        }
        .onboard-next-btn {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #8a6f2e, #c9a84c);
          color: #000;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Cinzel', serif;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .onboard-next-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .onboard-skip {
          background: none;
          border: none;
          color: #4a5a6a;
          font-size: 12px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          text-align: center;
          padding: 0;
          transition: color 0.2s;
        }
        .onboard-skip:hover { color: #7a8a9a; }
      `}</style>

      <div className="onboard-overlay">
        <div className="onboard-card">

          {/* Progress */}
          <ProgressDots total={ONBOARDING_STEPS.length} current={step} />

          {/* Step content */}
          <div style={slideStyle}>

            {/* Icon + title */}
            <div style={{ textAlign: "center", marginBottom: "4px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px", lineHeight: 1 }}>{current.icon}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "20px", fontWeight: 700, color: "var(--gold)", marginBottom: "8px" }}>
                {current.title}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.6 }}>
                {current.subtitle}
              </div>
            </div>

            {/* Input */}
            {current.type === "text" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  className="onboard-text-input"
                  placeholder={current.placeholder}
                  value={textVal}
                  onChange={e => setTextVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && advance()}
                  autoFocus
                />
                <div style={{ fontSize: "11px", color: "#4a5a6a", textAlign: "center" }}>{current.hint}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {current.options.map(opt => (
                  <button
                    key={opt.value}
                    className="onboard-choice-btn"
                    style={{
                      border: `1px solid ${draft[current.key] === opt.value ? opt.border : "rgba(255,255,255,0.08)"}`,
                      background: draft[current.key] === opt.value ? opt.bg : "rgba(255,255,255,0.03)",
                    }}
                    onClick={() => advance(opt.value)}
                  >
                    <span style={{ fontSize: "22px", flexShrink: 0 }}>{opt.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: draft[current.key] === opt.value ? opt.color : "var(--text)", marginBottom: "2px" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.5 }}>{opt.desc}</div>
                    </div>
                    {draft[current.key] === opt.value && (
                      <span style={{ fontSize: "16px", color: opt.color, flexShrink: 0 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Text step confirm button */}
            {current.type === "text" && (
              <button className="onboard-next-btn" onClick={() => advance()}>
                {isLast ? "See My Picks →" : "Next →"}
              </button>
            )}

          </div>

          {/* Back / Skip */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {step > 0 ? (
              <button className="onboard-skip" onClick={goBack}>← Back</button>
            ) : (
              <span />
            )}
            <button
              className="onboard-skip"
              onClick={() => {
                setAnimDir("out");
                setTimeout(() => onComplete(draft), 300);
              }}
            >
              {isLast ? "" : "Skip setup →"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ── Preferences Bar (compact, always visible after onboarding) ────────────────
function PrefsBar({ prefs, setPref, onResetOnboarding }) {
  const riskMeta = {
    low:    "Vol/day ≥ 70× buy limit · fills in seconds.",
    medium: "Buy 200k–10M · Margin ≥ 30k · Vol/limit ≥ 15×.",
    high:   "Buy ≥ 10M · Margin ≥ 90k · Vol/limit ≥ 8×. High capital.",
  };
  const speedMeta = {
    fast:   "Vol/limit ≥ 50× — fast scalps only.",
    medium: "Vol/limit ≥ 15× — standard 4hr fills.",
    slow:   "Margin ≥ 50k — patient, high-margin holds.",
    any:    "No speed filter applied.",
  };

  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px 20px", display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "flex-start" }}>

      {/* Cash Stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Cash Stack</span>
        <input
          className="filter-input"
          placeholder="e.g. 10m, 500k, 1b"
          value={prefs.cashStack}
          onChange={e => setPref("cashStack", e.target.value)}
          style={{ width: "160px", height: "32px" }}
        />
        <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Filters out items you can't afford</span>
      </div>

      {/* Risk Tolerance */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Risk Tolerance</span>
        <div style={{ display: "flex", gap: "4px", height: "32px" }}>
          {[["low","Low"],["medium","Med"],["high","High"]].map(([v, l]) => (
            <button key={v}
              className={`toggle-btn${prefs.risk === v ? v === "low" ? " active-low" : v === "medium" ? " active-med" : " active-high" : ""}`}
              onClick={() => setPref("risk", v)}
            >{l}</button>
          ))}
        </div>
        <span style={{ fontSize: "10px", color: "var(--text-dim)", maxWidth: "240px", lineHeight: 1.5 }}>{riskMeta[prefs.risk]}</span>
      </div>

      {/* Flip Speed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Flip Speed</span>
        <div style={{ display: "flex", gap: "4px", height: "32px" }}>
          {[["fast","Fast"],["medium","Mid"],["slow","Slow"],["any","Any"]].map(([v, l]) => (
            <button key={v}
              className={`toggle-btn${prefs.flipSpeed === v ? " active-med" : ""}`}
              onClick={() => setPref("flipSpeed", v)}
            >{l}</button>
          ))}
        </div>
        <span style={{ fontSize: "10px", color: "var(--text-dim)", maxWidth: "240px", lineHeight: 1.5 }}>{speedMeta[prefs.flipSpeed]}</span>
      </div>

      {/* Membership */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Membership</span>
        <div style={{ display: "flex", gap: "4px", height: "32px" }}>
          {[["f2p","F2P"],["members","Members"]].map(([v, l]) => (
            <button key={v}
              className={`toggle-btn${prefs.membership === v ? " active-med" : ""}`}
              onClick={() => setPref("membership", v)}
            >{l}</button>
          ))}
        </div>
        <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>F2P hides members-only items</span>
      </div>

      {/* Re-run wizard button — pushed right */}
      <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: "18px" }}>
        <button
          onClick={onResetOnboarding}
          style={{ padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "11px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "var(--gold-dim)"; e.currentTarget.style.color = "var(--gold)"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}
          title="Re-run the setup wizard"
        >
          ✦ Redo Setup
        </button>
      </div>

    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RecommendedFlips({ user, items, flipsLog, onSignIn, onOpenChart }) {

  // Load prefs from localStorage
  const [prefs, setPrefs] = useState(() => {
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
    catch { return DEFAULT_PREFS; }
  });

  // Has the user completed onboarding?
  const [onboarded, setOnboarded] = useState(() => {
    return !!localStorage.getItem(ONBOARDED_KEY);
  });

  const [adv, setAdv]         = useState(DEFAULT_ADV);
  const [showAdv, setShowAdv] = useState(false);
  const [search, setSearch]   = useState("");
  const [sortCol, setSortCol] = useState("volume");
  const [sortDir, setSortDir] = useState("desc");

  // When user logs in for the first time (or hasn't onboarded yet), show wizard
  const showWizard = user && !onboarded;

  function setPref(key, val) {
    setPrefs(p => {
      const next = { ...p, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function handleOnboardComplete(finalPrefs) {
    const merged = { ...DEFAULT_PREFS, ...finalPrefs };
    setPrefs(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    localStorage.setItem(ONBOARDED_KEY, "1");
    setOnboarded(true);
  }

  function resetOnboarding() {
    localStorage.removeItem(ONBOARDED_KEY);
    setOnboarded(false);
  }

  function handleSort(col) {
    setSortCol(prev => {
      if (prev === col) { setSortDir(d => d === "desc" ? "asc" : "desc"); return col; }
      setSortDir("desc");
      return col;
    });
  }

  function resetAdv() { setAdv(DEFAULT_ADV); }
  const advCount = Object.values(adv).filter(v => v !== "").length;

  const flippedNames = useMemo(() => {
    const s = new Set();
    (flipsLog || []).forEach(f => { if (f.item) s.add(f.item.toLowerCase()); });
    return s;
  }, [flipsLog]);

  const budget = parseCash(prefs.cashStack);

  const qualifies = useMemo(() => {
    if (prefs.risk === "low")    return qualifiesLow;
    if (prefs.risk === "medium") return qualifiesMedium;
    if (prefs.risk === "high")   return qualifiesHigh;
    return () => false;
  }, [prefs.risk]);

  const picks = useMemo(() => {
    if (!items || items.length === 0) return [];

    let result = items
      .filter(item => {
        if (!qualifies(item))                                              return false;
        if ((item.low || 0) > budget)                                      return false;
        if (!passesFlipSpeed(item, prefs.flipSpeed))                       return false;
        if (prefs.membership === "f2p" && item.members) return false;
        // "members" shows all items (members + f2p)
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;

        // Advanced filters
        if (adv.minMargin && (item.margin || 0) < parseFloat(adv.minMargin)) return false;
        if (adv.maxMargin && (item.margin || 0) > parseFloat(adv.maxMargin)) return false;
        if (adv.minRoi    && (item.roi    || 0) < parseFloat(adv.minRoi))    return false;
        if (adv.maxRoi    && (item.roi    || 0) > parseFloat(adv.maxRoi))    return false;
        if (adv.minVolume && (item.volume || 0) < parseFloat(adv.minVolume.replace(/[km]/i, v => v === 'k' ? 'e3' : 'e6'))) return false;
        if (adv.maxVolume && (item.volume || 0) > parseFloat(adv.maxVolume.replace(/[km]/i, v => v === 'k' ? 'e3' : 'e6'))) return false;

        return true;
      })
      .map(item => ({ ...item, _gpPerFill: calcGpPerFill(item) }));

    // Sort
    result.sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case "name":      av = a.name; bv = b.name; return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        case "low":       av = a.low      || 0; bv = b.low      || 0; break;
        case "high":      av = a.high     || 0; bv = b.high     || 0; break;
        case "margin":    av = a.margin   || 0; bv = b.margin   || 0; break;
        case "roi":       av = a.roi      || 0; bv = b.roi      || 0; break;
        case "volume":    av = a.volume   || 0; bv = b.volume   || 0; break;
        case "buyLimit":  av = a.buyLimit || 0; bv = b.buyLimit || 0; break;
        case "gpPerFill": av = a._gpPerFill;    bv = b._gpPerFill;    break;
        case "lastTrade": av = a.lastTradeTime || 0; bv = b.lastTradeTime || 0; break;
        default:          av = a.volume   || 0; bv = b.volume   || 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return result.slice(0, 50);
  }, [items, qualifies, prefs.membership, prefs.flipSpeed, budget, search, adv, sortCol, sortDir]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!user) return <LoginGate onSignIn={onSignIn} />;

  const COLS = "minmax(160px,2fr) 1fr 1fr 1fr 1fr 1fr 1fr 1fr 80px 70px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Onboarding Wizard — renders as fullscreen overlay */}
      {showWizard && (
        <OnboardingWizard onComplete={handleOnboardComplete} />
      )}

      {/* Preferences Bar */}
      <PrefsBar prefs={prefs} setPref={setPref} onResetOnboarding={resetOnboarding} />

      {/* ── Search + Advanced Filters Row ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <input
              className="filter-input"
              placeholder="Item name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "150px" }}
            />
            <button
              className={`adv-filters-btn${showAdv || advCount > 0 ? " active" : ""}`}
              onClick={() => setShowAdv(v => !v)}
            >
              ⚙ Filters {advCount > 0 && <span className="adv-filter-badge">{advCount}</span>}
            </button>
            <span style={{ fontSize: "12px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>
              {picks.length} pick{picks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Search within current picks</span>
        </div>
      </div>

      {/* ── Advanced Filters Panel ── */}
      {showAdv && (
        <div className="adv-filter-panel">
          <div className="adv-filter-group">
            <div className="adv-filter-label">Margin (gp)</div>
            <div className="adv-filter-row">
              <input className="adv-filter-input" placeholder="Min" type="number" value={adv.minMargin} onChange={e => setAdv(a => ({ ...a, minMargin: e.target.value }))} />
              <span className="adv-filter-sep">–</span>
              <input className="adv-filter-input" placeholder="Max" type="number" value={adv.maxMargin} onChange={e => setAdv(a => ({ ...a, maxMargin: e.target.value }))} />
            </div>
          </div>
          <div className="adv-filter-group">
            <div className="adv-filter-label">ROI %</div>
            <div className="adv-filter-row">
              <input className="adv-filter-input" placeholder="Min" type="number" value={adv.minRoi} onChange={e => setAdv(a => ({ ...a, minRoi: e.target.value }))} />
              <span className="adv-filter-sep">–</span>
              <input className="adv-filter-input" placeholder="Max" type="number" value={adv.maxRoi} onChange={e => setAdv(a => ({ ...a, maxRoi: e.target.value }))} />
            </div>
          </div>
          <div className="adv-filter-group">
            <div className="adv-filter-label">Vol / Day</div>
            <div className="adv-filter-row">
              <input className="adv-filter-input" placeholder="Min" type="number" value={adv.minVolume} onChange={e => setAdv(a => ({ ...a, minVolume: e.target.value }))} />
              <span className="adv-filter-sep">–</span>
              <input className="adv-filter-input" placeholder="Max" type="number" value={adv.maxVolume} onChange={e => setAdv(a => ({ ...a, maxVolume: e.target.value }))} />
            </div>
          </div>
          <div className="adv-filter-group" style={{ justifyContent: "flex-end", flexDirection: "row", alignItems: "flex-end" }}>
            {advCount > 0 && (
              <button className="adv-filters-btn" onClick={resetAdv}>✕ Clear filters</button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="flips-table">

        {/* Header — all sortable */}
        <div className="table-header" style={{ gridTemplateColumns: COLS }}>
          <SortBtn col="name"      label="Item"       sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={null} />
          <SortBtn col="low"       label="Buy"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Lowest current buy offer on the GE" />
          <SortBtn col="high"      label="Sell"       sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Highest current sell offer on the GE" />
          <SortBtn col="margin"    label="Margin"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Sell price minus buy price minus GE tax" />
          <SortBtn col="roi"       label="ROI"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Margin ÷ buy price" />
          <SortBtn col="volume"    label="Vol / Day"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Total items traded per day" />
          <SortBtn col="buyLimit"  label="Limit"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Max you can buy every 4 hours" />
          <SortBtn col="gpPerFill" label="GP / Fill"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Realistic GP profit per 4hr window, scaled by market volume" />
          <SortBtn col="lastTrade" label="Last Trade" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="When this item last traded on the GE" />
          <div style={{ fontSize: "13px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>24hr Trend</div>
        </div>

        {/* Rows */}
        {picks.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>No picks match your current settings</p>
            <small>
              {prefs.cashStack && parseCash(prefs.cashStack) < 200_000
                ? "Cash stack below 200k — most items won't qualify"
                : prefs.flipSpeed === "fast"
                ? "Fast + High risk is a tough combo — try Medium risk or a looser speed filter"
                : "Prices update constantly — check back shortly or adjust your preferences above"}
            </small>
          </div>
        ) : (
          picks.map(item => {
            const age        = freshnessAge(item.lastTradeTime);
            const tradeColor = age <= 300 ? "var(--green)" : age <= 900 ? "var(--text)" : "var(--text-dim)";
            const hasFlipped = flippedNames.has((item.name || "").toLowerCase());
            const volColor   = (item.volume || 0) >= 1_000_000 ? "var(--green)" : (item.volume || 0) >= 300_000 ? "var(--text)" : "var(--text-dim)";
            const gpf        = item._gpPerFill;
            const gpfColor   = gpf >= 1_000_000 ? "var(--green)" : gpf >= 200_000 ? "var(--gold)" : "var(--text-dim)";

            return (
              <div key={item.id} className="flip-row" style={{ gridTemplateColumns: COLS }} onClick={() => onOpenChart(item)}>

                {/* Item */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src={itemIconUrl(item.name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div className="item-name">{item.name}</div>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <RiskTag item={item} />
                      {hasFlipped && (
                        <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(201,168,76,0.12)", color: "var(--gold)", borderRadius: "4px", padding: "1px 5px" }}>✓ Flipped</span>
                      )}
                    </div>
                  </div>
                </div>

                <span className="price">{formatGP(item.low)}</span>
                <span className="price">{formatGP(item.high)}</span>
                <span className={`margin${item.margin < 0 ? " neg" : ""}`}>{formatGP(item.margin)}</span>
                <span className="roi" style={{ color: item.roi > 4 ? "var(--gold)" : item.roi >= 1 ? "var(--green)" : "#f39c12" }}>
                  {item.roi}%
                </span>
                <span style={{ fontSize: "13px", color: volColor }}>{formatVol(item.volume)}</span>
                <span className="price" style={{ color: "var(--text-dim)" }}>{item.buyLimit ? item.buyLimit.toLocaleString() : "?"}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: gpfColor }}>{formatGP(gpf)}</span>
                <span style={{ fontSize: "11px", color: tradeColor }}>{item.lastTradeTime ? timeAgo(item.lastTradeTime) : "—"}</span>
                <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center" }}>
                  <Sparkline itemId={item.id} width={68} height={28} />
                </div>

              </div>
            );
          })
        )}
      </div>

      {picks.length > 0 && (
        <div style={{ fontSize: "11px", color: "var(--text-dim)", padding: "0 4px", opacity: 0.6 }}>
          Up to 50 picks · Click column headers to sort · Click any row to open the item chart
        </div>
      )}

    </div>
  );
}
