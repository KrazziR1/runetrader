# RuneTrader.gg — Product Roadmap

> Last updated: March 2026  
> Stack: React CRA · Vercel · Supabase  
> Plugin Hub PR: https://github.com/runelite/plugin-hub/pull/11028

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
- Death's Coffer — savings, potential savings, target amount calculator (GE price × 0.75 fallback for items without store value, fixes items like Goading potions)
- Trade Board — WTS/WTB listings for rare items, wiki item validation, bulk pricing, 7-day expiry, category filters
- Flip Queue, Rotation Picks, Session Intel, Risk Exposure, Daily GP Goal
- Portfolio page — period selector, win rate donut, per-item P&L, best/worst items
- Alerts page — price alerts, smart alert feed, clickable items open chart modal
- Changelog page + What's New modal
- Login streak tracking + streak banner (fires on day 2+)
- Shareable item URLs — `/item/abyssal-whip` opens chart modal directly
- Shareable flip cards — canvas-rendered card on profitable close

### Engagement & Gamification
- **XP / Levelling system** — OSRS exact XP curve, levels 1–99, titles (Peasant → Tycoon → Max Cape), level-up modal with gold rays animation. Persists to Supabase `trader_xp`.
- **Daily quest system** — 3 quests/day (1 easy + 1 medium + 1 hard), deterministic per user+date, progress tracking, completion toasts. Persists to Supabase `daily_quests`.
- **Quest reroll** — spend 15 gold coins to reroll any incomplete quest. Same difficulty tier guaranteed.
- **Gold coins currency** — earned from completing quests (10/25/60 per difficulty). Spent on rerolls. Shown in Player Card and quest panels.
- **Player Card panel** — slide-in from right (click level badge in header). Shows avatar, username, title, streak, XP bar, total profit/flips/achievements stats, daily quests with reroll buttons, achievements grid.
- **Achievements** — First Blood, First Million, Whale, On a Roll, Getting Started, Veteran Trader, Max Cape, Dedicated, Diversified, Centurion. Unlocked via flipping activity.
- **Profit celebrations** — 📈 100k+, 🔥 1M+, 💎 10M+, 🐉 100M+
- **Login cinematic** — daily full-screen entry sequence: logo → quests deal in → market pulse item. Plays login chime.
- **First-login goal modal** — fires 2s after first sign-up. Grow GP / Learn to flip / Track history. Sets default Picks preferences.
- **Sound engine** — Web Audio API, zero external files. Coin clink, big profit, epic profit, level up, quest complete, nudge, login chime. Mute toggle persists.
- **Quest nudge banner** — fires at 50% progress on count-based quests.

### Navigation & UI
- Two-tier header: top bar (Live · Trading Terminal · 🔊 · Lv.X + quest count · Profile) + bottom nav (Flips · High Alch · Death's Coffer · Trade Board · Alerts | Watchlist · Settings · Refer & Earn)
- **"✨ Help me decide" button** in filter bar — opens 4-step Customize modal (cash stack → risk → speed → membership). Activates Picks mode on Flips table when saved.
- **Picks mode** — toggle on Flips table that filters items using same tier logic as Picks tab. Shows qualifying item count live.
- Tracker tab removed from nav (content accessible via Trading Terminal)
- Landing page redesign — "Trade Smarter. Profit More." headline, features, comparison table, plugin install steps
- Demo mode — 9-step guided tour with fake Trading Terminal data
- Demo end screen — fullscreen CTA "Ready to flip smarter?"
- Sparklines — 24hr margin trend canvas charts in Market table
- Watchlist — stores items with per-item price alerts
- Soft gates — Advanced Filters, CSV Export, Alert Thresholds show upgrade prompts

### Monetisation
- Stripe integration — $9.99/mo Pro tier (`price_1TAk4ECNKvvsYZxGopi1ANmE`)
- `api/create-checkout.js` — creates Stripe Checkout session, auto-applies referral coupon
- `api/webhook.js` — syncs `is_pro` to Supabase on subscription events
- Pricing page (`/pricing` tab) — Free vs Pro comparison, referral section, FAQ
- **3-day Pro trial** — new signups get `trial_ends_at` written to `user_profiles`. Trial status shown in profile dropdown ("⏳ Pro Trial — 2 days left"). Locks after 3 days.
- Referral system — 50% off first month, Pro for life at 3 referrals
- Referral coupon `sAvO4kCM`

### SEO
- `api/og.js` — dynamic OG meta tags for `/item/:slug`
- Discord/Reddit/Twitter previews show live item prices

### Supabase Schema
- `user_profiles`: `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `pro_expires_at`, `referral_count`, `lifetime_pro`, `referral_discount_used`, `pending_referral_discount`, `trial_ends_at`, `ref_code`
- `trade_listings`: `id`, `user_id`, `item_name`, `item_image`, `type`, `price`, `quantity`, `notes`, `discord`, `rsn`, `category`, `created_at`, `expires_at`, `active`
- `trader_xp`: `user_id`, `total_xp`, `level`, `achievements`, `updated_at`
- `daily_quests`: `user_id`, `quest_date`, `quests`, `gold_coins`, `updated_at`

---

## 🟢 Build Now (No Dependencies)

### Pro Gating (Pass 2 — next priority)
- [ ] **Gate Trading Terminal behind `isPro`** — currently still activates free
- [ ] **Gate quests + XP behind `isPro`** — free tier sees locked state with upgrade prompt
- [ ] **Pro welcome animation** — epic one-time full-screen ceremony on first Pro activation, shows perk list
- [ ] **Free vs Pro nav differences** — free tier gets: GE Market (Flips, High Alch, Death's Coffer, Trade Board), Watchlist, Alerts (read-only). Pro gets everything.

### Coin Shop
- [ ] **Profile titles** — spend coins to equip a title next to username (50–500 coins). "The Merchant", "Rune Runner", "Gold Hoarder" etc.
- [ ] **Streak insurance** — spend 30 coins to protect streak if you miss a day
- [ ] **Bonus XP boost** — spend 50 coins for 2× XP multiplier on next flip
- [ ] Coin shop UI in Player Card — "Spend Coins" section showing available/affordable items

### Market / Flips Page
- [ ] **Price alert from Market page** — bell icon on each row, sets alert without leaving page
- [ ] **"You've flipped this" badge** on rows where user has personal history
- [ ] **Category filters** — runes, food, armour, weapons, etc.
- [ ] **Margin History Chart** — margin as third line on item chart modal alongside buy/sell

### Growth
- [ ] Daily Digest AI Prompts — market pulse on login
- [ ] Blog / guides: *"How to flip Abyssal whip"*, *"Best F2P flips 2026"* — SEO content
- [ ] Discord Webhook Alerts — users paste webhook URL in Settings, alerts to their Discord server

### Future Tools
- [ ] **Margin Watch tab** — items whose margins moved most in the last hour
- [ ] **Item Compare** — pick 2-3 items side by side, compare margin/volume/ROI/history
- [ ] **Flip Planner** — "I have 50M and 4 slots, build me an optimal portfolio" (AI-driven)

---

## 🟡 Build at ~25 Plugin Users

### Price Truth (Real Trade Data Layer)
- [ ] Create Supabase `price_truth` view (aggregated real trade data)
- [ ] Fallback hierarchy: `price_truth` (if ≥2 recent trades) → Wiki `/latest`
- [ ] AI cites *"based on recent player trades"* only when price_truth data exists
- [ ] **Advertising claim unlocked:** *"Powered by real player trade data"*

### Scoring System Overhaul
- [ ] **GP/hr** — capital × ROI × cycles/day
- [ ] **Fill Speed** — volume-weighted, accounts for GE limit
- [ ] **Safety** — price stability, dump risk, tax efficiency

### Leaderboard / Public Profiles
- [ ] Opt-in public profile with nickname
- [ ] Weekly/monthly leaderboard (major retention driver)
- [ ] XP leaderboard — who's the highest level trader this week?

---

## 🔵 Build at Scale (100+ Users)

### GE Oracle
- [ ] Market intelligence using aggregated real trade data
- [ ] *"Average real margin: 12,400gp (vs Wiki estimate: 8,200gp)"*
- [ ] Main differentiator vs GE Tracker and Flipping Copilot

### Live Traders Counter
- [ ] *"847 merchants active right now"* — social proof on landing

### Community Features
- [ ] *"Most watched items"* — crowdsourced from Watchlist
- [ ] User-submitted flip tips per item
- [ ] Clan system — group leaderboards, shared watchlists

---

## 🤝 Community & Growth

### Discord
- [ ] Create RuneTrader Discord server ⏳ waiting
- [ ] Custom bot with real-time market alerts
- [ ] Bot posts "Flip of the Day" automatically
- [ ] Invite link prominent on site

### Plugin Hub (Critical Path)
- [ ] PR #11028 — awaiting human maintainer review ⏳
- [ ] **After merge:** marketing push — Reddit r/2007scape, flipping Discords, OSRS creators
- [ ] Milestone: 25 plugin users → activate price_truth

---

## 💡 Future Ideas (Unscoped)

- **Status page** — Wiki API uptime, plugin sync status, last data refresh
- **Price chart improvements** — volume bars, RSI, support/resistance levels
- **Mobile app** — React Native, push notifications for alerts
- **Portfolio Snapshot** — shareable read-only page showing positions and P&L
- **Best Time to Flip** — hold until 50+ users with trade history for accuracy
- **Skill trees** — unlock passive bonuses by reaching XP milestones (e.g. "Level 20: +10% XP from Medium quests")

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
