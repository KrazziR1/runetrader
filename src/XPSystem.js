// â”€â”€ XPSystem.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// OSRS-authentic XP curve, levels 1â€“99, titles, achievements, celebrations.
// All logic is pure â€” no React, no side effects. Import into App.js.

// â”€â”€ OSRS XP Table (exact formula) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Level N requires sum of floor(x/4 + 300 * 2^(x/7)) for x = 1 to N-1
function buildXPTable() {
  const table = [0, 0]; // index 0 unused, level 1 = 0 XP
  let points = 0;
  for (let lvl = 1; lvl < 99; lvl++) {
    points += Math.floor(lvl / 4 + 300 * Math.pow(2, lvl / 7));
    table.push(Math.floor(points));
  }
  return table; // table[N] = XP required to reach level N
}

export const XP_TABLE = buildXPTable();
// XP_TABLE[1]  = 0
// XP_TABLE[10] = 1,154
// XP_TABLE[50] = 101,333
// XP_TABLE[99] = 13,034,431

// â”€â”€ Get level from total XP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function xpToLevel(totalXP) {
  for (let lvl = 98; lvl >= 1; lvl--) {
    if (totalXP >= XP_TABLE[lvl]) return lvl;
  }
  return 1;
}

// â”€â”€ XP progress within current level (0â€“1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function xpProgress(totalXP) {
  const lvl = xpToLevel(totalXP);
  if (lvl >= 99) return 1;
  const current = totalXP - XP_TABLE[lvl];
  const needed  = XP_TABLE[lvl + 1] - XP_TABLE[lvl];
  return Math.min(current / needed, 1);
}

// â”€â”€ XP to next level â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function xpToNextLevel(totalXP) {
  const lvl = xpToLevel(totalXP);
  if (lvl >= 99) return 0;
  return XP_TABLE[lvl + 1] - totalXP;
}

// â”€â”€ Calculate XP earned from a flip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Base: profit / 500 (1M profit = 2,000 XP)
// First flip of the day: 1.5Ã— multiplier
// Minimum: 0 (never penalise a loss)
export function calcFlipXP(profit, isFirstFlipOfDay = false) {
  if (!profit || profit <= 0) return 0;
  const base = Math.floor(profit / 500);
  return isFirstFlipOfDay ? Math.floor(base * 1.5) : base;
}

// â”€â”€ Level titles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getLevelTitle(level) {
  if (level >= 99) return { title: "Max Cape",          emoji: "ðŸŽ“", color: "#c9a84c" };
  if (level >= 91) return { title: "Tycoon",            emoji: "ðŸ‘‘", color: "#c9a84c" };
  if (level >= 81) return { title: "Gold Baron",        emoji: "ðŸ’Ž", color: "#e8c96a" };
  if (level >= 71) return { title: "Wealth Architect",  emoji: "ðŸ›ï¸", color: "#e8c96a" };
  if (level >= 61) return { title: "Market Manipulator",emoji: "ðŸ“Š", color: "#2ecc71" };
  if (level >= 51) return { title: "GE Master",         emoji: "âš”ï¸", color: "#2ecc71" };
  if (level >= 41) return { title: "Arbitrageur",       emoji: "âš¡", color: "#3498db" };
  if (level >= 31) return { title: "Commodity Broker",  emoji: "ðŸ“ˆ", color: "#3498db" };
  if (level >= 21) return { title: "GE Trader",         emoji: "ðŸª™", color: "#7a8a9a" };
  if (level >= 11) return { title: "Market Watcher",    emoji: "ðŸ‘€", color: "#7a8a9a" };
  if (level >= 5)  return { title: "Merchant Apprentice",emoji: "ðŸ“¦", color: "#7a8a9a" };
  return                  { title: "Peasant",            emoji: "ðŸŒ¾", color: "#4a5a6a" };
}

// â”€â”€ Profit celebration tier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getCelebrationTier(profit) {
  if (profit >= 100_000_000) return { tier: "legendary", label: "LEGENDARY FLIP", color: "#c9a84c", emoji: "ðŸ‰", particles: 120 };
  if (profit >= 10_000_000)  return { tier: "epic",      label: "EPIC FLIP",      color: "#9b59b6", emoji: "ðŸ’Ž", particles: 80 };
  if (profit >= 1_000_000)   return { tier: "great",     label: "GREAT FLIP",     color: "#2ecc71", emoji: "ðŸ”¥", particles: 50 };
  if (profit >= 100_000)     return { tier: "nice",      label: "NICE FLIP",      color: "#3498db", emoji: "ðŸ“ˆ", particles: 25 };
  return null;
}

// â”€â”€ Achievement definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ACHIEVEMENTS = [
  {
    id: "first_blood",
    name: "First Blood",
    desc: "Complete your first profitable flip",
    emoji: "ðŸª™",
    check: ({ flipsLog }) => flipsLog.some(f => f.status !== "open" && (f.totalProfit || 0) > 0),
  },
  {
    id: "first_million",
    name: "First Million",
    desc: "Make 1,000,000 gp profit on a single flip",
    emoji: "ðŸ’°",
    check: ({ lastFlipProfit }) => (lastFlipProfit || 0) >= 1_000_000,
  },
  {
    id: "whale",
    name: "Whale",
    desc: "Make 10,000,000 gp profit on a single flip",
    emoji: "ðŸ‹",
    check: ({ lastFlipProfit }) => (lastFlipProfit || 0) >= 10_000_000,
  },
  {
    id: "on_a_roll",
    name: "On a Roll",
    desc: "Complete 5 profitable flips in a row",
    emoji: "ðŸ”¥",
    check: ({ flipsLog }) => {
      const closed = flipsLog.filter(f => f.status !== "open").slice(0, 5);
      return closed.length >= 5 && closed.every(f => (f.totalProfit || 0) > 0);
    },
  },
  {
    id: "level_10",
    name: "Getting Started",
    desc: "Reach level 10",
    emoji: "ðŸ“ˆ",
    check: ({ level }) => level >= 10,
  },
  {
    id: "level_50",
    name: "Veteran Trader",
    desc: "Reach level 50",
    emoji: "âš”ï¸",
    check: ({ level }) => level >= 50,
  },
  {
    id: "max_cape",
    name: "Max Cape",
    desc: "Reach level 99 â€” the pinnacle of GE mastery",
    emoji: "ðŸŽ“",
    check: ({ level }) => level >= 99,
  },
  {
    id: "dedicated",
    name: "Dedicated",
    desc: "Log in 7 days in a row",
    emoji: "ðŸ“…",
    check: ({ loginStreak }) => (loginStreak || 0) >= 7,
  },
  {
    id: "diversified",
    name: "Diversified",
    desc: "Flip 10 different items",
    emoji: "ðŸ—‚ï¸",
    check: ({ flipsLog }) => {
      const items = new Set(flipsLog.filter(f => f.status !== "open").map(f => f.item));
      return items.size >= 10;
    },
  },
  {
    id: "centurion",
    name: "Centurion",
    desc: "Complete 100 flips",
    emoji: "ðŸ†",
    check: ({ flipsLog }) => flipsLog.filter(f => f.status !== "open").length >= 100,
  },
];

// â”€â”€ Check which new achievements were just unlocked â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function checkNewAchievements(context, alreadyUnlocked = []) {
  return ACHIEVEMENTS.filter(a => {
    if (alreadyUnlocked.includes(a.id)) return false;
    try { return a.check(context); } catch { return false; }
  });
}
