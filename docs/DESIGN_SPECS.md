# FindFree Design Specifications
**Extracted from 7 Warm Brutalist Mobile Screens**  
**Date:** 2026-06-01  
**Platform:** Android 12+ (React Native, iOS-ready)

---

## Color Palette

### Primary Colors
```
CREAM:        #F5F1E8  (foreground, primary text, accents)
RUST:         #8B6F47  (primary accent, borders, badges)
CHARCOAL:     #3D3D39  (backgrounds, primary surfaces)
```

### Derived Secondary Colors
```
DEEPER_CHARCOAL:  #2D2D2A  (deep backgrounds, pressed states — "Deep Charcoal" in DESIGN.md)
MID_CHARCOAL:     #4A4844  (secondary surfaces, cards)
LIGHT_CHARCOAL:   #5A5450  (tertiary surfaces, image placeholders)
RUST_LIGHT:       #D4A574  (accents, highlights, dashed borders)
MUTED_ASH:        #B8B0A0  (secondary text, metadata, disabled — "Muted Ash" in DESIGN.md)
DISABLED_GRAY:    #999999  (placeholder text in inputs only — never body copy)
```

### Canonical Token Names for `lib/colors.ts`
The following names are authoritative for implementation. DESIGN.md uses prose names; code uses these constants:
- `DEEPER_CHARCOAL` (not `DARKER_CHARCOAL`) — aligns with DESIGN.md "Deep Charcoal"
- `MUTED_ASH` (not `GRAY_MUTED`) — aligns with DESIGN.md "Muted Ash"
- `DISABLED_GRAY` (not `GRAY_DISABLED`) — role clarified: placeholder text only

### Color Usage
- **Background:** CHARCOAL (#3D3D39)
- **Primary Surface (cards, modals):** MID_CHARCOAL (#4A4844)
- **Text - Primary:** CREAM (#F5F1E8)
- **Text - Secondary:** GRAY_MUTED (#B8B0A0)
- **Accent (borders, badges, buttons):** RUST (#8B6F47)
- **Accent Highlight (dashes, light borders):** RUST_LIGHT (#D4A574)
- **Dividers:** rgba(139, 111, 71, 0.3) — 30% opacity rust

### Dark Mode
- All screens are dark mode by default
- Light mode variants would swap CREAM ↔ CHARCOAL
- Contrast ratio for body text: 7:1+ (CREAM on CHARCOAL)
- Contrast ratio for labels: 5:1+ (GRAY_MUTED on CHARCOAL)

---

## Typography Scale

### Font Family
**Primary:** -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif  
**Fallback:** System sans-serif (native San Francisco on iOS, Roboto on Android)

**Rationale:** Native system fonts for performance + native feel. No custom font files for MVP.

### Type Scale

Scale family: **Minor Third (1.2×)** from 16sp base.  
Functional core: 11–13–16–20–24–28sp follows the ratio exactly.

| Role | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| **Display Hero** | 56sp | 900 | 1.0 | 0 | Intro "FIND FREE" wordmark only |
| **Display Heading** | 48sp | 900 | 1.0 | 0 | Large accent text in intro only |
| **Section Title** | 28sp | 700 | 1.2 | -0.3dp | Onboarding headline |
| **Headline** | 24sp | 700 | 1.2 | -0.25dp | Screen titles (Map, Feed, Detail) |
| **Subheading** | 20sp | 500 | 1.3 | 0 | Secondary headers (was 600 — Roboto has no 600) |
| **Body** | 16sp | 400 | 1.5 | 0 | Primary body text, item descriptions |
| **Body Compact** | 15sp | 400 | 1.4 | 0 | Feed list items only (density-justified) |
| **Label** | 14sp | 500 | 1.3 | 0 | Input labels, UI control labels |
| **Caption** | 13sp | 400 | 1.4 | 0 | Metadata, timestamps (use tabular-nums) |
| **Tiny Label** | 12sp | 700 | 1.2 | 1.2dp | Badges, section headers (uppercase) |
| **Nav Label** | 11sp | 700 | 1.2 | 0.9dp | Tab bar labels (uppercase) |

**Android Roboto weight mapping (critical):**
Roboto only has weights: 100, 300, 400, 500, 700, 900.  
`fontWeight: '600'` and `fontWeight: '800'` map unpredictably — avoid them.  
Use 500 (Medium), 700 (Bold), or 900 (Black) exclusively.

**Uppercase letter spacing rule:**
All text rendered in uppercase (buttons, badges, nav labels, section headers) must use positive letter spacing: 7-10% of font size.

| Element | Font Size | letterSpacing |
|---|---|---|
| Button label (14sp) | 14sp | 1dp |
| Badge "FREE" (12sp) | 12sp | 1.2dp |
| Nav label (11sp) | 11sp | 0.9dp |

**Tabular numbers:**
All numeric values in captions (distances, counts, timestamps) must use `fontVariant: ['tabular-nums']` to prevent layout shifts.

```jsx
// Correct — numeric metadata
<Text style={{ fontSize: 13, fontVariant: ['tabular-nums'] }}>
  2.3 km away • 3 hours ago
</Text>
```

**Line length:**
Item descriptions in detail view must be constrained to ~65 characters per line for readability. At 16sp on a 320dp screen with 16dp gutters, the 288dp text width accommodates ~38-42 characters. Multi-line descriptions should use `numberOfLines={6}` with a "Show more" affordance.

### Typography Hierarchy Examples

**Headline (24px 700) + Body (16px 400):**
```
VINTAGE SOFA               ← 24px, weight 700
Vintage mid-century modern sofa, good condition. Beige fabric, minimal wear. 
Must pick up this week.    ← 16px, weight 400, line-height 1.5
```

**Section Title (28px 700) + Supporting (16px 400):**
```
Welcome to FindFree        ← 28px, weight 700
Discover free items near you instantly  ← 16px, weight 400, color: GRAY_MUTED
```

**Badge + Body:**
```
FREE                       ← 12px, weight 700, uppercase, bg: RUST, color: CREAM (#F5F1E8)
Vintage Sofa               ← 13px, weight 700
2.3 km away • 3 hours ago  ← 11px, weight 400, color: GRAY_MUTED
```

### Text Contrast
- **Primary text (CREAM on CHARCOAL):** 7.2:1 (AAA)
- **Secondary text (GRAY_MUTED on CHARCOAL):** 5.5:1 (AA)
- **Labels (GRAY_MUTED on MID_CHARCOAL):** 4.8:1 (AA, acceptable for small text)

---

## Spacing & Rhythm System

### Vertical Spacing Scale
```
2px   - hairline dividers
4px   - micro spacing (between elements)
8px   - small spacing (within components)
12px  - standard spacing (between small sections, card padding)
16px  - medium spacing (section padding, list item gaps)
20px  - large spacing (between major content areas)
24px  - extra large spacing (between screen sections)
32px  - hero spacing (top padding on major sections)
40px  - screen-level padding (header/footer clearance)
```

### Horizontal Spacing (Gutters)
```
12px  - minimum gutter (mobile comfortable)
16px  - standard gutter (default padding on screens)
20px  - expanded gutter (for larger screens, future)
```

### Component-Level Spacing

**Search Bar:**
- Padding: 10px horizontal, 12px vertical (touch-friendly 48px total height)
- Margin: 12px horizontal, 8px vertical between bar and controls

**Card / Feed Item:**
- Padding: 12px internal
- Margin: 12px horizontal, 12px bottom between items
- Border-left: 3px solid RUST (accent)

**Button (Primary):**
- Padding: 14px vertical, horizontal auto (min 48pt height)
- Margin: 12px between buttons in stack
- Font-size: 14px, font-weight: 700, text-transform: uppercase

**Tab Bar:**
- Height: 50px (touch-friendly)
- Border-top: 2px solid RUST
- Icon: 18px
- Label: 11px, font-weight: 700 (raised from 9px — Android M3 floor)
- Each tab: flex-grow 1, centered

**Bottom Sheet (Item Preview):**
- Height: 110px
- Padding: 12px
- Border-top: 2px solid RUST

**Safe Areas:**
- Top (notch/status bar): 28px clearance minimum
- Bottom (home indicator): 34px clearance minimum
- Sides: 16px minimum gutter

---

## Shape System

**Rule:** All UI components use `border-radius: 0` (square, brutalist). The single exception is avatars, which use `border-radius: 50%` (circle).

| Element type | Border-radius |
|---|---|
| Buttons, inputs, cards, sheets, badges, modals | 0 (square) |
| Avatars | 50% (circle) |

Do not introduce rounded corners on any new UI element without explicit sign-off.

---

## Component Specifications

### Buttons

**Primary Button**
```
Background: RUST (#8B6F47)
Color: CREAM (#F5F1E8)  ← contrast 3.84:1, passes WCAG AA large text (14pt bold)
Border: 2px solid RUST
Padding: 14px vertical, 16px+ horizontal
Border-radius: 0 (square, brutalist)
Font: 14sp, weight 700, uppercase, letterSpacing: 1dp
Height: minimum 48pt
Active state: background CREAM (#F5F1E8), color RUST (#8B6F47), scale 0.98
```

**Secondary Button**
```
Background: transparent
Color: CREAM (#F5F1E8)
Border: 2px solid RUST
Padding: 14px vertical, 16px+ horizontal
Border-radius: 0
Font: 14sp, weight 700, uppercase, letterSpacing: 1dp
Height: minimum 48pt
Active state: background RUST (#8B6F47), color CREAM (#F5F1E8), scale 0.98
```

### Input Fields

**Search Bar**
```
Background: MID_CHARCOAL (#4A4844)
Border: 2px solid RUST
Padding: 10px horizontal, 12px vertical
Color: CREAM
Font-size: 13px
Border-radius: 0
Placeholder color: GRAY_DISABLED (#999999)
Height: 48px minimum
```

### Cards / Feed Items

**Feed Item Card**
```
Background: MID_CHARCOAL (#4A4844)
Border-left: 3px solid RUST
Border-bottom: 1px solid LIGHT_CHARCOAL (#5A5450)
Padding: 12px
Margin: 12px horizontal, 12px bottom
Border-radius: 0
Image placeholder height: 80px
Image placeholder border: 1px dashed RUST_LIGHT
```

**Detail Card (Poster Info)**
```
Background: MID_CHARCOAL
Border: 1px solid RUST
Padding: 12px
Border-radius: 0
Avatar: 36px circle, background: RUST
Content: name (12px 700), stat (11px 400, color: GRAY_MUTED)
```

### Bottom Sheet

**Item Preview Sheet**
```
Background: MID_CHARCOAL
Border-top: 2px solid RUST
Padding: 12px
Height: 110px (fixed)
Position: absolute bottom 0
Thumb area: 60x60px, background: RUST, border: 2px dashed RUST_LIGHT
Title: 14px 700  ← raised from 12px (primary title on tap-action element)
Meta: 11px 400, color: GRAY_MUTED
```

### Tab Bar

**Bottom Navigation**
```
Background: CHARCOAL
Border-top: 2px solid RUST
Height: 50px
Display: flex, justify-content: space-around
Each tab:
  - flex: 1
  - display: flex, flex-direction: column, align-items: center, justify-content: center
  - color: GRAY_MUTED (default) / RUST (active)
  - background: CHARCOAL (default) / rgba(139,111,71,0.1) (active)
  - border-right: 1px solid rgba(139,111,71,0.3)
  - font-size: 11px, font-weight: 700  ← raised from 9px (Android M3 floor: 10-12sp)
  - icon-size: 18px, margin-bottom: 2px
```

### Safe Area / Status Bar

**Top Safe Area**
- Notch height: 28px (iPhone) / status bar 24px (Android)
- Clear padding above content: +12px additional

**Bottom Safe Area**
- Home indicator: 34px (iPhone) / navigation bar 48px (Android)
- Tab bar accounts for this

---

## Screen-Specific Spacing

### Screen 1: Intro Splash
- Center content vertically
- Logo: 56px font-size, margin-bottom: 16px
- Accent line: 60px width, 3px height, margin: 20px auto
- Tagline: margin-top: 24px, font-size: 14px

### Screen 2: Onboarding
- Header padding: 40px top, 20px horizontal
- Main content: center-aligned
- Button stack: padding 20px, gap: 12px between buttons

### Screen 3: Map Home
- Header: 12px padding, border-bottom: 2px RUST
- Search bar: 13px height + 8px margin
- Controls: 2 buttons, gap: 8px
- Map area: flex 1 (fill available space)
- Bottom sheet: positioned absolutely at bottom

### Screen 4: Feed
- Header: 12px padding top
- Feed items: padding 12px horizontal, 12px vertical gap
- Scrollable content area

### Screen 5: Detail
- Carousel: 180px height, positioned top
- Content: padding 16px
- Details: standard spacing (12px margins, 8px between blocks)
- Message button: 100% width, padding: 12px

### Screen 6: Messages
- Conversation items: padding 12px horizontal + vertical, bordered-bottom
- Avatar: 44px circle
- Gap between items: 1px divider

### Screen 7: Profile
- Header: background MID_CHARCOAL, padding: 16px, border-bottom: 2px RUST
- Avatar: 64px circle
- Sections: padding 12px horizontal, border-bottom between
- Section items: 8px vertical padding, 1px divider

---

## Navigation Graph

```
Intro Splash (2-3s)
  ↓
Onboarding Choice
  ├─→ Sign Up → Auth Flow → Map Home
  └─→ Browse as Guest → Map Home

Map Home (default tab: Map)
  ├─ Tab: Map (current)
  │   ├─→ Tap Marker → Item Detail
  │   └─→ Fab "Sign Up / Post Item" → Auth or Create Item
  ├─ Tab: Feed
  │   └─→ Tap Card → Item Detail
  ├─ Tab: Messages (signed in only)
  │   └─→ Tap Conversation → Chat Thread
  ├─ Tab: Saved (signed in only)
  │   └─→ Tap Item → Item Detail
  └─ Tab: Profile (signed in only)
      └─→ Edit Profile, Posted Items, Settings

Item Detail
  ├─→ "Save" heart → add to Saved items
  ├─→ "Message Poster" → Chat Thread (creates conversation)
  └─→ Back / Swipe left → return to previous screen

Chat Thread
  ├─→ Send message → real-time update (Supabase subscription)
  └─→ Back → Messages inbox

Posted Items (Profile tab)
  └─→ Tap item → Edit Item / Delete / View

Settings (Profile tab)
  └─→ Toggle Dark Mode, Notifications, Account

```

**Primary Gesture Language:**
- **Swipe left:** Back / dismiss
- **Tap:** Select / open detail
- **Long-press:** Context menu (favorite, share, report)
- **Pull-to-refresh:** Reload data (on Map and Feed)

---

## Device Specifications

### Target Android Devices
- **Min:** Android 12 (API 31)
- **Tested:** Pixel 6a (6.1"), Pixel 7 (6.1"), Galaxy S23 (6.1")
- **Tablet support:** 7-10" tablets (future, landscape layout)

### Safe Area Dimensions
- **Notch/Status bar:** 28px top
- **Home indicator:** 34px bottom (or 48px Android nav bar)
- **Side gutters:** 16px minimum

### Phone Frame Specs
- **Device frame:** visible in design, 10px border
- **Screen resolution:** 320x640px (design size)
- **Aspect ratio:** 9:19.5 (mobile standard)

---

## Component API Specifications

### Button Component
```tsx
<Button
  variant="primary" | "secondary"
  size="large" // 48px
  label="Action Label"
  onPress={() => {}}
  disabled={false}
  fullWidth={false}
/>
```

### Input Component
```tsx
<SearchInput
  placeholder="Search nearby..."
  value={searchTerm}
  onChangeText={(text) => {}}
  onClear={() => {}}
/>
```

### Card Component
```tsx
<FeedCard
  id="item-id"
  image={null} // or image URL
  badge="FREE"
  title="Item Name"
  meta="2.3 km away • 3h ago"
  onPress={() => {}}
/>
```

### Tab Bar Component
```tsx
<BottomTabBar
  tabs={[
    { label: "Map", icon: "map", active: true },
    { label: "Feed", icon: "list", active: false },
    // ... etc
  ]}
  onTabPress={(tab) => {}}
/>
```

### Bottom Sheet Component
```tsx
<ItemPreviewSheet
  visible={true}
  image={null}
  title="Item Name"
  meta="Distance • Time"
  onViewDetails={() => {}}
  onDismiss={() => {}}
/>
```

### FAB Component (Map screen — guests only)
```
Position: absolute, bottom 80dp (above tab bar), right 16dp
Size: 48×48dp minimum (square, border-radius: 0)
Background: RUST (#8B6F47)
Icon: plus, 20dp, CREAM
Label: none (icon-only)
accessibilityLabel: "Sign up to post items"
Pressed: scale 0.95, 80ms spring
Visibility: shown only when user is a guest; hidden after sign-in
```

Copy on FAB press: navigates to Onboarding with sign-up pre-selected.

### Filter Bottom Sheet
```
Background: MID_CHARCOAL (#4A4844)
Border-top: 2px solid RUST
Handle: 4×32dp bar, MUTED_ASH, centered at top with 8dp top padding
Title: "Show me items within" — 20sp 500 Cream, 16dp horizontal padding
Height: dynamic (content-driven, approximately 340dp)

Radius selector (segmented):
  - 5 options: 1 km / 5 km / 10 km / 25 km / 50 km
  - Row layout, equal flex
  - Selected: RUST fill, CREAM text, 14sp 700
  - Unselected: MID_CHARCOAL fill, MUTED_ASH text, 14sp 400
  - Divider between options: 1px LIGHT_CHARCOAL
  - Height: 44dp

Category chips (horizontal scroll row, optional):
  - All / Furniture / Electronics / Clothing / Books / Other
  - Selected: RUST fill, CREAM text, 12sp 700 uppercase
  - Unselected: LIGHT_CHARCOAL fill, MUTED_ASH text, 12sp 400
  - Padding: 6dp vertical, 12dp horizontal
  - Margin: 8dp between chips

Button row (bottom):
  - Left: "Clear all" — secondary button, 50% width
  - Right: "Show results" — primary button, 50% width
  - Gap: 8dp
  - Padding: 16dp
```

---

## Animation & Gesture Specifications

### Gesture Feedback
- **Tap button:** scale 0.98, 100ms
- **Tap to dismiss:** fade out, 200ms
- **Swipe left (back):** slide out left, 250ms
- **Long-press:** haptic tick (optional), no visual change initially

### Screen Transitions
- **Enter new screen:** slide right in, fade in, 250ms
- **Exit screen (back):** slide left out, fade out, 250ms
- **Tab switch:** cross-fade between tabs, 150ms
- **Modal appear:** scale up from bottom (bottom sheet), 200ms

### Loading States
- **Skeleton screens:** skeleton placeholder blocks (Light Charcoal fill, shimmer), fade in when ready. No spinners.
- **Pull-to-refresh:** standard Android RefreshControl, RUST tint

---

## Accessibility

### Touch Targets
- **Minimum:** 44pt (88 x 88 pixels at 2x density)
- **Recommended:** 48pt
- **Button height:** 48pt minimum
- **Tab bar items:** 50pt height, each tab ~64pt wide

### Text & Contrast
- **Body text:** 16pt minimum, 7:1 contrast (CREAM on CHARCOAL)
- **Labels:** 14pt minimum, 5:1 contrast
- **All text:** avoid white-on-white or low-contrast combinations

### Screen Reader Support
- **Tab bar items:** label + icon description
- **Buttons:** descriptive label text
- **Images:** alt text for all images
- **Cards:** semantic heading + body order

---

## Implementation Notes

### React Native Specifics
- Use `React Navigation` for Stack + Tab navigation
- Use `Supabase React Native` client for real-time messaging
- Use `react-native-maps` for Google Maps integration
- Respect safe areas with `SafeAreaView` + `useSafeAreaInsets()`
- Performance: FlatList for feed (not ScrollView + map)
- Image optimization: cache with `react-native-fast-image`

### State Management
- Auth state: Supabase Auth context
- App state: Redux/Zustand (filters, saved items, user data)
- Messages: Supabase real-time subscriptions

### Backend Integration
- User/item queries: Supabase PostgreSQL
- Location-based search: PostGIS radius queries
- Real-time messaging: Supabase Realtime
- File uploads: Supabase Storage

---

## Responsive Breakpoints

### Portrait (Mobile First)
- **320px - 480px:** XS (tight spacing, single column)
- **481px - 768px:** SM (standard padding, slight expansion)

### Landscape (Tablet)
- **769px+:** MD (expanded layout, side-by-side possible)
- **1024px+:** LG (full tablet experience, not MVP)

---

## Quality Assurance Checklist

- [ ] All touch targets ≥44pt (ideally 48pt)
- [ ] All text ≥14pt for labels, ≥16pt for body
- [ ] Safe area clearance respected (notch, home indicator)
- [ ] Color contrast ≥5:1 for all text
- [ ] Gestures clearly hinted (swipe indicators, long-press feedback)
- [ ] No nested-box clutter on any screen
- [ ] Spacing consistent across screens
- [ ] Tab bar height 50pt, icons 18px
- [ ] Buttons filled to 48pt height minimum
- [ ] Cards breathe with proper margins
- [ ] Typography hierarchy obvious on each screen
- [ ] Bottom sheet 110px height, positioned absolutely
- [ ] Search bar 48pt height minimum
- [ ] Image placeholders clear and proportionate

---

## Taste Filter Applied (2026-06-01)

Contrast and size corrections from design-taste-frontend review:

| Element | Before | After | Reason |
|---|---|---|---|
| Primary button text | CHARCOAL (#3D3D39) on RUST | CREAM (#F5F1E8) on RUST | 2.26:1 → 3.84:1; WCAG AA large text |
| Secondary button active text | CHARCOAL on RUST | CREAM on RUST | Same contrast failure |
| FREE badge text | CHARCOAL on RUST | CREAM on RUST | Same contrast failure |
| Tab bar label size | 9px | 11px | Below Android M3 floor (10-12sp) |
| Bottom sheet item title | 12px 700 | 14px 700 | Primary title too small for tap-action preview |

Shape system documented: `border-radius: 0` all UI elements, `50%` avatars only.

---

**Status:** Design specs extracted, taste-filtered, and locked.  
**Ready for:** React Native component development and screen implementation.
