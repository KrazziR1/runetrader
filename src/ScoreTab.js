import { useState, useMemo } from "react";

function formatGP(n) {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (Math.abs(n) >= 1_000_000)     return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000)         return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
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

// ── Full score breakdown for a single item ────────────────────────────────────
function getScoreBreakdown(item) {
  const margin    = item.margin   || 0;
  const roi       = item.roi      || 0;
  const volume    = item.volume   || 0;
  const gpPerFill = calcGpPerFill(item);

  const marginPts  = Math.round(Math.min(margin / 100_000, 1)             * 25);
  const roiPts     = Math.round(Math.min(roi / 30, 1)                     * 25);
  const volPts     = Math.round(Math.min(Math.log10(volume + 1) / 5.5, 1) * 25);
  const gpFillPts  = Math.round(Math.min(gpPerFill / 2_000_000, 1)        * 25);
  const total      = marginPts + roiPts + volPts + gpFillPts;

  return { marginPts, roiPts, volPts, gpFillPts, total };
}

// ── Mini score bar ─────────────────────────────────────────────────────────────
function ScoreBar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "6px", background: "var(--bg4)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px", transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "11px", color: "var(--text-dim)", minWidth: "24px", textAlign: "right" }}>{value}</span>
    </div>
  );
}

// ── Expanded breakdown row ─────────────────────────────────────────────────────
function BreakdownPanel({ item, bd }) {
  return (
    <div style={{ gridColumn: "1 / -1", background: "var(--bg4)", borderTop: "1px solid var(--border)", padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
      {[
        { label: "Margin Score", pts: bd.marginPts, max: 25, color: "var(--green)",  tip: `+${formatGP(item.margin)} margin → ${bd.marginPts}/25 pts` },
        { label: "ROI Score",    pts: bd.roiPts,    max: 25, color: "var(--gold)",   tip: `${item.roi}% ROI → ${bd.roiPts}/25 pts` },
        { label: "Volume Score", pts: bd.volPts,    max: 25, color: "var(--blue)",   tip: `${item.volume >= 1000 ? (item.volume/1000).toFixed(1)+"k" : item.volume} vol/day → ${bd.volPts}/25 pts` },
        { label: "GP/Fill Score",pts: bd.gpFillPts, max: 25, color: "#a855f7",       tip: `${formatGP(calcGpPerFill(item))} GP/fill → ${bd.gpFillPts}/25 pts` },
      ].map(({ label, pts, max, color, tip }) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>{tip}</span>
          </div>
          <ScoreBar value={pts} max={max} color={color} />
        </div>
      ))}
    </div>
  );
}

// ── Score explanation card ─────────────────────────────────────────────────────
function ScoringExplainer() {
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "16px", fontWeight: 700, color: "var(--gold)", marginBottom: "12px" }}>
        🏆 How Scores Are Calculated
      </div>
      <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.7, marginBottom: "16px" }}>
        Every item is scored out of <strong style={{ color: "var(--text)" }}>100 points</strong> across four equal components.
        Scores are recalculated live every time prices refresh.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
        {[
          { icon: "💰", label: "Margin",    pts: 25, color: "var(--green)", desc: "Raw GP profit per item after GE tax. Items with +100k margin score full points." },
          { icon: "📊", label: "ROI",       pts: 25, color: "var(--gold)",  desc: "Return on investment. High ROI means you're getting more bang per GP invested." },
          { icon: "🔥", label: "Volume",    pts: 25, color: "var(--blue)",  desc: "Daily trade volume. High volume = faster fills = more flips per day." },
          { icon: "⚡", label: "GP / Fill", pts: 25, color: "#a855f7",      desc: "Realistic GP per 4hr window, accounting for your buy limit and market volume." },
        ].map(({ icon, label, pts, color, desc }) => (
          <div key={label} style={{ background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "18px" }}>{icon}</span>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text)" }}>{label}</span>
              <span style={{ marginLeft: "auto", background: `${color}22`, color, borderRadius: "12px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>{pts} pts</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "14px", padding: "12px 16px", background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.6 }}>
        💡 <strong style={{ color: "var(--gold)" }}>Coming soon:</strong> The score will also factor in your personal preferences from the ⭐ Picks tab —
        risk appetite, trade speed, and cash stack — so items are ranked specifically to how you trade.
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ScoreTab({ user, items, onSignIn, onOpenChart }) {
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState(null);
  const [rowsShown, setRowsShown] = useState(100);

  const scored = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items
      .filter(item => item.hasPrice && item.margin > 0 && item.roi > 0)
      .map(item => ({ ...item, _bd: getScoreBreakdown(item) }))
      .filter(item => item._bd.total > 0)
      .filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b._bd.total - a._bd.total);
  }, [items, search]);

  const COLS = "2fr 80px 80px 80px 80px 1fr 1fr 1fr 1fr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Explainer */}
      <ScoringExplainer />

      {/* Table header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          All Items by Score
          <span style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "Inter, sans-serif", fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: "8px" }}>
            {scored.length.toLocaleString()} items
          </span>
        </div>
        <input
          className="filter-input"
          placeholder="Search items..."
          value={search}
          onChange={e => { setSearch(e.target.value); setRowsShown(100); }}
          style={{ width: "200px" }}
        />
      </div>

      {/* Table */}
      <div className="flips-table">
        {/* Header */}
        <div className="table-header" style={{ gridTemplateColumns: COLS }}>
          {["Item", "Score", "Margin", "ROI", "Vol/Day", "Margin pts", "ROI pts", "Volume pts", "GP/Fill pts"].map((col, i) => (
            <span key={i} style={{ fontSize: "13px" }}>{col}</span>
          ))}
        </div>

        {/* Rows */}
        {scored.slice(0, rowsShown).map((item, i) => {
          const { marginPts, roiPts, volPts, gpFillPts, total } = item._bd;
          const scoreClass = total >= 65 ? "score-high" : total >= 35 ? "score-med" : "score-low";
          const isOpen = expanded === item.id;

          return (
            <div key={item.id} style={{ display: "contents" }}>
              <div
                className="flip-row"
                style={{ gridTemplateColumns: COLS, cursor: "pointer" }}
                onClick={() => { setExpanded(isOpen ? null : item.id); }}
              >
                {/* Item */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src={itemIconUrl(item.name)} alt="" className="item-icon" onError={e => { e.target.style.display = "none"; }} />
                  <div>
                    <div className="item-name">{item.name}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>{isOpen ? "▲ hide" : "▼ breakdown"}</div>
                  </div>
                </div>

                {/* Total score */}
                <span className={`score-badge ${scoreClass}`}>{total}</span>

                {/* Margin */}
                <span className="margin">{formatGP(item.margin)}</span>

                {/* ROI */}
                <span className="roi" style={{ color: item.roi > 4 ? "var(--gold)" : item.roi >= 1 ? "var(--green)" : "#f39c12" }}>
                  {item.roi}%
                </span>

                {/* Volume */}
                <span className="price" style={{ color: item.volume >= 500 ? "var(--green)" : "var(--text-dim)" }}>
                  {item.volume >= 1000 ? (item.volume / 1000).toFixed(1) + "k" : item.volume.toLocaleString()}
                </span>

                {/* Score bars — margin */}
                <ScoreBar value={marginPts} max={25} color="var(--green)" />

                {/* ROI bar */}
                <ScoreBar value={roiPts} max={25} color="var(--gold)" />

                {/* Volume bar */}
                <ScoreBar value={volPts} max={25} color="var(--blue)" />

                {/* GP/Fill bar */}
                <ScoreBar value={gpFillPts} max={25} color="#a855f7" />
              </div>

              {/* Expanded breakdown */}
              {isOpen && (
                <div
                  className="flip-row"
                  style={{ gridTemplateColumns: "1fr", padding: 0, cursor: "default" }}
                  onClick={e => e.stopPropagation()}
                >
                  <BreakdownPanel item={item} bd={item._bd} />
                  <div style={{ padding: "10px 20px", display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => { onOpenChart && onOpenChart(item); }}
                      style={{ padding: "7px 18px", borderRadius: "6px", border: "1px solid var(--gold-dim)", background: "rgba(201,168,76,0.08)", color: "var(--gold)", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                    >
                      View Chart →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {scored.length > rowsShown && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => setRowsShown(n => n + 100)}
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text-dim)", borderRadius: "8px", padding: "8px 24px", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "var(--gold-dim)"; e.currentTarget.style.color = "var(--gold)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}
          >
            Load more ({scored.length - rowsShown} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
