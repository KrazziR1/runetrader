// -- XPSystem.js ----------------------------------------------------------
// OSRS-authentic XP curve, levels 1-99, titles, achievements, celebrations.
// All logic is pure - no React, no side effects. Import into App.js.

// -- OSRS XP Table (exact formula) ----------------------------------------
function buildXPTable() {
  const table = [0, 0];
  let points = 0;
  for (let lvl = 1; lvl < 99; lvl++) {
    points += Math.floor(lvl / 4 + 300 * Math.pow(2, lvl / 7));
    table.push(Math.floor(points));
  }
  return table;
}

export const XP_TABLE = buildXPTable();

// -- Get level from total XP -----------------------------------------------
export function xpToLevel(totalXP) {
  for (let lvl = 98; lvl >= 1; lvl--) {
    if (totalXP >= XP_TABLE[lvl]) return lvl;
  }
  return 1;
}

// -- XP progress within current level (0-1) --------------------------------
export function xpProgress(totalXP) {
  const lvl = xpToLevel(totalXP);
  if (lvl >= 99) return 1;
  const current = totalXP - XP_TABLE[lvl];
  const needed  = XP_TABLE[lvl + 1] - XP_TABLE[lvl];
  return Math.min(current / needed, 1);
}

// -- XP to next level -------------------------------------------------------
export function xpToNextLevel(totalXP) {
  const lvl = xpToLevel(totalXP);
  if (lvl >= 99) return 0;
  return XP_TABLE[lvl + 1] - totalXP;
}

// -- Calculate XP earned from a flip ----------------------------------------
export function calcFlipXP(profit, isFirstFlipOfDay = false) {
  if (!profit || profit <= 0) return 0;
  const base = Math.floor(profit / 500);
  return isFirstFlipOfDay ? Math.floor(base * 1.5) : base;
}

// -- Level titles -----------------------------------------------------------
export function getLevelTitle(level) {
  if (level >= 99) return { title: "Max Cape",           emoji: "\uD83C\uDF93", color: "#c9a84c" };
  if (level >= 91) return { title: "Tycoon",             emoji: "\uD83D\uDC51", color: "#c9a84c" };
  if (level >= 81) return { title: "Gold Baron",         emoji: "\uD83D\uDC8E", color: "#e8c96a" };
  if (level >= 71) return { title: "Wealth Architect",   emoji: "\uD83C\uDFDB\uFE0F", color: "#e8c96a" };
  if (level >= 61) return { title: "Market Manipulator", emoji: "\uD83D\uDCCA", color: "#2ecc71" };
  if (level >= 51) return { title: "GE Master",          emoji: "\u2694\uFE0F", color: "#2ecc71" };
  if (level >= 41) return { title: "Arbitrageur",        emoji: "\u26A1", color: "#3498db" };
  if (level >= 31) return { title: "Commodity Broker",   emoji: "\uD83D\uDCC8", color: "#3498db" };
  if (level >= 21) return { title: "GE Trader",          emoji: "\uD83E\uDE99", color: "#7a8a9a" };
  if (level >= 11) return { title: "Market Watcher",     emoji: "\uD83D\uDC40", color: "#7a8a9a" };
  if (level >= 5)  return { title: "Merchant Apprentice",emoji: "\uD83D\uDCE6", color: "#7a8a9a" };
  return                  { title: "Peasant",             emoji: "\uD83C\uDF3E", color: "#4a5a6a" };
}

// -- Profit celebration tier ------------------------------------------------
export function getCelebrationTier(profit) {
  if (profit >= 100_000_000) return { tier: "legendary", label: "LEGENDARY FLIP", color: "#c9a84c", emoji: "\uD83D\uDC09", particles: 120 };
  if (profit >= 10_000_000)  return { tier: "epic",      label: "EPIC FLIP",      color: "#9b59b6", emoji: "\uD83D\uDC8E", particles: 80 };
  if (profit >= 1_000_000)   return { tier: "great",     label: "GREAT FLIP",     color: "#2ecc71", emoji: "\uD83D\uDD25", particles: 50 };
  if (profit >= 100_000)     return { tier: "nice",      label: "NICE FLIP",      color: "#3498db", emoji: "\uD83D\uDCC8", particles: 25 };
  return null;
}

// -- Achievement definitions ------------------------------------------------
export const ACHIEVEMENTS = [
  {
    id: "first_blood",
    name: "First Blood",
    desc: "Complete your first profitable flip",
    emoji: "\uD83E\uDE99",
    check: ({ flipsLog }) => flipsLog.some(f => f.status !== "open" && (f.totalProfit || 0) > 0),
  },
  {
    id: "first_million",
    name: "First Million",
    desc: "Make 1,000,000 gp profit on a single flip",
    emoji: "\uD83D\uDCB0",
    check: ({ lastFlipProfit }) => (lastFlipProfit || 0) >= 1_000_000,
  },
  {
    id: "whale",
    name: "Whale",
    desc: "Make 10,000,000 gp profit on a single flip",
    emoji: "\uD83D\uDC0B",
    check: ({ lastFlipProfit }) => (lastFlipProfit || 0) >= 10_000_000,
  },
  {
    id: "on_a_roll",
    name: "On a Roll",
    desc: "Complete 5 profitable flips in a row",
    emoji: "\uD83D\uDD25",
    check: ({ flipsLog }) => {
      const closed = flipsLog.filter(f => f.status !== "open").slice(0, 5);
      return closed.length >= 5 && closed.every(f => (f.totalProfit || 0) > 0);
    },
  },
  {
    id: "level_10",
    name: "Getting Started",
    desc: "Reach level 10",
    emoji: "\uD83D\uDCC8",
    check: ({ level }) => level >= 10,
  },
  {
    id: "level_50",
    name: "Veteran Trader",
    desc: "Reach level 50",
    emoji: "\u2694\uFE0F",
    check: ({ level }) => level >= 50,
  },
  {
    id: "max_cape",
    name: "Max Cape",
    desc: "Reach level 99 - the pinnacle of GE mastery",
    emoji: "\uD83C\uDF93",
    check: ({ level }) => level >= 99,
  },
  {
    id: "dedicated",
    name: "Dedicated",
    desc: "Log in 7 days in a row",
    emoji: "\uD83D\uDCC5",
    check: ({ loginStreak }) => (loginStreak || 0) >= 7,
  },
  {
    id: "diversified",
    name: "Diversified",
    desc: "Flip 10 different items",
    emoji: "\uD83D\uDDC2\uFE0F",
    check: ({ flipsLog }) => {
      const items = new Set(flipsLog.filter(f => f.status !== "open").map(f => f.item));
      return items.size >= 10;
    },
  },
  {
    id: "centurion",
    name: "Centurion",
    desc: "Complete 100 flips",
    emoji: "\uD83C\uDFC6",
    check: ({ flipsLog }) => flipsLog.filter(f => f.status !== "open").length >= 100,
  },
];

// -- Check which new achievements were just unlocked ------------------------
export function checkNewAchievements(context, alreadyUnlocked = []) {
  return ACHIEVEMENTS.filter(a => {
    if (alreadyUnlocked.includes(a.id)) return false;
    try { return a.check(context); } catch { return false; }
  });
}
