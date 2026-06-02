# FindFree

Free stuff is everywhere — on Facebook Marketplace, Buy Nothing groups, Craigslist — but it's scattered. FindFree pulls it all into one map so you can see what's free near you right now, contact the poster, and go pick it up.

No account needed to browse. Open the app and start finding.

---

## How it works

**Find something free**
Open the map and see free items pinned around you. Tap a pin to preview it — photo, title, how far away. Tap through to the full listing for more photos, a description, and the poster's info. Message them directly in the app to claim it.

**Browse the feed**
Prefer a list? Switch to the feed view for a scrollable card layout of nearby items. Filter by category (furniture, electronics, clothing, books, and more) or distance.

**Give something away**
Post your own free items in under a minute. Add a photo, title, category, and your location — it goes live on the map immediately for anyone nearby to find.

**Save for later**
Bookmark listings you want to come back to. Saved items stay in your list even after you leave the app.

**Messages**
All coordination happens in-app. No sharing phone numbers or redirecting to other apps. Real-time chat so you know the second someone replies.

**Community board**
Share finds, post coupons, or let neighbors know about free stuff that doesn't fit a standard listing.

---

## Guest vs. signed-in

| Feature | Guest | Signed in |
|---------|-------|-----------|
| Browse map | ✓ | ✓ |
| Browse feed | ✓ | ✓ |
| View item detail | ✓ | ✓ |
| Save items | — | ✓ |
| Message posters | — | ✓ |
| Post items | — | ✓ |
| Community board | ✓ | ✓ |

---

## Getting started (development)

### Prerequisites

- Node 20+
- A [Supabase](https://supabase.com) project with PostGIS enabled
- Google Maps API key (Maps SDK for Android)

### Setup

```bash
npm install
```

Copy `.env.local.example` to `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

Apply the database schema via the Supabase SQL editor (`supabase/schema.sql`), then seed it (`supabase/seed.sql`).

### Run

```bash
npm start          # Expo dev server
npm run android    # Android
npm run ios        # iOS
npm test           # Tests
```

---

## Tech

React Native (Expo) · Supabase (Postgres + Auth + Realtime) · TypeScript · React Navigation · Zustand · TanStack Query
