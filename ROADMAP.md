# RuneTrader.gg — Product Roadmap

> Last updated: March 30, 2026  
> Stack: React CRA · Vercel · Supabase  
> Plugin Hub PR: https://github.com/runelite/plugin-hub/pull/11114

---

## 🔑 Key Context

- **You are currently the only plugin user.** Features that depend on real trade data need ~25+ users before they're meaningful.
- **Trading Terminal** (formerly Merchant Mode) is the flagship Pro feature — a self-contained trading terminal, gated behind Stripe subscription.
- **The AI Advisor** already has live slot context. It will get smarter as the user base grows.
- **Price truth architecture** is designed and ready — just waiting on user growth to activate.
- **Stripe is live** — $9.99/mo Pro tier, checkout flow, webhook handler, referral coupon `sAvO4kCM`.
- **Referral system is live** — 50% off first month for both sides, Pro for life at 3 converted referrals.
- **Trade Board is live** — player-to-player listings for rare/above-max-cash items. Wiki item validation, 7-day auto-expiry, Discord/RSN contact.
- **3-day Pro trial** — new signups automatically get full Pro access for 3 days via `trial_ends_at` in `user_profiles`.
- **Rune Trader Discord Bot is live** — Python/discord.py bot hosted on Railway, connected to Supabase. GitHub: https://github.com/KrazziR1/rune-trader-bot
- **Discord server is live** — full server structure set up with welcome, rules, FAQ, roadmap, connect, announcements, general, flipping, bot, pro, support, and staff sections.

---

## ✅ Already Shipped

### Core Platform
- Live GE slot tracking via RuneLite plugin
- Slot drift alerts (warns when your offer price drifts from market)
- AI Advisor with live slot context (knows your active offers)
- AI Advisor personalised welcome message based on user goal + streak
- AI Advisor reads user's Picks preferences and pre-filters qualifying items
- Trading Terminal (formerly Merchant Mode) — Operations, Analytics, Market, Alerts tabs
- Trading Terminal tutorial tour
- Trading Terminal activation animation — "Entering the Market" with personal stats
- Active Operations table with live P&L, Autopilot per-slot rules
- Smart Alerts — Margin Spike, Volume Surge, Dump Detected, Price Crash
- Live Feed with badge filters and sort
- Market tab with 4,525 items — Flips / High Alch / Death's Coffer / Trade Board
- High Alch tracker — profit/cast, live + editable nature rune price
- Death's Coffer — savings, potential savings, target amount calculator
- Trade Board — WTS/WTB listings, wiki item validation, 7-day expiry, category filters
- Flip Queue, Rotation Picks, Session Intel, Risk Exposure, Daily GP Goal
- Portfolio page — period selector, win rate donut, per-item P&L, best/worst items
- Alerts page — price alerts, smart alert feed, clickable items open chart modal
- Changelog page + What's New modal (DEPLOY_KEY v4, shows v1.2 on next login)
- Login streak tracking + streak banner
- Shareable item URLs — `/item/abyssal-whip`
- Shareable flip cards — canvas-rendered card on profitable close

### Plugin Enhancements (shipped March 17, 2026)
- **Sync pause / resume** — Shift+P keybind + panel button. Shows "RT PAUSED" on GE screen. Auto-resumes after configurable timeout (default 60 min). Pushes state to website via `/api/sync-pause`.
- **Buy limit countdown overlays** — live countdown on each GE slot for 4-hour buy limit reset. Pure display.
- **Drift alert overlays** — badge on slot when offer drifts from Wiki price. Shows drift % and relist price. Pure display.
- **Flip recommendation panel** — side panel with personalised top picks from runetrader.gg. Updates every 60 seconds.
- **Click-to-fill** — opt-in config toggle (off by default). Uses `java.awt.Robot` keystrokes. Player still clicks Confirm.
- **Actual fill price tracking** — uses `getSpent() / getQuantitySold()` for true average fill price.

### API Endpoints (all live, all authenticated via `rt_` API key)
- `POST /api/sync-offers` — receives GE offer data from plugin
- `POST /api/sync-pause` — receives pause state from plugin, updates `user_profiles.sync_paused`
- `GET /api/plugin/picks` — personalised flip recommendations. Reads `picks_prefs` from Supabase. Returns scored picks with suggested prices, qty, margin, ROI, fill time.
- `POST /api/chat` — AI Advisor
- `POST /api/push-subscribe` — push notifications
- `GET /api/prices` + `GET /api/prices-live` — Wiki prices
- `POST /api/create-checkout` + `POST /api/webhook` — Stripe
- `GET /api/og` — dynamic OG meta tags
- `GET /api/api-keys` + `POST /api/generate-api-key` — API key management
- `GET /api/check-alerts` — alert checking cron
- `POST /api/discord-verify` — links Discord account to Rune Trader profile via one-time code

### Website — Discord Integration (shipped March 30, 2026)
- Discord section added to Settings page
- User runs `!verify` in Discord → bot DMs a one-time code (format `RT-XXXXXX`)
- User enters code on runetrader.gg → Settings → Discord → Link Account
- Website calls `/api/discord-verify` → validates code, links `discord_id` to `user_profiles`
- Code stored in `discord_verify_codes` table, expires after 10 minutes, deleted on use
- Settings page shows "✅ Discord account linked" state after successful link

### Discord Bot (shipped March 30, 2026)
- Built from scratch in Python/discord.py, hosted on Railway, auto-deploys from GitHub
- Cog-based architecture: `price.py`, `flips.py`, `stats.py`, `admin.py`, `verify.py`, `panels.py`
- Connected to Supabase (`rune_trader` database) — shares data with the website
- Commands live:
  - `!price <item>` — live GE buy/sell price, margin, tax, ROI, buy limit from OSRS Wiki API
  - `!tax <price> [qty]` — GE tax calculator
  - `!stats <username>` — OSRS hiscores lookup
  - `!kc <username>` — boss kill count lookup
  - `!myflips [@member]` — flip history from `ge_flips_live`
  - `!fliplb` — flip profit leaderboard
  - `!announce <message>` — admin announcement embed
  - `!ping` — bot latency check
  - `!verify` — generates one-time code, DMs it to user for website account linking
  - `!linked` — checks if Discord account is linked to Rune Trader
  - `!welcomepanel` — posts the full welcome panel to #welcome
  - `!verifypanel` — posts the connect Discord panel
  - `!rulespanel` — posts the server rules panel
  - `!faqpanel` — posts the FAQ panel
  - `!roadmappanel` — posts the roadmap panel

### Discord Server (set up March 30, 2026)
- Full server structure with categories and channels
- Welcome panel, rules panel, FAQ panel, roadmap panel all live
- Custom Rune Trader welcome banner image
- Channel structure: Information · Get Started · Community · Flipping · Bot · Pro · Support · Staff

### Supabase Schema
- `user_profiles`: `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `pro_expires_at`, `referral_count`, `lifetime_pro`, `trial_ends_at`, `ref_code`, `api_key`, `sync_paused`, `sync_paused_at`, `picks_prefs`, `discord_id`
- `trade_listings`: `id`, `user_id`, `item_name`, `item_image`, `type`, `price`, `quantity`, `notes`, `discord`, `rsn`, `category`, `created_at`, `expires_at`, `active`
- `trader_xp`: `user_id`, `total_xp`, `level`, `achievements`, `updated_at`
- `daily_quests`: `user_id`, `quest_date`, `quests`, `gold_coins`, `updated_at`
- `ge_offers`: live GE slot state per user
- `ge_flips_live`: completed flip history from plugin
- `discord_verify_codes`: `discord_id`, `code`, `created_at` — temporary one-time verify codes, deleted on use

---

## 🟢 Build Now (No Dependencies)

### Discord Bot — Next Features
- [ ] `!myflips` — rewrite to read from `ge_flips_live` in Supabase (requires Discord account linked)
- [ ] `!fliplb` — rewrite to aggregate from `ge_flips_live` in Supabase
- [ ] Price alert system — `!alert <item> <price>` notifies user in Discord when price is hit
- [ ] Flip of the Day — bot auto-posts best flip opportunity daily to a designated channel
- [ ] Update all embed styling to match dark gold Rune Trader theme across all commands
- [ ] Roadmap panel visual redesign — header images for each section (SVGs ready, need imgur hosting)

### New Website Tabs
- [ ] **Leaderboard tab** — anonymous nicknames only, real usernames never shown. Podium top 3, ranked table, "you" row highlighted. Categories: Total GP, Flips closed, Win rate, GP/hr, Best single flip. Time periods: This week / This month / All time. Nickname setup modal with "Clear & hide me" opt-out. Mockup already designed.
- [ ] **GE Limit Tracker tab** — log when you started buying an item, countdown to 4-hour reset per item. Replaces phone alarms and pen/paper. Persists across sessions.
- [ ] **Tax Calculator tab** — buy/sell price, quantity, buy limit inputs. Shows profit after tax, ROI, GP/hr estimate, flips needed to hit a GP goal.

### Pro Gating (Pass 2)
- [ ] Gate quests + XP behind `isPro` — free tier sees locked state with upgrade prompt
- [ ] Pro welcome animation — epic one-time full-screen ceremony on first Pro activation
- [ ] Free vs Pro nav differences — free: GE Market, Watchlist, Alerts (read-only). Pro: everything.

### Coin Shop
- [ ] Profile titles — spend coins to equip a title (50–500 coins)
- [ ] Streak insurance — spend 30 coins to protect streak if you miss a day
- [ ] Bonus XP boost — spend 50 coins for 2× XP on next flip
- [ ] Coin shop UI in Player Card

### Market / Flips Page
- [ ] Price alert from Market page — bell icon on each row
- [ ] "You've flipped this" badge on rows with personal history
- [ ] Margin History Chart — margin as third line on item chart modal

### Growth
- [ ] Daily Digest AI Prompts — market pulse on login
- [ ] Blog / guides — SEO content
- [ ] Discord Webhook Alerts — users paste webhook URL in Settings

### Plugin (Next PRs — submit after #11114 reviewed)
- [ ] PR 2 — buy limit countdowns + drift overlay (pure display, zero compliance risk)
- [ ] PR 3 — recommendation panel display-only
- [ ] PR 4 — click-to-fill opt-in toggle
- [ ] Update README.md in plugin repo with new features

---

## 🟡 Build at ~25 Plugin Users

### Price Truth (Real Trade Data Layer)
- [ ] Create Supabase `price_truth` view
- [ ] Fallback: `price_truth` (if ≥2 recent trades) → Wiki `/latest`
- [ ] AI cites "based on recent player trades" only when price_truth exists
- [ ] Unlocks advertising claim: "Powered by real player trade data"

### Scoring System Overhaul
- [ ] GP/hr, Fill Speed, Safety scoring

### Leaderboard Backend
- [ ] Aggregate stats from `ge_flips_live`
- [ ] `user_profiles.leaderboard_nickname` + `leaderboard_hidden` columns

---

## 🔵 Build at Scale (100+ Users)

### GE Oracle
- [ ] Market intelligence from aggregated real trade data
- [ ] Main differentiator vs GE Tracker and Flipping Copilot

### Live Traders Counter
- [ ] "847 merchants active right now" — social proof on landing

### Community Features
- [ ] "Most watched items" — crowdsourced from Watchlist
- [ ] Group leaderboards — shared watchlists, flip competitions

---

## 🤝 Community & Growth

### Discord
- [x] Rune Trader Discord server live — full structure, panels, and bot connected
- [x] Rune Trader Discord Bot live — Railway hosted, GitHub: https://github.com/KrazziR1/rune-trader-bot
- [ ] Bot posts "Flip of the Day" automatically
- [ ] Price alert notifications via Discord DM

### Plugin Hub (Critical Path)
- [x] PR #11028 — closed, superseded by #11114
- [ ] PR #11114 — awaiting maintainer review ⏳
- [ ] **After merge:** marketing push — Reddit r/2007scape, flipping Discords, OSRS creators
- [ ] Milestone: 25 plugin users → activate price_truth

---

## 💡 Future Ideas (Unscoped)

- Status page — Wiki API uptime, plugin sync status, last data refresh
- Price chart improvements — volume bars, RSI, support/resistance levels
- Mobile app — React Native, push notifications for alerts
- Portfolio Snapshot — shareable read-only page
- Best Time to Flip — needs 50+ users with trade history

---

## 🗂 How to Use This Doc in Future Chats

Paste this file at the start of any new Claude conversation to restore full context. Claude will know:
- What's been built and deployed
- What's planned and why
- The user base thresholds for each feature
- The architecture decisions already made

> Repo: https://github.com/KrazziR1/runetrader  
> Bot Repo: https://github.com/KrazziR1/rune-trader-bot  
> Plugin: https://github.com/KrazziR1/runetrader-plugin  
> Live: https://www.runetrader.gg  
> User ID: `338ff3a1-1ffa-4b39-9d5a-58d4475536fa`  
> Stripe Price ID: `price_1TAk4ECNKvvsYZxGopi1ANmE`  
> Stripe Referral Coupon: `sAvO4kCM`  
> Plugin Hub PR: https://github.com/runelite/plugin-hub/pull/11114  
> Vercel env vars: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `REACT_APP_ANTHROPIC_KEY`, `REACT_APP_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `CRON_SECRET`  
> Railway env vars: `DISCORD_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PREFIX`  
> Welcome banner imgur: https://i.imgur.com/ksDy6lV.png  
> Section header SVGs: saved locally as header-shipped.svg, header-coming-soon.svg, header-vision.svg
