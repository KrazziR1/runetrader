// src/SkillCalc.js
import { useState } from "react";

// XP table - standard OSRS XP per level
function xpForLevel(level) {
  if (level <= 1) return 0;
  let xp = 0;
  for (let i = 1; i < level; i++) {
    xp += Math.floor(i + 300 * Math.pow(2, i / 7));
  }
  return Math.floor(xp / 4);
}

function levelForXp(xp) {
  for (let lvl = 98; lvl >= 1; lvl--) {
    if (xp >= xpForLevel(lvl + 1)) return lvl + 1;
  }
  return 1;
}

const XP_TABLE = Array.from({ length: 127 }, (_, i) => xpForLevel(i + 1));

const SKILLS = [
  { name: "Attack",       icon: "⚔️"  },
  { name: "Strength",     icon: "💪"  },
  { name: "Defence",      icon: "🛡️"  },
  { name: "Ranged",       icon: "🏹"  },
  { name: "Magic",        icon: "🔮"  },
  { name: "Prayer",       icon: "🙏"  },
  { name: "Hitpoints",    icon: "❤️"  },
  { name: "Crafting",     icon: "🧵"  },
  { name: "Fletching",    icon: "🏹"  },
  { name: "Herblore",     icon: "🌿"  },
  { name: "Smithing",     icon: "🔨"  },
  { name: "Mining",       icon: "⛏️"  },
  { name: "Woodcutting",  icon: "🪵"  },
  { name: "Fishing",      icon: "🎣"  },
  { name: "Cooking",      icon: "🍳"  },
  { name: "Firemaking",   icon: "🔥"  },
  { name: "Agility",      icon: "🏃"  },
  { name: "Thieving",     icon: "🗝️"  },
  { name: "Slayer",       icon: "💀"  },
  { name: "Farming",      icon: "🌱"  },
  { name: "Runecraft",    icon: "🔵"  },
  { name: "Construction", icon: "🏠"  },
  { name: "Hunter",       icon: "🦎"  },
];

// Common training methods per skill with XP rates
const METHODS = {
  Attack:      [{ name: "Controlled (Sand Crabs)", xp: 10000 }, { name: "Slash (NMZ)", xp: 90000 }, { name: "Slash (Bandits)", xp: 50000 }],
  Strength:    [{ name: "Sand Crabs", xp: 30000 }, { name: "NMZ (Melee)", xp: 130000 }, { name: "Chinning (MM2)", xp: 200000 }],
  Defence:     [{ name: "Sand Crabs (Def)", xp: 15000 }, { name: "NMZ (Def)", xp: 90000 }, { name: "Defensive Casting", xp: 60000 }],
  Ranged:      [{ name: "Chinning (MM2)", xp: 200000 }, { name: "NMZ Ranged", xp: 100000 }, { name: "Sand Crabs", xp: 20000 }],
  Magic:       [{ name: "Splashing", xp: 7500 }, { name: "High Alch", xp: 78000 }, { name: "Barraging (NPC)", xp: 250000 }],
  Prayer:      [{ name: "Dragon Bones (Altar)", xp: 252 }, { name: "Superior Dragon Bones", xp: 525 }, { name: "Ensouled Heads", xp: 130000 }],
  Hitpoints:   [{ name: "Sand Crabs", xp: 10000 }, { name: "NMZ", xp: 43000 }, { name: "Chinning", xp: 65000 }],
  Crafting:    [{ name: "Cutting Gems", xp: 60000 }, { name: "Battlestaves", xp: 116000 }, { name: "Blow Pipe", xp: 45000 }],
  Fletching:   [{ name: "Stringing Bows", xp: 200000 }, { name: "Cutting Darts", xp: 900000 }, { name: "Amethyst Arrows", xp: 150000 }],
  Herblore:    [{ name: "Potions (Ranarr)", xp: 50000 }, { name: "Overloads (CoX)", xp: 100000 }, { name: "Staminas", xp: 80000 }],
  Smithing:    [{ name: "Blast Furnace (Gold)", xp: 350000 }, { name: "Platebodies (Anvil)", xp: 100000 }, { name: "Blast Furnace (Rune)", xp: 50000 }],
  Mining:      [{ name: "Motherlode Mine", xp: 30000 }, { name: "3-tick Granite", xp: 100000 }, { name: "Amethyst", xp: 25000 }],
  Woodcutting: [{ name: "Teaks (2t)", xp: 120000 }, { name: "Redwoods", xp: 65000 }, { name: "Mahogany (1.5t)", xp: 200000 }],
  Fishing:     [{ name: "Barbarian Fishing", xp: 60000 }, { name: "Karambwan", xp: 90000 }, { name: "Fly Fishing", xp: 30000 }],
  Cooking:     [{ name: "Karambwan", xp: 450000 }, { name: "Wines", xp: 490000 }, { name: "Lobsters/Swordfish", xp: 200000 }],
  Firemaking:  [{ name: "Wintertodt", xp: 100000 }, { name: "Magic Logs", xp: 85000 }, { name: "Redwood Logs", xp: 70000 }],
  Agility:     [{ name: "Seers Rooftop", xp: 50000 }, { name: "Ardougne Rooftop", xp: 62000 }, { name: "Gnome Stronghold", xp: 15000 }],
  Thieving:    [{ name: "Blackjacking", xp: 240000 }, { name: "Pyramid Plunder", xp: 270000 }, { name: "Menaphite Thugs", xp: 250000 }],
  Slayer:      [{ name: "Catacombs Tasks", xp: 30000 }, { name: "Konar Tasks", xp: 35000 }, { name: "Duradel Tasks", xp: 50000 }],
  Farming:     [{ name: "Tree Runs", xp: 50000 }, { name: "Herb Runs", xp: 20000 }, { name: "Tithe Farm", xp: 100000 }],
  Runecraft:   [{ name: "Lava Runes (2t)", xp: 75000 }, { name: "Blood Runes (GOTR)", xp: 40000 }, { name: "ZMI Altar", xp: 55000 }],
  Construction:[{ name: "Oak Dungeon Doors", xp: 400000 }, { name: "Mahogany Tables", xp: 900000 }, { name: "Oak Larders", xp: 600000 }],
  Hunter:      [{ name: "Maniacal Monkeys", xp: 130000 }, { name: "Black Chins", xp: 200000 }, { name: "Herbiboar", xp: 150000 }],
};

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Math.round(n).toLocaleString();
}

function formatTime(hours) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
  const d = Math.floor(hours / 24);
  const h = Math.floor(hours % 24);
  return `${d}d ${h}h`;
}

export default function SkillCalc() {
  const [selectedSkill, setSelectedSkill] = useState("Attack");
  const [currentInput, setCurrentInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [inputMode, setInputMode] = useState("level"); // "level" or "xp"
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [customXpHr, setCustomXpHr] = useState("");

  const skill = SKILLS.find(s => s.name === selectedSkill);
  const methods = METHODS[selectedSkill] || [];

  const currentVal = parseInt(currentInput) || 0;
  const targetVal = parseInt(targetInput) || 0;

  let currentXp = 0, targetXp = 0;
  if (inputMode === "level") {
    currentXp = currentVal >= 1 && currentVal <= 126 ? xpForLevel(currentVal) : 0;
    targetXp = targetVal >= 1 && targetVal <= 126 ? xpForLevel(targetVal) : 0;
  } else {
    currentXp = currentVal;
    targetXp = targetVal;
  }

  const xpNeeded = Math.max(0, targetXp - currentXp);
  const currentLevel = levelForXp(currentXp);
  const targetLevel = levelForXp(targetXp);
  const xpHr = parseInt(customXpHr) || methods[selectedMethod]?.xp || 0;
  const hoursNeeded = xpHr > 0 ? xpNeeded / xpHr : 0;

  // XP progress bar within current level
  const levelXpStart = xpForLevel(currentLevel);
  const levelXpEnd = xpForLevel(Math.min(currentLevel + 1, 127));
  const levelProgress = levelXpEnd > levelXpStart
    ? ((currentXp - levelXpStart) / (levelXpEnd - levelXpStart)) * 100
    : 100;

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {/* Skill picker */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "160px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Select Skill</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "500px", overflowY: "auto" }}>
          {SKILLS.map(s => (
            <button key={s.name} onClick={() => { setSelectedSkill(s.name); setSelectedMethod(0); }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${selectedSkill === s.name ? "var(--gold-dim)" : "transparent"}`, background: selectedSkill === s.name ? "rgba(201,168,76,0.1)" : "transparent", color: selectedSkill === s.name ? "var(--gold)" : "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left", transition: "all 0.15s" }}
              onMouseOver={e => { if (selectedSkill !== s.name) e.currentTarget.style.background = "var(--bg3)"; }}
              onMouseOut={e => { if (selectedSkill !== s.name) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: "16px", width: "20px" }}>{s.icon}</span>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Calculator */}
      <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontFamily: "Cinzel, serif", fontSize: "18px", fontWeight: 700, color: "var(--gold)" }}>
          {skill?.icon} {selectedSkill}
        </div>

        {/* Input mode toggle */}
        <div style={{ display: "flex", gap: "8px" }}>
          {["level", "xp"].map(mode => (
            <button key={mode} onClick={() => setInputMode(mode)}
              style={{ padding: "5px 14px", borderRadius: "6px", border: `1px solid ${inputMode === mode ? "var(--gold-dim)" : "var(--border)"}`, background: inputMode === mode ? "rgba(201,168,76,0.1)" : "transparent", color: inputMode === mode ? "var(--gold)" : "var(--text-dim)", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif", textTransform: "capitalize" }}>
              {mode}
            </button>
          ))}
        </div>

        {/* Current / Target inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { label: `Current ${inputMode === "level" ? "Level" : "XP"}`, val: currentInput, set: setCurrentInput, placeholder: inputMode === "level" ? "1–126" : "0" },
            { label: `Target ${inputMode === "level" ? "Level" : "XP"}`,  val: targetInput,  set: setTargetInput,  placeholder: inputMode === "level" ? "2–126" : "83" },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
              <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                style={{ background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", color: "var(--text)", fontSize: "14px", fontFamily: "Inter, sans-serif", outline: "none", width: "100%", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "var(--gold-dim)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
          ))}
        </div>

        {/* Results */}
        {xpNeeded > 0 && (
          <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {[
              { label: "XP Needed",     value: formatNum(xpNeeded)  },
              { label: "Levels to Gain",value: Math.max(0, targetLevel - currentLevel) },
              { label: "Time Needed",   value: hoursNeeded > 0 ? formatTime(hoursNeeded) : "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                <div style={{ fontFamily: "Cinzel, serif", fontSize: "20px", fontWeight: 700, color: "var(--gold)" }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Current level progress */}
        {currentXp > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-dim)" }}>
              <span>Level {currentLevel} progress</span>
              <span>{Math.round(levelProgress)}%</span>
            </div>
            <div style={{ background: "var(--bg4)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${levelProgress}%`, background: "linear-gradient(90deg, var(--gold-dim), var(--gold))", borderRadius: "4px", transition: "width 0.3s ease" }} />
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
              {formatNum(currentXp - levelXpStart)} / {formatNum(levelXpEnd - levelXpStart)} XP this level
              {levelXpEnd > currentXp && ` · ${formatNum(levelXpEnd - currentXp)} XP to level ${currentLevel + 1}`}
            </div>
          </div>
        )}

        {/* Training methods */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Training Method</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {methods.map((m, i) => (
              <button key={m.name} onClick={() => { setSelectedMethod(i); setCustomXpHr(""); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "8px", border: `1px solid ${selectedMethod === i && !customXpHr ? "var(--gold-dim)" : "var(--border)"}`, background: selectedMethod === i && !customXpHr ? "rgba(201,168,76,0.08)" : "transparent", color: "var(--text)", fontSize: "13px", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.15s", textAlign: "left" }}>
                <span>{m.name}</span>
                <span style={{ color: "var(--gold)", fontWeight: 600 }}>{formatNum(m.xp)} XP/hr</span>
              </button>
            ))}

            {/* Custom XP rate */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "8px", border: `1px solid ${customXpHr ? "var(--gold-dim)" : "var(--border)"}`, background: customXpHr ? "rgba(201,168,76,0.08)" : "transparent" }}>
              <span style={{ fontSize: "13px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>Custom:</span>
              <input value={customXpHr} onChange={e => setCustomXpHr(e.target.value)} placeholder="Enter XP/hr"
                style={{ background: "transparent", border: "none", color: "var(--text)", fontSize: "13px", fontFamily: "Inter, sans-serif", outline: "none", flex: 1 }} />
              {customXpHr && <span style={{ fontSize: "12px", color: "var(--gold)", whiteSpace: "nowrap" }}>XP/hr</span>}
            </div>
          </div>
        </div>

        {/* XP milestones */}
        {currentXp > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.5px" }}>XP Milestones</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {[50, 60, 70, 80, 90, 99, 120, 126].filter(lvl => lvl > currentLevel).slice(0, 8).map(lvl => {
                const xpToLvl = Math.max(0, xpForLevel(lvl) - currentXp);
                const hrs = xpHr > 0 ? xpToLvl / xpHr : 0;
                return (
                  <div key={lvl} style={{ background: "var(--bg4)", borderRadius: "8px", padding: "10px", display: "flex", flexDirection: "column", gap: "4px", border: lvl === 99 ? "1px solid var(--gold-dim)" : "1px solid var(--border)" }}>
                    <div style={{ fontFamily: "Cinzel, serif", fontSize: "18px", fontWeight: 700, color: lvl === 99 ? "var(--gold)" : "var(--text)" }}>{lvl}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{formatNum(xpToLvl)} XP</div>
                    {hrs > 0 && <div style={{ fontSize: "11px", color: "var(--gold-dim)" }}>{formatTime(hrs)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
