import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configure web-push with VAPID keys from environment variables
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Protect the cron endpoint — Vercel sends this header automatically
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch live GE prices
    const priceRes = await fetch('https://prices.runescape.wiki/api/v1/osrs/latest', {
      headers: { 'User-Agent': 'RuneTrader/1.0 (runetrader.gg)' }
    });
    const priceData = await priceRes.json();
    const prices = priceData.data; // { itemId: { high, low, highTime, lowTime } }

    // 2. Fetch OSRS item mapping so we can look up item IDs by name
    const mappingRes = await fetch('https://prices.runescape.wiki/api/v1/osrs/mapping', {
      headers: { 'User-Agent': 'RuneTrader/1.0 (runetrader.gg)' }
    });
    const mappingData = await mappingRes.json();
    // Build name → id map (lowercase for matching)
    const nameToId = {};
    mappingData.forEach(item => { nameToId[item.name.toLowerCase()] = item.id; });

    // 3. Load all active (non-triggered) alerts from Supabase with their user's push subscription
    const { data: alerts, error: alertsErr } = await supabase
      .from('alerts')
      .select(`
        id, user_id, item, price, type,
        push_subscriptions ( endpoint, p256dh, auth )
      `)
      .eq('triggered', false)
      .eq('notifications_enabled', true);

    if (alertsErr) throw alertsErr;
    if (!alerts || alerts.length === 0) return res.status(200).json({ checked: 0, fired: 0 });

    let fired = 0;
    const triggeredIds = [];

    for (const alert of alerts) {
      const sub = alert.push_subscriptions?.[0];
      if (!sub) continue; // user hasn't subscribed to push yet

      // Look up current price for this item
      const itemId = nameToId[alert.item.toLowerCase()];
      if (!itemId) continue;
      const itemPrices = prices[String(itemId)];
      if (!itemPrices) continue;

      const currentPrice = alert.type === 'above' ? itemPrices.high : itemPrices.low;
      if (!currentPrice) continue;

      const triggered = alert.type === 'above'
        ? currentPrice >= alert.price
        : currentPrice <= alert.price;

      if (!triggered) continue;

      // Fire the push notification
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      const direction = alert.type === 'above' ? '↑ above' : '↓ below';
      const payload = JSON.stringify({
        title: `🔔 RuneTrader: ${alert.item}`,
        body: `Price hit ${currentPrice.toLocaleString()} gp — your target was ${direction} ${alert.price.toLocaleString()} gp`,
        tag: `alert-${alert.id}`,
        url: '/?tab=alerts',
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        fired++;
        triggeredIds.push(alert.id);
      } catch (pushErr) {
        // 410 = subscription expired/unsubscribed — clean it up
        if (pushErr.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        }
        console.error(`Push failed for alert ${alert.id}:`, pushErr.message);
      }
    }

    // 4. Mark triggered alerts so they don't fire again
    if (triggeredIds.length > 0) {
      await supabase
        .from('alerts')
        .update({ triggered: true })
        .in('id', triggeredIds);
    }

    return res.status(200).json({ checked: alerts.length, fired });

  } catch (err) {
    console.error('check-alerts error:', err);
    return res.status(500).json({ error: err.message });
  }
}
