// api/sync-offers.js
// Vercel serverless function — receives GE slot syncs from the RuneLite plugin
//
// POST /api/sync-offers
// Authorization: Bearer <api_key>
// Content-Type: application/json
//
// Body: array of up to 8 offer objects (one per GE slot)

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Allowed offer statuses (mirrors GrandExchangeOfferState) ─
const VALID_STATUSES = new Set([
  'EMPTY',
  'BOUGHT', 'BUYING',
  'SOLD',   'SELLING',
  'CANCELLED_BUY', 'CANCELLED_SELL',
]);

const VALID_TYPES = new Set(['BUY', 'SELL']);

// ─── Input validation ─────────────────────────────────────────
function validateOffer(offer, index) {
  const errors = [];

  if (typeof offer.slot !== 'number' || offer.slot < 0 || offer.slot > 7) {
    errors.push(`[${index}] slot must be 0-7`);
  }
  if (typeof offer.itemId !== 'number' || offer.itemId <= 0) {
    errors.push(`[${index}] itemId must be a positive integer`);
  }
  if (typeof offer.itemName !== 'string' || offer.itemName.trim() === '') {
    errors.push(`[${index}] itemName must be a non-empty string`);
  }
  if (!VALID_TYPES.has(offer.offerType)) {
    errors.push(`[${index}] offerType must be BUY or SELL`);
  }
  if (typeof offer.offerPrice !== 'number' || offer.offerPrice <= 0) {
    errors.push(`[${index}] offerPrice must be a positive integer`);
  }
  if (typeof offer.qtyTotal !== 'number' || offer.qtyTotal <= 0) {
    errors.push(`[${index}] qtyTotal must be a positive integer`);
  }
  if (typeof offer.qtyFilled !== 'number' || offer.qtyFilled < 0) {
    errors.push(`[${index}] qtyFilled must be >= 0`);
  }
  if (!VALID_STATUSES.has(offer.status)) {
    errors.push(`[${index}] status "${offer.status}" is not a valid GrandExchangeOfferState`);
  }

  return errors;
}

// ─── Main handler ─────────────────────────────────────────────
export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Extract & validate API key ──────────────────────────
  const authHeader = req.headers['authorization'] ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey.startsWith('rt_') || apiKey.length < 10) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }

  // ── 2. Look up API key in database ─────────────────────────
  const { data: keyRow, error: keyError } = await supabase
    .from('ge_api_keys')
    .select('id, user_id, revoked_at')
    .eq('api_key', apiKey)
    .single();

  if (keyError || !keyRow) {
    return res.status(401).json({ error: 'API key not found' });
  }

  if (keyRow.revoked_at !== null) {
    return res.status(401).json({ error: 'API key has been revoked' });
  }

  const userId = keyRow.user_id;

  // ── 3. Validate request body ───────────────────────────────
  const body = req.body;

  if (!Array.isArray(body) || body.length === 0 || body.length > 8) {
    return res.status(400).json({ error: 'Body must be an array of 1-8 offer objects' });
  }

  const validationErrors = body.flatMap((offer, i) => validateOffer(offer, i));
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  // ── 4. Upsert offers ──────────────────────────────────────
  // One row per (user_id, slot) — this replaces whatever was there before.
  // The auto_match_flip trigger fires automatically on each upsert.
  const syncedAt = new Date().toISOString();

  const rows = body.map((offer) => ({
    user_id:     userId,
    slot:        offer.slot,
    item_id:     offer.itemId,
    item_name:   offer.itemName.trim(),
    offer_type:  offer.offerType,
    offer_price: offer.offerPrice,
    qty_total:   offer.qtyTotal,
    qty_filled:  offer.qtyFilled,
    status:      offer.status,
    synced_at:   syncedAt,
  }));

  const { error: upsertError } = await supabase
    .from('ge_offers')
    .upsert(rows, {
      onConflict: 'user_id,slot',
      ignoreDuplicates: false,   // always overwrite — we want latest state
    });

  if (upsertError) {
    console.error('Upsert error:', upsertError);
    return res.status(500).json({ error: 'Failed to save offers' });
  }

  // ── 5. Touch last_used async (best-effort, don't block response) ──
  supabase.rpc('touch_api_key', { p_key: apiKey }).then(() => {}).catch(() => {});

  // ── 6. Return success ─────────────────────────────────────
  return res.status(200).json({
    ok: true,
    synced: rows.length,
    synced_at: syncedAt,
  });
}
