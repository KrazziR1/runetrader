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

  const validationErrors = body.flatMap((offer, i) => {
    if (offer.status === 'EMPTY') return []; // EMPTY only needs slot
    return validateOffer(offer, i);
  });
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  // ── 4. Upsert ge_offers (display table — unchanged) ────────
  const syncedAt = new Date().toISOString();

  const emptySlots   = body.filter(o => o.status === 'EMPTY').map(o => o.slot);
  const activeOffers = body.filter(o => o.status !== 'EMPTY');

  if (emptySlots.length > 0) {
    await supabase
      .from('ge_offers')
      .delete()
      .eq('user_id', userId)
      .in('slot', emptySlots);
  }

  if (activeOffers.length > 0) {
    const rows = activeOffers.map((offer) => ({
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
      .upsert(rows, { onConflict: 'user_id,slot', ignoreDuplicates: false });

    if (upsertError) {
      console.error('ge_offers upsert error:', upsertError);
      return res.status(500).json({ error: 'Failed to save offers' });
    }
  }

  // ── 5. Update ge_flips_live ────────────────────────────────
  //
  // State machine per slot:
  //
  //   BUYING / BOUGHT  → upsert a live flip row (open position)
  //   SELLING          → mark the live flip row as SELLING (still open)
  //   SOLD             → write sell price + profit, mark SOLD, then DELETE the row
  //                      so Active Operations clears automatically
  //   EMPTY            → DELETE the live flip row for that slot
  //                      (item collected from GE — slot is now empty)
  //   CANCELLED_BUY    → DELETE the live flip row (buy never happened)
  //   CANCELLED_SELL   → leave open (item still held, sell cancelled)

  for (const offer of body) {
    const slot = offer.slot;

    // ── EMPTY: item collected — remove from live flips ──────
    if (offer.status === 'EMPTY') {
      await supabase
        .from('ge_flips_live')
        .delete()
        .eq('user_id', userId)
        .eq('slot', slot);
      continue;
    }

    // ── CANCELLED_BUY: buy never filled — clean up ──────────
    if (offer.status === 'CANCELLED_BUY') {
      await supabase
        .from('ge_flips_live')
        .delete()
        .eq('user_id', userId)
        .eq('slot', slot);
      continue;
    }

    // ── SOLD: complete the flip ──────────────────────────────
    if (offer.status === 'SOLD') {
      // Find the open live flip for this slot to get the buy price
      const { data: existingFlip } = await supabase
        .from('ge_flips_live')
        .select('*')
        .eq('user_id', userId)
        .eq('slot', slot)
        .maybeSingle();

      const sellPrice = offer.offerPrice;
      const buyPrice  = existingFlip?.buy_price ?? null;
      const quantity  = offer.qtyFilled || offer.qtyTotal;

      // Calculate profit if we have buy price
      let profit = null;
      let roi    = null;
      if (buyPrice && sellPrice) {
        const tax    = Math.min(Math.floor(sellPrice * 0.02), 5_000_000);
        const margin = sellPrice - buyPrice - tax;
        profit = margin * quantity;
        roi    = parseFloat(((margin / buyPrice) * 100).toFixed(2));
      }

      if (existingFlip) {
        // Update the existing row with sell data and mark SOLD
        await supabase
          .from('ge_flips_live')
          .update({
            status:           'SOLD',
            sell_price:       sellPrice,
            profit:           profit,
            roi:              roi,
            sell_completed_at: syncedAt,
          })
          .eq('id', existingFlip.id);
      } else {
        // No open flip found (e.g. server restarted mid-flip) — insert a closed record
        await supabase
          .from('ge_flips_live')
          .insert({
            user_id:           userId,
            slot:              slot,
            item_id:           offer.itemId,
            item_name:         offer.itemName.trim(),
            status:            'SOLD',
            sell_price:        sellPrice,
            profit:            profit,
            roi:               roi,
            buy_started_at:    syncedAt, // best guess
            sell_completed_at: syncedAt,
            quantity:          quantity,
          });
      }

      // BUG 1 FIX + BUG 2 FIX:
      // Delete the row from ge_flips_live so it disappears from Active Operations.
      // The sell data has already been written above — the realtime DELETE event
      // will trigger the frontend to remove it from the live view.
      await supabase
        .from('ge_flips_live')
        .delete()
        .eq('user_id', userId)
        .eq('slot', slot);

      continue;
    }

    // ── BUYING / BOUGHT / SELLING: upsert open flip ─────────
    const isBuyOffer = offer.offerType === 'BUY';

    if (isBuyOffer) {
      // Only BUY offers create/update live flip rows
      const flipRow = {
        user_id:       userId,
        slot:          slot,
        item_id:       offer.itemId,
        item_name:     offer.itemName.trim(),
        status:        offer.status,            // BUYING, BOUGHT, or SELLING
        buy_price:     offer.offerPrice,
        quantity:      offer.qtyFilled || offer.qtyTotal,
        buy_started_at: syncedAt,
      };

      const { data: existing } = await supabase
        .from('ge_flips_live')
        .select('id, buy_started_at, buy_price')
        .eq('user_id', userId)
        .eq('slot', slot)
        .maybeSingle();

      if (existing) {
        // Update status + quantity, preserve original buy_started_at and buy_price
        await supabase
          .from('ge_flips_live')
          .update({
            status:   offer.status,
            quantity: offer.qtyFilled || offer.qtyTotal,
            // Only update buy_price if it wasn't set yet (BUYING → BOUGHT transition)
            ...(existing.buy_price ? {} : { buy_price: offer.offerPrice }),
          })
          .eq('id', existing.id);
      } else {
        // New flip — insert fresh row
        await supabase
          .from('ge_flips_live')
          .insert(flipRow);
      }
    } else {
      // SELL offer — update status on the existing flip row to SELLING
      // (the SOLD case above handles full completion)
      await supabase
        .from('ge_flips_live')
        .update({ status: 'SELLING' })
        .eq('user_id', userId)
        .eq('slot', slot)
        .not('status', 'eq', 'SOLD'); // don't overwrite a completed flip
    }
  }

  // ── 6. Touch last_used async (best-effort) ─────────────────
  supabase.rpc('touch_api_key', { p_key: apiKey }).then(() => {}).catch(() => {});

  // ── 7. Return success ──────────────────────────────────────
  return res.status(200).json({
    ok: true,
    synced: activeOffers.length,
    synced_at: syncedAt,
  });
}
