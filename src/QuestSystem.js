// â\u201D\u20ACâ\u201D\u20AC QuestSystem.js â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
// Daily quest generation, progress tracking, and reward calculation.
// Pure logic â\u20AC\u201D no React, no side effects.

// â\u201D\u20ACâ\u201D\u20AC Quest reward tables â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
const QUEST_REWARDS = {
  easy:   { xp: 500,   coins: 10 },
  medium: { xp: 1500,  coins: 25 },
  hard:   { xp: 3500,  coins: 60 },
};

// â\u201D\u20ACâ\u201D\u20AC Quest templates â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
// Each template has a generator that takes a seed + user context and
// produces a concrete quest with a target and completion check.

const QUEST_TEMPLATES = [

  // â\u201D\u20ACâ\u201D\u20AC PROFIT QUEST â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
  {
    type: "profit_single",
    difficulty: "easy",
    generate: (seed) => {
      const targets = [50_000, 75_000, 100_000, 150_000, 200_000];
      const target = targets[seed % targets.length];
      return {
        id: `profit_single_${target}`,
        type: "profit_single",
        difficulty: "easy",
        title: "Profitable Trade",
        desc: `Make ${fmtGP(target)} gp profit on a single flip`,
        target,
        progress: 0,
        completed: false,
        emoji: "ð\u0178\u2019°",
      };
    },
    check: (quest, { lastFlipProfit }) =>
      (lastFlipProfit || 0) >= quest.target,
  },

  {
    type: "profit_single_med",
    difficulty: "medium",
    generate: (seed) => {
      const targets = [500_000, 750_000, 1_000_000];
      const target = targets[seed % targets.length];
      return {
        id: `profit_single_med_${target}`,
        type: "profit_single_med",
        difficulty: "medium",
        title: "Big Earner",
        desc: `Make ${fmtGP(target)} gp profit on a single flip`,
        target,
        progress: 0,
        completed: false,
        emoji: "ð\u0178\u201C\u02C6",
      };
    },
    check: (quest, { lastFlipProfit }) =>
      (lastFlipProfit || 0) >= quest.target,
  },

  {
    type: "profit_single_hard",
    difficulty: "hard",
    generate: (seed) => {
      const targets = [2_000_000, 5_000_000, 10_000_000];
      const target = targets[seed % targets.length];
      return {
        id: `profit_single_hard_${target}`,
        type: "profit_single_hard",
        difficulty: "hard",
        title: "High Roller",
        desc: `Make ${fmtGP(target)} gp profit on a single flip`,
        target,
        progress: 0,
        completed: false,
        emoji: "ð\u0178\u2019\u017D",
      };
    },
    check: (quest, { lastFlipProfit }) =>
      (lastFlipProfit || 0) >= quest.target,
  },

  // â\u201D\u20ACâ\u201D\u20AC FLIP COUNT QUEST â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
  {
    type: "flip_count",
    difficulty: "easy",
    generate: (seed) => {
      const targets = [1, 2, 3];
      const target = targets[seed % targets.length];
      return {
        id: `flip_count_${target}`,
        type: "flip_count",
        difficulty: "easy",
        title: target === 1 ? "First Flip" : `${target} Flips Today`,
        desc: `Complete ${target} flip${target > 1 ? "s" : ""} today`,
        target,
        progress: 0,
        completed: false,
        emoji: "â\u0161¡",
      };
    },
    check: (quest, { todayFlipCount }) =>
      (todayFlipCount || 0) >= quest.target,
    progressValue: (quest, { todayFlipCount }) =>
      Math.min(todayFlipCount || 0, quest.target),
  },

  {
    type: "flip_count_med",
    difficulty: "medium",
    generate: (seed) => {
      const targets = [5, 7, 10];
      const target = targets[seed % targets.length];
      return {
        id: `flip_count_med_${target}`,
        type: "flip_count_med",
        difficulty: "medium",
        title: "Busy Merchant",
        desc: `Complete ${target} flips today`,
        target,
        progress: 0,
        completed: false,
        emoji: "ð\u0178\u201D\u201E",
      };
    },
    check: (quest, { todayFlipCount }) =>
      (todayFlipCount || 0) >= quest.target,
    progressValue: (quest, { todayFlipCount }) =>
      Math.min(todayFlipCount || 0, quest.target),
  },

  // â\u201D\u20ACâ\u201D\u20AC SPEED QUEST â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
  {
    type: "speed_flip",
    difficulty: "medium",
    generate: () => ({
      id: "speed_flip_30",
      type: "speed_flip",
      difficulty: "medium",
      title: "Early Bird",
      desc: "Complete a profitable flip within 30 minutes of logging in",
      target: 30,       // minutes
      progress: 0,
      completed: false,
      emoji: "â±ï¸",
      startedAt: Date.now(),
    }),
    check: (quest, { lastFlipProfit }) => {
      if ((lastFlipProfit || 0) <= 0) return false;
      const elapsed = (Date.now() - (quest.startedAt || Date.now())) / 60000;
      return elapsed <= 30;
    },
  },

  // â\u201D\u20ACâ\u201D\u20AC NEW ITEM QUEST â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
  {
    type: "new_item",
    difficulty: "medium",
    generate: () => ({
      id: "new_item",
      type: "new_item",
      difficulty: "medium",
      title: "Explorer",
      desc: "Profitably flip an item you've never flipped before",
      target: 1,
      progress: 0,
      completed: false,
      emoji: "ð\u0178\u2014ºï¸",
    }),
    check: (quest, { lastFlipItem, flipsLog }) => {
      if (!lastFlipItem) return false;
      // Count how many times this item appears in historical flips (excluding today's)
      const today = new Date().toISOString().slice(0, 10);
      const historical = (flipsLog || []).filter(f =>
        f.status !== "open" &&
        f.item === lastFlipItem &&
        (f.date || "").slice(0, 10) < today
      );
      return historical.length === 0;
    },
  },

  // â\u201D\u20ACâ\u201D\u20AC TOTAL GP QUEST â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
  {
    type: "total_gp",
    difficulty: "hard",
    generate: (seed) => {
      const targets = [5_000_000, 10_000_000, 20_000_000];
      const target = targets[seed % targets.length];
      return {
        id: `total_gp_${target}`,
        type: "total_gp",
        difficulty: "hard",
        title: "Daily Grind",
        desc: `Make ${fmtGP(target)} total GP profit today`,
        target,
        progress: 0,
        completed: false,
        emoji: "ð\u0178\u2020",
      };
    },
    check: (quest, { todayTotalProfit }) =>
      (todayTotalProfit || 0) >= quest.target,
    progressValue: (quest, { todayTotalProfit }) =>
      Math.min(todayTotalProfit || 0, quest.target),
  },
];

// â\u201D\u20ACâ\u201D\u20AC Format GP helper (no React dependency) â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
function fmtGP(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + "k";
  return n.toLocaleString();
}

// â\u201D\u20ACâ\u201D\u20AC Seeded random (deterministic per user+date) â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
function seededRand(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// â\u201D\u20ACâ\u201D\u20AC Generate today's 3 quests for a user â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
// Deterministic â\u20AC\u201D same user gets same quests all day.
// One easy, one medium, one hard â\u20AC\u201D guaranteed variety.
export function generateDailyQuests(userId, date = new Date().toISOString().slice(0, 10)) {
  // Build seed from userId + date
  const seedStr = userId + date;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const rand = seededRand(Math.abs(hash));

  const easy   = QUEST_TEMPLATES.filter(t => t.difficulty === "easy");
  const medium = QUEST_TEMPLATES.filter(t => t.difficulty === "medium");
  const hard   = QUEST_TEMPLATES.filter(t => t.difficulty === "hard");

  const pickFrom = (pool, rand) => pool[Math.floor(rand() * pool.length)];

  const easyTemplate   = pickFrom(easy,   rand);
  const mediumTemplate = pickFrom(medium, rand);
  const hardTemplate   = pickFrom(hard,   rand);

  const seed = Math.abs(hash);
  return [
    easyTemplate.generate(seed),
    mediumTemplate.generate(seed + 1),
    hardTemplate.generate(seed + 2),
  ];
}

// â\u201D\u20ACâ\u201D\u20AC Update quest progress after a flip â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
// Returns updated quests array and list of newly completed quest ids.
export function updateQuestProgress(quests, context) {
  if (!quests || quests.length === 0) return { quests, newlyCompleted: [] };

  const newlyCompleted = [];
  const updated = quests.map(quest => {
    if (quest.completed) return quest;

    const template = QUEST_TEMPLATES.find(t => t.type === quest.type);
    if (!template) return quest;

    const nowComplete = template.check(quest, context);
    const progressVal = template.progressValue
      ? template.progressValue(quest, context)
      : (nowComplete ? quest.target : quest.progress);

    if (nowComplete && !quest.completed) {
      newlyCompleted.push(quest.id);
      return { ...quest, completed: true, progress: quest.target };
    }
    return { ...quest, progress: progressVal };
  });

  return { quests: updated, newlyCompleted };
}

// â\u201D\u20ACâ\u201D\u20AC Calculate total rewards for completed quests â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
export function calcQuestRewards(quest) {
  return QUEST_REWARDS[quest.difficulty] || QUEST_REWARDS.easy;
}

// â\u201D\u20ACâ\u201D\u20AC Get today's date string â\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20ACâ\u201D\u20AC
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
