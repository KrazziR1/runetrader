// api/prices.js
// Vercel serverless function — server-side cache for RS Wiki price data.
//
// Instead of every browser hitting prices.runescape.wiki directly (bad for their
// servers, and a likely rejection reason for the RuneLite plugin hub), this endpoint:
//   1. Checks Supabase for a cached response younger than 60 seconds
//   2. If fresh → returns the cache immediately
//   3. If stale → fetches from the Wiki, stores it, returns it
//
// The frontend calls /api/prices?type=latest|mapping|volumes
// This means the Wiki API gets at most 1 request/minute total regardless of users.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WIKI_BASE = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'RuneTrader.gg - contact@runetrader.gg';

// Cache TTLs in milliseconds
const TTL = {
  latest:  60 * 1000,        // 60s — wiki updates every ~60s
  mapping: 24 * 60 * 60 * 1000, // 24h — item metadata never changes
  volumes: 10 * 60 * 1000,   // 10m — volumes update daily but no need to hammer
};

module.exports = async function handler(req, res) {
  // CORS — allow the frontend to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const type = req.query.type;
  if (!['latest', 'mapping', 'volumes'].includes(type)) {
    return res.status(400).json({ error: 'type must be latest, mapping, or volumes' });
  }

  try {
    // ── 1. Check cache ──────────────────────────────────────────
    const { data: cached } = await supabase
      .from('price_cache')
      .select('data, fetched_at')
      .eq('cache_key', type)
      .maybeSingle();

    const now = Date.now();
    const age = cached ? now - new Date(cached.fetched_at).getTime() : Infinity;

    if (cached && age < TTL[type]) {
      // Cache is fresh — serve it
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Age', Math.round(age / 1000) + 's');
      res.setHeader('Cache-Control', `public, max-age=${Math.round((TTL[type] - age) / 1000)}`);
      return res.status(200).json(cached.data);
    }

    // ── 2. Fetch from Wiki ──────────────────────────────────────
    const wikiRes = await fetch(`${WIKI_BASE}/${type}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!wikiRes.ok) {
      // Wiki is down — return stale cache if we have it rather than erroring
      if (cached) {
        res.setHeader('X-Cache', 'STALE');
        return res.status(200).json(cached.data);
      }
      return res.status(502).json({ error: `Wiki API returned ${wikiRes.status}` });
    }

    const freshData = await wikiRes.json();

    // ── 3. Store in Supabase ────────────────────────────────────
    await supabase
      .from('price_cache')
      .upsert(
        { cache_key: type, data: freshData, fetched_at: new Date().toISOString() },
        { onConflict: 'cache_key' }
      );

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', `public, max-age=${TTL[type] / 1000}`);
    return res.status(200).json(freshData);

  } catch (err) {
    console.error('[prices] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
