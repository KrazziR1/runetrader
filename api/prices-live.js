// api/prices-live.js
// Direct Wiki fetch for active GE slot items ONLY — bypasses the shared price cache.
//
// Why separate from /api/prices?
//   - /api/prices caches ALL items (4000+) for 60s — great for the flip scanner
//   - This endpoint fetches only the specific items in a user's active slots (max 8)
//   - No cache — always fresh — used exclusively for drift detection & slot health alerts
//   - Safe for Wiki's servers: max 1 tiny request per user per poll interval
//   - Has zero interaction with the RuneLite plugin — purely website-side
//
// Called by the frontend drift detection system every 30 seconds when user has active slots.
// Query: GET /api/prices-live?ids=2,6,4151,12695  (comma-separated item IDs)

const WIKI_BASE   = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT  = 'RuneTrader.gg price drift monitor - contact@runetrader.gg';
const MAX_IDS     = 8; // hard cap — this endpoint is only for GE slots

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  const raw = req.query.ids;
  if (!raw) return res.status(400).json({ error: 'ids query param required (comma-separated item IDs)' });

  // Validate & cap IDs
  const ids = raw.split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id) && id > 0)
    .slice(0, MAX_IDS);

  if (ids.length === 0) return res.status(400).json({ error: 'No valid item IDs provided' });

  try {
    // Hit Wiki /latest — returns instabuy/instasell for all items
    // We filter client-side since Wiki doesn't support ID filtering on /latest
    const wikiRes = await fetch(`${WIKI_BASE}/latest`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!wikiRes.ok) {
      return res.status(502).json({ error: `Wiki API returned ${wikiRes.status}` });
    }

    const full = await wikiRes.json();

    // Filter to only the requested item IDs
    const filtered = {};
    for (const id of ids) {
      if (full.data[id]) filtered[id] = full.data[id];
    }

    // No-cache headers — this data must always be fresh
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('X-Cache', 'BYPASS');
    res.setHeader('X-Item-Count', ids.length);

    return res.status(200).json({
      timestamp: Date.now(),
      data: filtered,
    });

  } catch (err) {
    console.error('[prices-live] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
