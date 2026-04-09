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
- **Trade Board is live** — player-to-player listings with full feature set (see below).
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
- Flip Queue, Rotation Picks, Session Intel, Risk Exposure, Daily GP Goal
- Portfolio page — period selector, win rate donut, per-item P&L, best/worst items
- Alerts page — price alerts, smart alert feed, clickable items open chart modal
- Changelog page + What's New modal (DEPLOY_KEY v5) — updated to v1.4, trimmed to user-facing entries only
- Login streak tracking + streak banner
- Shareable item URLs — `/item/abyssal-whip`
- Shareable flip cards — canvas-rendered card on profitable close
- Watchlist — sortable, Vol/Day + Last Trade columns, price chart access from row click

### Trade Board (fully shipped April 8, 2026)
- WTS/WTB listings with wiki item validation and 7-day auto-expiry
- k/m/b price shorthand input (100k, 2.5m, 1b) with live preview
- Compact price display — shows "2.5B gp" headline with exact amount below
- Categories: Weapons, Armour, 3rd Age, Runes, Ammunition, Potions, Food, Skilling Resources, Other
- Category auto-normalisation for legacy DB values
- Bundle only toggle per listing
- Bump listing button with 60-minute cooldown (stored in localStorage)
- Max 8 listings per user enforced client + server side
- Duplicate listing prevention (same item + type blocked)
- Discord "Message in Discord" button — copies pre-filled @mention message, opens trade channel (server: `1459412578999599216`, channel: `1491584732025065544`)
- Report listing modal with pre-set reasons → writes to `trade_reports` table
- Sort options: Newest first, Price low→high, Price high→low, Expiring soon
- WTB/WTS match indicator — badge on listing if counter-listing exists for same item
- Search bar, category filter panel, price range filter (with k/m/b support)
- Expiry progress bar per listing (green → amber → red)
- Realtime updates via Supabase postgres_changes (debounced 1s)
- New listing dot on Trade Board tab when unseen listings exist
- Remove confirmation dialog to prevent accidental deletion
- Self-contained bundle toggle (no App.js CSS dependency)
- Separate backdrop + modal pattern (fixes modal closing on field click)
- Remove listing confirmation dialog
- Total/Each toggle removed — multi-qty listings always show total with "X each" subtitle
- Filter panel redesigned — inline layout, no box, label/controls rows
- Category pills redesigned — borderless, warm gold active state
- Full null/error safety on all fields, sort, and display

### Flip Exclusion System (shipped April 8, 2026)
- "Exclude" toggle on open positions in tracker — removes from all stats
- Rule: cannot exclude a closed flip with negative profit (prevents stat gaming)
- Exclusion persisted to localStorage and Supabase `ge_flips_live`
- Filters `!f.excluded` applied to all 13 stat calculation sites:
  - Portfolio P&L chart, closed count badge, period stats
  - Tracker open/closed counts, Merchant Mode GE slots
  - Realised today, session summary, live GP tracker
  - Quest/daily progress, player card Total Profit + Flips count
- Info banner above open positions explaining the feature

### Header & Navigation (April 8, 2026)
- Alpha banner: slim green strip with ALPHA badge, What's New button, Send Feedback link — text bumped to 14px, buttons 13px
- Header top row: 68px, stronger gold border/shadow
- Nav tab row: 46px, 15px/600 font, visible border on hover, gold active state
- Trading Terminal: plain gold text in nav row far-right, intermittent `terminalTextGlow` pulse every 15s
- Upgrade to Pro button (blue, free users only) in nav row far-right
- Support Development link in nav row far-right — brightened to gold-light (#e8c96a), full opacity
- Player card button: avatar circle (30px, gold border), Lv.X in Cinzel 900, XP progress bar, quest count — avatar click opens profile dropdown, rest opens player card
- Profile dropdown: 15px username, plan status in green/gold/amber
- Settings X button added to close settings page
- AI bubble shifts right by 408px when player card is open

### Settings Page Rebuild (April 8, 2026)
- Sidebar nav + content panel layout (replaces stacked accordions)
- 6 sections: General, Alerts, RuneLite Plugin, Connections, Support Us, Account
- Smart Alert Types in dedicated group
- Support page with breakdown of what funding goes toward
- Danger Zone: red-bordered section for destructive actions
- Font sizes bumped throughout (nav 15px, titles 20px, row labels 15px)
- Mobile: sidebar collapses to horizontal tab bar

### UI Consistency Pass (April 8, 2026)
- Filter buttons in High Alch, Recipes, and Margin Watch bumped to match Market tab style — 14px, rounded pill, bg3 background
- Show unprofitable / hide no volume labels bumped to 14px

### Bug Fixes & Code Quality (April 8, 2026)
- `mapFlipRow` now carries `excluded` flag — survives page reload and Supabase re-sync
- `flip.item` null safety in ItemChart (`.toLowerCase()` guard)
- 21 raw `localStorage.setItem` calls → `safeSetItem` (Safari ITP / private browsing safety)
- `sessionStorage.getItem` wrapped in try/catch
- `buyLimit.toLocaleString()` null guard in AI context
- `AutoFlipHistory` exclusion: local `toggleExclude` fn, updates Supabase `ge_flips_live.excluded`
- `toggleFlipExclude` in main App suppressed (reserved for manual flip log)
- TradeBoard: 30+ bug fixes across null guards, sort stability, realtime debounce, category normalisation, input limits, bundle_only reset, clipboard guard, modal close fix

### Recipes Tab (shipped April 2026 — v1.3)
- GE Sets tab, Potion Decanting tab, Misc tab
- "Grand Exchange" label replaced with "GE Sets" for sets category
- Potion decanting items clickable to open price chart
- Disclaimer banner font bumped to 15px

### Market Tab Enhancements (April 2026)
- Filter bar simplified — All Items / F2P / Watchlist / 1gp Sales
- Personalised Picks fully reworked
- New Items badge — green NEW pill on items added in last 30 days

### UI / Typography (April 2026)
- Font upgrade: Cinzel Decorative for logo, DM Sans for body
- Logo `.gg` gold gradient, nav tabs 15px/600
- All dropdown items (Market sub-menu, profile dropdown) bumped to 15px/500

### Plugin Enhancements (shipped March 17, 2026)
- Sync pause / resume — Shift+P keybind + panel button
- Buy limit countdown overlays
- Drift alert overlays
- Flip recommendation panel
- Click-to-fill opt-in config toggle
- Actual fill price tracking

### API Endpoints (all live)
- `POST /api/sync-offers`, `POST /api/sync-pause`, `GET /api/plugin/picks`
- `POST /api/chat`, `POST /api/push-subscribe`
- `GET /api/prices`, `GET /api/prices-live`
- `POST /api/create-checkout`, `POST /api/webhook`
- `GET /api/og`, `GET /api/api-keys`, `POST /api/generate-api-key`
- `GET /api/check-alerts`, `POST /api/discord-verify`

### Supabase Schema
- `user_profiles`: `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `pro_expires_at`, `referral_count`, `lifetime_pro`, `trial_ends_at`, `ref_code`, `api_key`, `sync_paused`, `sync_paused_at`, `picks_prefs`, `discord_id`
- `trade_listings`: `user_id`, `item_name`, `item_image`, `type`, `price`, `quantity`, `notes`, `discord`, `rsn`, `category`, `bundle_only`, `active`, `expires_at`, `created_at`
- `trade_reports`: `listing_id`, `reporter_id`, `reason`
- `trader_xp`, `daily_quests`, `ge_offers`, `ge_flips_live` (with `excluded` column), `discord_verify_codes`

**Required SQL for Trade Board (run if not already done):**
```sql
ALTER TABLE trade_listings ADD COLUMN IF NOT EXISTS bundle_only boolean DEFAULT false;
ALTER TABLE trade_listings ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE ge_flips_live ADD COLUMN IF NOT EXISTS excluded boolean DEFAULT false;
```

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
- [ ] Exclusion toggle on manual flip log rows (toggleFlipExclude already wired, just needs UI)

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
> Discord Server ID: `1459412578999599216`  
> Discord Trade Channel ID: `1491584732025065544`  
> Discord Invite: https://discord.gg/runetrader  
> Vercel env vars: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `REACT_APP_ANTHROPIC_KEY`, `REACT_APP_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `CRON_SECRET`  
> Railway env vars: `DISCORD_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PREFIX`  
> Welcome banner imgur: https://i.imgur.com/ksDy6lV.png  
> Section header SVGs: saved locally as header-shipped.svg, header-coming-soon.svg, header-vision.svg
