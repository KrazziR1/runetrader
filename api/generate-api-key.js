// api/generate-api-key.js
// Vercel serverless function — generates a new API key for an authenticated user
//
// POST /api/generate-api-key
// Authorization: Bearer <supabase_user_jwt>
// Body (optional): { "label": "My RuneLite client" }

import { createClient } from '@supabase/supabase-js';

// Admin client for key generation
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public client for verifying the user's JWT
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Verify the user's Supabase session JWT ──────────────
  const authHeader = req.headers['authorization'] ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const jwt = authHeader.slice(7).trim();
  const { data: { user }, error: authError } = await supabasePublic.auth.getUser(jwt);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // ── 2. Enforce key limit (max 5 active keys per user) ──────
  const { count, error: countError } = await supabaseAdmin
    .from('ge_api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('revoked_at', null);

  if (countError) {
    return res.status(500).json({ error: 'Failed to check key count' });
  }

  if (count >= 5) {
    return res.status(400).json({
      error: 'Maximum of 5 active API keys reached. Revoke one before generating a new key.',
    });
  }

  // ── 3. Generate key using the DB function ─────────────────
  const { data: keyData, error: keyGenError } = await supabaseAdmin
    .rpc('generate_api_key');

  if (keyGenError || !keyData) {
    return res.status(500).json({ error: 'Failed to generate API key' });
  }

  const newKey = keyData;
  const label  = typeof req.body?.label === 'string'
    ? req.body.label.trim().slice(0, 64)   // max 64 chars
    : null;

  // ── 4. Insert key into database ───────────────────────────
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('ge_api_keys')
    .insert({
      user_id: user.id,
      api_key: newKey,
      label,
    })
    .select('id, label, created_at')
    .single();

  if (insertError) {
    console.error('Key insert error:', insertError);
    return res.status(500).json({ error: 'Failed to save API key' });
  }

  // ── 5. Return the key — shown ONCE, never again ──────────
  return res.status(201).json({
    ok:         true,
    api_key:    newKey,           // caller must copy this — we don't store it readable
    id:         inserted.id,
    label:      inserted.label,
    created_at: inserted.created_at,
    warning:    'Store this key securely. It will not be shown again.',
  });
}
