# FindFree Design Specification
**Date:** 2026-06-01  
**Project:** FindFree — Free Item Finder Android App  
**Status:** Design Locked

---

## Product Vision

FindFree aggregates free item listings from Facebook Marketplace, Buy Nothing groups, and Craigslist into one clean, map-based mobile experience. Target users: college students, young renters, sustainability-conscious people. Core insight: free stuff exists everywhere but discovery is fragmented. FindFree fixes that with a warm, community-driven interface that makes finding free things feel like neighborhood treasure hunting.

---

## Brand & Visual Direction

**Personality:** Warm Brutalist
- Bold, human-made, trustworthy
- Organic geometry mixed with geometric precision
- Warm neutrals: cream (#F5F1E8), rust (#8B6F47), dark charcoal (#3D3D39)
- High contrast for small screens, clear readability
- Gesture language: swipe left = back, long-press = menu, tap = select
- Motion intensity: 7/10 (fast, responsive, not laggy or fussy)

**Brand Posture:** Human-scale discovery platform, not corporate. Feels like a friend helping you hunt for deals.

---

## User Journey

1. **Onboarding:** Animated intro (2–3s) → "Sign Up" or "Browse as Guest" choice
2. **Discovery:** Land on map view, see free items nearby, or switch to feed view
3. **Exploration:** Search/filter by location, category, time posted; results update map & feed
4. **Action:** Tap item → details view → save or message poster
5. **Conversation:** In-app messaging thread with poster

---

## Core Screens & Navigation

**Navigation Structure:** Bottom Tab Bar (5 tabs)

### Tab 1: Map (Home)
- Google Map centered on user location
- Markers for nearby free items, clustered at zoom-out
- Search bar at top (keyword search)
- Filter button (radius 1–50km, category, posting time)
- Bottom sheet on marker tap: item preview (photo, title, distance, "View Details")
- Fab for guests: "Sign Up" / "Post Item"

### Tab 2: Feed
- Vertical scrollable list of nearby items (ordered by distance/recency)
- Card per item: photo, title, location, distance, time posted, "Free" badge
- Pull-to-refresh
- Same search/filter controls as map
- Tap card → detail view

### Tab 3: Messages (Signed In Only)
- Inbox: list of conversations with posters/users
- Unread badge on tab
- Tap conversation → chat thread with message history
- "Compose" fab → start new message to a poster

### Tab 4: Saved
- Grid or list of bookmarked items
- Empty state with friendly copy
- Tap item → detail view

### Tab 5: Profile (Signed In Only)
- User info: avatar, name, email, join date
- "My Posted Items" section (list + ability to edit/delete)
- "Message Count" stat
- Settings: notifications, dark mode, account management
- Logout button

### Detail View (Modal/Stack)
- Photo carousel (swipe to browse)
- Item: title, description, category, location
- Poster profile: avatar, name, message count
- "Save" heart button (top-right)
- "Message Poster" button (primary action)
- Related items below (same category, nearby)

---

## Data Architecture

**Frontend:** React Native (Android v1, iOS-ready)
- Navigation: React Navigation (Stack, Tab)
- State: Redux or Context API (user auth, filters, saved items)
- Maps: Google Maps SDK
- Messaging: Real-time Supabase subscriptions

**Backend:** Node.js + Supabase (PostgreSQL + Auth + Real-time)
- User management: Supabase Auth (email/password)
- Messages: Real-time subscriptions via Supabase
- Search: PostgreSQL full-text search
- Location queries: PostGIS radius-based search

**Data Scraping:** Node.js scheduled jobs
- Cron: every 6–12 hours
- Sources: Facebook Marketplace, Buy Nothing APIs, Craigslist scraper
- Normalization: all items in single `items` table with source attribution
- Deduplication & geocoding

### Database Schema

```sql
-- Users
users (id, email, name, avatar_url, location, created_at, message_count)

-- Items (user-posted + scraped)
items (
  id, user_id, title, description, category,
  location (lat/lng), photo_urls, source,
  source_id, status (available/claimed/deleted),
  created_at, expires_at (30-day auto-archive)
)

-- Saves
saved_items (id, user_id, item_id, created_at)

-- Messages
messages (id, conversation_id, sender_id, body, created_at)
conversations (id, item_id, participant_ids, updated_at)
```

**Security:** Row-Level Security (RLS) on messages & saves (users see only their own).

---

## MVP Feature Scope

### Discovery (Required)
- Browse map of nearby free items (Google Maps)
- Browse feed of nearby items
- Search by keyword (title/description)
- Filter by: radius (1–50km), category, posting time
- View item details: photos, description, location, poster info
- Guest browsing (no account required)

### Accounts & Posting (Required)
- Sign up/login (email/password)
- User profile: name, avatar, posted items list
- Post a free item (title, description, up to 5 photos, category, location auto-fill)
- Edit/delete own items
- In-app messaging with posters

### Polish (Required)
- Intro animation (2–3s splash screen, Warm Brutalist aesthetic)
- Dark mode toggle
- Empty states (friendly copy when no items/messages)
- Loading states & error handling
- Message notifications

### Phase 2 (Post-Launch, Not MVP)
- Real-time alerts for new items matching saved searches
- Poster reviews/ratings
- Wish list / item alerts
- iOS support

---

## Mobile-Specific Hard Constraints

- ✅ Min 44pt touch targets (ideally 48pt)
- ✅ Min 16pt body text, 14pt for UI labels
- ✅ No modals covering full screen (use bottom sheets)
- ✅ No horizontal scrolling for main content
- ✅ Safe area respected (notch, home indicator)
- ✅ Gesture hints visible (swipe affordances, long-press feedback)
- ✅ No auto-playing audio/video
- ✅ Thumb-reachable bottom tabs (primary action in lower 2/3 of screen)

---

## Technical Stack

**Frontend:**
- React Native 0.74+
- React Navigation 6+ (Stack, Tab, Drawer)
- Redux Toolkit or Zustand (state management)
- Google Maps SDK (react-native-maps)
- Supabase client (real-time, auth)
- TypeScript

**Backend:**
- Node.js 18+ (LTS)
- Express.js
- Supabase (PostgreSQL, Auth, Real-time)
- PostGIS (location queries)
- node-cron (scraping jobs)

**DevOps:**
- Vercel or Railway (Node backend)
- Supabase Cloud (database + auth)
- GitHub Actions (CI/CD)

---

## Narrative Arc

**Onboarding:** "Welcome, this is who we are" (friendly intro animation)  
**Home:** "Here's what you need right now" (map + feed, instant discovery)  
**Details:** "Deep dive into what you care about" (full item info, poster context)  
**Success:** "Celebrate what you found" (message sent, item saved, posted item live)

Micro-copy reinforces warmth and action:
- Button labels: "Send Message" (not "OK"), "Post Your Item" (not "Submit")
- Empty states: "No items nearby yet—try expanding your radius!" (not generic placeholder)
- Error messages: "Couldn't load map. Check your connection." (helpful, not technical jargon)

---

## Testing & Validation

**Manual Testing:**
- Actual Android devices: Pixel 6a, Pixel 7, Samsung Galaxy S23
- Screen sizes: small (SE), regular (6-inch), large (6.7-inch+)
- Portrait & landscape orientation
- Dark mode + light mode

**Edge Cases:**
- No network (offline map caching)
- Location services disabled (show permission request)
- No items in radius (helpful empty state)
- Message notifications (permission flow)
- Image upload failures (retry + error messaging)

**Accessibility:**
- Screen reader testing (TalkBack)
- Min 48pt touch targets
- Sufficient color contrast (7:1 for body text)
- Alt text for all images

---

## Success Criteria

**v1 Launch:**
- Users can discover free items on map within 5 seconds of opening
- Users can post items in < 2 minutes
- Message delivery is real-time
- No crashes on Android 12+
- Dark mode fully functional

**Growth:**
- iOS support (same codebase)
- Real-time item alerts (phase 2)
- Poster reviews (phase 2)

---

## Next Steps

1. Generate visual mockups (imagegen-frontend-mobile skill)
2. Extract design specs from mockups (image-to-code skill)
3. Taste filtering: design-taste, high-end-visual, stitch-design, gpt-taste
4. Typography lockdown (typography skill)
5. Gesture animation planning (framer-motion-animator skill)
6. React Native architecture & component design (fullstack-dev-skills:react-native-expert)
7. UX validation (web-design-guidelines, storytelling)
8. Testing strategy (webapp-testing)
9. Final quality gate (impeccable skill)
10. Full implementation & shipping

---

**Design locked:** 2026-06-01  
**Ready for:** Visual generation phase (imagegen-frontend-mobile)
