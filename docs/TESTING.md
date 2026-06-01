# FindFree Testing Strategy
**Phase 10: Device Testing, Coverage, Edge Cases**  
**Date:** 2026-06-01

---

## Device Matrix

| Device | OS | Screen | Priority |
|---|---|---|---|
| Pixel 6a | Android 13 | 6.1", 1080×2400 | P0 — primary |
| Pixel 7 | Android 14 | 6.3", 1080×2400 | P0 — primary |
| Galaxy S23 | Android 13 | 6.1", 1080×2340 | P0 — primary |
| Pixel 4a (small) | Android 12 | 5.8" | P1 — edge |
| Galaxy S23 Ultra (large) | Android 13 | 6.8" | P1 — edge |

Test on all P0 devices before every release. P1 devices before major features.

---

## Test Layers

### Layer 1: Unit Tests (Jest)
Component logic, store actions, service functions. No UI rendering.

```bash
npx jest --coverage
```

Cover:
- `useFilterStore` — setRadius, setCategory, resetFilters
- `useSavedStore` — toggle, isSaved, setSavedIds
- `itemsService.getNearby` — correct params passed to Supabase RPC
- `deriveCardTier` — correct tier for index 0, recent items, no-photo items
- Copy strings — no `...` (three periods), all errors include fix text

### Layer 2: Integration Tests (Jest + React Native Testing Library)

```bash
npx jest --testPathPattern=integration
```

Cover:
- `FeedCard` renders correct tier based on item data
- `PrimaryButton` fires onPress + haptic, disabled state blocks press
- `FeedList` shows skeleton on isLoading, RefreshControl present
- Auth store hydrates from Supabase session on app start
- Filter persistence survives app reload (MMKV)

### Layer 3: E2E Tests (Detox)

```bash
detox test --configuration android.emu.release
```

Critical paths — must pass on every release:

| # | Flow | Steps | Pass Criteria |
|---|---|---|---|
| 1 | Guest browse | Launch → skip onboarding → map loads | Map visible, items on map |
| 2 | Sign up | Create account → map home | Tab bar visible, profile populated |
| 3 | Find item | Feed → tap card → view detail | Detail screen shows title, CTA |
| 4 | Save item | Detail → tap Save → Saved tab | Item appears in Saved |
| 5 | Message poster | Detail → Message Poster → send | Message visible in thread |
| 6 | Post item | Profile → Post Item → submit | Item appears on map |
| 7 | Delete item | Profile → listings → delete → confirm | Item removed |
| 8 | Filters | Map → Filters → 1km radius → apply | Fewer markers visible |

---

## Manual Testing Checklist

Run before every release on all P0 devices.

### Accessibility
- [ ] TalkBack navigation through all 5 tabs — correct labels announced
- [ ] All buttons announce their action (not just "button")
- [ ] Feed cards announce: title + distance (not individual child elements)
- [ ] Form inputs announce label on focus
- [ ] Save button announces "Save item" / "Remove from favorites" state

### Dark Mode
- [ ] All screens render correctly in dark mode (no white surfaces)
- [ ] CREAM text readable on all CHARCOAL surfaces
- [ ] Map controls visible against map tiles
- [ ] Status bar icons visible (light icons on dark background)

### Offline
- [ ] Map shows cached tiles when offline
- [ ] Feed shows helpful error: "Couldn't load items. Check your connection."
- [ ] Send message while offline: fails gracefully, offers retry
- [ ] App launches without network — no crash, shows offline state

### Location Permissions
- [ ] Denied: app shows inline prompt (no crash, no alert loop)
- [ ] Denied + map: centers on default city, shows "Enable location" banner
- [ ] Granted after initial denial: map recenters on user location

### Notifications
- [ ] Denied: no crash, messages still work (user just won't get push)
- [ ] Granted: new message triggers notification when app is backgrounded

### Portrait / Landscape
- [ ] All screens usable in portrait (primary)
- [ ] Landscape: no broken layouts, tab bar accessible
- [ ] Keyboard doesn't cover input fields (KeyboardAvoidingView working)

### Safe Areas
- [ ] No content clipped by notch on any screen
- [ ] Tab bar above home indicator (not hidden behind it)
- [ ] Bottom sheet above home indicator

### Performance
- [ ] Feed scrolls at 60fps (no jank on Pixel 6a)
- [ ] Map pan/zoom smooth — no dropped frames on marker clusters
- [ ] App cold start < 3 seconds
- [ ] Screen transition < 300ms (spring animation completes)
- [ ] Image load: skeleton shows immediately, image fades in

### Edge Cases
- [ ] Item with no photos: text-only card renders, no empty image box
- [ ] Item title > 60 characters: truncates at 2 lines with ellipsis
- [ ] Description > 300 characters: truncates at 5 lines, "Show more" present
- [ ] 0 items in radius: empty state with helpful copy, not blank screen
- [ ] 200+ items on map: clusters render, tapping cluster zooms in
- [ ] Very long username in messages: wraps or truncates, no overflow
- [ ] Network timeout mid-send: message shows failed state, retry available

---

## Performance Targets

| Metric | Target | Measure with |
|---|---|---|
| Cold start (no cache) | < 3s | `adb shell am start -S` timing |
| Feed initial load | < 1.5s | React DevTools profiler |
| Screen transition | < 300ms | Detox timeline |
| Feed scroll FPS | ≥ 58fps | Flipper Performance tab |
| Map render | < 2s | Manual stopwatch |
| Image load (cached) | < 100ms | expo-image built-in |

---

*FindFree TESTING.md — Phase 10 complete 2026-06-01.*
