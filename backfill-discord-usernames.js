// scripts/backfill-discord-usernames.js
// One-time script to backfill discord_username for users who linked before we added the column.
//
// Run with: node scripts/backfill-discord-usernames.js
// Requires env vars: REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DISCORD_BOT_TOKEN

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const RATE_LIMIT_MS = 1000; // 1 request per second — well within Discord's rate limit

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchDiscordUsername(discordId) {
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    });
    if (!res.ok) {
      console.warn(`  Discord API ${res.status} for ID ${discordId}`);
      return null;
    }
    const user = await res.json();
    return user.global_name || user.username || null;
  } catch (e) {
    console.error(`  Error fetching Discord user ${discordId}:`, e.message);
    return null;
  }
}

async function main() {
  console.log("=== Discord username backfill ===\n");

  if (!DISCORD_BOT_TOKEN) {
    console.error("Missing DISCORD_BOT_TOKEN env var");
    process.exit(1);
  }

  // Fetch all users with discord_id but no discord_username
  const { data: users, error } = await supabase
    .from("user_profiles")
    .select("user_id, discord_id, discord_username")
    .not("discord_id", "is", null)
    .is("discord_username", null);

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  if (!users?.length) {
    console.log("No users to backfill — all linked users already have a discord_username.");
    return;
  }

  console.log(`Found ${users.length} user(s) to backfill.\n`);

  let updated = 0, failed = 0;

  for (const u of users) {
    process.stdout.write(`  ${u.user_id.slice(0, 8)}... discord_id=${u.discord_id} → `);

    const username = await fetchDiscordUsername(u.discord_id);

    if (!username) {
      console.log("SKIP (no username returned)");
      failed++;
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ discord_username: username })
      .eq("user_id", u.user_id);

    if (updateError) {
      console.log(`FAIL (${updateError.message})`);
      failed++;
    } else {
      console.log(`OK → "${username}"`);
      updated++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\nDone. Updated: ${updated}, Failed/Skipped: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
