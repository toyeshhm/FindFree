# Product

## Register

product

## Users

College students, young renters, and sustainability-conscious people in their 20s-30s. Context: browsing on their phone while commuting, at home, or out exploring — looking for free items nearby. They know free stuff is out there but discovery is fragmented across Facebook Marketplace, Buy Nothing groups, and Craigslist. They want a single place to find it all.

Primary job: discover free items available near them, contact the poster, and claim the item. Secondary job: post their own free items for others to claim.

Guest users (pre-sign-up) represent the majority first-session experience. The app must be fully useful before any account creation.

## Product Purpose

FindFree aggregates free item listings from Facebook Marketplace, Buy Nothing groups, and Craigslist into one map-based Android mobile app. It is a discovery and coordination tool, not a marketplace — everything on it is free.

Success looks like: a user opens the app, finds a free couch two blocks away, messages the poster, and picks it up. Or: a user posts a free lamp, it gets claimed within an hour.

MVP scope: Map view, Feed view, Item Detail, Messages (signed-in), Saved (signed-in), Profile (signed-in). Android first. Supabase backend with real-time chat.

## Brand Personality

Warm Brutalist. Human-scale community platform — feels like a neighborhood tool that takes itself seriously without being corporate. Like a friend helping you hunt through a neighborhood's discarded treasure.

Three words: Direct. Warm. Grounded.

Voice: Plain speech. Short sentences. Specific, not abstract. Never "leverage" or "seamless." The app talks like a person, not a product.

Emotional goal: Curiosity on open → Discovery on browse → Action on contact → Habit on return.

## Anti-references

- OfferUp, Facebook Marketplace — commercial, polished, corporate. FindFree is community-native.
- Cream/sand/beige-background "warm" apps — the AI default. FindFree is dark-ground. Cream is text, not background.
- SaaS-aesthetic tools with floating cards, gradients, glassmorphism — FindFree is machined, not ethereal.
- Airbnb, Depop — lifestyle brand polish. FindFree is a neighborhood board, not a brand experience.

## Design Principles

1. **Community over Corporate** — Every decision should feel like it came from a neighbor, not a startup. No corporate visual language, no fake round numbers, no buzzword copy.
2. **Dark ground is the identity** — CHARCOAL surfaces, CREAM text, one RUST accent. This is not a style choice; it is the product's voice. Never invert this for any screen or state.
3. **Physical motion** — Spring-weighted, gesture-resonant. Interactions have tactile weight. Nothing floats, nothing eases linearly.
4. **Guest-first access** — Map and Feed are fully usable without an account. Locking discovery behind sign-up destroys the product promise. Never show a blocking modal on app open.
5. **Warm utility** — Empty states guide. Error states explain and fix. Copy is specific and warm, never generic. The interface should never abandon the user.

## Accessibility & Inclusion

WCAG AA minimum throughout. Dark-mode first (CREAM #F5F1E8 on CHARCOAL #3D3D39 = 7.2:1, AAA).

All touch targets: 44dp minimum, 48dp preferred.

Reduced motion: required on every animated element. All transitions collapse to instant crossfades when system reduced-motion is enabled.

Color is never the sole signal — source badges, error states, and status indicators include text labels alongside color.

Android 12+ primary target. Accessibility services (TalkBack) must work with all interactive elements.
