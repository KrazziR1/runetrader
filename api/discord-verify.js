import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabasePublic = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the logged in user from their session token
  const authHeader = req.headers.authorization || "";
  const jwt = authHeader.replace("Bearer ", "").trim();
  if (!jwt) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabasePublic.auth.getUser(jwt);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { code } = req.body;
  if (!code || !code.startsWith("RT-")) {
    return res.status(400).json({ error: "Invalid code format" });
  }

  // Find the user_profile that has this verify code
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("user_id, discord_id, discord_verify_code")
    .eq("discord_verify_code", code)
    .single();

  if (profileError || !profile) {
    return res.status(400).json({ error: "Invalid or expired code. Run !verify in Discord to get a new one." });
  }

  // Check if this Discord account is already linked to a different website account
  if (profile.discord_id && profile.user_id !== user.id) {
    return res.status(400).json({ error: "This Discord account is already linked to another Rune Trader account." });
  }

  // Link the Discord ID to the logged in user's profile
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({
      discord_id: profile.discord_id,
      discord_verify_code: null,
    })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("discord-verify update error:", updateError);
    return res.status(500).json({ error: "Failed to link account. Please try again." });
  }

  return res.status(200).json({ ok: true });
}
