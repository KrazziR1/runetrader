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

  const authHeader = req.headers.authorization || "";
  const jwt = authHeader.replace("Bearer ", "").trim();
  if (!jwt) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error: authError } = await supabasePublic.auth.getUser(jwt);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  const { code } = req.body;
  if (!code || !code.startsWith("RT-")) {
    return res.status(400).json({ error: "Invalid code format" });
  }

  // Find the pending verify code
  const { data: pending, error: pendingError } = await supabase
    .from("discord_verify_codes")
    .select("discord_id, created_at")
    .eq("code", code)
    .single();

  if (pendingError || !pending) {
    return res.status(400).json({ error: "Invalid or expired code. Run !verify in Discord to get a new one." });
  }

  // Check code is not older than 10 minutes
  const createdAt = new Date(pending.created_at);
  const now = new Date();
  const ageMinutes = (now - createdAt) / 1000 / 60;
  if (ageMinutes > 10) {
    await supabase.from("discord_verify_codes").delete().eq("code", code);
    return res.status(400).json({ error: "Code has expired. Run !verify in Discord to get a new one." });
  }

  // Fetch Discord username from Discord API
  let discordUsername = null;
  try {
    const discordRes = await fetch(`https://discord.com/api/v10/users/${pending.discord_id}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    });
    if (discordRes.ok) {
      const discordUser = await discordRes.json();
      // Use global_name (display name) if available, otherwise username
      discordUsername = discordUser.global_name || discordUser.username || null;
    }
  } catch (e) {
    console.error("discord-verify: failed to fetch Discord username:", e);
    // Non-fatal — still link the account, just without username
  }

  // Update the user's profile with their Discord ID and username
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({
      discord_id: pending.discord_id,
      ...(discordUsername ? { discord_username: discordUsername } : {}),
    })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("discord-verify update error:", updateError);
    return res.status(500).json({ error: "Failed to link account. Please try again." });
  }

  // Delete the used code
  await supabase.from("discord_verify_codes").delete().eq("code", code);

  return res.status(200).json({ ok: true, discord_username: discordUsername });
}
