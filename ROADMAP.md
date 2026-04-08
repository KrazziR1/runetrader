# RuneTrader.gg — Product Roadmap

> Last updated: April 8, 2026  
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
- Market tab with 4,525 items — Flips / High Alch / Death's Coffer / Recipes / Trade Board
- High Alch tracker — profit/cast, live + editable nature rune price, F2P/Members filter, Vol/Day column
- Death's Coffer — Margin column, Max Savings/4hr, Vol/Day column, target amount calculator
- Trade Board — WTS/WTB listings, wiki item validation, 7-day expiry, category filters
- Flip Queue, Rotation Picks, Session Intel, Risk Exposure, Daily GP Goal
- Portfolio page — period selector, win rate donut, per-item P&L, best/worst items
- Alerts page — price alerts, smart alert feed, clickable items open chart modal
- Changelog page + What's New modal (DEPLOY_KEY v5, shows v1.3 on next login)
- Login streak tracking + streak banner
- Shareable item URLs — `/item/abyssal-whip`
- Shareable flip cards — canvas-rendered card on profitable close
- Watchlist — sortable, Vol/Day + Last Trade columns, price chart access from row click

### Recipes Tab (shipped April 2026 — v1.3)
- GE Sets tab — ~110 sets, Making/Breaking direction toggle, live profit/ROI/Vol/Day
- Potion Decanting tab — all major potions, dose direction filter, grouped by potion with collapse/expand
- Misc tab — flatpacks (construction), unstrung bows (fletching), uncut gems (crafting), cannonballs (smithing), charged jewelry arbitrage
- Per-recipe expandable breakdown panel — individual item buy/sell price, GE limit, Vol/Day, Last Trade; all items clickable to open price chart
- Vol/Day column — green/gold/red color coding, lowest-volume item in recipe
- Last Trade column — green < 1hr, orange < 24hr, red > 24hr
- ⚠ Stale badge — hoverable warning when any recipe item hasn't traded in 24hrs+
- Advanced filters panel — F2P/Members, hide no volume, min profit, min ROI, min vol
- Profitable only toggle (default on), search box far-right, results count
- Context-sensitive direction sub-filters (Making/Breaking for sets, Low→High dose / High→Low dose for potions, skill filter for misc)
- Data disclaimer banner explaining wiki data freshness
- NEW badge on Recipes nav tab

### Market Tab Enhancements (April 2026)
- Filter bar simplified — All Items / F2P / Watchlist / 1gp Sales only (Members + High Volume moved to ⚙ Filters panel)
- Personalised Picks banner — Edit prefs + Show all items as inline text links, no separate button cluster
- New Items badge — green NEW pill on items added to the GE in the last 30 days (30-day TTL, persists in localStorage)
- Profile dropdown — outside-click backdrop to close

### High Alch Enhancements (April 2026)
- F2P / Members / All filter added
- Vol/Day column with green/gold/red color coding
- Last Trade column with staleness colors
- Default sort changed to Max Profit/4hr
- Buy limit "?" now hoverable with tooltip explaining why it's unknown

### Death's Coffer Enhancements (April 2026)
- Vol/Day column added
- "Savings" renamed to "Margin", "Potential Savings" renamed to "Max Savings / 4hr"
- Typo fixed ("Taget" → "Target")

### Watchlist Enhancements (April 2026)
- Vol/Day column added (sortable)
- Last Trade column added (sortable, staleness colors)

### UI / Typography (April 2026)
- Font upgrade: **Cinzel Decorative** for logo, **DM Sans** for all body text (replaces Inter)
- Logo `.gg` now uses same gold gradient as "RuneTrader", rendered crisply in Cinzel Decorative
- `--text` bumped to `#eef0f2`, `--text-dim` bumped to `#a8bccb` for better contrast
- Nav tab font size bumped to 14px/600 weight
- Filter bar buttons (Search, Filters, Refresh, Export) bumped to 14px/600 weight
- Table headers bumped from 11px to 12px across market, recipe, margin watch
- Sort buttons bumped from 11px to 12px
- Item count labels, results counts, filter labels all bumped from 11–12px to 13–14px
- Help me decide button bumped from 12px to 14px
- "Settings" / "Refer & Earn" inline size override removed (now inherits 14px nav-tab)

### Plugin Enhancements (shipped March 17, 2026)
- **Sync pause / resume** — Shift+P keybind + panel button
- **Buy limit countdown overlays** — live countdown on each GE slot
- **Drift alert overlays** — badge on slot when offer drifts from Wiki price
- **Flip recommendation panel** — side panel with personalised top picks
- **Click-to-fill** — opt-in config toggle (off by default)
- **Actual fill price tracking** — uses `getSpent() / getQuantitySold()`

### API Endpoints (all live)
- `POST /api/sync-offers`, `POST /api/sync-pause`, `GET /api/plugin/picks`
- `POST /api/chat`, `POST /api/push-subscribe`
- `GET /api/prices`, `GET /api/prices-live`
- `POST /api/create-checkout`, `POST /api/webhook`
- `GET /api/og`, `GET /api/api-keys`, `POST /api/generate-api-key`
- `GET /api/check-alerts`, `POST /api/discord-verify`

### Website — Discord Integration (shipped March 30, 2026)
- Discord section in Settings, one-time `RT-XXXXXX` code verification flow
- `/api/discord-verify` endpoint, `discord_verify_codes` table

### Discord Bot (shipped March 30, 2026)
- Python/discord.py, Railway hosted, Supabase connected
- Commands: `!price`, `!tax`, `!stats`, `!kc`, `!myflips`, `!fliplb`, `!announce`, `!ping`, `!verify`, `!linked`, panel commands

### Discord Server (set up March 30, 2026)
- Full server structure, welcome/rules/FAQ/roadmap panels live

### Supabase Schema
- `user_profiles`: `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `pro_expires_at`, `referral_count`, `lifetime_pro`, `trial_ends_at`, `ref_code`, `api_key`, `sync_paused`, `sync_paused_at`, `picks_prefs`, `discord_id`
- `trade_listings`, `trader_xp`, `daily_quests`, `ge_offers`, `ge_flips_live`, `discord_verify_codes`

---

## 🟢 Build Now (No Dependencies)

### New Website Tabs
- [ ] **Leaderboard tab** — anonymous nicknames only. Podium top 3, ranked table, "you" row highlighted. Categories: Total GP, Flips closed, Win rate, GP/hr, Best single flip. Time periods: This week / This month / All time. Nickname setup modal with opt-out. Mockup already designed.
- [ ] **Tax Calculator tab** — buy/sell price, quantity, buy limit inputs. Profit after tax, ROI, GP/hr estimate, flips needed to hit a GP goal.

### Discord Bot — Next Features
- [ ] `!myflips` — rewrite to read from `ge_flips_live` in Supabase (requires Discord account linked)
- [ ] `!fliplb` — rewrite to aggregate from `ge_flips_live` in Supabase
- [ ] Price alert system — `!alert <item> <price>` notifies user in Discord when price is hit
- [ ] Flip of the Day — bot auto-posts best flip opportunity daily to a designated channel
- [ ] Update all embed styling to match dark gold Rune Trader theme
- [ ] Roadmap panel visual redesign — header images for each section

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
- [ ] "You've flipped this" badge on rows with personal history
- [ ] Margin History Chart — margin as third line on item chart modal

### Growth
- [ ] Daily Digest AI Prompts — market pulse on login
- [ ] Blog / guides — SEO content
- [ ] Discord Webhook Alerts — users paste webhook URL in Settings

### Plugin (Next PRs — submit after #11114 reviewed)
- [ ] PR 2 — buy limit countdowns + drift overlay
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
- Profit per 4hr cycle on Recipes — profit × buy limit ÷ 4
- Mobile layout pass — site layout not optimised for small screens

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
