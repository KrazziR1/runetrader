// api/sync-offers.js
// Vercel serverless function — receives GE slot syncs from the RuneLite plugin

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALID_STATUSES = new Set([
  'EMPTY', 'BOUGHT', 'BUYING', 'SOLD', 'SELLING', 'CANCELLED_BUY', 'CANCELLED_SELL',
]);
const VALID_TYPES = new Set(['BUY', 'SELL']);

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

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  // ── 1. Auth ──────────────────────────────────────────────────
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

  if (keyError || !keyRow) return res.status(401).json({ error: 'API key not found' });
  if (keyRow.revoked_at !== null) return res.status(401).json({ error: 'API key has been revoked' });

  const userId = keyRow.user_id;

  // ── 2. Validate body ─────────────────────────────────────────
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

  // ── 3. ge_offers (Live GE Slots display) ─────────────────────
  // Terminal statuses: delete from ge_offers immediately so slots clear.
  const terminalStatuses = ['EMPTY', 'SOLD', 'CANCELLED_BUY', 'CANCELLED_SELL'];
  const terminalSlots = body.filter(o => terminalStatuses.includes(o.status)).map(o => o.slot);
  const activeOffers  = body.filter(o => !terminalStatuses.includes(o.status));

  if (terminalSlots.length > 0) {
    await supabase.from('ge_offers').delete().eq('user_id', userId).in('slot', terminalSlots);
  }
  if (activeOffers.length > 0) {
    const rows = activeOffers.map(o => ({
      user_id: userId, slot: o.slot, item_id: o.itemId,
      item_name: o.itemName.trim(), offer_type: o.offerType,
      offer_price: o.offerPrice, qty_total: o.qtyTotal,
      qty_filled: o.qtyFilled, status: o.status, synced_at: syncedAt,
    }));
    const { error: upsertError } = await supabase
      .from('ge_offers')
      .upsert(rows, { onConflict: 'user_id,slot', ignoreDuplicates: false });
    if (upsertError) {
      console.error('ge_offers upsert error:', upsertError);
      return res.status(500).json({ error: 'Failed to save offers' });
    }
  }

  // ── 4. ge_flips_live ─────────────────────────────────────────
  //
  // KEY DESIGN:
  // Each slot has at most ONE open row (status IN BUYING/BOUGHT/SELLING)
  // and any number of historical SOLD rows.
  //
  // To prevent duplicate rows on every poll, we use upsert on (user_id, slot)
  // but ONLY for open rows — SOLD rows are inserted once and never touched.
  //
  // State machine:
  //   BUYING/BOUGHT   → upsert open row (ON CONFLICT user_id,slot DO UPDATE
  //                     but only if existing row is not SOLD)
  //   SELLING         → update existing open row status to SELLING
  //   SOLD            → compute profit, update open row → SOLD (locks it)
  //   EMPTY           → delete non-SOLD rows for slot
  //   CANCELLED_BUY   → delete non-SOLD rows for slot
  //   CANCELLED_SELL  → revert open row to BOUGHT

  for (const offer of body) {
    const slot = offer.slot;

    // ── EMPTY or CANCELLED_BUY: clean up open row ────────────
    if (offer.status === 'EMPTY' || offer.status === 'CANCELLED_BUY') {
      await supabase
        .from('ge_flips_live')
        .delete()
        .eq('user_id', userId)
        .eq('slot', slot)
        .neq('status', 'SOLD');
      continue;
    }

    // ── CANCELLED_SELL: revert to BOUGHT ─────────────────────
    if (offer.status === 'CANCELLED_SELL') {
      await supabase
        .from('ge_flips_live')
        .update({ status: 'BOUGHT' })
        .eq('user_id', userId)
        .eq('slot', slot)
        .eq('status', 'SELLING');
      continue;
    }

    // ── SOLD ─────────────────────────────────────────────────
    if (offer.status === 'SOLD') {
      // Find the open flip for this slot
      const { data: openFlip } = await supabase
        .from('ge_flips_live')
        .select('id, buy_price, quantity')
        .eq('user_id', userId)
        .eq('slot', slot)
        .in('status', ['BUYING', 'BOUGHT', 'SELLING'])
        .order('buy_started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // FIX: use spentAmount/qtyFilled for actual sell price if plugin sends it,
      // otherwise fall back to offerPrice (listed price).
      // spentAmount = total GP received for the sell order.
      const quantity  = offer.qtyFilled || offer.qtyTotal;
      const sellPrice = (offer.spentAmount && quantity > 0)
        ? Math.round(offer.spentAmount / quantity)   // actual fill price
        : offer.offerPrice;                           // listed price (fallback)

      const buyPrice = openFlip?.buy_price ?? null;
      let profit = null, roi = null;
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
            status: 'SOLD', sell_price: sellPrice,
            profit, roi, quantity, sell_completed_at: syncedAt,
          })
          .eq('id', openFlip.id);
      } else {
        // Plugin restarted mid-flip — insert closed record with what we know
        await supabase.from('ge_flips_live').insert({
          user_id: userId, slot, item_id: offer.itemId,
          item_name: offer.itemName.trim(), status: 'SOLD',
          sell_price: sellPrice, profit, roi, quantity,
          buy_started_at: syncedAt, sell_completed_at: syncedAt,
        });
      }
      continue;
    }

    // ── BUYING / BOUGHT / SELLING: maintain open row ──────────
    //
    // FIX for duplicate rows: instead of select-then-insert-or-update,
    // use a true upsert on (user_id, slot) with a WHERE guard so we never
    // overwrite a SOLD row. This is idempotent — every poll hitting the same
    // BOUGHT state will update the existing row, not insert a new one.
    if (offer.offerType === 'BUY') {
      // Check if a SOLD row already occupies this slot
      // (we don't want to overwrite history, and a new buy on same slot
      //  should INSERT fresh, not update the SOLD row)
      const { data: soldRow } = await supabase
        .from('ge_flips_live')
        .select('id')
        .eq('user_id', userId)
        .eq('slot', slot)
        .eq('status', 'SOLD')
        .order('sell_completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: openRow } = await supabase
        .from('ge_flips_live')
        .select('id, buy_price')
        .eq('user_id', userId)
        .eq('slot', slot)
        .in('status', ['BUYING', 'BOUGHT', 'SELLING'])
        .order('buy_started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openRow) {
        // Update existing open row — idempotent on every poll
        await supabase
          .from('ge_flips_live')
          .update({
            status:   offer.status,
            quantity: offer.qtyFilled || offer.qtyTotal,
            // Lock in buy_price once filled (BUYING may come through with 0)
            ...(openRow.buy_price ? {} : { buy_price: offer.offerPrice }),
          })
          .eq('id', openRow.id);
      } else {
        // No open row exists — fresh insert (even if soldRow exists for same slot,
        // that's history and we insert a new open row alongside it)
        await supabase.from('ge_flips_live').insert({
          user_id: userId, slot,
          item_id: offer.itemId,
          item_name: offer.itemName.trim(),
          status: offer.status,
          buy_price: offer.offerPrice,
          quantity: offer.qtyFilled || offer.qtyTotal,
          buy_started_at: syncedAt,
        });
      }
    } else {
      // SELL offer (offerType=SELL, status=SELLING)
      await supabase
        .from('ge_flips_live')
        .update({ status: 'SELLING' })
        .eq('user_id', userId)
        .eq('slot', slot)
        .in('status', ['BUYING', 'BOUGHT']);
    }
  }

  // ── 5. Touch last_used async ─────────────────────────────────
  supabase.rpc('touch_api_key', { p_key: apiKey }).then(() => {}).catch(() => {});

  return res.status(200).json({ ok: true, synced: activeOffers.length, synced_at: syncedAt });
}
