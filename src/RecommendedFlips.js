import { useState, useMemo } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtGP(n) {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

function scoreItem(item) {
  // Composite score 0–100 based on margin, ROI, and volume
  const margin    = item.margin   || 0;
  const roi       = item.roi      || 0;
  const volume    = item.volume   || 0;
  const tax       = item.tax      || 0;
  const netMargin = margin - tax;

  if (netMargin <= 0 || roi <= 0) return 0;

  // Normalised sub-scores (capped to avoid runaway items dominating)
  const marginScore = Math.min(netMargin / 50_000, 1)  * 40; // max 40 pts
  const roiScore    = Math.min(roi / 30, 1)            * 35; // max 35 pts
  const volScore    = Math.min(Math.log10(volume + 1) / 5, 1) * 25; // max 25 pts

  return Math.round(marginScore + roiScore + volScore);
}

const BUDGET_OPTIONS = [
  { label: "Any",    min: 0,          max: Infinity },
  { label: "< 100k", min: 0,          max: 100_000  },
  { label: "< 1M",   min: 0,          max: 1_000_000 },
  { label: "< 5M",   min: 0,          max: 5_000_000 },
  { label: "< 25M",  min: 0,          max: 25_000_000},
];

const RISK_OPTIONS = [
  { label: "Any",    minRoi: 0,  minVol: 0       },
  { label: "Safe",   minRoi: 1,  minVol: 500     }, // high volume, modest ROI
  { label: "Balanced",minRoi: 3, minVol: 100     },
  { label: "Aggressive",minRoi:8,minVol: 20      },
];

// ── Login Gate ────────────────────────────────────────────────────────────────
function LoginGate({ onSignIn }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: "20px", padding: "80px 24px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "52px" }}>📈</div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: "22px",
        fontWeight: 700, color: "var(--gold)",
      }}>
        Recommended Flips
      </div>
      <div style={{
        fontSize: "14px", color: "var(--text-dim)",
        lineHeight: 1.7, maxWidth: "380px",
      }}>
        Sign in to see your personalised flip recommendations — scored by margin,
        ROI, and market volume, filtered to your budget and risk appetite.
      </div>
      <div style={{
        background: "var(--bg3)", border: "1px solid var(--border)",
        borderRadius: "12px", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: "10px",
        width: "100%", maxWidth: "340px",
      }}>
        {[
          "Top 50 flip opportunities, live-scored",
          "Filter by budget & risk tolerance",
          "\"You've flipped this\" badges from your history",
          "One-click to open item chart",
        ].map((f, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center",
            gap: "10px", fontSize: "13px", color: "var(--text)",
          }}>
            <span style={{ color: "var(--gold)", fontSize: "11px", flexShrink: 0 }}>◆</span>
            {f}
          </div>
        ))}
      </div>
      <button
        onClick={onSignIn}
        style={{
          padding: "13px 36px", borderRadius: "8px", border: "none",
          background: "linear-gradient(135deg, var(--gold-dim), var(--gold))",
          color: "#000", fontSize: "16px", fontWeight: 700, cursor: "pointer",
          fontFamily: "'Cinzel', serif", letterSpacing: "0.5px",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(201,168,76,0.4)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      >
        Sign In Free →
      </button>
    </div>
  );
}

// ── Flip Card ─────────────────────────────────────────────────────────────────
function FlipCard({ item, rank, hasFlipped, onOpenChart }) {
  const score = item._score;
  const scoreClass = score >= 65 ? "score-high" : score >= 35 ? "score-med" : "score-low";
  const netMargin = (item.margin || 0) - (item.tax || 0);
  const roi = item.roi || 0;

  return (
    <div
      onClick={() => onOpenChart(item)}
      style={{
        background: "var(--bg3)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "14px 16px",
        display: "grid",
        gridTemplateColumns: "28px 28px 1fr 90px 90px 80px 80px 72px",
        gap: "10px", alignItems: "center",
        cursor: "pointer", transition: "background 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg4)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--bg3)"; }}
    >
      {/* Rank */}
      <span style={{
        fontSize: "11px",
        fontWeight: rank <= 3 ? 700 : 400,
        color: rank === 1 ? "var(--gold)" : rank === 2 ? "#aaa" : rank === 3 ? "#cd7f32" : "var(--text-dim)",
      }}>
        #{rank}
      </span>

      {/* Icon */}
      {item.icon ? (
        <img
          src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(item.icon)}`}
          alt={item.name}
          style={{ width: 24, height: 24, objectFit: "contain", imageRendering: "pixelated" }}
          onError={e => { e.target.style.display = "none"; }}
        />
      ) : (
        <div style={{ width: 24, height: 24 }} />
      )}

      {/* Name + badges */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
          {item.name}
        </div>
        <div style={{ display: "flex", gap: "4px", marginTop: "3px", flexWrap: "wrap" }}>
          {item.members && (
            <span style={{
              fontSize: "10px", fontWeight: 700,
              background: "rgba(52,152,219,0.12)", color: "var(--blue)",
              borderRadius: "4px", padding: "1px 5px",
            }}>P2P</span>
          )}
          {hasFlipped && (
            <span style={{
              fontSize: "10px", fontWeight: 700,
              background: "rgba(201,168,76,0.12)", color: "var(--gold)",
              borderRadius: "4px", padding: "1px 5px",
            }}>✓ Flipped</span>
          )}
        </div>
      </div>

      {/* Buy */}
      <div>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "2px" }}>Buy</div>
        <div style={{ fontSize: "13px", color: "var(--text)" }}>{fmtGP(item.low)}</div>
      </div>

      {/* Sell */}
      <div>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "2px" }}>Sell</div>
        <div style={{ fontSize: "13px", color: "var(--text)" }}>{fmtGP(item.high)}</div>
      </div>

      {/* Net Margin */}
      <div>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "2px" }}>Margin</div>
        <div style={{
          fontSize: "13px", fontWeight: 600,
          color: netMargin >= 0 ? "var(--green)" : "var(--red)",
        }}>
          {netMargin >= 0 ? "+" : ""}{fmtGP(netMargin)}
        </div>
      </div>

      {/* ROI */}
      <div>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "2px" }}>ROI</div>
        <div style={{
          fontSize: "13px", fontWeight: 600,
          color: roi >= 0 ? "var(--green)" : "var(--red)",
        }}>
          {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
        </div>
      </div>

      {/* Score */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span className={`score-badge ${scoreClass}`}>{score}</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RecommendedFlips({ user, items, flipsLog, onSignIn, onOpenChart }) {
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [riskIdx,   setRiskIdx]   = useState(0);
  const [search,    setSearch]    = useState("");

  // Build a set of item names the user has flipped before
  const flippedNames = useMemo(() => {
    const names = new Set();
    (flipsLog || []).forEach(f => { if (f.item) names.add(f.item.toLowerCase()); });
    return names;
  }, [flipsLog]);

  const budget = BUDGET_OPTIONS[budgetIdx];
  const risk   = RISK_OPTIONS[riskIdx];

  const recommendations = useMemo(() => {
    if (!items || items.length === 0) return [];

    const filtered = items.filter(item => {
      const netMargin = (item.margin || 0) - (item.tax || 0);
      if (netMargin <= 0)                              return false;
      if ((item.roi || 0) < risk.minRoi)               return false;
      if ((item.volume || 0) < risk.minVol)            return false;
      if ((item.low || 0) > budget.max)                return false;
      if ((item.low || 0) < budget.min)                return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    return filtered
      .map(item => ({ ...item, _score: scoreItem(item) }))
      .filter(item => item._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 50);
  }, [items, budget, risk, search]);

  // ── Not logged in ──
  if (!user) return <LoginGate onSignIn={onSignIn} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Page header */}
      <div>
        <div className="section-title">📈 Recommended Flips</div>
        <p style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "4px" }}>
          Top flipping opportunities right now, scored by margin, ROI, and market volume.
          Updates with live prices.
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: "var(--bg3)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "16px",
        display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start",
      }}>

        {/* Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 160px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
            Search
          </span>
          <input
            className="filter-input"
            placeholder="Item name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {/* Budget */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
            Buy-in Budget
          </span>
          <div className="toggle-group">
            {BUDGET_OPTIONS.map((opt, i) => (
              <button
                key={i}
                className={`toggle-btn${budgetIdx === i ? " active-med" : ""}`}
                onClick={() => setBudgetIdx(i)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Risk */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
            Risk
          </span>
          <div className="toggle-group">
            {RISK_OPTIONS.map((opt, i) => {
              const cls = i === 0 ? "active-med"
                        : i === 1 ? "active-low"
                        : i === 2 ? "active-med"
                        : "active-high";
              return (
                <button
                  key={i}
                  className={`toggle-btn${riskIdx === i ? ` ${cls}` : ""}`}
                  onClick={() => setRiskIdx(i)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
            {recommendations.length} flip{recommendations.length !== 1 ? "s" : ""} found
          </span>
        </div>
      </div>

      {/* Table header */}
      {recommendations.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "28px 28px 1fr 90px 90px 80px 80px 72px",
          gap: "10px", padding: "0 16px",
          fontSize: "11px", color: "var(--text-dim)",
          textTransform: "uppercase", letterSpacing: "0.5px",
        }}>
          <span>#</span>
          <span></span>
          <span>Item</span>
          <span>Buy</span>
          <span>Sell</span>
          <span>Net Margin</span>
          <span>ROI</span>
          <span style={{ textAlign: "right" }}>Score</span>
        </div>
      )}

      {/* Results */}
      {recommendations.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {recommendations.map((item, i) => (
            <FlipCard
              key={item.id}
              item={item}
              rank={i + 1}
              hasFlipped={flippedNames.has((item.name || "").toLowerCase())}
              onOpenChart={onOpenChart}
            />
          ))}
        </div>
      ) : (
        <div style={{
          background: "var(--bg3)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "60px 24px",
          textAlign: "center", color: "var(--text-dim)",
        }}>
          <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.4 }}>📭</div>
          <div style={{ fontSize: "14px", marginBottom: "4px" }}>
            No flips match your filters
          </div>
          <div style={{ fontSize: "12px", opacity: 0.6 }}>
            Try loosening your budget or risk settings
          </div>
        </div>
      )}

      {/* Score legend */}
      <div style={{
        display: "flex", gap: "16px", flexWrap: "wrap",
        fontSize: "11px", color: "var(--text-dim)", padding: "0 4px",
      }}>
        <span>Score legend:</span>
        <span><span className="score-badge score-high" style={{ display: "inline-flex" }}>75+</span> Strong</span>
        <span><span className="score-badge score-med"  style={{ display: "inline-flex" }}>35–74</span> Decent</span>
        <span><span className="score-badge score-low"  style={{ display: "inline-flex" }}>&lt;35</span> Weak</span>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>Scored on net margin (after GE tax) · ROI · volume</span>
      </div>
    </div>
  );
}
