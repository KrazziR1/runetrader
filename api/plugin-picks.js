import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const WIKI_URL = "https://prices.runescape.wiki/api/v1/osrs/latest";
const MAPPING_URL = "https://prices.runescape.wiki/api/v1/osrs/mapping";
const USER_AGENT = "RuneTrader GE Sync Plugin - runetrader.gg";

// Cache wiki data for 30 seconds
let wikiCache = null;
let wikiCacheTime = 0;
let mappingCache = null;

// ── Score function (mirrors App.js getScore) ──────────────────────────────────
function getScore(margin, volume, roi, buyLimit, lastTradeTime) {
  if (margin <= 0 || volume < 200) return 0;
  const nowSec = Date.now() / 1000;
  if (lastTradeTime && (nowSec - lastTradeTime) > 3600) return 0;

  const limit = buyLimit > 0 ? buyLimit : 500;
  const marketPer4hr = volume / 6;
  let expectedFill;
  if      (volume >= 500_000) expectedFill = Math.min(limit, marketPer4hr);
  else if (volume >= 100_000) expectedFill = Math.min(limit, marketPer4hr * 0.6);
  else if (volume >= 20_000)  expectedFill = Math.min(limit, marketPer4hr * 0.2);
  else if (volume >= 5_000)   expectedFill = Math.min(limit, marketPer4hr * 0.08);
  else                        expectedFill = Math.min(limit, marketPer4hr * 0.03);

  const gpPer4hr = margin * Math.max(expectedFill, 1);
  if (gpPer4hr < 50_000) return 0;

  let base;
  if      (gpPer4hr >= 10_000_000) base = 70;
  else if (gpPer4hr >= 5_000_000)  base = 62;
  else if (gpPer4hr >= 2_000_000)  base = 54;
  else if (gpPer4hr >= 800_000)    base = 46;
  else if (gpPer4hr >= 300_000)    base = 38;
  else if (gpPer4hr >= 100_000)    base = 28;
  else if (gpPer4hr >= 30_000)     base = 18;
  else                             base = 8;

  let roiMod = 0;
  if      (roi < 0.5)  roiMod = -10;
  else if (roi <= 2)   roiMod = 5;
  else if (roi <= 10)  roiMod = 15;
  else if (roi <= 25)  roiMod = 8;
  else if (roi <= 50)  roiMod = 0;
  else if (roi <= 100) roiMod = -8;
  else                 roiMod = -15;

  return Math.min(100, Math.max(0, base + roiMod));
}

// ── Beat-the-market relist price ──────────────────────────────────────────────
function beatIncrement(price) {
  if (price >= 10_000_000) return 10;
  if (price >= 1_000_000)  return 5;
  if (price >= 10_000)     return 3;
  return 2;
}

// ── GE tax ────────────────────────────────────────────────────────────────────
function calcTax(sellPrice) {
  return Math.min(Math.floor(sellPrice * 0.02), 5_000_000);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth via API key
  const authHeader = req.headers.authorization || "";
  const apiKey = authHeader.replace("Bearer ", "").trim();
  if (!apiKey || !apiKey.startsWith("rt_")) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Look up user + their picks prefs
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("api_key", apiKey)
    .single();

  if (profileError || !profile) {
    return res.status(401).json({ error: "API key not found" });
  }

  // Parse query params (risk, membership, cashStack, flipSpeed, limit)
  const risk       = req.query.risk       || "low";
  const membership = req.query.membership || "members";
  const flipSpeed  = req.query.flipSpeed  || "any";
  const cashStack  = parseInt(req.query.cashStack || "0") || Infinity;
  const limit      = Math.min(parseInt(req.query.limit || "3"), 10);

  // Fetch wiki prices (cached 30s)
  const now = Date.now();
  if (!wikiCache || now - wikiCacheTime > 30_000) {
    try {
      const [priceRes, mappingRes] = await Promise.all([
        fetch(WIKI_URL,    { headers: { "User-Agent": USER_AGENT } }),
        mappingCache ? null : fetch(MAPPING_URL, { headers: { "User-Agent": USER_AGENT } }),
      ]);
      const priceData = await priceRes.json();
      wikiCache = priceData.data || {};
      wikiCacheTime = now;
      if (!mappingCache && mappingRes) {
        const mappingData = await mappingRes.json();
        mappingCache = {};
        for (const item of mappingData) {
          mappingCache[item.id] = item;
        }
      }
    } catch (e) {
      console.error("[plugin-picks] wiki fetch error", e.message);
      return res.status(503).json({ error: "Failed to fetch price data" });
    }
  }

  const nowSec = now / 1000;
  const picks = [];

  for (const [idStr, prices] of Object.entries(wikiCache)) {
    const id   = parseInt(idStr);
    const meta = mappingCache?.[id];
    if (!meta) continue;

    const high = prices.high || 0;
    const low  = prices.low  || 0;
    const highTime = prices.highTime || 0;
    const lowTime  = prices.lowTime  || 0;
    const lastTradeTime = Math.max(highTime, lowTime);

    if (!high || !low || high <= low) continue;

    const tax    = calcTax(low);
    const margin = low - high - tax;
    if (margin <= 0) continue;

    const buyLimit = meta.limit || 0;
    if (buyLimit <= 0) continue;

    // Volume proxy: RuneTrader doesn't have volume in this endpoint
    // Use buy limit as a proxy — items with high limits tend to be high volume
    // Real volume would need a separate timeseries call; this is a good approximation
    const volume = buyLimit * 80; // conservative proxy

    const roi   = high > 0 ? (margin / high) * 100 : 0;
    const score = getScore(margin, volume, roi, buyLimit, lastTradeTime);
    if (score <= 0) continue;

    // Risk tier filter
    const age = nowSec - lastTradeTime;
    if (risk === "low") {
      if (age > 900) continue;
      if ((volume / buyLimit) < 70) continue;
    } else if (risk === "medium") {
      if (age > 2700) continue;
      if (high < 200_000 || high >= 10_000_000) continue;
      if (margin < 30_000) continue;
      if ((volume / buyLimit) < 15) continue;
    } else if (risk === "high") {
      if (age > 3600) continue;
      if (high < 10_000_000) continue;
      if (margin < 90_000) continue;
      if ((volume / buyLimit) < 8) continue;
    }

    // Membership filter
    if (membership === "f2p" && meta.members) continue;

    // Cash stack filter
    if (cashStack !== Infinity && high > cashStack) continue;

    // Flip speed filter
    const ratio = volume / buyLimit;
    if (flipSpeed === "fast"   && ratio < 50) continue;
    if (flipSpeed === "medium" && ratio < 15) continue;
    if (flipSpeed === "slow"   && margin < 50_000) continue;

    const suggestedBuyPrice  = high + beatIncrement(high);
    const suggestedSellPrice = Math.max(1, low - beatIncrement(low));
    const suggestedQty       = cashStack !== Infinity
      ? Math.min(buyLimit, Math.floor(cashStack / suggestedBuyPrice))
      : buyLimit;
    const gpPerFlip = margin * Math.min(suggestedQty, buyLimit);
    const dataAgeMinutes = Math.round(age / 60);

    picks.push({
      id,
      name:               meta.name,
      suggestedBuyPrice,
      suggestedSellPrice,
      buyLimit,
      suggestedQty:       Math.max(1, suggestedQty),
      margin,
      roi:                parseFloat(roi.toFixed(1)),
      gpPerFlip,
      volume,
      score,
      dataAgeMinutes,
    });
  }

  // Sort by score descending, return top N
  picks.sort((a, b) => b.score - a.score);
  const top = picks.slice(0, limit);

  return res.status(200).json({ picks: top, count: top.length });
}
