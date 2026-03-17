# RuneTrader.gg — Product Roadmap

> Last updated: March 17, 2026  
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
- Trading Terminal activation animation — "Entering the Market" with personal stats (level, streak, quests done)
- Active Operations table with live P&L, Autopilot per-slot rules
- Smart Alerts — Margin Spike, Volume Surge, Dump Detected, Price Crash
- Live Feed with badge filters and sort
- Market tab with 4,525 items — flat nav tabs: Flips / High Alch / Death's Coffer / Trade Board
- High Alch tracker — profit/cast, live + editable nature rune price
- Death's Coffer — savings, potential savings, target amount calculator
- Trade Board — WTS/WTB listings for rare items, wiki item validation, bulk pricing, 7-day expiry, category filters
- Flip Queue, Rotation Picks, Session Intel, Risk Exposure, Daily GP Goal
- Portfolio page — period selector, win rate donut, per-item P&L, best/worst items
- Alerts page — price alerts, smart alert feed, clickable items open chart modal
- Changelog page + What's New modal
- Login streak tracking + streak banner (fires on day 2+)
- Shareable item URLs — `/item/abyssal-whip` opens chart modal directly
- Shareable flip cards — canvas-rendered card on profitable close

### Plugin Enhancements (shipped March 17, 2026)
- **Sync pause / resume** — toggle button in plugin panel + `Shift+P` keybind stops all GE data from being sent. Designed for personal buys that shouldn't pollute flip tracker. Shows "RT PAUSED" overlay on GE screen. Auto-resumes after configurable timeout (default 60 min).
- **Buy limit countdown overlays** — displays countdown timer on each active GE slot showing when the 4-hour buy limit resets. Pure display, no automation.
- **Drift alert overlays** — when an active offer drifts from Wiki market price by configurable threshold (default 3%), shows badge with drift % and recommended relist price on the slot. Pure display, no automation.
- **Flip recommendation panel** — side panel showing top flip picks from runetrader.gg based on user's saved preferences (risk tier, cash stack, membership, flip speed). Updates every 60 seconds.
- **Click-to-fill** — opt-in config toggle (off by default). Clicking a suggested price types it into the focused GE field via `java.awt.Robot` keystrokes. Player still clicks Confirm themselves.
- **Actual fill price tracking** — uses `getSpent() / getQuantitySold()` to record true average fill price, not just offer price. More accurate profit calculations.
- **`/api/plugin-picks` endpoint** — serves tailored flip recommendations to the plugin. Reads user's saved picks prefs from Supabase, applies risk tier / cash stack / membership / flip speed filters, returns scored picks with suggested buy/sell prices and fill time estimates.
- **`/api/sync-pause` endpoint** — receives pause state from plugin, updates `sync_paused` in `user_profiles`. Website reads this to show/hide the amber banner.
- **Website sync paused banner** — amber banner below header when sync is paused, shows time since paused. "Resume tracking" button clears the pause state in Supabase.

### Engagement & Gamification
- **XP / Levelling system** — OSRS exact XP curve, levels 1–99, titles (Peasant → Tycoon → Max Cape), level-up modal with gold rays animation. Persists to Supabase `trader_xp`.
- **Daily quest system** — 3 quests/day (1 easy + 1 medium + 1 hard), deterministic per user+date, progress tracking, completion toasts. Persists to Supabase `daily_quests`.
- **Quest reroll** — spend 15 gold coins to reroll any incomplete quest. Same difficulty tier guaranteed.
- **Gold coins currency** — earned from completing quests (10/25/60 per difficulty). Spent on rerolls. Shown in Player Card and quest panels.
- **Player Card panel** — slide-in from right (click level badge in header). Shows avatar, username, title, streak, XP bar, total profit/flips/achievements stats, daily quests with reroll buttons, achievements grid.
- **Achievements** — First Blood, First Million, Whale, On a Roll, Getting Started, Veteran Trader, Max Cape, Dedicated, Diversified, Centurion.
- **Profit celebrations** — 📈 100k+, 🔥 1M+, 💎 10M+, 🐉 100M+
- **Login cinematic** — daily full-screen entry sequence: logo → quests deal in → market pulse item. Plays login chime.
- **First-login goal modal** — fires 2s after first sign-up. Sets default Picks preferences.
- **Sound engine** — Web Audio API, zero external files. Coin clink, big profit, epic profit, level up, quest complete, nudge, login chime. Mute toggle persists.
- **Quest nudge banner** — fires at 50% progress on count-based quests.

### Navigation & UI
- Two-tier header: top bar (Live · Trading Terminal · 🔊 · Lv.X + quest count · Profile) + bottom nav
- **"✨ Help me decide" button** — opens 4-step Customize modal, activates Picks mode
- **Picks mode** — filters Market table using same tier logic as Picks tab
- Landing page redesign — "Trade Smarter. Profit More." headline, features, comparison table, plugin install steps
- Demo mode — 9-step guided tour with fake Trading Terminal data
- Sparklines — 24hr margin trend canvas charts in Market table
- Watchlist — stores items with per-item price alerts
- Soft gates — Advanced Filters, CSV Export, Alert Thresholds show upgrade prompts
- **Error Boundary** — wraps entire app, shows branded recovery screen instead of white screen on crashes
- **Pro gate on Trading Terminal** — free users see upgrade modal + 🔒 lock icon on button

### Security & Stability (audited March 2026)
- Fixed cross-user data leak — `positions` and `flips` tables now filtered by `user_id`
- Fixed `/?upgrade=success` granting Pro without server verification
- Sign-out clears all 30+ user-specific state values including refs and achievements
- Login streak uses local timezone (not UTC) — prevents midnight streak breaks
- Sell/buy price validation rejects zero and negative values
- ROI division-by-zero guard when `buyPrice` is 0
- `picksPrefsForFilter` uses React state instead of stale localStorage reads
- Canvas renders guard against zero-dimension (3 charts)
- All 3 canvas renders have zero-dimension guard
- `marginHistoryRef` capped at 120 snapshots (prevents ~576MB memory growth)
- AI chat messages, smart events, toasts all capped
- 43 async functions wrapped in try/catch

### Monetisation
- Stripe integration — $9.99/mo Pro tier
- `api/create-checkout.js`, `api/webhook.js`
- Pricing page — Free vs Pro comparison, referral section, FAQ
- **3-day Pro trial** — new signups get `trial_ends_at` in `user_profiles`
- Referral system — 50% off first month, Pro for life at 3 referrals

### SEO
- `api/og.js` — dynamic OG meta tags for `/item/:slug`

### Supabase Schema
- `user_profiles`: `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `pro_expires_at`, `referral_count`, `lifetime_pro`, `referral_discount_used`, `pending_referral_discount`, `trial_ends_at`, `ref_code`, `sync_paused`, `sync_paused_at`, `picks_prefs`
- `trade_listings`: `id`, `user_id`, `item_name`, `item_image`, `type`, `price`, `quantity`, `notes`, `discord`, `rsn`, `category`, `created_at`, `expires_at`, `active`
- `trader_xp`: `user_id`, `total_xp`, `level`, `achievements`, `updated_at`
- `daily_quests`: `user_id`, `quest_date`, `quests`, `gold_coins`, `updated_at`
- `ge_offers`: live GE slot state per user
- `ge_flips_live`: completed flip history from plugin, includes `actual_buy_price`

---

## 🟢 Build Now (No Dependencies)

### New Tabs
- [ ] **Leaderboard tab** — anonymous nicknames only, real usernames never shown. Podium top 3, ranked table, "you" row highlighted. Categories: Total GP, Flips closed, Win rate, GP/hr, Best single flip. Time periods: This week / This month / All time. Nickname setup modal with privacy explanation, "Clear & hide me" opt-out. Mockup complete.
- [ ] **GE Limit Tracker tab** — log when you started buying an item, shows countdown to 4-hour reset per item. Replaces phone alarms and pen/paper tracking. Persists across sessions.
- [ ] **Tax Calculator tab** — buy price / sell price / quantity / buy limit inputs. Shows profit after tax, ROI, GP/hr estimate, flips needed to hit a GP goal.

### Pro Gating (Pass 2)
- [ ] **Gate quests + XP behind `isPro`** — free tier sees locked state with upgrade prompt
- [ ] **Pro welcome animation** — epic one-time full-screen ceremony on first Pro activation
- [ ] **Free vs Pro nav differences** — free tier: GE Market, Watchlist, Alerts (read-only). Pro: everything.

### Coin Shop
- [ ] **Profile titles** — spend coins to equip a title (50–500 coins)
- [ ] **Streak insurance** — spend 30 coins to protect streak if you miss a day
- [ ] **Bonus XP boost** — spend 50 coins for 2× XP on next flip
- [ ] Coin shop UI in Player Card

### Market / Flips Page
- [ ] **Price alert from Market page** — bell icon on each row
- [ ] **"You've flipped this" badge** on rows with personal history
- [ ] **Category filters** — runes, food, armour, weapons, etc.
- [ ] **Margin History Chart** — margin as third line on item chart modal

### Growth
- [ ] Daily Digest AI Prompts — market pulse on login
- [ ] Blog / guides — SEO content
- [ ] Discord Webhook Alerts — users paste webhook URL in Settings

### Plugin (Next PRs — submit after #11114 is reviewed)
- [ ] **PR 2** — buy limit countdowns + drift overlay as standalone (already in codebase, needs separate PR for review clarity)
- [ ] **PR 3** — recommendation panel display-only
- [ ] **PR 4** — click-to-fill opt-in toggle
- [ ] **PR 5** — actual fill price (schema: `ge_flips_live.actual_buy_price`)

---

## 🟡 Build at ~25 Plugin Users

### Price Truth (Real Trade Data Layer)
- [ ] Create Supabase `price_truth` view
- [ ] Fallback hierarchy: `price_truth` → Wiki `/latest`
- [ ] AI cites *"based on recent player trades"* only when price_truth data exists

### Scoring System Overhaul
- [ ] GP/hr, Fill Speed, Safety scoring

### Leaderboard Backend
- [ ] Aggregate stats from `ge_flips_live` for leaderboard queries
- [ ] Nickname stored in `user_profiles.leaderboard_nickname`
- [ ] Opt-out flag `leaderboard_hidden`

---

## 🔵 Build at Scale (100+ Users)

### GE Oracle
- [ ] Market intelligence using aggregated real trade data
- [ ] Main differentiator vs GE Tracker and Flipping Copilot

### Live Traders Counter
- [ ] *"847 merchants active right now"* — social proof on landing

### Community Features
- [ ] *"Most watched items"* — crowdsourced from Watchlist
- [ ] Clan system — group leaderboards, shared watchlists

---

## 🤝 Community & Growth

### Discord
- [ ] Create RuneTrader Discord server ⏳ waiting
- [ ] Custom bot with real-time market alerts
- [ ] Bot posts "Flip of the Day" automatically

### Plugin Hub (Critical Path)
- [x] PR #11028 — closed, superseded by #11114
- [ ] PR #11114 — awaiting maintainer review ⏳
- [ ] **After merge:** marketing push — Reddit r/2007scape, flipping Discords, OSRS creators
- [ ] Milestone: 25 plugin users → activate price_truth

---

## 💡 Future Ideas (Unscoped)

- **Status page** — Wiki API uptime, plugin sync status, last data refresh
- **Price chart improvements** — volume bars, RSI, support/resistance levels
- **Mobile app** — React Native, push notifications for alerts
- **Portfolio Snapshot** — shareable read-only page showing positions and P&L
- **Best Time to Flip** — needs 50+ users with trade history
- **Skill trees** — unlock passive bonuses by reaching XP milestones

---

## 🗂 How to Use This Doc in Future Chats

Paste this file at the start of any new Claude conversation to restore full context. Claude will know:
- What's been built
- What's planned and why
- The user base thresholds for each feature
- The architecture decisions already made

> Repo: https://github.com/KrazziR1/runetrader  
> Plugin: https://github.com/KrazziR1/runetrader-plugin  
> Live: https://www.runetrader.gg  
> User ID: `338ff3a1-1ffa-4b39-9d5a-58d4475536fa`  
> Stripe Price ID: `price_1TAk4ECNKvvsYZxGopi1ANmE`  
> Stripe Referral Coupon: `sAvO4kCM`  
> Plugin Hub PR: https://github.com/runelite/plugin-hub/pull/11114
