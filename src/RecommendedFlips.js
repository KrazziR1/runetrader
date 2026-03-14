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

// ── Tier Qualification ────────────────────────────────────────────────────────
//
// LOW:    vol / buyLimit ≥ 70×  |  margin > 0  |  freshness ≤ 15min
// MEDIUM: buy ≥ 200k  |  margin ≥ 30k  |  freshness ≤ 45min
// HIGH:   buy ≥ 10M   |  margin ≥ 90k  |  freshness ≤ 1hr
//
// All tiers: positive margin only, hasPrice required
// Items can qualify for multiple tiers — shown with lowest applicable risk tag

function qualifiesLow(item) {
  if (!item.hasPrice || item.margin <= 0) return false;
  const vol = item.volume   || 0;
  const lim = item.buyLimit || 0;
  if (lim <= 0) return false;
  const age = freshnessAge(item.lastTradeTime);
  if (age > 900) return false; // > 15min
  return (vol / lim) >= 70;
}

function qualifiesMedium(item) {
  if (!item.hasPrice || item.margin <= 0) return false;
  const age = freshnessAge(item.lastTradeTime);
  if (age > 2700) return false; // > 45min
  if ((item.low || 0) < 200_000) return false;
  if ((item.margin || 0) < 30_000) return false;
  return true;
}

function qualifiesHigh(item) {
  if (!item.hasPrice || item.margin <= 0) return false;
  const age = freshnessAge(item.lastTradeTime);
  if (age > 3600) return false; // > 1hr
  if ((item.low || 0) < 10_000_000) return false;
  if ((item.margin || 0) < 90_000) return false;
  return true;
}

// ── Risk Tag ──────────────────────────────────────────────────────────────────
function RiskTag({ item }) {
  if (qualifiesLow(item)) return (
    <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(46,204,113,0.12)", color: "var(--green)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>
      Low Risk
    </span>
  );
  if (qualifiesMedium(item)) return (
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
          "Low / Medium / High risk — real qualification rules",
          "Cash stack filter — only see what you can afford",
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
      const saved = JSON.parse(localStorage.getItem("rt_picks_prefs_v3") || "{}");
      return { ...DEFAULT_PREFS, ...saved };
    } catch { return DEFAULT_PREFS; }
  });
  const [search, setSearch] = useState("");

  function setPref(key, val) {
    setPrefs(p => {
      const next = { ...p, [key]: val };
      localStorage.setItem("rt_picks_prefs_v3", JSON.stringify(next));
      return next;
    });
  }

  const flippedNames = useMemo(() => {
    const s = new Set();
    (flipsLog || []).forEach(f => { if (f.item) s.add(f.item.toLowerCase()); });
    return s;
  }, [flipsLog]);

  const budget = parseCash(prefs.cashStack);

  // Select the qualifier function for the chosen risk tier
  const qualifies = useMemo(() => {
    if (prefs.risk === "low")    return qualifiesLow;
    if (prefs.risk === "medium") return qualifiesMedium;
    if (prefs.risk === "high")   return qualifiesHigh;
    return () => false;
  }, [prefs.risk]);

  const picks = useMemo(() => {
    if (!items || items.length === 0) return [];

    return items
      .filter(item => {
        // Must pass the tier qualification
        if (!qualifies(item)) return false;

        // Cash stack — can't afford it
        if ((item.low || 0) > budget) return false;

        // Membership
        if (prefs.membership === "f2p"     && item.members)  return false;
        if (prefs.membership === "members" && !item.members) return false;

        // Search
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;

        return true;
      })
      // Highest daily volume first
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 50);
  }, [items, qualifies, prefs.membership, budget, search]);

  if (!user) return <LoginGate onSignIn={onSignIn} />;

  const COLS = "minmax(160px,2fr) 1fr 1fr 1fr 1fr 1fr 1fr 80px";

  const riskMeta = {
    low: {
      label: "Low Risk",
      desc: "Vol/day ≥ 70× your buy limit. Market moves far more than you can buy — fast, reliable fills. Think runes, food, ammunition.",
    },
    medium: {
      label: "Medium Risk",
      desc: "Buy price ≥ 200k · Margin ≥ 30k · Traded in last 45min. Mid-tier gear and supplies with meaningful profit per flip.",
    },
    high: {
      label: "High Risk",
      desc: "Buy price ≥ 10M · Margin ≥ 90k · Traded in last hour. High capital, high reward. Fills not guaranteed — price can move while you wait.",
    },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Preferences bar */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px 20px", display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "flex-end" }}>

        {/* Cash Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
            Cash Stack
          </span>
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
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
            Risk Tolerance
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            {[["low","Low"],["medium","Medium"],["high","High"]].map(([v, l]) => (
              <button
                key={v}
                className={`toggle-btn${prefs.risk === v
                  ? v === "low" ? " active-low" : v === "medium" ? " active-med" : " active-high"
                  : ""}`}
                onClick={() => setPref("risk", v)}
              >
                {l}
              </button>
            ))}
          </div>
          <span style={{ fontSize: "10px", color: "var(--text-dim)", maxWidth: "320px", lineHeight: 1.5 }}>
            {riskMeta[prefs.risk].desc}
          </span>
        </div>

        {/* Membership */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
            Membership
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            {[["f2p","F2P"],["members","Members"],["both","Both"]].map(([v, l]) => (
              <button
                key={v}
                className={`toggle-btn${prefs.membership === v ? " active-med" : ""}`}
                onClick={() => setPref("membership", v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Search + count */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginLeft: "auto" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
            Search
          </span>
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
            ["Vol / Day",  "Total items traded per day"],
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
            <p>No picks right now</p>
            <small>
              {prefs.cashStack && parseCash(prefs.cashStack) < 200_000
                ? "Your cash stack is below 200k — most items won't qualify"
                : "Prices update constantly — check back shortly or try a different risk level"}
            </small>
          </div>
        ) : (
          picks.map(item => {
            const age        = freshnessAge(item.lastTradeTime);
            const tradeColor = age <= 300 ? "var(--green)" : age <= 900 ? "var(--text)" : "var(--text-dim)";
            const hasFlipped = flippedNames.has((item.name || "").toLowerCase());
            const volColor   = (item.volume || 0) >= 1_000_000 ? "var(--green)"
                             : (item.volume || 0) >= 300_000   ? "var(--text)"
                             : "var(--text-dim)";

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
