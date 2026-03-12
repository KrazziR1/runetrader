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
  if (typeof offer.slot !== 'number' || offer.slot < 0 || offer.slot > 7)
    errors.push(`[${index}] slot must be 0-7`);
  if (typeof offer.itemId !== 'number' || offer.itemId <= 0)
    errors.push(`[${index}] itemId must be a positive integer`);
  if (typeof offer.itemName !== 'string' || offer.itemName.trim() === '')
    errors.push(`[${index}] itemName must be a non-empty string`);
  if (!VALID_TYPES.has(offer.offerType))
    errors.push(`[${index}] offerType must be BUY or SELL`);
  if (typeof offer.offerPrice !== 'number' || offer.offerPrice <= 0)
    errors.push(`[${index}] offerPrice must be a positive integer`);
  if (typeof offer.qtyTotal !== 'number' || offer.qtyTotal <= 0)
    errors.push(`[${index}] qtyTotal must be a positive integer`);
  if (typeof offer.qtyFilled !== 'number' || offer.qtyFilled < 0)
    errors.push(`[${index}] qtyFilled must be >= 0`);
  if (!VALID_STATUSES.has(offer.status))
    errors.push(`[${index}] status "${offer.status}" is not a valid GrandExchangeOfferState`);
  return errors;
}

// ─── Main handler ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  // ── 1. Auth ────────────────────────────────────────────────
  const authHeader = req.headers['authorization'] ?? '';
  if (!authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey.startsWith('rt_') || apiKey.length < 10)
    return res.status(401).json({ error: 'Invalid API key format' });

  const { data: keyRow, error: keyError } = await supabase
    .from('ge_api_keys')
    .select('id, user_id, revoked_at')
    .eq('api_key', apiKey)
    .single();

  if (keyError || !keyRow)
    return res.status(401).json({ error: 'API key not found' });
  if (keyRow.revoked_at !== null)
    return res.status(401).json({ error: 'API key has been revoked' });

  const userId = keyRow.user_id;

  // ── 2. Validate body ───────────────────────────────────────
  const body = req.body;
  if (!Array.isArray(body) || body.length === 0 || body.length > 8)
    return res.status(400).json({ error: 'Body must be an array of 1-8 offer objects' });

  const validationErrors = body.flatMap((offer, i) => {
    if (offer.status === 'EMPTY') return [];
    return validateOffer(offer, i);
  });
  if (validationErrors.length > 0)
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });

  const syncedAt = new Date().toISOString();

  // ── 3. ge_offers (Live GE Slots display table) ─────────────
  //
  // FIX: Always delete a slot from ge_offers when its status is EMPTY *or*
  // SOLD/CANCELLED — these are all terminal states meaning the slot is done.
  // Previously only EMPTY slots were deleted, so SOLD offers lingered in
  // Live GE Slots until the next poll sent an EMPTY for that slot.

  const terminalSlots = body
    .filter(o => ['EMPTY', 'SOLD', 'CANCELLED_BUY', 'CANCELLED_SELL'].includes(o.status))
    .map(o => o.slot);

  const activeOffers = body.filter(
    o => !['EMPTY', 'SOLD', 'CANCELLED_BUY', 'CANCELLED_SELL'].includes(o.status)
  );

  if (terminalSlots.length > 0) {
    await supabase
      .from('ge_offers')
      .delete()
      .eq('user_id', userId)
      .in('slot', terminalSlots);
  }

  if (activeOffers.length > 0) {
    const rows = activeOffers.map(offer => ({
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

  // ── 4. ge_flips_live (Open Flips + Flip History) ───────────
  //
  // State machine per slot:
  //
  //   BUYING          → INSERT a new open flip row (if none exists for this slot)
  //   BOUGHT          → UPDATE status on the open row
  //   SELLING         → UPDATE status on the open row
  //   SOLD            → UPDATE open row with sell price + profit, mark SOLD
  //                     Row stays permanently — Flip History reads SOLD rows,
  //                     Active Operations filters them out.
  //   EMPTY           → DELETE only non-SOLD rows (open flip is gone; SOLD rows
  //                     stay so flip history is preserved)
  //   CANCELLED_BUY   → DELETE the open flip row
  //   CANCELLED_SELL  → UPDATE status back to BOUGHT (item still held)

  for (const offer of body) {
    const slot = offer.slot;

    // ── EMPTY ───────────────────────────────────────────────
    if (offer.status === 'EMPTY') {
      await supabase
        .from('ge_flips_live')
        .delete()
        .eq('user_id', userId)
        .eq('slot', slot)
        .neq('status', 'SOLD'); // preserve completed flip history
      continue;
    }

    // ── CANCELLED_BUY ───────────────────────────────────────
    if (offer.status === 'CANCELLED_BUY') {
      await supabase
        .from('ge_flips_live')
        .delete()
        .eq('user_id', userId)
        .eq('slot', slot)
        .neq('status', 'SOLD');
      continue;
    }

    // ── CANCELLED_SELL ──────────────────────────────────────
    if (offer.status === 'CANCELLED_SELL') {
      await supabase
        .from('ge_flips_live')
        .update({ status: 'BOUGHT' })
        .eq('user_id', userId)
        .eq('slot', slot)
        .eq('status', 'SELLING');
      continue;
    }

    // ── SOLD ────────────────────────────────────────────────
    if (offer.status === 'SOLD') {
      // FIX: only match the current OPEN flip for this slot (not old SOLD rows).
      // Previously .maybeSingle() with no status filter would match old SOLD rows
      // from previous flips on the same slot → buy_price came back null → profit = 0.
      const { data: openFlip } = await supabase
        .from('ge_flips_live')
        .select('id, buy_price, quantity')
        .eq('user_id', userId)
        .eq('slot', slot)
        .in('status', ['BUYING', 'BOUGHT', 'SELLING']) // only match the open flip
        .order('buy_started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const sellPrice = offer.offerPrice;
      const buyPrice  = openFlip?.buy_price ?? null;
      const quantity  = offer.qtyFilled || offer.qtyTotal;

      let profit = null;
      let roi    = null;
      if (buyPrice && sellPrice) {
        const tax    = Math.min(Math.floor(sellPrice * 0.02), 5_000_000);
        const margin = sellPrice - buyPrice - tax;
        profit = margin * quantity;
        roi    = parseFloat(((margin / buyPrice) * 100).toFixed(2));
      }

      if (openFlip) {
        await supabase
          .from('ge_flips_live')
          .update({
            status:            'SOLD',
            sell_price:        sellPrice,
            profit:            profit,
            roi:               roi,
            sell_completed_at: syncedAt,
          })
          .eq('id', openFlip.id);
      } else {
        // No open flip found (plugin restarted mid-flip) — insert a closed record
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
            quantity:          quantity,
            buy_started_at:    syncedAt,
            sell_completed_at: syncedAt,
          });
      }
      continue;
    }

    // ── BUYING / BOUGHT / SELLING: upsert open flip ─────────
    if (offer.offerType === 'BUY') {
      // FIX: only look for the currently open (non-SOLD) row for this slot.
      // Previously maybeSingle() with no status filter matched old SOLD rows,
      // causing the UPDATE to fire on a completed flip instead of inserting a
      // new row → duplicate open flips accumulated.
      const { data: openFlip } = await supabase
        .from('ge_flips_live')
        .select('id, buy_price')
        .eq('user_id', userId)
        .eq('slot', slot)
        .in('status', ['BUYING', 'BOUGHT', 'SELLING'])
        .order('buy_started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openFlip) {
        // Update status on the existing open flip
        await supabase
          .from('ge_flips_live')
          .update({
            status:   offer.status,
            quantity: offer.qtyFilled || offer.qtyTotal,
            // Only lock in buy_price once we have it (BUYING may send 0)
            ...(openFlip.buy_price ? {} : { buy_price: offer.offerPrice }),
          })
          .eq('id', openFlip.id);
      } else {
        // No open flip for this slot — insert fresh
        await supabase
          .from('ge_flips_live')
          .insert({
            user_id:        userId,
            slot:           slot,
            item_id:        offer.itemId,
            item_name:      offer.itemName.trim(),
            status:         offer.status,
            buy_price:      offer.offerPrice,
            quantity:       offer.qtyFilled || offer.qtyTotal,
            buy_started_at: syncedAt,
          });
      }
    } else {
      // SELL offer (SELLING status) — update the open flip row
      await supabase
        .from('ge_flips_live')
        .update({ status: 'SELLING' })
        .eq('user_id', userId)
        .eq('slot', slot)
        .in('status', ['BUYING', 'BOUGHT']); // only update open rows
    }
  }

  // ── 5. Touch last_used async ───────────────────────────────
  supabase.rpc('touch_api_key', { p_key: apiKey }).then(() => {}).catch(() => {});

  return res.status(200).json({
    ok: true,
    synced: activeOffers.length,
    synced_at: syncedAt,
  });
}
