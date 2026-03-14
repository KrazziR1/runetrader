// src/BlastFurnace.js
import { useState, useEffect } from "react";

const WIKI_API = "https://prices.runescape.wiki/api/v1/osrs/latest";
const WIKI_MAP = "https://prices.runescape.wiki/api/v1/osrs/mapping";

// Bars: ores needed, coal needed, smithing level, XP per bar
const BARS = [
  { name: "Bronze bar",  ores: [{ name: "Copper ore", qty: 1 }, { name: "Tin ore", qty: 1 }],    coal: 0,  level: 1,  xp: 6.2,  bar: "Bronze bar"  },
  { name: "Iron bar",    ores: [{ name: "Iron ore", qty: 1 }],                                    coal: 0,  level: 15, xp: 12.5, bar: "Iron bar"    },
  { name: "Silver bar",  ores: [{ name: "Silver ore", qty: 1 }],                                  coal: 0,  level: 20, xp: 13.7, bar: "Silver bar"  },
  { name: "Steel bar",   ores: [{ name: "Iron ore", qty: 1 }],                                    coal: 2,  level: 30, xp: 17.5, bar: "Steel bar"   },
  { name: "Gold bar",    ores: [{ name: "Gold ore", qty: 1 }],                                    coal: 0,  level: 40, xp: 22.5, bar: "Gold bar"    },
  { name: "Mithril bar", ores: [{ name: "Mithril ore", qty: 1 }],                                 coal: 4,  level: 50, xp: 30,   bar: "Mithril bar" },
  { name: "Adamant bar", ores: [{ name: "Adamantite ore", qty: 1 }],                              coal: 6,  level: 70, xp: 37.5, bar: "Adamant bar" },
  { name: "Rune bar",    ores: [{ name: "Runite ore", qty: 1 }],                                  coal: 8,  level: 85, xp: 50,   bar: "Runite bar"  },
];

// Stamina potion cost split across bars per hour (approx 4 doses/hr at ~10k each)
const STAMINA_COST_PER_HOUR = 40000;
const BARS_PER_HOUR = 5200; // approx at BF with coffer
const STAMINA_PER_BAR = STAMINA_COST_PER_HOUR / BARS_PER_HOUR;

function formatGP(n) {
  if (!n || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return Math.round(n / 1_000) + "K";
  return Math.round(n).toLocaleString();
}

export default function BlastFurnace() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [includeStamina, setIncludeStamina] = useState(true);
  const [sortCol, setSortCol] = useState("profitHr");
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => { fetchPrices(); }, []);

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
      console.error("BF price fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const bars = BARS.map(b => {
    const barPrice = prices[b.bar]?.high || 0;
    const oreCost = b.ores.reduce((sum, o) => sum + (prices[o.name]?.low || 0) * o.qty, 0);
    const coalCost = b.coal * (prices["Coal"]?.low || 0);
    const staminaCost = includeStamina ? STAMINA_PER_BAR : 0;
    const profitPerBar = barPrice - oreCost - coalCost - staminaCost;
    const profitHr = profitPerBar * BARS_PER_HOUR;
    const xpHr = b.xp * BARS_PER_HOUR;
    return { ...b, barPrice, oreCost, coalCost, profitPerBar, profitHr, xpHr };
  }).sort((a, b) => {
    if (sortCol === "profitHr") return b.profitHr - a.profitHr;
    if (sortCol === "profitPerBar") return b.profitPerBar - a.profitPerBar;
    if (sortCol === "xpHr") return b.xpHr - a.xpHr;
    if (sortCol === "level") return a.level - b.level;
    return 0;
  });

  const cols = [
    { key: "name",        label: "Bar",           align: "left"  },
    { key: "level",       label: "Level",         align: "right" },
    { key: "profitPerBar",label: "Profit/Bar",     align: "right" },
    { key: "profitHr",    label: "GP/hr",          align: "right" },
    { key: "xpHr",        label: "XP/hr",          align: "right" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-dim)", cursor: "pointer" }}>
          <input type="checkbox" checked={includeStamina} onChange={e => setIncludeStamina(e.target.checked)} />
          Include stamina potions (~{formatGP(STAMINA_COST_PER_HOUR)}gp/hr)
        </label>
        <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>Based on ~{(BARS_PER_HOUR).toLocaleString()} bars/hr</div>
        <button onClick={fetchPrices} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: "12px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          ↻ Refresh
        </button>
        {lastUpdate && <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Updated {Math.round((new Date() - lastUpdate) / 1000)}s ago</span>}
      </div>

      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 1fr 1fr", padding: "12px 16px", background: "var(--bg4)", borderBottom: "1px solid var(--border)", fontSize: "13px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {cols.map(c => (
            <div key={c.key} style={{ textAlign: c.align, cursor: "pointer", color: sortCol === c.key ? "var(--gold)" : "var(--text-dim)" }} onClick={() => setSortCol(c.key)}>
              {c.label} {sortCol === c.key ? "▼" : ""}
            </div>
          ))}
        </div>

        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 1fr 1fr", padding: "14px 16px", borderBottom: "1px solid var(--border)", gap: "8px" }}>
              {[2, 1, 1, 1, 1].map((_, j) => <div key={j} style={{ height: "16px", background: "var(--bg4)", borderRadius: "4px", opacity: 0.5 }} />)}
            </div>
          ))
        ) : bars.map((b, i) => (
          <div key={b.name} style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr 1fr 1fr", padding: "14px 16px", borderBottom: i < bars.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}
            onMouseOver={e => e.currentTarget.style.background = "var(--bg3)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "14px", color: "var(--text)", fontWeight: 500 }}>{b.name}</span>
              <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                {b.ores.map(o => `${o.qty}x ${o.name}`).join(", ")}{b.coal > 0 ? ` + ${b.coal}x Coal` : ""}
              </span>
            </div>
            <div style={{ textAlign: "right", fontSize: "13px", color: "var(--text-dim)" }}>{b.level}</div>
            <div style={{ textAlign: "right", fontSize: "13px", color: b.profitPerBar >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{formatGP(b.profitPerBar)}</div>
            <div style={{ textAlign: "right", fontSize: "14px", color: b.profitHr >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{formatGP(b.profitHr)}</div>
            <div style={{ textAlign: "right", fontSize: "13px", color: "var(--text-dim)" }}>{Math.round(b.xpHr).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center" }}>
        Prices from OSRS Wiki API · GP/hr assumes ~5,200 bars/hr with coal bag · XP assumes full inventory cycles
      </div>
    </div>
  );
}
