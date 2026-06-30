# Asik Game — Gaming Landing Page (Frontend Only)

PKOK11-এর হুবহু কপি না করে, একই ধরনের **dark + neon casino/gaming landing page** বানাবো নতুন ব্র্যান্ড **"Asik Game"** এর জন্য। সম্পূর্ণ ফ্রন্টএন্ড, কোনো লগইন/ব্যাকএন্ড/পেমেন্ট/রিয়েল গেম নেই — শুধু UI।

## Visual Direction

- **Theme:** Deep dark background (#0a0613 / #120a1f) + neon accents
- **Accents:** Gold `#f5c542`, Purple `#a855f7`, Red/Pink `#ef2967`, Cyan `#22d3ee`
- **Typography:** Heading — `Outfit` (bold, display feel); Body — `Hind Siliguri` (বাংলা সাপোর্টের জন্য জরুরি)
- **Effects:** Neon glow shadows, gradient borders, subtle hover lifts, gold/purple gradient CTAs, glassmorphic cards
- **Imagery:** AI-generated hero banner (neon casino vibe), game thumbnails (slot/roulette/crash/fishing style), QR placeholder

## Sections (top → bottom)

1. **Top Nav Bar** — Logo "Asik Game" (neon gold wordmark) • মেনু: হোম, গেমস, প্রমোশন, VIP, সাপোর্ট • Language selector (বাং/EN) • Login + Register বাটন (purple→pink gradient)। Mobile: hamburger drawer।
2. **Hero Section** — Full-width neon background image, বড় বাংলা হেডলাইন ("জিতুন বড়, খেলুন স্মার্ট"), সাবহেডলাইন, দুটো CTA — "এখনই জয়েন করুন" (gold) + "অ্যাপ ডাউনলোড করুন" (outline cyan)। Animated glow।
3. **Live Stats Strip** — তিন/চারটে counter (Active Players, Total Payout, Games, Winners Today)।
4. **Game Categories Tabs** — All / Slots / Live Casino / Crash / Fishing / Table Games। Tab-active neon underline।
5. **Games Grid** — 12টা game card (thumbnail + name + "PLAY" overlay button)। Hover: scale + neon glow। Mobile: 2-col, Tablet: 3-col, Desktop: 4-6 col।
6. **Promotions / Bonus** — Carousel/grid 3-4 banner কার্ড: Welcome Bonus 200%, Daily Reward, Super Reward Event, VIP Cashback। Gradient borders।
7. **Why Asik Game (Features)** — 4টা আইকন কার্ড: নিরাপদ ও বিশ্বস্ত, দ্রুত উত্তোলন, ২৪/৭ লাইভ সাপোর্ট, বিশাল জ্যাকপট।
8. **App Download Section** — Split layout: বামে phone mockup + বাংলা copy + Android APK ও iOS বাটন; ডানে QR কোড placeholder।
9. **Testimonials** — 3টা ইউজার রিভিউ কার্ড (avatar + নাম + ৫-star + বাংলা quote)।
10. **Footer** — ৪ কলাম লিংক (Quick Links, Games, Support, Legal) + social আইকন (FB, Telegram, WhatsApp, YouTube) + payment method logos placeholder + কপিরাইট।

## Responsiveness

- Mobile-first। Nav → hamburger drawer। Hero stacks vertically। Grid → 2 col on mobile। সব text scale with `clamp()`/responsive utilities। Header rows use `grid-cols-[minmax(0,1fr)_auto]` pattern with `min-w-0` + `shrink-0`।

## Disclaimer

Footer-এ ছোট করে: "18+ • শুধুমাত্র ডেমো UI, কোনো real-money gaming নয়।"

## Technical

- TanStack Start routes:
  - `src/routes/index.tsx` — পুরো landing page একসাথে (scroll sections)
  - Hash anchors `#games`, `#promo`, `#features`, `#download` শুধু in-page scroll এর জন্য
- Components under `src/components/landing/`: `Navbar`, `Hero`, `LiveStats`, `GamesGrid`, `Promotions`, `Features`, `AppDownload`, `Testimonials`, `Footer`
- Design tokens in `src/styles.css` (`@theme inline`): semantic colors `--neon-gold`, `--neon-purple`, `--neon-pink`, `--neon-cyan`, gradient + glow shadow tokens। কোনো hardcoded color class নয়।
- Fonts via `@fontsource/outfit` + `@fontsource/hind-siliguri` (bun add)
- Icons via `lucide-react` (already available)
- Images: AI-generated via `imagegen` — 1 hero banner (1920x900), 1 phone mockup, 8-12 game thumbnails (square)। Avatar/QR placeholders inline SVG।
- No backend, no auth, no Lovable Cloud। Login/Register বাটন শুধু visual।

আপনি অনুমোদন দিলে বানানো শুরু করব।
