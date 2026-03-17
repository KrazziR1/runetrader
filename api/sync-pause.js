import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validate API key from Authorization header
  const authHeader = req.headers.authorization || "";
  const apiKey = authHeader.replace("Bearer ", "").trim();

  if (!apiKey || !apiKey.startsWith("rt_")) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  const { paused } = req.body;
  if (typeof paused !== "boolean") {
    return res.status(400).json({ error: "paused must be a boolean" });
  }

  // Look up user by API key
  const { data: profile, error: lookupError } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("api_key", apiKey)
    .single();

  if (lookupError || !profile) {
    return res.status(401).json({ error: "API key not found" });
  }

  // Update sync_paused in user_profiles
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({
      sync_paused: paused,
      sync_paused_at: paused ? new Date().toISOString() : null,
    })
    .eq("user_id", profile.user_id);

  if (updateError) {
    console.error("[sync-pause]", updateError.message);
    return res.status(500).json({ error: "Failed to update pause state" });
  }

  return res.status(200).json({ ok: true, paused });
}
