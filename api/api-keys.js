// api/api-keys.js
// Vercel serverless function — list and revoke API keys for the authed user
//
// GET    /api/api-keys          → list active keys (no raw key values returned)
// DELETE /api/api-keys?id=<id>  → revoke a key by its UUID

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function getUser(req) {
  const authHeader = req.headers['authorization'] ?? '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const jwt = authHeader.slice(7).trim();
  const { data: { user } } = await supabasePublic.auth.getUser(jwt);
  return user ?? null;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── GET: list keys ─────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('ge_api_keys')
      .select('id, label, created_at, last_used, revoked_at')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch keys' });

    // Mask the actual key value — prefix hint only for UX
    return res.status(200).json({ ok: true, keys: data });
  }

  // ── DELETE: revoke a key ───────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id query parameter' });

    const { error } = await supabaseAdmin
      .from('ge_api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)   // ensure user can only revoke their own keys
      .is('revoked_at', null);

    if (error) return res.status(500).json({ error: 'Failed to revoke key' });

    return res.status(200).json({ ok: true, revoked: id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
