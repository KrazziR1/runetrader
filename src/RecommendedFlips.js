import { useState, useMemo } from "react";

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

// ── Tier Classification ───────────────────────────────────────────────────────

function volTier(vol) {
  if (vol >= 1_000_000) return "high";     // 1M+
  if (vol >= 300_000)   return "medium";   // 300k–999k
  if (vol >= 100_000)   return "low";      // 100k–299k
  if (vol >= 1_000)     return "verylow";  // 1k–99k
  return "avoid";                          // <1k
}

function freshnessTier(ageSec) {
  if (ageSec <= 300)  return "live";   // ≤5 min
  if (ageSec <= 900)  return "ok";     // 5–15 min
  if (ageSec <= 2700) return "dated";  // 16–45 min
  if (ageSec <= 3600) return "hour";   // 45–60 min
  return "stale";                      // 60min+
}

// ── Qualification Rules ───────────────────────────────────────────────────────

function qualifiesSafe(item) {
  const vol    = item.volume   || 0;
  const roi    = item.roi      || 0;
  const lim    = item.buyLimit || 0;
  const ageSec = freshnessAge(item.lastTradeTime);
  const vTier  = volTier(vol);
  const fTier  = freshnessTier(ageSec);

  if (!item.hasPrice || item.margin <= 0) return false;

  // Freshness: live or ok only (≤15min)
  if (fTier !== "live" && fTier !== "ok") return false;

  // Volume: High (1M+) required
  // Medium allowed ONLY if vol ≥ 200× buyLimit
  const mediumHighLiquidity = vTier === "medium" && lim > 0 && vol >= lim * 200;
  if (vTier !== "high" && !mediumHighLiquidity) return false;

  // ROI: must be 0.25–5%
  if (roi < 0.25) return false;
  if (roi > 5 && roi <= 20) return false;

  // ROI 0.25–0.5%: volume must be medium or high (medium only via 200× rule)
  if (roi >= 0.25 && roi < 0.5) {
    if (vTier !== "high" && !mediumHighLiquidity) return false;
  }

  // ROI 21%+: only allowed if vol > 1M/day
  if (roi > 20 && vol <= 1_000_000) return false;

  return true;
}

function qualifiesBalanced(item) {
  const vol    = item.volume   || 0;
  const roi    = item.roi      || 0;
  const lim    = item.buyLimit || 0;
  const ageSec = freshnessAge(item.lastTradeTime);
  const vTier  = volTier(vol);
  const fTier  = freshnessTier(ageSec);

  if (!item.hasPrice || item.margin <= 0) return false;

  // Freshness: ≤15min
  if (fTier !== "live" && fTier !== "ok") return false;

  // Volume: ≥300k/day (medium or high)
  if (vTier !== "high" && vTier !== "medium") return false;

  // Never negative ROI or <0.1%
  if (roi < 0.1) return false;

  // Core range 1–20%: always qualifies
  if (roi >= 1 && roi <= 20) return true;

  // 21–50%: allowed if vol ≥100k OR vol ≥ 200× limit
  if (roi > 20 && roi <= 50) {
    if (vol >= 100_000) return true;
    if (lim > 0 && vol >= lim * 200) return true;
    return false;
  }

  // 51%+: medium or high volume only
  if (roi > 50) {
    if (vTier === "medium" || vTier === "high") return true;
    return false;
  }

  // 0.1–0.99%: not in qualifying range
  return false;
}

function qualifiesRisky(item) {
  const vol    = item.volume   || 0;
  const roi    = item.roi      || 0;
  const lim    = item.buyLimit || 0;
  const ageSec = freshnessAge(item.lastTradeTime);
  const vTier  = volTier(vol);
  const fTier  = freshnessTier(ageSec);

  if (!item.hasPrice || item.margin <= 0) return false;

  // Never negative ROI
  if (roi < 0) return false;

  // Freshness: ≤1hr (live, ok, dated, hour all qualify)
  if (fTier === "stale") return false;

  // Volume: ≥100k/day minimum
  if (vTier === "verylow" || vTier === "avoid") return false;

  // ROI <0.1%: allowed only if vol >100k/day
  if (roi < 0.1) {
    return vol > 100_000;
  }

  // ROI 0.1–5.99%: not risky enough
  if (roi >= 0.1 && roi < 6) return false;

  // ROI 6–20%: qualifies
  if (roi >= 6 && roi <= 20) return true;

  // ROI 21–50%: fine if vol ≥100k/day
  if (roi > 20 && roi <= 50) {
    return vol >= 100_000;
  }

  // ROI 51%+: vol ≥200k/day OR vol ≥ 70× buyLimit
  if (roi > 50) {
    if (vol >= 200_000) return true;
    if (lim > 0 && vol >= lim * 70) return true;
    return false;
  }

  return false;
}

// ── Risk Tag shown on each row ────────────────────────────────────────────────
function RiskTag({ item }) {
  const safe     = qualifiesSafe(item);
  const balanced = qualifiesBalanced(item);
  if (safe) return (
    <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(46,204,113,0.12)", color: "var(--green)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>
      Low Risk
    </span>
  );
  if (balanced) return (
    <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(201,168,76,0.12)", color: "var(--gold)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>
      Med Risk
    </span>
  );
  return (
    <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(231,76,60,0.12)", color: "var(--red)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>
      High Risk
    </span>
  );
}

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_PREFS = {
  cashStack:  "",
  risk:       "low",
  membership: "both",
};

// ── Login Gate ────────────────────────────────────────────────────────────────
function LoginGate({ onSignIn }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "52px" }}>⭐</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", fontWeight: 700, color: "var(--gold)" }}>
        Personalised Flip Picks
      </div>
      <div style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.7, maxWidth: "400px" }}>
        Sign in to get flip recommendations filtered to your cash stack and risk tolerance,
        sorted by highest daily volume.
      </div>
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "360px" }}>
        {[
          "Tier-based qualification — not just a sorted list",
          "Cash stack filter — only see what you can afford",
          "Low / Medium / High risk tolerance",
          "Sorted by daily volume — most liquid first",
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function RecommendedFlips({ user, items, flipsLog, onSignIn, onOpenChart }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rt_picks_prefs_v2") || "{}");
      return { ...DEFAULT_PREFS, ...saved };
    } catch { return DEFAULT_PREFS; }
  });
  const [search, setSearch] = useState("");

  function setPref(key, val) {
    setPrefs(p => {
      const next = { ...p, [key]: val };
      localStorage.setItem("rt_picks_prefs_v2", JSON.stringify(next));
      return next;
    });
  }

  const flippedNames = useMemo(() => {
    const s = new Set();
    (flipsLog || []).forEach(f => { if (f.item) s.add(f.item.toLowerCase()); });
    return s;
  }, [flipsLog]);

  const budget = parseCash(prefs.cashStack);

  const picks = useMemo(() => {
    if (!items || items.length === 0) return [];

    return items
      .filter(item => {
        if (!item.hasPrice) return false;

        // Cash stack hard filter
        if ((item.low || 0) > budget) return false;

        // Membership filter
        if (prefs.membership === "f2p" && item.members)   return false;
        if (prefs.membership === "members" && !item.members) return false;

        // Search
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;

        // Risk tier
        if (prefs.risk === "low")    return qualifiesSafe(item);
        if (prefs.risk === "medium") return qualifiesBalanced(item);
        if (prefs.risk === "high")   return qualifiesRisky(item);

        return false;
      })
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 50);
  }, [items, prefs, budget, search]);

  if (!user) return <LoginGate onSignIn={onSignIn} />;

  const COLS = "minmax(160px,2fr) 1fr 1fr 1fr 1fr 1fr 1fr 80px";

  const riskDesc = {
    low:    "High-volume items, thin reliable margins. Fastest fills, lowest variance.",
    medium: "Mid-volume items with solid ROI. Balance of fill speed and profit.",
    high:   "Higher ROI, more variance. Volume ≥100k/day required but fills not guaranteed.",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Preferences bar */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px 20px", display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "flex-end" }}>

        {/* Cash Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Cash Stack</span>
          <input
            className="filter-input"
            placeholder="e.g. 10m, 500k, 1b"
            value={prefs.cashStack}
            onChange={e => setPref("cashStack", e.target.value)}
            style={{ width: "160px" }}
          />
        </div>

        {/* Risk Tolerance */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Risk Tolerance</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {[["low","Low"],["medium","Medium"],["high","High"]].map(([v, l]) => (
              <button
                key={v}
                className={`toggle-btn${prefs.risk === v ? (v === "low" ? " active-low" : v === "medium" ? " active-med" : " active-high") : ""}`}
                onClick={() => setPref("risk", v)}
              >{l}</button>
            ))}
          </div>
          <span style={{ fontSize: "10px", color: "var(--text-dim)", maxWidth: "280px", lineHeight: 1.5 }}>
            {riskDesc[prefs.risk]}
          </span>
        </div>

        {/* Membership */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Membership</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {[["f2p","F2P"],["members","Members"],["both","Both"]].map(([v, l]) => (
              <button
                key={v}
                className={`toggle-btn${prefs.membership === v ? " active-med" : ""}`}
                onClick={() => setPref("membership", v)}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Search + count */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginLeft: "auto" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Search</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              className="filter-input"
              placeholder="Item name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "160px" }}
            />
            <span style={{ fontSize: "12px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>
              {picks.length} pick{picks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

      </div>

      {/* Table */}
      <div className="flips-table">

        {/* Header */}
        <div className="table-header" style={{ gridTemplateColumns: COLS }}>
          {[
            ["Item",       null],
            ["Buy",        "Lowest current buy offer on the GE"],
            ["Sell",       "Highest current sell offer on the GE"],
            ["Margin",     "Sell price minus buy price minus GE tax"],
            ["ROI",        "Margin ÷ buy price"],
            ["Vol / Day",  "Total items traded per day — higher means more liquid"],
            ["Limit",      "Max you can buy every 4 hours"],
            ["Last Trade", "When this item last traded on the GE"],
          ].map(([label, tip], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>{label}</span>
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
        {picks.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>No picks match your filters right now</p>
            <small>
              {prefs.cashStack && parseCash(prefs.cashStack) < 500_000
                ? "Your cash stack may be filtering out most items — try increasing it"
                : "Prices and freshness update constantly — check back shortly or try a different risk level"}
            </small>
          </div>
        ) : (
          picks.map(item => {
            const ageSec     = freshnessAge(item.lastTradeTime);
            const fTier      = freshnessTier(ageSec);
            const tradeColor = fTier === "live" ? "var(--green)" : fTier === "ok" ? "var(--text)" : "var(--text-dim)";
            const hasFlipped = flippedNames.has((item.name || "").toLowerCase());
            const vt         = volTier(item.volume || 0);
            const volColor   = vt === "high" ? "var(--green)" : vt === "medium" ? "var(--text)" : "var(--text-dim)";

            return (
              <div
                key={item.id}
                className="flip-row"
                style={{ gridTemplateColumns: COLS }}
                onClick={() => onOpenChart(item)}
              >
                {/* Item */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img
                    src={itemIconUrl(item.name)}
                    alt=""
                    className="item-icon"
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div className="item-name">{item.name}</div>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <RiskTag item={item} />
                      {hasFlipped && (
                        <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(201,168,76,0.12)", color: "var(--gold)", borderRadius: "4px", padding: "1px 5px" }}>
                          ✓ Flipped
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Buy */}
                <span className="price">{formatGP(item.low)}</span>

                {/* Sell */}
                <span className="price">{formatGP(item.high)}</span>

                {/* Margin */}
                <span className={`margin${item.margin < 0 ? " neg" : ""}`}>
                  {formatGP(item.margin)}
                </span>

                {/* ROI */}
                <span className="roi" style={{ color: item.roi > 4 ? "var(--gold)" : item.roi >= 1 ? "var(--green)" : "#f39c12" }}>
                  {item.roi}%
                </span>

                {/* Volume */}
                <span style={{ fontSize: "13px", color: volColor }}>
                  {formatVol(item.volume)}
                </span>

                {/* Buy Limit */}
                <span className="price" style={{ color: "var(--text-dim)" }}>
                  {item.buyLimit ? item.buyLimit.toLocaleString() : "?"}
                </span>

                {/* Last Trade */}
                <span style={{ fontSize: "11px", color: tradeColor }}>
                  {item.lastTradeTime ? timeAgo(item.lastTradeTime) : "—"}
                </span>

              </div>
            );
          })
        )}
      </div>

      {picks.length > 0 && (
        <div style={{ fontSize: "11px", color: "var(--text-dim)", padding: "0 4px", opacity: 0.6 }}>
          Up to 50 picks · Sorted by daily volume · Click any row to open the item chart
        </div>
      )}

    </div>
  );
}
