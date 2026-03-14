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
- **Referral system is live** — 50% off first month for both sides, Pro for life at 3 converted referrals. Gap fix: referrers without a Stripe account get a `pending_referral_discount` applied automatically when they upgrade.
- **Trade Board is live** — player-to-player listings for rare/above-max-cash items. Wiki item validation, 7-day auto-expiry, Discord/RSN contact.

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
- Market tab with 4,525 items — Flips / High Alch / Death's Coffer / Trade Board sub-tabs
- High Alch tracker — profit/cast, live + editable nature rune price
- Death's Coffer — savings, potential savings, target amount calculator
- Trade Board — WTS/WTB listings for rare items, wiki item validation, bulk pricing (per-item + total), 7-day expiry, category filters
- Flip Queue, Rotation Picks, Session Intel, Risk Exposure, Daily GP Goal
- Tracker page with profit chart, live GE slots, flip history
- Portfolio page — period selector, win rate donut, per-item P&L, best/worst items
- Alerts page — price alerts, smart alert feed, clickable items open chart modal
- Changelog page + What's New modal
- Login streak tracking
- Shareable item URLs — `/item/abyssal-whip` opens chart modal directly
- Shareable flip cards — canvas-rendered card on profitable close (Merchant Mode)

### UI / UX
- Landing page redesign — "Trade Smarter. Profit More." headline, features, comparison table, plugin install steps
- Hero subtitle updated — removed AI-built insinuations, kept AI Advisor references
- "Enter the Market →" nav CTA
- "Explore Demo ↗" button on landing — triggers guided tour
- Demo mode — 9-step guided tour with fake Merchant Mode data (fake positions, P&L, ops)
- Dramatic Merchant Mode intro animation during demo tour step 6
- Demo end screen — fullscreen CTA "Ready to flip smarter?"
- Market sub-tabs row below header (Flips / High Alch / Death's Coffer / Trade Board)
- Sparklines — 24hr margin trend canvas charts in Market table + Merchant Mode Market tab
- Watchlist tab — replaces Favourites, stores items with per-item price alerts
- Watchlist button in item chart modal (replaces "Log this flip")
- 📈 emoji replaces ⚔️ throughout (finance/chart theme)
- All Cinzel font instances bumped to 18px minimum across entire site
- Cinzel Decorative replaced with Cinzel everywhere — more readable
- Table headers bumped to 13px across all tables
- Landing page section labels, feature cards, step numbers, buttons all enlarged
- Soft gates — Advanced Filters, CSV Export, Alert Thresholds show upgrade prompts
- Item chart modal — "Log this flip" removed, replaced with Watchlist button

### Monetisation
- Stripe integration — $9.99/mo Pro tier (`price_1TAk4ECNKvvsYZxGopi1ANmE`)
- `api/create-checkout.js` — creates Stripe Checkout session, auto-applies referral coupon
- `api/webhook.js` — syncs `is_pro` to Supabase on subscription events
- Pricing page (`/pricing` tab) — Free vs Pro comparison, referral section, FAQ
- Upgrade modal CTA routes to pricing page
- `?upgrade=success` redirect handler — fires toast, sets isPro in UI
- Referral system — `?ref=CODE` captured, stored in localStorage, written to `referrals` table on sign-up
- Referral coupon `sAvO4kCM` — 50% off first month, applied once per account
- Refer 3 friends → `lifetime_pro = true` → Pro free forever, Stripe subscription cancelled
- Gap fix — referrers without Stripe account get `pending_referral_discount = true`; discount applied automatically at their next checkout or invoice
- Safety net — `invoice.payment_succeeded` webhook cancels subscription for lifetime_pro users and applies any pending referral discount
- Referral tab UI (`ReferralPage.js`) — ref link, copy button, Discord/Reddit share, stats, progress bar, history

### SEO
- `api/og.js` — Vercel serverless function serving dynamic OG meta tags for `/item/:slug`
- Bot user-agent detection in `vercel.json` routes crawlers to OG function
- Discord/Reddit/Twitter previews show live item prices (full numbers, not abbreviated)

### Supabase Schema
- `user_profiles`: `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `pro_expires_at`, `referral_count`, `lifetime_pro`, `referral_discount_used`, `pending_referral_discount`
- `trade_listings`: `id`, `user_id`, `item_name`, `item_image`, `type`, `price`, `quantity`, `notes`, `discord`, `rsn`, `category`, `created_at`, `expires_at`, `active`

---

## 🟢 Build Now (No Dependencies)

### Market / Flips Page
- [ ] **Price alert from Market page** — bell icon on each row, sets alert without leaving page
- [ ] **"You've flipped this" badge** on rows where user has personal history
- [ ] **Category filters** — runes, food, armour, weapons, etc.
- [ ] **Margin History Chart** — add margin (spread) as a third line on the item chart modal alongside buy/sell price

### Growth
- [ ] Gate Merchant Mode behind `isPro` check (currently still activates free)
- [ ] Daily Digest AI Prompts — market pulse on login
- [ ] Blog / guides: *"How to flip Abyssal whip"*, *"Best F2P flips 2026"* — SEO content
- [ ] Discord Webhook Alerts — users paste webhook URL in Settings, alerts delivered to their Discord server (free advertising)

### Future Tools (Finance/Flipping Focused)
- [ ] **Margin Watch tab** — items whose margins moved most in the last hour
- [ ] **F2P Flips tab** — dedicated F2P filtered view
- [ ] **Item Compare** — pick 2-3 items side by side, compare margin/volume/ROI/history
- [ ] **Flip Planner** — "I have 50M and 4 slots, build me an optimal portfolio" (AI-driven, defer until AI judgment improves)

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
- [ ] **GP/hr** — capital × ROI × cycles/day
- [ ] **Fill Speed** — volume-weighted, accounts for GE limit
- [ ] **Safety** — price stability, dump risk, tax efficiency

### Leaderboard / Public Profiles
- [ ] Opt-in public profile with nickname
- [ ] Weekly/monthly leaderboard
- [ ] Major retention driver

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
- **Item Explorer** — browse all 4,000+ items without budget/risk filter
- **Portfolio Snapshot** — shareable read-only page showing positions and P&L
- **Best Time to Flip** — hold until 50+ users with trade history for accuracy

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
