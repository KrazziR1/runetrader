# RuneTrader.gg — Product Roadmap

> Last updated: March 2026  
> Stack: React CRA · Vercel · Supabase  
> Plugin Hub PR: https://github.com/runelite/plugin-hub/pull/11028

---

## 🔑 Key Context

- **You are currently the only plugin user.** Features that depend on real trade data need ~25+ users before they're meaningful.
- **Merchant Mode** is the flagship Pro feature — a self-contained trading terminal, gated behind Stripe subscription.
- **The AI Advisor** already has live slot context. It will get smarter as the user base grows.
- **Price truth architecture** is designed and ready — just waiting on user growth to activate.
- **Stripe is live** — $9.99/mo Pro tier, checkout flow, webhook handler, referral coupon `sAvO4kCM`.
- **Referral system is live** — 50% off first month for both sides, Pro for life at 10 converted referrals.

---

## ✅ Already Shipped

### Core Platform
- Live GE slot tracking via RuneLite plugin
- Slot drift alerts (warns when your offer price drifts from market)
- AI Advisor with live slot context (knows your active offers)
- Merchant Mode with activation/shutdown animations
- Merchant Mode tutorial tour
- Merchant Mode — Operations, Analytics, Market, Alerts tabs
- Active Operations table with live P&L, Autopilot per-slot rules
- Smart Alerts — Margin Spike, Volume Surge, Dump Detected, Price Crash
- Live Feed with badge filters and sort
- Market tab with 4,525 items — Flips / High Alch / Death's Coffer sub-tabs
- High Alch tracker — profit/cast, live + editable nature rune price
- Death's Coffer — savings, potential savings, target amount calculator
- Flip Queue, Rotation Picks, Session Intel, Risk Exposure, Daily GP Goal
- Tracker page with profit chart, live GE slots, flip history
- Portfolio page — period selector, win rate donut, per-item P&L, best/worst items
- Alerts page — price alerts, smart alert feed, clickable items open chart modal
- Changelog page + What's New modal
- Login streak tracking
- Shareable item URLs — `/item/abyssal-whip` opens chart modal directly
- Shareable flip cards — canvas-rendered card on profitable close (Merchant Mode)

### UI / UX
- Landing page redesign — hero, features, comparison table, plugin install steps, pricing section
- "Explore Demo ↗" button on landing — triggers guided tour
- Demo mode — 9-step guided tour with fake Merchant Mode data (fake positions, P&L, ops)
- Dramatic Merchant Mode intro animation during demo tour step 6
- Demo end screen — fullscreen CTA "Ready to flip smarter?"
- Market sub-tabs (Flips / High Alch / Death's Coffer) moved to header center
- Sparklines — 24hr margin trend canvas charts in Market table + Merchant Mode Market tab
- Watchlist tab — replaces ⭐ Favourites, stores items with per-item price alerts
- Watchlist button in item chart modal (replaces "Log this flip")
- 📈 emoji replaces ⚔️ throughout (finance/chart theme)
- "Enter the GE →" replaces "Launch App →" on landing
- Font sizes bumped across the app (15px base, 14px table cells)
- Soft gates — Advanced Filters, CSV Export, Alert Thresholds show upgrade prompts

### Monetisation
- Stripe integration — $9.99/mo Pro tier (`price_1TAk4ECNKvvsYZxGopi1ANmE`)
- `api/create-checkout.js` — creates Stripe Checkout session, auto-applies referral coupon
- `api/webhook.js` — syncs `is_pro` to Supabase on subscription events
- Pricing page (`/pricing` tab) — Free vs Pro comparison, FAQ
- Upgrade modal CTA routes to pricing page
- `?upgrade=success` redirect handler — fires toast, sets isPro in UI
- Referral system — `?ref=CODE` captured, stored in localStorage, written to `referrals` table on sign-up
- Referral coupon `sAvO4kCM` — 50% off first month, applied once per account
- Refer 10 friends → `lifetime_pro = true` → Pro free forever, Stripe subscription cancelled
- Safety net — `invoice.payment_succeeded` webhook cancels subscription for lifetime_pro users
- Referral tab UI (`ReferralPage.js`) — ref link, copy button, Discord/Reddit share, stats, progress bar, history

### SEO
- `api/og.js` — Vercel serverless function serving dynamic OG meta tags for `/item/:slug`
- Bot user-agent detection in `vercel.json` routes crawlers to OG function
- Discord/Reddit/Twitter previews show live item prices (full numbers, not abbreviated)

### Supabase Schema Additions
- `user_profiles`: `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `pro_expires_at`, `referral_count`, `lifetime_pro`, `referral_discount_used`

---

## 🟢 Build Now (No Dependencies)

### Market / Flips Page
- [ ] **Price alert from Market page** — bell icon on each row, sets alert without leaving page
- [ ] **"You've flipped this" badge** on rows where user has personal history
- [ ] **Category filters** — runes, food, armour, weapons, etc.

### Growth
- [ ] Gate Merchant Mode behind `isPro` check (currently still activates free)
- [ ] Daily Digest AI Prompts — market pulse on login
- [ ] Blog / guides: *"How to flip Abyssal whip"*, *"Best F2P flips 2026"* — SEO content

---

## 🟡 Build at ~25 Plugin Users

### Price Truth (Real Trade Data Layer)
- [ ] Create Supabase view:
```sql
CREATE VIEW price_truth AS
SELECT item_name,
  AVG(buy_price) AS real_buy,
  AVG(sell_price) AS real_sell,
  AVG(sell_price - buy_price) AS real_margin,
  COUNT(*) AS trade_count,
  MAX(sell_completed_at) AS last_seen
FROM ge_flips_live
WHERE status = 'SOLD'
  AND sell_completed_at > NOW() - INTERVAL '2 hours'
  AND buy_price > 0 AND sell_price > 0
GROUP BY item_name
HAVING COUNT(*) >= 2;
```
- [ ] Fallback hierarchy: `price_truth` (if ≥2 recent trades) → Wiki `/latest`
- [ ] AI cites *"based on recent player trades"* only when price_truth data exists
- [ ] **Advertising claim unlocked:** *"Powered by real player trade data"*

### Scoring System Overhaul
Current `getScore()` issues:
- GE tax (2%) not penalising items that barely clear threshold
- Liquidity ratio conflates high-volume/low-limit vs low-volume/high-limit
- Fill rate assumptions too optimistic at mid-volume
- Score ceiling is 85 but displayed as /100 — confusing

**Proposed fix:** Replace single score with 3 signals:
- [ ] **GP/hr** — capital × ROI × cycles/day
- [ ] **Fill Speed** — volume-weighted, accounts for GE limit
- [ ] **Safety** — price stability, dump risk, tax efficiency

### Leaderboard / Public Profiles
- [ ] Opt-in public profile with nickname (no real usernames — avoid targeting)
- [ ] Total profit, best items, flip count
- [ ] Weekly/monthly leaderboard
- [ ] Major retention driver — people come back to maintain rank

---

## 🔵 Build at Scale (100+ Users)

### GE Oracle
- [ ] Market intelligence layer using aggregated real trade data
- [ ] *"1,247 players checked this item in the last hour"*
- [ ] *"Average real margin: 12,400gp (vs Wiki estimate: 8,200gp)"*
- [ ] *"Fill time based on real data: ~4 minutes"*
- [ ] **Requires critical mass** — misleading without enough data
- [ ] Main differentiator vs GE Tracker and Flipping Copilot

### Live Traders Counter
- [ ] *"847 merchants active right now"*
- [ ] Quick win once user base exists — social proof on landing page

### Community Features
- [ ] *"Most watched items"* — crowdsourced from Watchlist
- [ ] User-submitted flip tips per item
- [ ] Community watchlist — items lots of users have starred

### Analytics / Stats Page
- [ ] Profit over time chart (daily/weekly/monthly)
- [ ] Best performing items historically
- [ ] Flip win rate, avg ROI, avg hold time
- [ ] Capital efficiency over time

---

## 🤝 Community & Growth

### Discord
- [ ] Create RuneTrader Discord server ⏳ waiting
- [ ] **Custom bot** with real-time market alerts (margin spikes, dumps, crashes)
- [ ] Bot posts "Flip of the Day" automatically from site data
- [ ] Bot integrates with price_truth when available
- [ ] Invite link prominent on site

### Plugin Hub (Critical Path)
- [ ] PR #11028 — awaiting human maintainer review ⏳
- [ ] **After merge:** marketing push to OSRS flipping communities
  - Reddit r/2007scape
  - Flipping Discord servers
  - OSRS content creators
- [ ] Track plugin installs — milestone: 25 users → activate price_truth

---

## 💡 Future Ideas (Unscoped)

- **Flip planner** — *"I have 50M and 3 slots, build me an optimal portfolio right now"* (AI-driven)
- **Status page** — Wiki API uptime, plugin sync status, last data refresh
- **History analytics** — best times of day to flip, avg hold time trends
- **Price chart improvements** — volume bars, RSI, support/resistance levels
- **Mobile app** — React Native, push notifications for alerts
- **Item Explorer** — browse all 4,000+ items without budget/risk filter

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
