# FindFree

A map-based mobile app that aggregates free item listings from Facebook Marketplace, Buy Nothing groups, and Craigslist into one place. Built for college students, young renters, and sustainability-conscious people who want to find (or give away) free stuff nearby.

## What it does

- **Map view** — see free items near you on a live map with cluster markers
- **Feed view** — scrollable list of nearby items, filterable by category and distance
- **Item detail** — photo carousel, poster info, save or message to claim
- **In-app messaging** — real-time chat between finder and poster
- **Post items** — list your own free items with photos and location
- **Saved items** — bookmark listings to revisit
- **Guest access** — map and feed work without an account; messaging and posting require sign-in

## Tech stack

| Layer | Tool |
|-------|------|
| Framework | Expo SDK 54 / React Native 0.81 |
| Language | TypeScript |
| Navigation | React Navigation 7 (stack + bottom tabs) |
| State | Zustand (auth, filter, saved) |
| Data fetching | TanStack Query v5 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Animations | Reanimated 3 (spring-based, no linear easing) |
| Icons | Phosphor React Native |
| Maps | React Native Maps |

## Project structure

```
src/
  app/           # Expo Router screens
    auth/        # Sign in, sign up, forgot password
    messages/    # Inbox + chat thread
    profile/     # Profile, post item, settings screens
  components/    # Shared primitives (Button, Badge, Avatar, etc.)
  features/      # Feature-level components
    feed/        # FeedCard, FeedList, FeedCardSkeleton
    items/       # PhotoCarousel, PosterInfo
    map/         # ItemMarker, ItemPreviewSheet
    messages/    # ChatBubble, ConversationRow
    navigation/  # CustomTabBar
    profile/     # ProfileHeader
  hooks/         # React Query hooks (useNearbyItems, useChatThread, etc.)
  lib/           # Design system (colors, typography, spacing, springs)
  services/      # Supabase API calls (auth, items, messages, users)
  stores/        # Zustand stores
  types/         # Shared TypeScript types
supabase/
  schema.sql     # Full database schema with PostGIS
  seed.sql       # Development seed data
```

## Design system

**Warm Brutalist** — dark ground, no rounded corners (avatars excepted), spring-weighted motion.

| Token | Value |
|-------|-------|
| `CHARCOAL` (background) | `#3D3D39` |
| `CREAM` (primary text) | `#F5F1E8` |
| `RUST` (accent) | `#8B6F47` |

Contrast: CREAM on CHARCOAL = 7.2:1 (WCAG AAA). All touch targets ≥ 44dp.

## Getting started

### Prerequisites

- Node 20+
- Expo CLI: `npm install -g expo-cli`
- A [Supabase](https://supabase.com) project with PostGIS enabled
- Google Maps API key (Maps SDK for Android)

### Setup

```bash
npm install
```

Copy `.env.local.example` to `.env.local` and fill in your keys:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

Apply the database schema:

```bash
# Via Supabase dashboard SQL editor, or:
supabase db push
```

### Run

```bash
npm start          # Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
```

### Test

```bash
npm test
```

## Screens

| Screen | Auth required |
|--------|--------------|
| Splash / Onboarding | No |
| Map | No |
| Feed | No |
| Item Detail | No |
| Sign In / Sign Up | No |
| Inbox | Yes |
| Chat | Yes |
| Saved | Yes |
| Profile | Yes |
| Post Item | Yes |
| Account / Notification / Theme Settings | Yes |
| Community | No |
