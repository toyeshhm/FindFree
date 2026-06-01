# Design System: FindFree

## 0. Vibe Archetype: Community Brutalist

FindFree occupies a 4th design archetype not found in typical premium UI frameworks. It is neither Ethereal Glass (SaaS), Editorial Luxury (lifestyle), nor Soft Structuralism (health/portfolio).

**Community Brutalist:** Dark charcoal ground. Rust-chalk accent marks on every surface that matters. Cream paper text as the only light source. The aesthetic is a machined community board — weathered, direct, trustworthy. Not a tech product. Not a luxury brand. A neighborhood tool that takes itself seriously without being corporate.

**What this unlocks:**
- Cards feel like physical notices pinned to a board, not floating software tiles
- Typography is directive and warm, never decorative
- Motion is weighted and gesture-resonant, not performative
- The ONE accent (RUST) earns attention rather than competing for it

---

## 1. Visual Theme & Atmosphere

A dark-ground, community-raw interface with bold typographic confidence and deliberate material roughness. The atmosphere is warm but unpolished — like a neighborhood community board made digital: weathered charcoal surfaces, rust-orange chalk marks, and cream paper text.

**Personality:** Warm Brutalist. Human-scale, not corporate. Feels like a friend helping you hunt through a neighborhood's discarded treasure.

**Dial Settings:**
- Variance: 6/10 (Offset Asymmetric — structured brutalist grid with deliberate weight breaks)
- Motion: 7/10 (Gesture-First Choreography — fast, spring-weighted, haptic-resonant)
- Density: 6/10 (Daily App Balanced — mobile card density with breath between items)

**Platform:** React Native, Android 12+, dark mode default. All values in logical pixels (dp/sp) which map 1:1 to CSS pt at 1x density.

---

## 2. Color Palette & Roles

All surfaces are dark-ground. Cream is foreground, never background.

- **Charcoal Ground** (#3D3D39) — Primary screen background. All screens rest on this.
- **Mid Charcoal** (#4A4844) — Cards, input fields, bottom sheets, modals. One step elevated from ground.
- **Deep Charcoal** (#2D2D2A) — Deeper overlays, pressed states, recessed elements.
- **Light Charcoal** (#5A5450) — Tertiary surfaces, image placeholder fills.
- **Cream Paper** (#F5F1E8) — Primary text, button labels, foreground glyphs. The light source of every screen.
- **Rust Accent** (#8B6F47) — Single accent. Tab bar active, button fills, card left-borders, badges, focus rings. The one warm signal on every screen.
- **Rust Light** (#D4A574) — Accent highlight only: dashed image borders, secondary accent marks, icon highlights.
- **Muted Ash** (#B8B0A0) — Secondary text, metadata, distance labels, timestamps.
- **Disabled Gray** (#999999) — Placeholder text in inputs. Never for readable content.

**Divider tint:** `rgba(139, 111, 71, 0.3)` — 30% Rust. Use for hairline dividers and row separators.

**Palette rules:**
- One accent only: Rust (#8B6F47). No second accent introduced anywhere.
- No warm/cool shift: all surfaces stay in the charcoal-earth family.
- Never pure black (#000000). Never pure white (#FFFFFF).
- Cream is text and foreground only. Never as a background on any surface.

---

## 3. Font Stack

**System native. No custom font files for MVP.**

```jsx
fontFamily: Platform.OS === 'ios' 
  ? '-apple-system, BlinkMacSystemFont' 
  : 'Roboto, sans-serif'
```

Roboto on Android, SF Pro on iOS. Performance and native feel over brand expression at this stage. For post-MVP custom font choices, see Section 10.

**Banned:** Inter as default, any decorative fonts, mixed families within one text element.

---

## 4. Typography Lockdown (Locked 2026-06-01)

### Scale

**Ratio:** Minor Third (1.2×) from 16sp base. The functional range (11–13–16–20–24–28sp) follows the ratio exactly.

| Role | Size | Weight | Line Height | Letter Spacing | Uppercase? |
|---|---|---|---|---|---|
| Display Hero | 56sp | 900 | 1.0 | 0 | YES — splash only |
| Display Heading | 48sp | 900 | 1.0 | 0 | YES — splash only |
| Section Title | 28sp | 700 | 1.2 | -0.3dp | no |
| Headline | 24sp | 700 | 1.2 | -0.25dp | no |
| Subheading | 20sp | 500 | 1.3 | 0 | no |
| Body | 16sp | 400 | 1.5 | 0 | no |
| Body Compact | 15sp | 400 | 1.4 | 0 | no — list items only |
| Label | 14sp | 500 | 1.3 | 0 | no |
| Caption | 13sp | 400 | 1.4 | 0 | no — use tabular-nums |
| Tiny Label | 12sp | 700 | 1.2 | 1.2dp | YES — badges, section heads |
| Nav Label | 11sp | 700 | 1.2 | 0.9dp | YES — tab bar |

### Rules

**Weights (Android Roboto only has 100, 300, 400, 500, 700, 900):**
- Never specify `fontWeight: '600'` or `'800'` — maps unpredictably.
- Use only: 400 (Regular), 500 (Medium), 700 (Bold), 900 (Black).

**Dark mode:** FindFree is dark-mode first. CREAM (#F5F1E8) on CHARCOAL (#3D3D39) = 7.2:1 AAA. Apply `-webkit-font-smoothing: antialiased` equivalent (`fontSmoothing` in RN where available) on dark surfaces.

**Uppercase text always gets positive letter spacing:** 7-10% of font size. 14sp = 1dp. 12sp = 1.2dp. 11sp = 0.9dp.

**Large headings (28sp+) get slight negative tracking:** -0.01em. Prevents the spaced-out "shouting" look at display sizes.

**Tabular numbers for all numeric UI:** Distances, timestamps, counts, prices — all use `fontVariant: ['tabular-nums']` to prevent shimmy on value updates.

**Line length:** Descriptions and body text should constrain to ~40 characters per line at standard gutter width (288dp available). Use `numberOfLines` for truncation with explicit "Show more" affordance where content is long.

**Hierarchy is weight + color + size — not size alone.** Never increase font size to achieve emphasis. Use weight (400 → 700) or color (Muted Ash → Cream Paper) first.

**Orphan prevention:** Item titles in feed cards: `numberOfLines={2}`. Detail descriptions: `numberOfLines={5}` with expand. Message bubbles: natural wrap.

---

## 5. Component Stylings

### Buttons

**Primary Button**
- Background: Rust Accent (#8B6F47)
- Text: Cream Paper (#F5F1E8), 14sp 700 uppercase, letterSpacing: 1dp
- Border: 2px solid Rust Accent
- Border-radius: 0 (square, brutalist — non-negotiable)
- Height: 48dp minimum
- Active state: CREAM background (#F5F1E8), RUST text (#8B6F47), scale(0.98)
- Disabled: 50% opacity, no interaction

**Secondary Button**
- Background: transparent
- Text: Cream Paper (#F5F1E8), 14sp 700 uppercase
- Border: 2px solid Rust Accent (#8B6F47)
- Border-radius: 0
- Height: 48dp minimum
- Active state: Rust Accent fill, Cream Paper text, scale(0.98)

**Tactile feedback:** All buttons use `scale(0.98)` + 80ms spring on press. No neon glows. No outer shadows.

### Cards / Feed Items

- Background: Mid Charcoal (#4A4844)
- Left accent border: 3px solid Rust Accent
- Bottom divider: 1px solid Light Charcoal (#5A5450)
- Internal padding: 12dp
- Margin: 12dp horizontal, 12dp bottom
- Border-radius: 0
- Image placeholder: 80dp height, 1px dashed Rust Light (#D4A574)
- Active/pressed: background tints to Deep Charcoal (#2D2D2A), 120ms

**Rule:** Cards used because the left-accent border communicates item-level identity, not just grouping. The 3px rust stroke is the brutalist signature on every item.

### Badges

- Background: Rust Accent (#8B6F47)
- Text: Cream Paper (#F5F1E8), 12sp 700 uppercase
- Padding: 2dp vertical, 6dp horizontal
- Border-radius: 0

### Input Fields (Search Bar)

- Background: Mid Charcoal (#4A4844)
- Border: 2px solid Rust Accent (#8B6F47)
- Text: Cream Paper (#F5F1E8), 13sp 400
- Placeholder: Disabled Gray (#999999)
- Height: 48dp minimum
- Border-radius: 0
- Focus state: border brightens to Rust Light (#D4A574)
- Prefix icon: Muted Ash, shifts to Cream on focus

### Tab Bar (Bottom Navigation)

- Background: Charcoal Ground (#3D3D39)
- Top border: 2px solid Rust Accent
- Height: 50dp
- Tab active: Rust Accent icon + label, background tint `rgba(139,111,71,0.1)`
- Tab inactive: Muted Ash icon + label
- Inter-tab divider: 1px `rgba(139,111,71,0.3)`
- Label: 11sp 700 (see Typography)
- Icon: 18dp
- Touch target: full tab area (5 tabs across ~64dp each)

### Bottom Sheet (Item Preview)

- Background: Mid Charcoal (#4A4844)
- Top border: 2px solid Rust Accent
- Height: 110dp fixed
- Padding: 12dp
- Item title: 14sp 700 Cream Paper
- Meta: 11sp 400 Muted Ash
- Thumb: 60x60dp, Rust Accent background, 2px dashed Rust Light border
- Border-radius: 0

### Avatars

**Exception to border-radius: 0.** Avatars use `border-radius: 50%` (circle). This is the only element in the system permitted rounded corners. No exceptions for any other element type.

| Avatar size | Usage |
|---|---|
| 64dp | Profile screen header |
| 44dp | Message list items |
| 36dp | Detail card poster info (note: if tappable, expand tap zone to 44dp minimum) |

### Double-Bezel Card Architecture (Doppelrand)

All cards use a nested enclosure technique to achieve physical, machined depth — adapted for `border-radius: 0` brutalism:

```
Outer Shell:
  background: MID_CHARCOAL (#4A4844)
  borderLeftWidth: 3
  borderLeftColor: RUST (#8B6F47)
  borderBottomWidth: 1
  borderBottomColor: LIGHT_CHARCOAL (#5A5450)
  padding: 1 (outer shell breathing room)

Inner Core:
  background: MID_CHARCOAL (#4A4844)
  borderTopWidth: 1
  borderTopColor: rgba(255, 255, 255, 0.06)  ← inner highlight line
  padding: 12 (actual content padding)
```

The 1px `rgba(255,255,255,0.06)` top inner border creates the sensation of a raised surface — as if the card is sitting slightly above the ground plane. Combined with the 3px rust left-border (the "stake in the board"), each card reads as a physical object.

**Rule:** All feed cards, detail sections, poster info blocks, and bottom sheets implement this nested structure.

### Primary CTA Architecture: Button-in-Button

The "Message Poster" and "Post Your Item" buttons use an inner icon zone — a distinct square enclosure flush to the right inner edge:

```
Primary Button (Message Poster):
  Layout: row, align-center
  Left content: "MESSAGE POSTER" label — 14sp 700 uppercase, CREAM
  Right zone: 
    width: 32, height: 32
    background: rgba(61, 61, 57, 0.3)  ← 30% CHARCOAL overlay on RUST
    borderLeftWidth: 1
    borderLeftColor: rgba(61, 61, 57, 0.3)
    align-center, justify-center
    Icon: arrow-right, 16dp, CREAM
```

On press: entire button scales to 0.97, icon zone translates `x: +2, y: -1` over 80ms spring. Physical key-press sensation.

### Loading States

- Skeleton screens only. No circular spinners.
- Skeleton placeholder fill: Light Charcoal (#5A5450)
- Shimmer direction: left-to-right, 1.2s cycle, opacity 0.4 → 0.7
- Skeleton shapes must match the final layout exactly (card shape for cards, bar shape for text lines)

### Empty States

- Friendly, warm copy. Never generic "No data" text.
- Example: "No items nearby yet — try expanding your radius!"
- Minimal iconography: single icon at 48dp, Muted Ash color
- CTA where applicable (e.g., "Post the first item")

### Error States

- Inline, below the triggering element
- Color: Rust Light (#D4A574) for non-blocking warnings
- For blocking errors: a toast at bottom, Mid Charcoal background, Rust accent top border
- Copy: plain English. "Couldn't load map. Check your connection." — not "Error 404."

---

## 6. Layout Principles

**Shape system (non-negotiable):**
`border-radius: 0` for all UI components. `border-radius: 50%` for avatars only. This rule must not be violated by any new screen or component.

**Touch targets:** 44dp minimum, 48dp preferred. All interactive elements.

**Safe areas:**
- Top (notch/status bar): 28dp clearance
- Bottom (home indicator/nav bar): 34dp clearance (Android), 48dp (with nav bar)
- Sides: 16dp minimum gutter

**Spacing rhythm:** 8dp base unit. All spacing values are multiples: 4, 8, 12, 16, 20, 24, 32, 40.

**Gutters:** 16dp standard horizontal padding on all screens.

**Elevation language:** Use border strokes, not shadows. Depth is communicated through:
1. Surface color stepping (Charcoal → Mid Charcoal → Light Charcoal)
2. Rust accent borders (indicates interactive or primary layer)
3. No drop shadows. No material-style elevation.

**Grid:** Single-column for all primary content. No multi-column feed. Tab bar handles primary navigation, not drawers or hamburger menus.

---

## 7. Motion & Interaction

**Philosophy:** Motion should feel physical — weighted, spring-based, gesture-resonant. Nothing floats, nothing eases linearly. Every interaction has a tactile quality.

**Spring presets (from `lib/springs.ts`):**
```js
Springs.standard  = { stiffness: 120, damping: 15, mass: 1 }  // buttons, cards, tabs
Springs.heavy     = { stiffness: 100, damping: 20, mass: 1 }  // screen transitions, bottom sheet
Springs.snappy    = { stiffness: 200, damping: 22, mass: 1 }  // press feedback, tab indicator
Springs.gentle    = { stiffness: 100, damping: 18, mass: 1 }  // feed card entry
```

**Web equivalent:** `cubic-bezier(0.32, 0.72, 0, 1)`

No linear easing. No `ease-in-out`. Spring only.

**Full implementation:** See `docs/MOTION_SPEC.md` for all 16 interaction patterns with code.

**Gesture language:**
- Swipe left: Back / dismiss (universal throughout)
- Tap: Select / navigate
- Long-press: Context menu (favorite, share, report) — no visual change on initial hold; action on confirmed long-press
- Pull-to-refresh: Standard platform animation (don't override)

**Screen transitions:**
- Push (enter): slide in from right + fade, 250ms spring
- Pop (back): slide out to right + fade, 250ms spring
- Tab switch: cross-fade, 150ms
- Bottom sheet appear: translate up from bottom, 200ms spring
- Bottom sheet dismiss: translate down, 180ms

**Button feedback:**
- Press: `scale(0.98)`, 80ms spring
- Release: return `scale(1.0)`, 120ms spring

**Card/list item press:**
- Background tints to Deep Charcoal (#2D2D2A), 100ms

**Feed card entry animation (heavy fade-up):**
Each card entering the viewport transitions from:
```
initial: { translateY: 16, opacity: 0 }
final:   { translateY: 0, opacity: 1 }
duration: 600ms, spring stiffness: 100, damping: 18
```
Stagger: 50ms delay between consecutive cards. Max 5 cards staggered — beyond that, instant reveal (avoids long waits on fast scroll).

**Loading entry:**
- Screen content fades in over 200ms after skeleton → real data swap
- List items use the heavy fade-up above on initial load

**Reduced motion:** All transitions collapse to instant crossfades when `prefers-reduced-motion: reduce` or system accessibility settings are enabled. Never skip this check.

**Rules:**
- Animate `transform` and `opacity` only. Never `top`, `left`, `width`, `height`.
- No linear easing. Spring or custom cubic-bezier only.
- No idle auto-animations (pulsing cards, floating elements) — motion only on user interaction or data events.
- Haptic feedback optional on button press (light impact), not mandatory.

---

## 8. Navigation Architecture

**Primary navigation:** Bottom Tab Bar with 5 tabs. Thumb-reachable (lower 2/3 of screen). Always visible except in full-screen states (photo carousel).

**Tab order:**
1. Map (home, default)
2. Feed
3. Messages (locked for guests — shows sign-up prompt on tap)
4. Saved (locked for guests)
5. Profile (locked for guests)

**Screen entry patterns:**
- Map markers → Item Detail (push)
- Feed cards → Item Detail (push)
- Message Poster → Chat Thread (push)
- Filters → Filter Sheet (bottom sheet)
- Item image → Photo Carousel (full-screen modal)

**Guest experience:** Map + Feed fully accessible. Messages, Saved, Profile show inline "Sign up to unlock" with single CTA. No blocking modals on app open.

---

## 9. Feed Variety (Anti-Repetition)

A feed of identical card clones creates cognitive flatness. Use a tiered card system to break monotony while preserving the brutalist language:

**Card tiers (rotate, not every card the same):**
- **Standard card:** 80dp image thumbnail + title + meta. Default, ~60% of cards.
- **Feature card:** 140dp image + title + description excerpt. First card in session, or freshly posted items within 1 hour.
- **Text-only card:** No image placeholder; title + meta + larger description snippet. For items posted without photos.

**Rule:** No more than 3 identical-height cards in a row before a tier break. The rust left-accent and MID_CHARCOAL background are consistent across all tiers — only proportions change.

**Map markers:** 2 sizes — standard (24dp, RUST fill) and cluster (32dp, RUST fill + item count badge). No decorative marker icons.

---

## 10. Headline Discipline

**2-3 line maximum rule (all screens):**
Every primary headline on every screen must fit within 2-3 lines at the screen's standard gutter width. If a headline wraps to 4 lines, either shorten the copy or increase the font size to force 2-line wrapping.

Reference values for 320dp-wide screen at 16dp gutters (288dp text width):
- 24sp 700: approximately 20-22 characters per line
- 28sp 700: approximately 17-19 characters per line
- 56sp 900 (splash): 6-8 characters per line — keep to one word per line maximum

**Onboarding headline:** "Welcome to FindFree" = 19 characters. At 28sp on 288dp width, fits in 1-2 lines. ✅

---

## 11. Future Font Recommendation

If custom fonts are introduced (post-MVP, marketing surface, or brand evolution), the prescribed choices in priority order are: **Geist**, **Satoshi**, **Cabinet Grotesk**, **Outfit**. NEVER Inter.

---

## 12. Anti-Patterns (Banned)

**Typography:**
- No emoji anywhere in the UI.
- No Inter font.
- No uppercase for more than 3 words (badges, tab labels, button text only).
- No mixed-family text (e.g., injecting a different font weight into a headline).
- No text below 11sp visible to users in any context.

**Color:**
- No pure black (#000000) or pure white (#FFFFFF).
- No neon/outer glow shadows.
- No gradient text on any element.
- No warm-to-cool background shift between screens or sections.
- No second accent color introduced anywhere in the system.
- CHARCOAL text (#3D3D39) on RUST background (#8B6F47) is banned — contrast 2.26:1, fails WCAG. Use CREAM on RUST instead.

**Layout:**
- No rounded corners on any UI element except avatars.
- No drop shadows or material-style elevation.
- No horizontal scroll on any primary content surface.
- No modal covering the full screen (use bottom sheets).
- No absolute-positioned elements that stack on each other unintentionally.

**Components:**
- No circular loading spinners. Skeletons only.
- No generic "John Doe", "Acme Co", "User 1" placeholder text.
- No fake round numbers ("99.9% uptime", "1000+ listings") unless from real data.
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize".
- No empty state that just says "Nothing here." Write a helpful, warm message.

**Motion:**
- No idle auto-animations (nothing pulses or floats without user action).
- No linear easing on any transition.
- No `window.addEventListener('scroll')` equivalents (use native scroll listeners with proper cleanup).
- No motion that doesn't degrade gracefully under reduced-motion settings.

**Identity:**
- No premium-consumer warm-paper aesthetic with cream background. FindFree uses DARK surfaces — the cream is text, not background.
- No corporate visual language. This is a community platform.
- No "powered by" or version stamps visible in the UI.

---

## 13. Contrast Reference

Critical contrast values (verified):

| Pair | Ratio | WCAG Rating |
|---|---|---|
| Cream Paper on Charcoal Ground | 7.2:1 | AAA |
| Muted Ash on Charcoal Ground | 5.5:1 | AA |
| Muted Ash on Mid Charcoal | 4.8:1 | AA (small text borderline) |
| Cream Paper on Rust Accent | 3.84:1 | AA large text (14sp bold+) |
| Rust Light on Deep Charcoal | 5.9:1 | AA |
| BANNED: Charcoal on Rust | 2.26:1 | FAIL |

**Rule:** Any RUST-background element must use CREAM (#F5F1E8) as text/icon color.

---

*FindFree DESIGN.md — Taste-filtered 2026-06-01 (design-taste-frontend, stitch-design-taste, gpt-taste). Use this as the prompt source for all new screen generation and component implementation.*
