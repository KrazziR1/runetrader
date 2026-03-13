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
  if (typeof offer.offerPrice !== 'number' || offer.offerPrice < 0)
    errors.push(`[${index}] offerPrice must be a non-negative integer`);
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
  // SOLD is NOT terminal for ge_offers — item stays in slot until player collects (EMPTY).
  const terminalStatuses = ['EMPTY', 'CANCELLED_BUY', 'CANCELLED_SELL'];
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
      // Safety guard: don't delete if another offer in this same batch is active for
      // this slot (prevents race where EMPTY and BUYING arrive in same payload).
      const slotIsActiveElsewhere = body.some(o =>
        o.slot === slot && o !== offer && ['BUYING','BOUGHT','SELLING'].includes(o.status)
      );
      if (!slotIsActiveElsewhere) {
        // Only delete BUYING rows on EMPTY (cancelled unfilled buy = no item, no flip).
        // BOUGHT rows = player has the item and hasn't sold yet — keep the open flip alive.
        // SOLD rows are never deleted (preserved as history).
        await supabase
          .from('ge_flips_live')
          .delete()
          .eq('user_id', userId)
          .eq('slot', slot)
          .in('status', ['BUYING']); // only delete unfilled/cancelled buys
      }
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
      // Match by item_id — OSRS GE assigns a different slot for sell vs buy.
      // The SELLING update already synced the slot, but item_id is always stable.
      let { data: openFlip } = await supabase
        .from('ge_flips_live')
        .select('id, buy_price, buy_spent, quantity, slot')
        .eq('user_id', userId)
        .eq('item_id', offer.itemId)
        .in('status', ['BUYING', 'BOUGHT', 'SELLING'])
        .order('buy_started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fallback 1: slot-based lookup (in case SELLING update already ran)
      if (!openFlip) {
        const { data: slotRow } = await supabase
          .from('ge_flips_live')
          .select('id, buy_price, buy_spent, quantity, slot')
          .eq('user_id', userId)
          .eq('slot', slot)
          .in('status', ['BUYING', 'BOUGHT', 'SELLING'])
          .order('buy_started_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (slotRow) openFlip = slotRow;
      }

      // Fallback 2: any non-SOLD row for this item regardless of slot
      if (!openFlip) {
        const { data: anyRow } = await supabase
          .from('ge_flips_live')
          .select('id, buy_price, buy_spent, quantity, slot')
          .eq('user_id', userId)
          .eq('item_id', offer.itemId)
          .neq('status', 'SOLD')
          .order('buy_started_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (anyRow) openFlip = anyRow;
      }

      // sellPrice: plugin computes getSpent()/getQuantitySold() and sends it as offerPrice.
      // offer.spent is also sent raw for cross-checking.
      const quantity  = offer.qtyFilled || offer.qtyTotal;
      const sellPrice = offer.offerPrice;

      // Prefer recalculating buy_price from raw buy_spent if available —
      // more accurate than stored buy_price which may have been set during BUYING (listed price).
      const buyQty = openFlip?.quantity || quantity;
      const buyPrice = (openFlip?.buy_spent && buyQty > 0)
        ? Math.round(openFlip.buy_spent / buyQty)
        : (openFlip?.buy_price ?? null);
      let profit = null, roi = null;
      let tax = null;
      if (buyPrice && sellPrice) {
        tax            = Math.min(Math.floor(sellPrice * 0.02), 5_000_000);
        const margin   = sellPrice - buyPrice - tax;
        profit         = margin * quantity;
        roi            = parseFloat(((margin / buyPrice) * 100).toFixed(2));
      }

      if (openFlip) {
        const { error: soldErr } = await supabase
          .from('ge_flips_live')
          .update({
            status: 'SOLD', sell_price: sellPrice,
            buy_price: buyPrice,  // lock in accurate buy_price at close time
            profit, roi, tax, quantity, sell_completed_at: syncedAt,
          })
          .eq('id', openFlip.id);
        if (soldErr) {
          console.error('ge_flips_live SOLD update error:', soldErr);
        } else {
          // Clean up any other open rows for this item (different slot, duplicates)
          await supabase.from('ge_flips_live').delete()
            .eq('user_id', userId)
            .eq('item_id', offer.itemId)
            .in('status', ['BUYING', 'BOUGHT', 'SELLING'])
            .neq('id', openFlip.id);
        }
      } else {
        // No open flip found (plugin restarted mid-flip, or SOLD fired before BUYING)
        // Insert a closed record with what we know
        const { error: soldInsertErr } = await supabase.from('ge_flips_live').insert({
          user_id: userId, slot, item_id: offer.itemId,
          item_name: offer.itemName.trim(), status: 'SOLD',
          sell_price: sellPrice, profit, roi, tax, quantity,
          buy_started_at: syncedAt, sell_completed_at: syncedAt,
        });
        if (soldInsertErr) console.error('ge_flips_live SOLD insert error:', soldInsertErr);
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
        // Update existing open row — idempotent on every poll.
        // Always update buy_price: offer.offerPrice is now the actual fill price
        // (getSpent()/getQuantitySold()) from the fixed plugin, so we always want
        // the latest value — it gets more accurate as more of the order fills.
        await supabase
          .from('ge_flips_live')
          .update({
            status:    offer.status,
            quantity:  offer.qtyFilled || offer.qtyTotal,
            buy_price: offer.offerPrice,
            buy_spent: offer.spent || 0,   // raw GP spent — recalculate at SOLD if needed
          })
          .eq('id', openRow.id);
      } else {
        // No open row exists — fresh insert.
        // Use actual fill price if available (spent / qtyFilled), else listed price.
        const insertBuyPrice = (offer.spent && offer.qtyFilled > 0)
          ? Math.round(offer.spent / offer.qtyFilled)
          : offer.offerPrice;
        const { error: insertErr } = await supabase.from('ge_flips_live').insert({
          user_id: userId, slot,
          item_id: offer.itemId,
          item_name: offer.itemName.trim(),
          status: offer.status,
          buy_price: insertBuyPrice,
          buy_spent: offer.spent || 0,   // raw GP spent
          quantity: offer.qtyFilled || offer.qtyTotal,
          buy_started_at: syncedAt,
        });
        if (insertErr) console.error('ge_flips_live INSERT error:', insertErr);
      }
    } else {
      // SELL offer (offerType=SELL, status=SELLING)
      // Match by item_id — sell slot may differ from buy slot in OSRS GE.
      // Also update slot to the current sell slot so SOLD lookup finds it.
      const { error: sellingErr } = await supabase
        .from('ge_flips_live')
        .update({ status: 'SELLING', slot })
        .eq('user_id', userId)
        .eq('item_id', offer.itemId)
        .in('status', ['BUYING', 'BOUGHT']);
      if (sellingErr) console.error('ge_flips_live SELLING update error:', sellingErr);
    }
  }

  // ── 5. Touch last_used async ─────────────────────────────────
  supabase.rpc('touch_api_key', { p_key: apiKey }).then(() => {}).catch(() => {});

  return res.status(200).json({ ok: true, synced: activeOffers.length, synced_at: syncedAt });
}
