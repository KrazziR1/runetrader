// â”€â”€ QuestSystem.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Daily quest generation, progress tracking, and reward calculation.
// Pure logic â€” no React, no side effects.

// â”€â”€ Quest reward tables â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const QUEST_REWARDS = {
  easy:   { xp: 500,   coins: 10 },
  medium: { xp: 1500,  coins: 25 },
  hard:   { xp: 3500,  coins: 60 },
};

// â”€â”€ Quest templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each template has a generator that takes a seed + user context and
// produces a concrete quest with a target and completion check.

const QUEST_TEMPLATES = [

  // â”€â”€ PROFIT QUEST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        emoji: "ðŸ’°",
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
        emoji: "ðŸ“ˆ",
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
        emoji: "ðŸ’Ž",
      };
    },
    check: (quest, { lastFlipProfit }) =>
      (lastFlipProfit || 0) >= quest.target,
  },

  // â”€â”€ FLIP COUNT QUEST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        emoji: "âš¡",
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
        emoji: "ðŸ”„",
      };
    },
    check: (quest, { todayFlipCount }) =>
      (todayFlipCount || 0) >= quest.target,
    progressValue: (quest, { todayFlipCount }) =>
      Math.min(todayFlipCount || 0, quest.target),
  },

  // â”€â”€ SPEED QUEST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ NEW ITEM QUEST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      emoji: "ðŸ—ºï¸",
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

  // â”€â”€ TOTAL GP QUEST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        emoji: "ðŸ†",
      };
    },
    check: (quest, { todayTotalProfit }) =>
      (todayTotalProfit || 0) >= quest.target,
    progressValue: (quest, { todayTotalProfit }) =>
      Math.min(todayTotalProfit || 0, quest.target),
  },
];

// â”€â”€ Format GP helper (no React dependency) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fmtGP(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + "k";
  return n.toLocaleString();
}

// â”€â”€ Seeded random (deterministic per user+date) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function seededRand(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// â”€â”€ Generate today's 3 quests for a user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Deterministic â€” same user gets same quests all day.
// One easy, one medium, one hard â€” guaranteed variety.
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

// â”€â”€ Update quest progress after a flip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Calculate total rewards for completed quests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function calcQuestRewards(quest) {
  return QUEST_REWARDS[quest.difficulty] || QUEST_REWARDS.easy;
}

// â”€â”€ Get today's date string â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
