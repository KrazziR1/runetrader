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

function timeAgo(ts) {
  const sec = Math.floor(Date.now() / 1000 - ts);
  if (sec < 60)   return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function itemIconUrl(name) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(
    name.replace(/ /g, "_")
  )}.png?format=png`;
}

function calcGpPerFill(item) {
  const lim = item.buyLimit > 0 ? item.buyLimit : 500;
  const mkt4hr = item.volume / 6;
  let expFill;
  if      (item.volume >= 500_000) expFill = Math.min(lim, mkt4hr);
  else if (item.volume >= 100_000) expFill = Math.min(lim, mkt4hr * 0.6);
  else if (item.volume >= 20_000)  expFill = Math.min(lim, mkt4hr * 0.2);
  else if (item.volume >= 5_000)   expFill = Math.min(lim, mkt4hr * 0.08);
  else                             expFill = Math.min(lim, mkt4hr * 0.03);
  return Math.round(item.margin * Math.max(expFill, 1));
}

// ── Scoring ────────────────────────────────────────────────────────────────────
// Weights tuned to user preferences
function scoreItem(item, prefs) {
  const margin    = item.margin   || 0;
  const roi       = item.roi      || 0;
  const volume    = item.volume   || 0;
  const gpPerFill = calcGpPerFill(item);

  if (margin <= 0 || roi <= 0) return 0;

  // Base score components
  const marginScore  = Math.min(margin / 100_000, 1)          * 25;
  const roiScore     = Math.min(roi / 30, 1)                  * 25;
  const volScore     = Math.min(Math.log10(volume + 1) / 5.5, 1) * 20;
  const gpFillScore  = Math.min(gpPerFill / 2_000_000, 1)     * 20;

  // Risk modifier — aggressive = reward higher ROI, safe = reward volume
  let riskBonus = 0;
  if (prefs.risk === "safe")       riskBonus = Math.min(volume / 500_000, 1) * 10;
  if (prefs.risk === "balanced")   riskBonus = Math.min(roi / 20, 1)         * 5 + Math.min(volume / 200_000, 1) * 5;
  if (prefs.risk === "aggressive") riskBonus = Math.min(roi / 15, 1)         * 10;

  // Trade time modifier — fast = reward high volume, patient = reward margin
  let timeBonus = 0;
  if (prefs.tradeTime === "fast")    timeBonus = Math.min(volume / 300_000, 1) * 5;
  if (prefs.tradeTime === "patient") timeBonus = Math.min(margin / 200_000, 1) * 5;

  return Math.round(marginScore + roiScore + volScore + gpFillScore + riskBonus + timeBonus);
}

// ── Preference defaults ───────────────────────────────────────────────────────
const DEFAULT_PREFS = {
  cashStack: "",
  slots: "4",
  risk: "balanced",
  tradeTime: "balanced",
  membership: "members",
  minRoi: "",
  minMargin: "",
};

// ── Login Gate ────────────────────────────────────────────────────────────────
function LoginGate({ onSignIn }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "52px" }}>⭐</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", fontWeight: 700, color: "var(--gold)" }}>
        Personalised Flip Picks
      </div>
      <div style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.7, maxWidth: "380px" }}>
        Sign in to get flip recommendations scored to your cash stack, risk appetite,
        available GE slots, and how long you want to trade.
      </div>
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "340px" }}>
        {["Top picks scored to your cash stack & slots", "Filter by risk, trade speed, and membership", "Same live data as the GE Tracker", "\"You've flipped this\" badges from your history"].map((f, i) => (
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

// ── Preferences Panel ─────────────────────────────────────────────────────────
function PrefsPanel({ prefs, setPrefs }) {
  const [open, setOpen] = useState(true);

  function set(key, val) { setPrefs(p => { const n = { ...p, [key]: val }; localStorage.setItem("rt_picks_prefs", JSON.stringify(n)); return n; }); }

  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontFamily: "Inter, sans-serif" }}
      >
        <span style={{ fontWeight: 600, fontSize: "13px" }}>⚙ Personalise Your Picks</span>
        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>{open ? "▲ Hide" : "▼ Show"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", borderTop: "1px solid var(--border)" }}>

          {/* Cash Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "14px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Cash Stack</span>
            <input
              className="filter-input"
              placeholder="e.g. 10m, 500k, 1b"
              value={prefs.cashStack}
              onChange={e => set("cashStack", e.target.value)}
              style={{ width: "100%" }}
            />
            <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Filters out items you can't afford</span>
          </div>

          {/* GE Slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "14px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Free GE Slots</span>
            <div className="toggle-group">
              {["1","2","3","4","5","6","7","8"].map(n => (
                <button key={n} className={`toggle-btn${prefs.slots === n ? " active-med" : ""}`} onClick={() => set("slots", n)}>{n}</button>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "14px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Risk Appetite</span>
            <div className="toggle-group">
              {[["safe","Safe"],["balanced","Balanced"],["aggressive","Aggressive"]].map(([v,l]) => (
                <button key={v} className={`toggle-btn${prefs.risk === v ? (v === "safe" ? " active-low" : v === "balanced" ? " active-med" : " active-high") : ""}`} onClick={() => set("risk", v)}>{l}</button>
              ))}
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
              {prefs.risk === "safe" && "High-volume, reliable margins. Slower but consistent."}
              {prefs.risk === "balanced" && "Mix of volume and ROI. Good all-rounder."}
              {prefs.risk === "aggressive" && "High ROI, thinner markets. More volatile."}
            </span>
          </div>

          {/* Trade Time */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "14px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Trade Speed</span>
            <div className="toggle-group">
              {[["fast","Fast"],["balanced","Mixed"],["patient","Patient"]].map(([v,l]) => (
                <button key={v} className={`toggle-btn${prefs.tradeTime === v ? (v === "fast" ? " active-fast" : v === "balanced" ? " active-med-speed" : " active-slow") : ""}`} onClick={() => set("tradeTime", v)}>{l}</button>
              ))}
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
              {prefs.tradeTime === "fast" && "Prioritises high-volume items that fill quickly."}
              {prefs.tradeTime === "balanced" && "Balances fill speed with margin."}
              {prefs.tradeTime === "patient" && "Prioritises items with large margins, even if slow."}
            </span>
          </div>

          {/* Membership */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "14px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Membership</span>
            <div className="toggle-group">
              {[["f2p","F2P"],["members","Members"],["all","Both"]].map(([v,l]) => (
                <button key={v} className={`toggle-btn${prefs.membership === v ? " active-med" : ""}`} onClick={() => set("membership", v)}>{l}</button>
              ))}
            </div>
          </div>

          {/* Min ROI */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "14px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Min ROI %</span>
            <input
              className="filter-input"
              placeholder="e.g. 5"
              value={prefs.minRoi}
              onChange={e => set("minRoi", e.target.value)}
              type="number"
              min="0"
              style={{ width: "100%" }}
            />
          </div>

          {/* Min Margin */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "14px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Min Margin (gp)</span>
            <input
              className="filter-input"
              placeholder="e.g. 5000"
              value={prefs.minMargin}
              onChange={e => set("minMargin", e.target.value)}
              type="number"
              min="0"
              style={{ width: "100%" }}
            />
          </div>

        </div>
      )}
    </div>
  );
}

// ── Parse cash stack string like "10m", "500k", "1.5b" ───────────────────────
function parseCash(str) {
  if (!str) return Infinity;
  const s = str.trim().toLowerCase().replace(/,/g, "");
  if (s.endsWith("b")) return parseFloat(s) * 1_000_000_000;
  if (s.endsWith("m")) return parseFloat(s) * 1_000_000;
  if (s.endsWith("k")) return parseFloat(s) * 1_000;
  const n = parseFloat(s);
  return isNaN(n) ? Infinity : n;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RecommendedFlips({ user, items, flipsLog, onSignIn, onOpenChart }) {
  const [prefs, setPrefs] = useState(() => {
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem("rt_picks_prefs") || "{}") }; }
    catch { return DEFAULT_PREFS; }
  });
  const [search, setSearch] = useState("");

  const flippedNames = useMemo(() => {
    const s = new Set();
    (flipsLog || []).forEach(f => { if (f.item) s.add(f.item.toLowerCase()); });
    return s;
  }, [flipsLog]);

  const budget = parseCash(prefs.cashStack);
  const minRoi = prefs.minRoi ? parseFloat(prefs.minRoi) : 0;
  const minMargin = prefs.minMargin ? parseFloat(prefs.minMargin) : 0;

  const recommendations = useMemo(() => {
    if (!items || items.length === 0) return [];

    return items
      .filter(item => {
        if (!item.hasPrice)          return false;
        if (item.margin <= 0)        return false;
        if ((item.roi || 0) < minRoi)    return false;
        if ((item.margin || 0) < minMargin) return false;
        if ((item.low || 0) > budget) return false;
        if (prefs.membership === "f2p" && item.members)  return false;
        if (prefs.membership === "members" && !item.members) return false;
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .map(item => ({ ...item, _score: scoreItem(item, prefs), _gpPerFill: calcGpPerFill(item) }))
      .filter(item => item._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 50);
  }, [items, prefs, budget, minRoi, minMargin, search]);

  if (!user) return <LoginGate onSignIn={onSignIn} />;

  const COLS = "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 90px 70px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div className="section-title">⭐ Picks</div>
          <p style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "2px" }}>
            Top 50 flips scored to your preferences. Click any row to open the item chart.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            className="filter-input"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "180px" }}
          />
          <span style={{ fontSize: "12px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>
            {recommendations.length} picks
          </span>
        </div>
      </div>

      {/* Preferences */}
      <PrefsPanel prefs={prefs} setPrefs={setPrefs} />

      {/* Table */}
      <div className="flips-table">
        {/* Header */}
        <div className="table-header" style={{ gridTemplateColumns: COLS }}>
          {[["#",""], ["Item",""], ["Buy","Lowest current buy offer"], ["Sell","Highest current sell offer"], ["Margin","Sell − buy − GE tax"], ["ROI","Margin ÷ buy price"], ["Vol/Day","Items traded per day. Higher = easier fills."], ["Limit","Max buy per 4 hours"], ["GP/Fill","Realistic GP profit per 4hr window"], ["Score","Personalised score based on your preferences"]].map(([label, tip], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {label}
              {tip && (
                <span className="stat-tooltip-wrap">
                  <span className="stat-help">?</span>
                  <span className="stat-tooltip">{tip}</span>
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Rows */}
        {recommendations.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>No picks match your preferences</p>
            <small>Try loosening your cash stack, ROI, or membership filters</small>
          </div>
        ) : (
          recommendations.map((item, i) => {
            const ageSec = item.lastTradeTime ? Math.floor(Date.now() / 1000 - item.lastTradeTime) : null;
            const tradeColor = !ageSec ? "var(--text-dim)" : ageSec < 300 ? "var(--green)" : ageSec < 3600 ? "var(--text)" : "var(--text-dim)";
            const score = item._score;
            const scoreClass = score >= 65 ? "score-high" : score >= 35 ? "score-med" : "score-low";
            const rank = i + 1;
            const rankColor = rank === 1 ? "var(--gold)" : rank === 2 ? "#aaa" : rank === 3 ? "#cd7f32" : "var(--text-dim)";
            const hasFlipped = flippedNames.has((item.name || "").toLowerCase());

            return (
              <div
                key={item.id}
                className="flip-row"
                style={{ gridTemplateColumns: COLS }}
                onClick={() => onOpenChart(item)}
              >
                {/* Rank */}
                <span style={{ fontSize: "11px", fontWeight: rank <= 3 ? 700 : 400, color: rankColor }}>
                  #{rank}
                </span>

                {/* Item name + badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src={itemIconUrl(item.name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                  <div>
                    <div className="item-name">{item.name}</div>
                    {hasFlipped && (
                      <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(201,168,76,0.12)", color: "var(--gold)", borderRadius: "4px", padding: "1px 5px" }}>
                        ✓ Flipped
                      </span>
                    )}
                  </div>
                </div>

                {/* Buy */}
                <span className="price">{formatGP(item.low)}</span>

                {/* Sell */}
                <span className="price">{formatGP(item.high)}</span>

                {/* Margin */}
                <span className={`margin${item.margin < 0 ? " neg" : ""}`}>{formatGP(item.margin)}</span>

                {/* ROI */}
                <span className="roi" style={{ color: item.roi > 4 ? "var(--gold)" : item.roi >= 1 ? "var(--green)" : "#f39c12" }}>
                  {item.roi}%
                </span>

                {/* Volume */}
                <span className="price" style={{ color: item.volume >= 500 ? "var(--green)" : item.volume >= 100 ? "var(--text)" : "var(--text-dim)" }}>
                  {item.volume >= 1000 ? (item.volume / 1000).toFixed(1) + "k" : item.volume.toLocaleString()}
                  {item.buyLimit > 0 && item.volume < item.buyLimit && (
                    <span style={{ color: "var(--red)", fontSize: "10px", marginLeft: "3px" }} title="Volume lower than buy limit">⚠</span>
                  )}
                </span>

                {/* Buy Limit */}
                <span className="price" style={{ color: "var(--text-dim)" }}>{item.buyLimit ? item.buyLimit.toLocaleString() : "?"}</span>

                {/* GP/Fill */}
                <span style={{ fontSize: "12px", fontWeight: 600, color: item._gpPerFill >= 1_000_000 ? "var(--green)" : item._gpPerFill >= 200_000 ? "var(--gold)" : "var(--text-dim)" }}>
                  {formatGP(item._gpPerFill)}
                </span>

                {/* Score badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                  <span className={`score-badge ${scoreClass}`} title={`Score: ${score}/100`}>{score}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "11px", color: "var(--text-dim)", padding: "0 4px" }}>
        <span>Score:</span>
        <span><span className="score-badge score-high" style={{ display: "inline-flex" }}>65+</span> Strong</span>
        <span><span className="score-badge score-med"  style={{ display: "inline-flex" }}>35–64</span> Decent</span>
        <span><span className="score-badge score-low"  style={{ display: "inline-flex" }}>&lt;35</span> Weak</span>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>Score factors: net margin · ROI · volume · GP/fill · your risk &amp; speed prefs</span>
      </div>
    </div>
  );
}
