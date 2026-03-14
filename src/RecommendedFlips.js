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
function qualifiesLow(item) {
  if (!item.hasPrice || item.margin <= 0) return false;
  const vol = item.volume   || 0;
  const lim = item.buyLimit || 0;
  if (lim <= 0) return false;
  if (freshnessAge(item.lastTradeTime) > 900) return false; // >15min
  return (vol / lim) >= 70;
}

function qualifiesMedium(item) {
  if (!item.hasPrice || item.margin <= 0) return false;
  if (freshnessAge(item.lastTradeTime) > 2700) return false; // >45min
  const vol = item.volume   || 0;
  const lim = item.buyLimit || 0;
  if ((item.low    || 0) < 200_000)  return false; // buy price ≥ 200k
  if ((item.low    || 0) >= 10_000_000) return false; // buy price < 10M (High tier)
  if ((item.margin || 0) < 30_000)   return false; // margin ≥ 30k
  if (vol < 50)                      return false; // vol ≥ 50/day
  if (lim <= 0)                      return false;
  if ((vol / lim) < 8)               return false; // vol/limit ≥ 8×
  return true;
}

function qualifiesHigh(item) {
  if (!item.hasPrice || item.margin <= 0) return false;
  if (freshnessAge(item.lastTradeTime) > 3600) return false; // >1hr
  const vol = item.volume   || 0;
  const lim = item.buyLimit || 0;
  if ((item.low    || 0) < 10_000_000) return false; // buy price ≥ 10M
  if ((item.margin || 0) < 90_000)     return false; // margin ≥ 90k
  if (vol < 50)                        return false; // vol ≥ 50/day
  if (lim <= 0)                        return false;
  if ((vol / lim) < 8)                 return false; // vol/limit ≥ 8×
  return true;
}

// ── Risk Tag ──────────────────────────────────────────────────────────────────
function RiskTag({ item }) {
  if (qualifiesLow(item))
    return <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(46,204,113,0.12)", color: "var(--green)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>Low Risk</span>;
  if (qualifiesMedium(item))
    return <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(201,168,76,0.12)", color: "var(--gold)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>Med Risk</span>;
  return <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(231,76,60,0.12)", color: "var(--red)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>High Risk</span>;
}

// ── Sort button ───────────────────────────────────────────────────────────────
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
const DEFAULT_PREFS = { cashStack: "", risk: "low", membership: "both" };
const DEFAULT_ADV   = { minMargin: "", maxMargin: "", minRoi: "", maxRoi: "", minVolume: "", maxVolume: "" };

// ── Login Gate ────────────────────────────────────────────────────────────────
function LoginGate({ onSignIn }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "52px" }}>⭐</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", fontWeight: 700, color: "var(--gold)" }}>Personalised Flip Picks</div>
      <div style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.7, maxWidth: "400px" }}>
        Sign in to get flip recommendations filtered to your cash stack and risk tolerance, sorted by highest daily volume.
      </div>
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "360px" }}>
        {["Low / Medium / High risk — real qualification rules", "Cash stack filter — only see what you can afford", "Sortable columns — sort by margin, ROI, volume and more", "\"You've flipped this\" badges from your history"].map((f, i) => (
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
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem("rt_picks_prefs_v3") || "{}") }; }
    catch { return DEFAULT_PREFS; }
  });
  const [adv, setAdv]               = useState(DEFAULT_ADV);
  const [showAdv, setShowAdv]       = useState(false);
  const [search, setSearch]         = useState("");
  const [sortCol, setSortCol]       = useState("volume");
  const [sortDir, setSortDir]       = useState("desc");

  function setPref(key, val) {
    setPrefs(p => {
      const next = { ...p, [key]: val };
      localStorage.setItem("rt_picks_prefs_v3", JSON.stringify(next));
      return next;
    });
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
        if (!qualifies(item))                                       return false;
        if ((item.low || 0) > budget)                               return false;
        if (prefs.membership === "f2p"     && item.members)         return false;
        if (prefs.membership === "members" && !item.members)        return false;
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;

        // Advanced filters
        if (adv.minMargin  && (item.margin || 0) < parseFloat(adv.minMargin))  return false;
        if (adv.maxMargin  && (item.margin || 0) > parseFloat(adv.maxMargin))  return false;
        if (adv.minRoi     && (item.roi    || 0) < parseFloat(adv.minRoi))     return false;
        if (adv.maxRoi     && (item.roi    || 0) > parseFloat(adv.maxRoi))     return false;
        if (adv.minVolume  && (item.volume || 0) < parseFloat(adv.minVolume.replace(/[km]/i, v => v === 'k' ? 'e3' : 'e6')))  return false;
        if (adv.maxVolume  && (item.volume || 0) > parseFloat(adv.maxVolume.replace(/[km]/i, v => v === 'k' ? 'e3' : 'e6')))  return false;

        return true;
      })
      .map(item => ({ ...item, _gpPerFill: calcGpPerFill(item) }));

    // Sort
    result.sort((a, b) => {
      let av, bv;
      switch (sortCol) {
        case "name":      av = a.name;        bv = b.name;        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
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
  }, [items, qualifies, prefs.membership, budget, search, adv, sortCol, sortDir]);

  if (!user) return <LoginGate onSignIn={onSignIn} />;

  const COLS = "minmax(160px,2fr) 1fr 1fr 1fr 1fr 1fr 1fr 1fr 80px 70px";

  const riskMeta = {
    low:    "Vol/day ≥ 70× your buy limit. Market moves far more than you can buy — fast, reliable fills.",
    medium: "Buy 200k–10M · Margin ≥ 30k · Vol ≥ 50/day · Vol/limit ≥ 8× · Traded in last 45min.",
    high:   "Buy ≥ 10M · Margin ≥ 90k · Vol ≥ 50/day · Vol/limit ≥ 8× · Traded in last hour. High capital, fills not guaranteed.",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Preferences bar ── */}
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
            {[["low","Low"],["medium","Medium"],["high","High"]].map(([v, l]) => (
              <button key={v}
                className={`toggle-btn${prefs.risk === v ? v === "low" ? " active-low" : v === "medium" ? " active-med" : " active-high" : ""}`}
                onClick={() => setPref("risk", v)}
              >{l}</button>
            ))}
          </div>
          <span style={{ fontSize: "10px", color: "var(--text-dim)", maxWidth: "260px", lineHeight: 1.5 }}>{riskMeta[prefs.risk]}</span>
        </div>

        {/* Membership */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Membership</span>
          <div style={{ display: "flex", gap: "4px", height: "32px" }}>
            {[["f2p","F2P"],["members","Members"],["both","Both"]].map(([v, l]) => (
              <button key={v}
                className={`toggle-btn${prefs.membership === v ? " active-med" : ""}`}
                onClick={() => setPref("membership", v)}
              >{l}</button>
            ))}
          </div>
          <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Filter by account type</span>
        </div>

        {/* Search + adv filters + count — pushed right */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginLeft: "auto" }}>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Search</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "32px" }}>
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
          <SortBtn col="name"      label="Item"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip={null} />
          <SortBtn col="low"       label="Buy"         sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Lowest current buy offer on the GE" />
          <SortBtn col="high"      label="Sell"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Highest current sell offer on the GE" />
          <SortBtn col="margin"    label="Margin"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Sell price minus buy price minus GE tax" />
          <SortBtn col="roi"       label="ROI"         sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Margin ÷ buy price" />
          <SortBtn col="volume"    label="Vol / Day"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Total items traded per day" />
          <SortBtn col="buyLimit"  label="Limit"       sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Max you can buy every 4 hours" />
          <SortBtn col="gpPerFill" label="GP / Fill"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="Realistic GP profit per 4hr window, scaled by market volume" />
          <SortBtn col="lastTrade" label="Last Trade"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} tip="When this item last traded on the GE" />
          <div style={{ fontSize: "13px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>24hr Trend</div>
        </div>

        {/* Rows */}
        {picks.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>No picks right now</p>
            <small>
              {prefs.cashStack && parseCash(prefs.cashStack) < 200_000
                ? "Cash stack below 200k — most items won't qualify"
                : "Prices update constantly — check back shortly or try a different risk level"}
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
                <span style={{ fontSize: "13px", color: volColor }}>{formatVol(item.volume)}</span>

                {/* Buy Limit */}
                <span className="price" style={{ color: "var(--text-dim)" }}>{item.buyLimit ? item.buyLimit.toLocaleString() : "?"}</span>

                {/* GP/Fill */}
                <span style={{ fontSize: "12px", fontWeight: 600, color: gpfColor }}>{formatGP(gpf)}</span>

                {/* Last Trade */}
                <span style={{ fontSize: "11px", color: tradeColor }}>{item.lastTradeTime ? timeAgo(item.lastTradeTime) : "—"}</span>

                {/* 24hr Trend sparkline */}
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
