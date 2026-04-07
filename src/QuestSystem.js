// -- QuestSystem.js --------------------------------------------------------
// Daily quest generation, progress tracking, and reward calculation.
// Pure logic - no React, no side effects.

// -- Quest reward tables ---------------------------------------------------
const QUEST_REWARDS = {
  easy:   { xp: 500,   coins: 10 },
  medium: { xp: 1500,  coins: 25 },
  hard:   { xp: 3500,  coins: 60 },
};

// -- Quest templates -------------------------------------------------------
const QUEST_TEMPLATES = [

  // -- PROFIT QUEST ---------------------------------------------------------
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
        emoji: "\uD83D\uDCB0",
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
        emoji: "\uD83D\uDCC8",
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
        emoji: "\uD83D\uDC8E",
      };
    },
    check: (quest, { lastFlipProfit }) =>
      (lastFlipProfit || 0) >= quest.target,
  },

  // -- FLIP COUNT QUEST -----------------------------------------------------
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
        emoji: "\u26A1",
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
        emoji: "\uD83D\uDD04",
      };
    },
    check: (quest, { todayFlipCount }) =>
      (todayFlipCount || 0) >= quest.target,
    progressValue: (quest, { todayFlipCount }) =>
      Math.min(todayFlipCount || 0, quest.target),
  },

  // -- SPEED QUEST ----------------------------------------------------------
  {
    type: "speed_flip",
    difficulty: "medium",
    generate: () => ({
      id: "speed_flip_30",
      type: "speed_flip",
      difficulty: "medium",
      title: "Early Bird",
      desc: "Complete a profitable flip within 30 minutes of logging in",
      target: 30,
      progress: 0,
      completed: false,
      emoji: "\u23F1\uFE0F",
      startedAt: Date.now(),
    }),
    check: (quest, { lastFlipProfit }) => {
      if ((lastFlipProfit || 0) <= 0) return false;
      const elapsed = (Date.now() - (quest.startedAt || Date.now())) / 60000;
      return elapsed <= 30;
    },
  },

  // -- NEW ITEM QUEST -------------------------------------------------------
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
      emoji: "\uD83D\uDDFA\uFE0F",
    }),
    check: (quest, { lastFlipItem, flipsLog }) => {
      if (!lastFlipItem) return false;
      const today = new Date().toISOString().slice(0, 10);
      const historical = (flipsLog || []).filter(f =>
        f.status !== "open" &&
        f.item === lastFlipItem &&
        (f.date || "").slice(0, 10) < today
      );
      return historical.length === 0;
    },
  },

  // -- TOTAL GP QUEST -------------------------------------------------------
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
        emoji: "\uD83C\uDFC6",
      };
    },
    check: (quest, { todayTotalProfit }) =>
      (todayTotalProfit || 0) >= quest.target,
    progressValue: (quest, { todayTotalProfit }) =>
      Math.min(todayTotalProfit || 0, quest.target),
  },
];

// -- Format GP helper -------------------------------------------------------
function fmtGP(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + "k";
  return n.toLocaleString();
}

// -- Seeded random ----------------------------------------------------------
function seededRand(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// -- Generate today's 3 quests for a user ----------------------------------
export function generateDailyQuests(userId, date = new Date().toISOString().slice(0, 10)) {
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

// -- Update quest progress after a flip ------------------------------------
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

// -- Calculate total rewards for completed quests --------------------------
export function calcQuestRewards(quest) {
  return QUEST_REWARDS[quest.difficulty] || QUEST_REWARDS.easy;
}

// -- Get today's date string -----------------------------------------------
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
