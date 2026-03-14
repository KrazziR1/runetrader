// src/HerbRun.js
import { useState, useEffect } from "react";

const WIKI_API = "https://prices.runescape.wiki/api/v1/osrs/latest";
const WIKI_MAP = "https://prices.runescape.wiki/api/v1/osrs/mapping";

const HERBS = [
  { name: "Guam",       seed: "Guam seed",       grimy: "Grimy guam leaf",    clean: "Guam leaf",        avgYield: 5.0, reqLevel: 9  },
  { name: "Marrentill", seed: "Marrentill seed",  grimy: "Grimy marrentill",   clean: "Marrentill",       avgYield: 5.0, reqLevel: 14 },
  { name: "Tarromin",   seed: "Tarromin seed",    grimy: "Grimy tarromin",     clean: "Tarromin",         avgYield: 5.1, reqLevel: 19 },
  { name: "Harralander",seed: "Harralander seed", grimy: "Grimy harralander",  clean: "Harralander",      avgYield: 5.2, reqLevel: 26 },
  { name: "Ranarr",     seed: "Ranarr seed",      grimy: "Grimy ranarr weed",  clean: "Ranarr weed",      avgYield: 6.5, reqLevel: 32 },
  { name: "Toadflax",   seed: "Toadflax seed",    grimy: "Grimy toadflax",     clean: "Toadflax",         avgYield: 6.8, reqLevel: 38 },
  { name: "Irit",       seed: "Irit seed",        grimy: "Grimy irit leaf",    clean: "Irit leaf",        avgYield: 6.5, reqLevel: 44 },
  { name: "Avantoe",    seed: "Avantoe seed",     grimy: "Grimy avantoe",      clean: "Avantoe",          avgYield: 7.0, reqLevel: 50 },
  { name: "Kwuarm",     seed: "Kwuarm seed",      grimy: "Grimy kwuarm",       clean: "Kwuarm",           avgYield: 7.0, reqLevel: 56 },
  { name: "Snapdragon", seed: "Snapdragon seed",  grimy: "Grimy snapdragon",   clean: "Snapdragon",       avgYield: 7.5, reqLevel: 62 },
  { name: "Cadantine",  seed: "Cadantine seed",   grimy: "Grimy cadantine",    clean: "Cadantine",        avgYield: 7.5, reqLevel: 67 },
  { name: "Lantadyme",  seed: "Lantadyme seed",   grimy: "Grimy lantadyme",    clean: "Lantadyme",        avgYield: 7.5, reqLevel: 73 },
  { name: "Dwarf weed", seed: "Dwarf weed seed",  grimy: "Grimy dwarf weed",   clean: "Dwarf weed",       avgYield: 7.5, reqLevel: 79 },
  { name: "Torstol",    seed: "Torstol seed",     grimy: "Grimy torstol",      clean: "Torstol",          avgYield: 8.0, reqLevel: 85 },
];

const PATCHES = 9; // max herb patches with all diaries
const COMPOST_COST = 500; // ultracompost approx

function formatGP(n) {
  if (!n || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return Math.round(n / 1_000) + "K";
  return Math.round(n).toLocaleString();
}

export default function HerbRun({ allItems }) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [patches, setPatches] = useState(9);
  const [useCompost, setUseCompost] = useState(true);
  const [sortCol, setSortCol] = useState("profit");
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  async function fetchPrices() {
    setLoading(true);
    try {
      const [mapRes, priceRes] = await Promise.all([
        fetch(WIKI_MAP, { headers: { "User-Agent": "RuneTrader.gg" } }),
        fetch(WIKI_API, { headers: { "User-Agent": "RuneTrader.gg" } }),
      ]);
      const mapping = await mapRes.json();
      const latest = await priceRes.json();

      const nameToPrice = {};
      mapping.forEach(item => {
        const p = latest.data[item.id];
        if (p) nameToPrice[item.name] = { high: p.high || 0, low: p.low || 0 };
      });
      setPrices(nameToPrice);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Herb price fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const herbs = HERBS.map(h => {
    const seedPrice = prices[h.seed]?.low || 0;
    const herbPrice = prices[h.grimy]?.high || 0;
    const compostCost = useCompost ? COMPOST_COST * patches : 0;
    const totalSeedCost = seedPrice * patches;
    const totalHerbValue = herbPrice * h.avgYield * patches;
    const profit = totalHerbValue - totalSeedCost - compostCost;
    const profitPerSeed = profit / patches;
    return { ...h, seedPrice, herbPrice, profit, profitPerSeed, totalHerbValue, totalSeedCost };
  }).sort((a, b) => {
    if (sortCol === "profit") return b.profit - a.profit;
    if (sortCol === "profitPerSeed") return b.profitPerSeed - a.profitPerSeed;
    if (sortCol === "herb") return b.herbPrice - a.herbPrice;
    if (sortCol === "seed") return a.seedPrice - b.seedPrice;
    return 0;
  });

  const cols = [
    { key: "name",         label: "Herb",            align: "left"  },
    { key: "seed",         label: "Seed Cost",        align: "right" },
    { key: "herb",         label: "Herb Price",       align: "right" },
    { key: "profitPerSeed",label: "Profit / Patch",   align: "right" },
    { key: "profit",       label: `Total (${patches} patches)`, align: "right" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>Patches:</span>
          {[4, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => setPatches(n)}
              style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${patches === n ? "var(--gold-dim)" : "var(--border)"}`, background: patches === n ? "rgba(201,168,76,0.12)" : "transparent", color: patches === n ? "var(--gold)" : "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              {n}
            </button>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-dim)", cursor: "pointer" }}>
          <input type="checkbox" checked={useCompost} onChange={e => setUseCompost(e.target.checked)} />
          Ultracompost ({formatGP(COMPOST_COST)}gp/patch)
        </label>
        <button onClick={fetchPrices} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          ↻ Refresh
        </button>
        {lastUpdate && <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Updated {Math.round((new Date() - lastUpdate) / 1000)}s ago</span>}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 16px", background: "var(--bg4)", borderBottom: "1px solid var(--border)", fontSize: "13px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {cols.map(c => (
            <div key={c.key} style={{ textAlign: c.align, cursor: "pointer", color: sortCol === c.key ? "var(--gold)" : "var(--text-dim)" }} onClick={() => setSortCol(c.key)}>
              {c.label} {sortCol === c.key ? "▼" : ""}
            </div>
          ))}
        </div>

        {loading ? (
          Array(14).fill(0).map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 16px", borderBottom: "1px solid var(--border)", gap: "8px" }}>
              {[2, 1, 1, 1, 1].map((w, j) => <div key={j} style={{ height: "16px", background: "var(--bg4)", borderRadius: "4px", opacity: 0.5 }} />)}
            </div>
          ))
        ) : herbs.map((h, i) => (
          <div key={h.name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 16px", borderBottom: i < herbs.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background 0.1s" }}
            onMouseOver={e => e.currentTarget.style.background = "var(--bg3)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "14px", color: "var(--text)", fontWeight: 500 }}>{h.name}</span>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Lv. {h.reqLevel} · ~{h.avgYield} herbs/patch</span>
            </div>
            <div style={{ textAlign: "right", fontSize: "13px", color: "var(--text-dim)" }}>{formatGP(h.seedPrice)}</div>
            <div style={{ textAlign: "right", fontSize: "13px", color: "var(--text-dim)" }}>{formatGP(h.herbPrice)}</div>
            <div style={{ textAlign: "right", fontSize: "13px", color: h.profitPerSeed >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{formatGP(h.profitPerSeed)}</div>
            <div style={{ textAlign: "right", fontSize: "14px", color: h.profit >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{formatGP(h.profit)}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center" }}>
        Prices from OSRS Wiki API · Yields are averages with Ultracompost · Actual results vary by farming level and diary completion
      </div>
    </div>
  );
}
