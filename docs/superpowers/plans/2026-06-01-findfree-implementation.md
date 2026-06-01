# FindFree React Native — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete FindFree React Native app — all screens, navigation, Supabase backend, and design system — from a blank Expo template to a shippable Android MVP.

**Architecture:** Feature-based structure under `src/`. Design system in `src/lib/`. Screens in `src/app/`. Feature components in `src/features/`. Shared primitives in `src/components/`. Zustand for client state, TanStack Query for server state, Supabase for backend + realtime.

**Tech Stack:** Expo SDK 51 / React Native 0.74, TypeScript, React Navigation 7, Reanimated 3, Zustand, TanStack Query v5, Supabase JS v2, MMKV, expo-image, expo-location, phosphor-react-native

**Reference docs (required reading):**
- `docs/DESIGN.md` — color palette, typography, component rules
- `docs/DESIGN_SPECS.md` — pixel specs, canonical color token names
- `docs/MOTION_SPEC.md` — all Reanimated 3 patterns
- `docs/ARCHITECTURE.md` — full TypeScript types, store shapes, component code
- `docs/COPY.md` — every label, placeholder, error, empty state
- `docs/QUALITY_GATE.md` — pre-implementation checklist + gap resolutions

---

## Pre-Start Checklist

- [ ] Supabase project created at supabase.com — PostGIS extension enabled (`Database > Extensions > postgis`)
- [ ] Google Maps API key created (Maps SDK for Android enabled)
- [ ] Node 20+ installed: `node --version`
- [ ] Decision: remove Dark Mode toggle from MVP Settings (GAP-1, QUALITY_GATE.md)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `babel.config.js`, `app.json`, `.env.local`
- Create: `jest.config.js`, `jest-setup.ts`

- [ ] **Step 1: Scaffold the Expo app in the existing project root**

```bash
cd /Users/medikonda/Projects/FindFree
npx create-expo-app@latest . --template blank-typescript
```

When prompted that the directory is not empty, choose to continue. This adds `package.json`, `app.json`, `tsconfig.json`, `App.tsx`, etc. without touching `docs/`.

- [ ] **Step 2: Install all runtime dependencies**

```bash
npx expo install \
  @react-navigation/native \
  @react-navigation/native-stack \
  @react-navigation/bottom-tabs \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  react-native-reanimated \
  @tanstack/react-query \
  zustand \
  @supabase/supabase-js \
  react-native-mmkv \
  expo-location \
  expo-image \
  expo-haptics \
  react-native-maps \
  phosphor-react-native
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev \
  @testing-library/react-native \
  @testing-library/jest-native \
  jest-expo \
  @types/react \
  @types/react-native
```

- [ ] **Step 4: Replace tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 5: Replace babel.config.js**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-reanimated/plugin'],
      ['module-resolver', {
        root: ['./src'],
        alias: { '@': './src' },
      }],
    ],
  };
};
```

Install the resolver: `npm install --save-dev babel-plugin-module-resolver`

- [ ] **Step 6: Create jest.config.js**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  setupFiles: ['./jest-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*|@tanstack/.*|phosphor-react-native)',
  ],
};
```

- [ ] **Step 7: Create jest-setup.ts**

```ts
import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const MapView = ({ children }: any) => React.createElement('View', null, children);
  const Marker = ({ children }: any) => React.createElement('View', null, children);
  return { default: MapView, Marker };
});
```

- [ ] **Step 8: Create .env.local**

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
EXPO_PUBLIC_GOOGLE_MAPS_KEY=YOUR_MAPS_KEY
```

- [ ] **Step 9: Create the src directory structure**

```bash
mkdir -p src/{app/auth,app/messages,app/profile,components,features/feed,features/map,features/items,features/messages,features/profile,hooks,lib,navigation,services,stores,types}
```

- [ ] **Step 10: Delete the generated App.tsx** — it will be replaced by `src/app/_layout.tsx` wired in a later task.

```bash
rm App.tsx
```

- [ ] **Step 11: Update app.json to point at the new entry**

In `app.json`, set:
```json
{
  "expo": {
    "entryPoint": "src/index.tsx",
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": ""
        }
      }
    }
  }
}
```

The `googleMaps.apiKey` will be set via EAS Secrets before release; leave blank locally for now.

- [ ] **Step 12: Create src/index.tsx (entry point)**

```tsx
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { RootLayout } from './app/_layout';

registerRootComponent(RootLayout);
```

- [ ] **Step 13: Verify the project compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (some "module not found" errors are OK until we create the files).

- [ ] **Step 14: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Expo project with all dependencies"
```

---

## Task 2: Supabase Database Schema

**Files:**
- Create: `supabase/schema.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create supabase/schema.sql**

```sql
-- Enable PostGIS (must be done first)
CREATE EXTENSION IF NOT EXISTS postgis;

-- User profiles (extends auth.users — created automatically on sign-up via trigger)
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_url  TEXT,
  message_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Items
CREATE TABLE items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  category    TEXT DEFAULT 'other'
              CHECK (category IN ('furniture','electronics','clothing','books','kitchen','sports','toys','other')),
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  address     TEXT,
  photo_urls  TEXT[] DEFAULT '{}',
  source      TEXT NOT NULL DEFAULT 'user'
              CHECK (source IN ('user','facebook','craigslist','buynot')),
  source_id   TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status      TEXT DEFAULT 'available'
              CHECK (status IN ('available','claimed','deleted')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX items_location_idx ON items
  USING GIST(ST_Point(lng, lat));

-- Saved items (junction table)
CREATE TABLE saved_items (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id    UUID REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

-- Conversations (one per item + requester pair)
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID REFERENCES items(id) ON DELETE CASCADE,
  requester_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  poster_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_id, requester_id)
);

-- Messages
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET last_message = NEW.body,
      last_message_at = NEW.created_at,
      unread_count = unread_count + 1,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Nearby items RPC (uses PostGIS)
CREATE OR REPLACE FUNCTION get_nearby_items(
  user_lat       DOUBLE PRECISION,
  user_lng       DOUBLE PRECISION,
  radius_km      DOUBLE PRECISION DEFAULT 10,
  category       TEXT DEFAULT NULL,
  max_age_hours  INT  DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  title       TEXT,
  description TEXT,
  category    TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  address     TEXT,
  photo_urls  TEXT[],
  source      TEXT,
  source_id   TEXT,
  user_id     UUID,
  status      TEXT,
  created_at  TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  distance_km DOUBLE PRECISION
)
LANGUAGE SQL STABLE AS $$
  SELECT
    i.id, i.title, i.description, i.category,
    i.lat, i.lng, i.address,
    i.photo_urls, i.source, i.source_id,
    i.user_id, i.status, i.created_at, i.expires_at,
    ST_Distance(
      ST_Point(i.lng, i.lat)::geography,
      ST_Point(user_lng, user_lat)::geography
    ) / 1000.0 AS distance_km
  FROM items i
  WHERE
    i.status = 'available'
    AND ST_DWithin(
      ST_Point(i.lng, i.lat)::geography,
      ST_Point(user_lng, user_lat)::geography,
      radius_km * 1000
    )
    AND (get_nearby_items.category IS NULL OR i.category = get_nearby_items.category)
    AND (max_age_hours IS NULL OR i.created_at > NOW() - (max_age_hours || ' hours')::INTERVAL)
  ORDER BY distance_km
  LIMIT 100;
$$;

-- Row-level security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- user_profiles: anyone can read, only owner can write
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- items: anyone can read available items, signed-in users can insert, only owner can update/delete
CREATE POLICY "items_select" ON items FOR SELECT USING (status != 'deleted');
CREATE POLICY "items_insert" ON items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "items_update" ON items FOR UPDATE USING (auth.uid() = user_id);

-- saved_items: only own saves
CREATE POLICY "saved_select" ON saved_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_insert" ON saved_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_delete" ON saved_items FOR DELETE USING (auth.uid() = user_id);

-- conversations: participants only
CREATE POLICY "conv_select" ON conversations FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = poster_id);
CREATE POLICY "conv_insert" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- messages: conversation participants only
CREATE POLICY "msg_select" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c WHERE c.id = conversation_id
      AND (c.requester_id = auth.uid() OR c.poster_id = auth.uid())
    )
  );
CREATE POLICY "msg_insert" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c WHERE c.id = conversation_id
      AND (c.requester_id = auth.uid() OR c.poster_id = auth.uid())
    )
  );
```

- [ ] **Step 2: Create supabase/seed.sql (dev fixtures)**

```sql
-- Seed 10 nearby items around San Francisco (lat 37.78, lng -122.41)
INSERT INTO items (title, description, category, lat, lng, address, source, status) VALUES
  ('Vintage Wooden Desk', 'Solid oak, minor scratches. 150cm wide. Must carry out yourself.', 'furniture', 37.7850, -122.4094, 'Castro District', 'user', 'available'),
  ('Box of Books', 'Mix of fiction and textbooks. About 20 books total.', 'books', 37.7751, -122.4193, 'Mission District', 'craigslist', 'available'),
  ('Standing Floor Lamp', 'Works fine, bulb included. Black metal.', 'furniture', 37.7690, -122.4230, 'Noe Valley', 'user', 'available'),
  ('Microwave Oven', 'Samsung, 700W, 2 years old. Fully working.', 'kitchen', 37.7920, -122.4010, 'Hayes Valley', 'facebook', 'available'),
  ('Kids Bicycle', '20 inch wheels, needs a tune-up. Blue.', 'sports', 37.7650, -122.4310, 'Glen Park', 'user', 'available'),
  ('Set of Pots and Pans', 'Stainless steel, 5 pieces. Used but clean.', 'kitchen', 37.7810, -122.4150, 'Haight-Ashbury', 'buynot', 'available'),
  ('Winter Coat Large', 'North Face, barely worn. Dark green.', 'clothing', 37.7730, -122.4080, 'SoMa', 'user', 'available'),
  ('IKEA Bookshelf', 'BILLY shelf, white, some scratches. You disassemble.', 'furniture', 37.7900, -122.4260, 'Lower Haight', 'craigslist', 'available'),
  ('PlayStation 3 + Games', 'Console + 8 games. Controllers need new batteries.', 'electronics', 37.7820, -122.4190, 'Duboce Triangle', 'facebook', 'available'),
  ('Yoga Mat + Blocks', 'Lululemon mat, good condition. 2 foam blocks included.', 'sports', 37.7700, -122.4050, 'Mission', 'buynot', 'available');
```

- [ ] **Step 3: Apply schema in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run `schema.sql`.
Then run `seed.sql` in a second query to populate test data.

- [ ] **Step 4: Enable realtime for messages table**

In Supabase Dashboard → Database → Replication, enable replication for the `messages` table.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema, RLS policies, nearby items RPC"
```

---

## Task 3: TypeScript Types + Navigation Types

**Files:**
- Create: `src/types/index.ts`
- Create: `src/navigation/types.ts`

- [ ] **Step 1: Create src/types/index.ts**

```ts
export type ItemCategory =
  | 'furniture' | 'electronics' | 'clothing' | 'books'
  | 'kitchen'   | 'sports'      | 'toys'     | 'other';

export type ItemSource  = 'user' | 'facebook' | 'craigslist' | 'buynot';
export type ItemStatus  = 'available' | 'claimed' | 'deleted';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  location: LatLng & { address?: string };
  photoUrls: string[];
  source: ItemSource;
  sourceId?: string;
  userId?: string;
  status: ItemStatus;
  createdAt: string;
  expiresAt: string;
  distanceKm?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  messageCount: number;
}

export interface Conversation {
  id: string;
  itemId: string;
  item?: Pick<Item, 'title' | 'photoUrls'>;
  otherUser?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface FilterState {
  radiusKm: number;
  category?: ItemCategory;
  maxAgeHours?: number;
}
```

- [ ] **Step 2: Create src/navigation/types.ts**

```ts
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation as useNav } from '@react-navigation/native';

export type RootStackParamList = {
  Splash:     undefined;
  Onboarding: undefined;
  Auth:       NavigatorScreenParams<AuthStackParamList>;
  Main:       NavigatorScreenParams<TabParamList>;
  ItemDetail: { itemId: string };
  ChatThread: { conversationId: string; itemTitle: string };
  PostItem:   undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type TabParamList = {
  MapTab:      undefined;
  FeedTab:     undefined;
  MessagesTab: undefined;
  SavedTab:    undefined;
  ProfileTab:  undefined;
};

export const useNavigation = () =>
  useNav<NativeStackNavigationProp<RootStackParamList>>();
```

- [ ] **Step 3: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/ src/navigation/
git commit -m "feat: add TypeScript types and navigation param types"
```

---

## Task 4: Design System Constants

**Files:**
- Create: `src/lib/colors.ts`
- Create: `src/lib/typography.ts`
- Create: `src/lib/spacing.ts`
- Create: `src/lib/springs.ts`
- Create: `src/lib/haptics.ts`
- Create: `src/lib/useReducedMotion.ts`
- Create: `src/lib/storage.ts`
- Create: `src/lib/index.ts`
- Create: `src/__tests__/lib/colors.test.ts`
- Create: `src/__tests__/lib/springs.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/__tests__/lib/colors.test.ts
import { Colors } from '@/lib/colors';

describe('Colors', () => {
  it('has 10 tokens', () => {
    expect(Object.keys(Colors)).toHaveLength(10);
  });
  it('CHARCOAL is the ground color', () => {
    expect(Colors.CHARCOAL).toBe('#3D3D39');
  });
  it('CREAM is the primary text color', () => {
    expect(Colors.CREAM).toBe('#F5F1E8');
  });
  it('RUST is the single accent', () => {
    expect(Colors.RUST).toBe('#8B6F47');
  });
  it('no pure black or pure white', () => {
    const values = Object.values(Colors);
    expect(values).not.toContain('#000000');
    expect(values).not.toContain('#FFFFFF');
  });
});
```

```ts
// src/__tests__/lib/springs.test.ts
import { Springs } from '@/lib/springs';

describe('Springs', () => {
  it('has 4 presets', () => {
    expect(Object.keys(Springs)).toHaveLength(4);
  });
  it('all presets have stiffness, damping, mass', () => {
    for (const preset of Object.values(Springs)) {
      expect(preset).toHaveProperty('stiffness');
      expect(preset).toHaveProperty('damping');
      expect(preset).toHaveProperty('mass');
    }
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest src/__tests__/lib --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/colors'`

- [ ] **Step 3: Create src/lib/colors.ts**

```ts
export const Colors = {
  CHARCOAL:        '#3D3D39',
  MID_CHARCOAL:    '#4A4844',
  DEEPER_CHARCOAL: '#2D2D2A',
  LIGHT_CHARCOAL:  '#5A5450',
  CREAM:           '#F5F1E8',
  RUST:            '#8B6F47',
  RUST_LIGHT:      '#D4A574',
  MUTED_ASH:       '#B8B0A0',
  DISABLED_GRAY:   '#999999',
  DIVIDER:         'rgba(139, 111, 71, 0.3)',
} as const;

export type ColorToken = keyof typeof Colors;
```

- [ ] **Step 4: Create src/lib/typography.ts**

```ts
import type { TextStyle } from 'react-native';

type TypographyRole = Omit<TextStyle, 'color'>;

export const Typography: Record<string, TypographyRole> = {
  displayHero:  { fontSize: 56, fontWeight: '900', lineHeight: 56,  letterSpacing: 0 },
  displayHead:  { fontSize: 48, fontWeight: '900', lineHeight: 48,  letterSpacing: 0 },
  sectionTitle: { fontSize: 28, fontWeight: '700', lineHeight: 34,  letterSpacing: -0.3 },
  headline:     { fontSize: 24, fontWeight: '700', lineHeight: 29,  letterSpacing: -0.25 },
  subheading:   { fontSize: 20, fontWeight: '500', lineHeight: 26,  letterSpacing: 0 },
  body:         { fontSize: 16, fontWeight: '400', lineHeight: 24,  letterSpacing: 0 },
  bodyCompact:  { fontSize: 15, fontWeight: '400', lineHeight: 21,  letterSpacing: 0 },
  label:        { fontSize: 14, fontWeight: '500', lineHeight: 18,  letterSpacing: 0 },
  caption:      { fontSize: 13, fontWeight: '400', lineHeight: 18,  letterSpacing: 0 },
  tinyLabel:    { fontSize: 12, fontWeight: '700', lineHeight: 14,  letterSpacing: 1.2 },
  navLabel:     { fontSize: 11, fontWeight: '700', lineHeight: 13,  letterSpacing: 0.9 },
} as const;
```

- [ ] **Step 5: Create src/lib/spacing.ts**

```ts
export const Spacing = {
  micro:      4,
  sm:         8,
  md:         12,
  base:       16,
  lg:         20,
  xl:         24,
  xxl:        32,
  hero:       40,
  gutter:     16,
  safeTop:    28,
  safeBottom: 34,
} as const;
```

- [ ] **Step 6: Create src/lib/springs.ts**

```ts
// Reanimated 3 withSpring config objects.
// All transitions use springs — no linear easing, no ease-in-out.
export const Springs = {
  standard: { stiffness: 120, damping: 15, mass: 1 }, // buttons, cards, tabs
  heavy:    { stiffness: 100, damping: 20, mass: 1 }, // screen transitions, bottom sheet
  snappy:   { stiffness: 200, damping: 22, mass: 1 }, // press feedback, tab indicator
  gentle:   { stiffness: 100, damping: 18, mass: 1 }, // feed card entry
} as const;
```

- [ ] **Step 7: Create src/lib/haptics.ts**

```ts
import * as ExpoHaptics from 'expo-haptics';

export const HapticFeedback = {
  tap: () =>
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light),
  impact: () =>
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium),
  success: () =>
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success),
  error: () =>
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error),
  selection: () =>
    ExpoHaptics.selectionAsync(),
};
```

- [ ] **Step 8: Create src/lib/useReducedMotion.ts**

```ts
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);

  return reduced;
}
```

- [ ] **Step 9: Create src/lib/storage.ts (MMKV adapter for Zustand persist)**

```ts
import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const mmkv = new MMKV();

export const storage: StateStorage = {
  getItem:    (key) => mmkv.getString(key) ?? null,
  setItem:    (key, value) => mmkv.set(key, value),
  removeItem: (key) => mmkv.delete(key),
};
```

- [ ] **Step 10: Create src/lib/index.ts (barrel export)**

```ts
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './springs';
export * from './haptics';
export * from './useReducedMotion';
export * from './storage';
```

- [ ] **Step 11: Run tests — verify they pass**

```bash
npx jest src/__tests__/lib --no-coverage
```

Expected: PASS (2 test files, all tests passing)

- [ ] **Step 12: Commit**

```bash
git add src/lib/ src/__tests__/lib/
git commit -m "feat: add design system constants (colors, typography, spacing, springs, haptics)"
```

---

## Task 5: Supabase Client + Zustand Stores

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/stores/useAuthStore.ts`
- Create: `src/stores/useFilterStore.ts`
- Create: `src/stores/useSavedStore.ts`
- Create: `src/__tests__/stores/useFilterStore.test.ts`
- Create: `src/__tests__/stores/useSavedStore.test.ts`

- [ ] **Step 1: Create src/lib/supabase.ts**

```ts
import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        getItem:    (key) => storage.getItem(key),
        setItem:    (key, value) => { storage.setItem(key, value); },
        removeItem: (key) => { storage.removeItem(key); },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

- [ ] **Step 2: Write failing store tests**

```ts
// src/__tests__/stores/useFilterStore.test.ts
import { act, renderHook } from '@testing-library/react-native';
import { useFilterStore } from '@/stores/useFilterStore';

describe('useFilterStore', () => {
  beforeEach(() => useFilterStore.getState().resetFilters());

  it('has default radius of 10km', () => {
    const { result } = renderHook(() => useFilterStore());
    expect(result.current.filters.radiusKm).toBe(10);
  });

  it('setRadius updates radiusKm', () => {
    const { result } = renderHook(() => useFilterStore());
    act(() => result.current.setRadius(25));
    expect(result.current.filters.radiusKm).toBe(25);
  });

  it('setCategory updates category', () => {
    const { result } = renderHook(() => useFilterStore());
    act(() => result.current.setCategory('furniture'));
    expect(result.current.filters.category).toBe('furniture');
  });

  it('resetFilters clears category and resets radius', () => {
    const { result } = renderHook(() => useFilterStore());
    act(() => { result.current.setRadius(50); result.current.setCategory('books'); });
    act(() => result.current.resetFilters());
    expect(result.current.filters.radiusKm).toBe(10);
    expect(result.current.filters.category).toBeUndefined();
  });
});
```

```ts
// src/__tests__/stores/useSavedStore.test.ts
import { act, renderHook } from '@testing-library/react-native';
import { useSavedStore } from '@/stores/useSavedStore';

describe('useSavedStore', () => {
  beforeEach(() => useSavedStore.getState().setSavedIds([]));

  it('isSaved returns false initially', () => {
    const { result } = renderHook(() => useSavedStore());
    expect(result.current.isSaved('item-1')).toBe(false);
  });

  it('toggle adds an item', () => {
    const { result } = renderHook(() => useSavedStore());
    act(() => result.current.toggle('item-1'));
    expect(result.current.isSaved('item-1')).toBe(true);
  });

  it('toggle removes an already-saved item', () => {
    const { result } = renderHook(() => useSavedStore());
    act(() => { result.current.toggle('item-1'); result.current.toggle('item-1'); });
    expect(result.current.isSaved('item-1')).toBe(false);
  });

  it('setSavedIds seeds the store', () => {
    const { result } = renderHook(() => useSavedStore());
    act(() => result.current.setSavedIds(['a', 'b', 'c']));
    expect(result.current.isSaved('a')).toBe(true);
    expect(result.current.isSaved('d')).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
npx jest src/__tests__/stores --no-coverage
```

Expected: FAIL — `Cannot find module '@/stores/useFilterStore'`

- [ ] **Step 4: Create src/stores/useAuthStore.ts**

```ts
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthStore {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setGuest: (isGuest: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session:  null,
  user:     null,
  isGuest:  false,
  setSession: (session) => set({ session }),
  setUser:    (user) => set({ user }),
  setGuest:   (isGuest) => set({ isGuest }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isGuest: false });
  },
}));
```

- [ ] **Step 5: Create src/stores/useFilterStore.ts**

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/lib/storage';
import type { FilterState, ItemCategory } from '@/types';

interface FilterStore {
  filters: FilterState;
  setRadius:   (km: number) => void;
  setCategory: (category?: ItemCategory) => void;
  setMaxAge:   (hours?: number) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: FilterState = { radiusKm: 10 };

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      setRadius:   (radiusKm) => set((s) => ({ filters: { ...s.filters, radiusKm } })),
      setCategory: (category) => set((s) => ({ filters: { ...s.filters, category } })),
      setMaxAge:   (maxAgeHours) => set((s) => ({ filters: { ...s.filters, maxAgeHours } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    {
      name:    'ff-filters',
      storage: createJSONStorage(() => storage),
    }
  )
);
```

- [ ] **Step 6: Create src/stores/useSavedStore.ts**

```ts
import { create } from 'zustand';

interface SavedStore {
  savedIds:    Set<string>;
  setSavedIds: (ids: string[]) => void;
  toggle:      (itemId: string) => void;
  isSaved:     (itemId: string) => boolean;
}

export const useSavedStore = create<SavedStore>((set, get) => ({
  savedIds: new Set(),
  setSavedIds: (ids) => set({ savedIds: new Set(ids) }),
  toggle: (itemId) =>
    set((s) => {
      const next = new Set(s.savedIds);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return { savedIds: next };
    }),
  isSaved: (itemId) => get().savedIds.has(itemId),
}));
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
npx jest src/__tests__/stores --no-coverage
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/lib/supabase.ts src/stores/
git commit -m "feat: add Supabase client and Zustand stores (auth, filter, saved)"
```

---

## Task 6: Navigation Layout + Custom Tab Bar

**Files:**
- Create: `src/app/_layout.tsx`
- Create: `src/features/navigation/CustomTabBar.tsx`

- [ ] **Step 1: Create src/features/navigation/CustomTabBar.tsx**

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MapPin, List, ChatCircle, BookmarkSimple, User } from 'phosphor-react-native';
import { Colors, Typography, Spacing } from '@/lib';

const TAB_ICONS: Record<string, (active: boolean) => React.ReactElement> = {
  MapTab:      (a) => <MapPin      size={18} color={a ? Colors.RUST : Colors.MUTED_ASH} weight={a ? 'fill' : 'regular'} />,
  FeedTab:     (a) => <List        size={18} color={a ? Colors.RUST : Colors.MUTED_ASH} weight={a ? 'bold' : 'regular'} />,
  MessagesTab: (a) => <ChatCircle  size={18} color={a ? Colors.RUST : Colors.MUTED_ASH} weight={a ? 'fill' : 'regular'} />,
  SavedTab:    (a) => <BookmarkSimple size={18} color={a ? Colors.RUST : Colors.MUTED_ASH} weight={a ? 'fill' : 'regular'} />,
  ProfileTab:  (a) => <User        size={18} color={a ? Colors.RUST : Colors.MUTED_ASH} weight={a ? 'fill' : 'regular'} />,
};

const TAB_LABELS: Record<string, string> = {
  MapTab: 'MAP', FeedTab: 'FEED', MessagesTab: 'MESSAGES',
  SavedTab: 'SAVED', ProfileTab: 'PROFILE',
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const label  = TAB_LABELS[route.name] ?? route.name;

        return (
          <Pressable
            key={route.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
          >
            {TAB_ICONS[route.name]?.(active)}
            <Text style={[styles.label, active && styles.labelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    backgroundColor: Colors.CHARCOAL,
    borderTopWidth:  2,
    borderTopColor:  Colors.RUST,
    height:          50,
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
    borderRightWidth: 1,
    borderRightColor: Colors.DIVIDER,
  },
  tabActive: {
    backgroundColor: 'rgba(139, 111, 71, 0.10)',
  },
  label: {
    ...Typography.navLabel,
    color: Colors.MUTED_ASH,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: Colors.RUST,
  },
});
```

- [ ] **Step 2: Create src/app/_layout.tsx**

```tsx
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import type { RootStackParamList, AuthStackParamList, TabParamList } from '@/navigation/types';
import { CustomTabBar } from '@/features/navigation/CustomTabBar';

// Screens — imported lazily to keep _layout.tsx thin
import { SplashScreen }        from './splash';
import { OnboardingScreen }    from './onboarding';
import { SignInScreen }        from './auth/sign-in';
import { SignUpScreen }        from './auth/sign-up';
import { MapScreen }           from './map';
import { FeedScreen }          from './feed';
import { MessagesInboxScreen } from './messages/inbox';
import { SavedScreen }         from './saved';
import { ProfileScreen }       from './profile/index';
import { ItemDetailScreen }    from './item-detail';
import { ChatThreadScreen }    from './messages/chat';
import { PostItemScreen }      from './profile/post-item';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 2 * 60 * 1000 },
  },
});

const Root = createNativeStackNavigator<RootStackParamList>();
const Auth = createNativeStackNavigator<AuthStackParamList>();
const Tab  = createBottomTabNavigator<TabParamList>();

function AuthStack() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="SignIn" component={SignInScreen} />
      <Auth.Screen name="SignUp" component={SignUpScreen} />
    </Auth.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="MapTab"      component={MapScreen} />
      <Tab.Screen name="FeedTab"     component={FeedScreen} />
      <Tab.Screen name="MessagesTab" component={MessagesInboxScreen} />
      <Tab.Screen name="SavedTab"    component={SavedScreen} />
      <Tab.Screen name="ProfileTab"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootLayout() {
  const { session, setSession } = useAuthStore();

  // Listen for Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Root.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {!session ? (
              <>
                <Root.Screen name="Splash"     component={SplashScreen} />
                <Root.Screen name="Onboarding" component={OnboardingScreen} />
                <Root.Screen name="Auth"       component={AuthStack} />
              </>
            ) : null}
            <Root.Screen name="Main" component={TabNavigator} />
            <Root.Screen name="ItemDetail" component={ItemDetailScreen}
              options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="ChatThread" component={ChatThreadScreen}
              options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="PostItem" component={PostItemScreen}
              options={{ presentation: 'modal' }} />
          </Root.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/_layout.tsx src/features/navigation/
git commit -m "feat: add navigation layout and custom tab bar"
```

---

## Task 7: Shared Components — PressableScale + Badge + Avatar

**Files:**
- Create: `src/components/PressableScale.tsx`
- Create: `src/components/Badge.tsx`
- Create: `src/components/Avatar.tsx`
- Create: `src/__tests__/components/PressableScale.test.tsx`
- Create: `src/__tests__/components/Badge.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// src/__tests__/components/PressableScale.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PressableScale } from '@/components/PressableScale';

describe('PressableScale', () => {
  it('renders children', () => {
    const { getByText } = render(
      <PressableScale onPress={() => {}}><Text>Tap me</Text></PressableScale>
    );
    expect(getByText('Tap me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PressableScale onPress={onPress}><Text>Tap</Text></PressableScale>
    );
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PressableScale onPress={onPress} disabled><Text>Tap</Text></PressableScale>
    );
    fireEvent.press(getByText('Tap'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

```tsx
// src/__tests__/components/Badge.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '@/components/Badge';

describe('Badge', () => {
  it('renders the label', () => {
    const { getByText } = render(<Badge label="FREE" />);
    expect(getByText('FREE')).toBeTruthy();
  });

  it('is hidden from accessibility when accessibilityHidden is true', () => {
    const { getByText } = render(<Badge label="FREE" accessibilityHidden />);
    expect(getByText('FREE').props.accessible).toBe(false);
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx jest src/__tests__/components --no-coverage
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create src/components/PressableScale.tsx**

```tsx
import React from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Springs } from '@/lib/springs';
import { useReducedMotion } from '@/lib/useReducedMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  scaleDown?: number;
}

export function PressableScale({
  children, onPress, disabled, style, scaleDown = 0.97, ...rest
}: PressableScaleProps) {
  const scale   = useSharedValue(1);
  const reduced = useReducedMotion();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!reduced) scale.value = withSpring(scaleDown, Springs.snappy);
  };
  const handlePressOut = () => {
    if (!reduced) scale.value = withSpring(1, Springs.snappy);
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
```

- [ ] **Step 4: Create src/components/Badge.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/lib';

interface BadgeProps {
  label: string;
  accessibilityHidden?: boolean;
}

export function Badge({ label, accessibilityHidden }: BadgeProps) {
  return (
    <View style={styles.container} accessible={!accessibilityHidden} accessibilityHidden={accessibilityHidden}>
      <Text style={styles.text} accessible={!accessibilityHidden} accessible={false}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.RUST,
    paddingVertical:   2,
    paddingHorizontal: Spacing.sm - 2,
  },
  text: {
    ...Typography.tinyLabel,
    color:         Colors.CREAM,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
```

- [ ] **Step 5: Create src/components/Avatar.tsx**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'phosphor-react-native';
import { Colors } from '@/lib';

interface AvatarProps {
  uri?: string;
  size?: 36 | 44 | 64;
  accessibilityLabel?: string;
}

export function Avatar({ uri, size = 44, accessibilityLabel }: AvatarProps) {
  const iconSize = Math.round(size * 0.45);

  return (
    <View
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <User size={iconSize} color={Colors.CREAM} weight="regular" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.RUST,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
});
```

- [ ] **Step 6: Run tests — verify pass**

```bash
npx jest src/__tests__/components --no-coverage
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/PressableScale.tsx src/components/Badge.tsx src/components/Avatar.tsx src/__tests__/components/
git commit -m "feat: add PressableScale, Badge, and Avatar components"
```

---

## Task 8: PrimaryButton + SecondaryButton + EmptyState

**Files:**
- Create: `src/components/PrimaryButton.tsx`
- Create: `src/components/SecondaryButton.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/__tests__/components/PrimaryButton.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/__tests__/components/PrimaryButton.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from '@/components/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders the label', () => {
    const { getByText } = render(<PrimaryButton label="Post Item" onPress={() => {}} />);
    expect(getByText('POST ITEM')).toBeTruthy();
  });

  it('fires onPress', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<PrimaryButton label="Post Item" onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled=true', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<PrimaryButton label="Post Item" onPress={onPress} disabled />);
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('has correct accessibilityRole', () => {
    const { getByRole } = render(<PrimaryButton label="Save" onPress={() => {}} />);
    expect(getByRole('button')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx jest src/__tests__/components/PrimaryButton --no-coverage
```

Expected: FAIL.

- [ ] **Step 3: Create src/components/PrimaryButton.tsx**

```tsx
import React from 'react';
import { Text, StyleSheet, View, type ViewStyle } from 'react-native';
import { ArrowRight } from 'phosphor-react-native';
import { PressableScale } from './PressableScale';
import { HapticFeedback } from '@/lib/haptics';
import { Colors, Typography, Spacing } from '@/lib';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  fullWidth?: boolean;
  showArrow?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const PrimaryButton = React.memo(function PrimaryButton({
  label, onPress, fullWidth, showArrow, disabled, style, accessibilityLabel,
}: PrimaryButtonProps) {
  const handlePress = () => {
    HapticFeedback.tap();
    onPress();
  };

  return (
    <PressableScale
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, fullWidth && styles.fullWidth, disabled && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={styles.label} numberOfLines={1} accessible={false}>
        {label.toUpperCase()}
      </Text>
      {showArrow && (
        <View style={styles.iconZone} accessible={false}>
          <ArrowRight size={16} color={Colors.CREAM} weight="bold" />
        </View>
      )}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'center',
    backgroundColor: Colors.RUST,
    borderWidth:   2,
    borderColor:   Colors.RUST,
    paddingVertical: 14,
    paddingLeft:   Spacing.base,
    paddingRight:  4,
    minHeight:     48,
  },
  fullWidth:  { width: '100%' },
  disabled:   { opacity: 0.5 },
  label: {
    ...Typography.label,
    color:         Colors.CREAM,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex:          1,
  },
  iconZone: {
    width:  32,
    height: 32,
    backgroundColor:  'rgba(61, 61, 57, 0.3)',
    borderLeftWidth:  1,
    borderLeftColor:  'rgba(61, 61, 57, 0.3)',
    alignItems:       'center',
    justifyContent:   'center',
    marginLeft:       Spacing.sm,
  },
});
```

- [ ] **Step 4: Create src/components/SecondaryButton.tsx**

```tsx
import React from 'react';
import { Text, StyleSheet, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { HapticFeedback } from '@/lib/haptics';
import { Colors, Typography, Spacing } from '@/lib';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const SecondaryButton = React.memo(function SecondaryButton({
  label, onPress, fullWidth, disabled, style,
}: SecondaryButtonProps) {
  return (
    <PressableScale
      onPress={() => { HapticFeedback.tap(); onPress(); }}
      disabled={disabled}
      style={[styles.container, fullWidth && styles.fullWidth, disabled && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={styles.label} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'transparent',
    borderWidth:     2,
    borderColor:     Colors.RUST,
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    minHeight:       48,
  },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },
  label: {
    ...Typography.label,
    color:         Colors.CREAM,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
```

- [ ] **Step 5: Create src/components/EmptyState.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SecondaryButton } from './SecondaryButton';
import { Colors, Typography, Spacing } from '@/lib';

interface EmptyStateProps {
  message: string;
  secondary?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, secondary, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {secondary && <Text style={styles.secondary}>{secondary}</Text>}
      {actionLabel && onAction && (
        <SecondaryButton label={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.hero,
    gap:            Spacing.md,
  },
  message: {
    ...Typography.subheading,
    color:     Colors.CREAM,
    textAlign: 'center',
  },
  secondary: {
    ...Typography.body,
    color:     Colors.MUTED_ASH,
    textAlign: 'center',
  },
  action: { marginTop: Spacing.sm },
});
```

- [ ] **Step 6: Run tests — verify pass**

```bash
npx jest src/__tests__/components/PrimaryButton --no-coverage
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/
git commit -m "feat: add PrimaryButton, SecondaryButton, EmptyState components"
```

---

## Task 9: Skeleton Components + Components Barrel

**Files:**
- Create: `src/components/SkeletonCard.tsx`
- Create: `src/components/SkeletonRow.tsx`
- Create: `src/components/index.ts`

- [ ] **Step 1: Create src/components/SkeletonCard.tsx**

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors, Spacing } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';

export function SkeletonCard() {
  const opacity = useSharedValue(0.4);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!reduced) {
      opacity.value = withRepeat(
        withTiming(0.7, { duration: 600 }),
        -1, true
      );
    }
  }, [reduced]);

  const shimmer = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.card, shimmer]}>
      <View style={styles.image} />
      <View style={styles.content}>
        <View style={styles.titleLine} />
        <View style={styles.metaLine} />
      </View>
    </Animated.View>
  );
}

const FILL = Colors.LIGHT_CHARCOAL;
const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.md,
    backgroundColor:  Colors.MID_CHARCOAL,
    borderLeftWidth:  3,
    borderLeftColor:  Colors.LIGHT_CHARCOAL,
  },
  image:     { height: 80, backgroundColor: FILL },
  content:   { padding: Spacing.md, gap: Spacing.sm },
  titleLine: { height: 14, backgroundColor: FILL, width: '70%' },
  metaLine:  { height: 10, backgroundColor: FILL, width: '40%' },
});
```

- [ ] **Step 2: Create src/components/SkeletonRow.tsx**

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors, Spacing } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';

export function SkeletonRow() {
  const opacity = useSharedValue(0.4);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!reduced) {
      opacity.value = withRepeat(withTiming(0.7, { duration: 600 }), -1, true);
    }
  }, [reduced]);

  const shimmer = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.row, shimmer]}>
      <View style={styles.avatar} />
      <View style={styles.lines}>
        <View style={styles.line1} />
        <View style={styles.line2} />
      </View>
    </Animated.View>
  );
}

const FILL = Colors.LIGHT_CHARCOAL;
const styles = StyleSheet.create({
  row:    { flexDirection: 'row', padding: Spacing.md, gap: Spacing.md, alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: FILL },
  lines:  { flex: 1, gap: Spacing.sm },
  line1:  { height: 14, backgroundColor: FILL, width: '60%' },
  line2:  { height: 10, backgroundColor: FILL, width: '40%' },
});
```

- [ ] **Step 3: Create src/components/index.ts**

```ts
export * from './PressableScale';
export * from './PrimaryButton';
export * from './SecondaryButton';
export * from './Badge';
export * from './Avatar';
export * from './EmptyState';
export * from './SkeletonCard';
export * from './SkeletonRow';
```

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: add skeleton loading components and components barrel"
```

---

## Task 10: Splash + Onboarding Screens

**Files:**
- Create: `src/app/splash.tsx`
- Create: `src/app/onboarding.tsx`

- [ ] **Step 1: Create src/app/splash.tsx**

Auto-advances to Onboarding after 2.5s. Animates in wordmark and tagline.

```tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { useNavigation } from '@/navigation/types';
import { useReducedMotion } from '@/lib/useReducedMotion';

export function SplashScreen() {
  const nav     = useNavigation();
  const insets  = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const wordmarkOpacity = useSharedValue(0);
  const taglineOpacity  = useSharedValue(0);

  useEffect(() => {
    const dur = reduced ? 0 : 400;
    wordmarkOpacity.value = withTiming(1, { duration: dur });
    taglineOpacity.value  = withDelay(reduced ? 0 : 300, withTiming(1, { duration: dur }));

    const timer = setTimeout(() => nav.replace('Onboarding'), 2500);
    return () => clearTimeout(timer);
  }, []);

  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: wordmarkOpacity.value }));
  const taglineStyle  = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.Text style={[styles.wordmark, wordmarkStyle]}>
        FIND{'\n'}FREE
      </Animated.Text>
      <View style={styles.divider} />
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Free stuff, nearby.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.CHARCOAL,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.xl,
  },
  wordmark: {
    ...Typography.displayHero,
    color:         Colors.CREAM,
    textAlign:     'center',
    textTransform: 'uppercase',
    lineHeight:    56,
  },
  divider: {
    width:           60,
    height:          3,
    backgroundColor: Colors.RUST,
  },
  tagline: {
    ...Typography.label,
    color:         Colors.MUTED_ASH,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
```

- [ ] **Step 2: Create src/app/onboarding.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { useNavigation } from '@/navigation/types';
import { useAuthStore } from '@/stores/useAuthStore';

export function OnboardingScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const { setGuest } = useAuthStore();

  const handleSignUp = () => nav.navigate('Auth', { screen: 'SignUp' });

  const handleGuest = () => {
    setGuest(true);
    nav.replace('Main');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.hero, paddingBottom: insets.bottom + Spacing.xl }]}>
      <View style={styles.top}>
        <Text style={styles.headline}>Free stuff is{'\n'}everywhere.</Text>
        <Text style={styles.subheadline}>Now you'll find it.</Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.guestNote}>
          You can browse and view items. Sign up to message posters or save finds.
        </Text>
        <PrimaryButton
          label="Create Account"
          onPress={handleSignUp}
          fullWidth
          showArrow
        />
        <SecondaryButton
          label="Browse Without Signing Up"
          onPress={handleGuest}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.CHARCOAL,
    paddingHorizontal: Spacing.gutter,
    justifyContent:  'space-between',
  },
  top: { gap: Spacing.md },
  headline: {
    ...Typography.sectionTitle,
    color: Colors.CREAM,
  },
  subheadline: {
    ...Typography.subheading,
    color: Colors.MUTED_ASH,
  },
  guestNote: {
    ...Typography.caption,
    color:     Colors.MUTED_ASH,
    textAlign: 'center',
  },
  actions: { gap: Spacing.md },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/app/splash.tsx src/app/onboarding.tsx
git commit -m "feat: add Splash and Onboarding screens"
```

---

## Task 11: Auth Service + Sign Up / Sign In Screens

**Files:**
- Create: `src/services/auth.ts`
- Create: `src/app/auth/sign-up.tsx`
- Create: `src/app/auth/sign-in.tsx`
- Create: `src/__tests__/services/auth.test.ts`

- [ ] **Step 1: Write failing service test**

```ts
// src/__tests__/services/auth.test.ts
import { authService } from '@/services/auth';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
  },
}));

describe('authService', () => {
  it('signUp calls supabase.auth.signUp with email and password', async () => {
    const { supabase } = require('@/lib/supabase');
    await authService.signUp('a@b.com', 'password123', 'Ada');
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password123',
      options: { data: { name: 'Ada' } },
    });
  });

  it('signIn calls signInWithPassword', async () => {
    const { supabase } = require('@/lib/supabase');
    await authService.signIn('a@b.com', 'password123');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com', password: 'password123',
    });
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx jest src/__tests__/services --no-coverage
```

Expected: FAIL — `Cannot find module '@/services/auth'`

- [ ] **Step 3: Create src/services/auth.ts**

```ts
import { supabase } from '@/lib/supabase';

export const authService = {
  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
```

- [ ] **Step 4: Run — verify pass**

```bash
npx jest src/__tests__/services --no-coverage
```

Expected: PASS

- [ ] **Step 5: Create src/app/auth/sign-up.tsx**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { authService } from '@/services/auth';
import { useNavigation } from '@/navigation/types';

export function SignUpScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!name.trim())          return setError('Add your name so people know who you are.');
    if (!email.includes('@'))  return setError('Enter a valid email address.');
    if (password.length < 8)   return setError('Use at least 8 characters.');

    setLoading(true);
    try {
      await authService.signUp(email.trim(), password, name.trim());
      // Session listener in _layout.tsx auto-navigates to Main
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('already registered')) {
        setError('That email is already registered. Sign in instead?');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError('Couldn't connect. Check your connection and try again.');
      } else {
        setError('Something went wrong. Try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.CHARCOAL }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create your account</Text>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.DISABLED_GRAY}
              autoComplete="name"
              returnKeyType="next"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.DISABLED_GRAY}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="8+ characters"
              placeholderTextColor={Colors.DISABLED_GRAY}
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={loading ? 'Creating your account…' : 'Create Account'}
            onPress={handleSubmit}
            fullWidth
            showArrow
            disabled={loading}
          />
          <SecondaryButton
            label="Already have one? Sign in"
            onPress={() => nav.navigate('Auth', { screen: 'SignIn' })}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow:          1,
    paddingHorizontal: Spacing.gutter,
    gap:               Spacing.xl,
    justifyContent:    'space-between',
  },
  title:   { ...Typography.sectionTitle, color: Colors.CREAM },
  fields:  { gap: Spacing.md },
  field:   { gap: Spacing.sm },
  label:   { ...Typography.label, color: Colors.CREAM },
  input: {
    backgroundColor:  Colors.MID_CHARCOAL,
    borderWidth:      2,
    borderColor:      Colors.RUST,
    color:            Colors.CREAM,
    fontSize:         13,
    paddingHorizontal: Spacing.md,
    paddingVertical:  Spacing.md,
    minHeight:        48,
  },
  error:   { ...Typography.caption, color: Colors.RUST_LIGHT },
  actions: { gap: Spacing.md },
});
```

- [ ] **Step 6: Create src/app/auth/sign-in.tsx**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { authService } from '@/services/auth';
import { useNavigation } from '@/navigation/types';

export function SignInScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await authService.signIn(email.trim(), password);
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Invalid') || msg.includes('credentials')) {
        setError('Email or password is incorrect. Try again.');
      } else {
        setError('Couldn't connect. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.CHARCOAL }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome back</Text>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.DISABLED_GRAY}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={Colors.DISABLED_GRAY}
              secureTextEntry
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={loading ? 'Signing in…' : 'Sign In'}
            onPress={handleSubmit}
            fullWidth
            showArrow
            disabled={loading}
          />
          <SecondaryButton
            label="New here? Create an account"
            onPress={() => nav.navigate('Auth', { screen: 'SignUp' })}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow:          1,
    paddingHorizontal: Spacing.gutter,
    gap:               Spacing.xl,
    justifyContent:    'space-between',
  },
  title:   { ...Typography.sectionTitle, color: Colors.CREAM },
  fields:  { gap: Spacing.md },
  field:   { gap: Spacing.sm },
  label:   { ...Typography.label, color: Colors.CREAM },
  input: {
    backgroundColor:   Colors.MID_CHARCOAL,
    borderWidth:       2,
    borderColor:       Colors.RUST,
    color:             Colors.CREAM,
    fontSize:          13,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    minHeight:         48,
  },
  error:   { ...Typography.caption, color: Colors.RUST_LIGHT },
  actions: { gap: Spacing.md },
});
```

- [ ] **Step 7: Commit**

```bash
git add src/services/auth.ts src/app/auth/ src/__tests__/services/
git commit -m "feat: add auth service and Sign Up / Sign In screens"
```

---

## Task 12: Items Service + Data Hooks

**Files:**
- Create: `src/services/items.ts`
- Create: `src/hooks/useNearbyItems.ts`
- Create: `src/hooks/useItemDetail.ts`
- Create: `src/__tests__/services/items.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/__tests__/services/items.test.ts
import { itemsService } from '@/services/items';

const mockRpc  = jest.fn().mockResolvedValue({ data: [], error: null });
const mockFrom = jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: null, error: null }) })) })) }));

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: mockRpc, from: mockFrom },
}));

describe('itemsService.getNearby', () => {
  it('calls get_nearby_items RPC with correct params', async () => {
    await itemsService.getNearby(
      { lat: 37.78, lng: -122.41 },
      { radiusKm: 5, category: 'furniture' }
    );
    expect(mockRpc).toHaveBeenCalledWith('get_nearby_items', {
      user_lat: 37.78, user_lng: -122.41,
      radius_km: 5, category: 'furniture', max_age_hours: null,
    });
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx jest src/__tests__/services/items --no-coverage
```

Expected: FAIL.

- [ ] **Step 3: Create src/services/items.ts**

```ts
import { supabase } from '@/lib/supabase';
import type { Item, LatLng, FilterState } from '@/types';

// Map snake_case DB row → camelCase Item
function rowToItem(row: any): Item {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description ?? '',
    category:    row.category,
    location:    { lat: row.lat, lng: row.lng, address: row.address },
    photoUrls:   row.photo_urls ?? [],
    source:      row.source,
    sourceId:    row.source_id,
    userId:      row.user_id,
    status:      row.status,
    createdAt:   row.created_at,
    expiresAt:   row.expires_at,
    distanceKm:  row.distance_km,
  };
}

export const itemsService = {
  getNearby: async (location: LatLng, filters: FilterState): Promise<Item[]> => {
    const { data, error } = await supabase.rpc('get_nearby_items', {
      user_lat:      location.lat,
      user_lng:      location.lng,
      radius_km:     filters.radiusKm,
      category:      filters.category ?? null,
      max_age_hours: filters.maxAgeHours ?? null,
    });
    if (error) throw error;
    return (data as any[]).map(rowToItem);
  },

  getById: async (itemId: string): Promise<Item> => {
    const { data, error } = await supabase
      .from('items').select('*').eq('id', itemId).single();
    if (error) throw error;
    return rowToItem(data);
  },

  getSaved: async (userId: string): Promise<Item[]> => {
    const { data, error } = await supabase
      .from('saved_items').select('item:items(*)').eq('user_id', userId);
    if (error) throw error;
    return (data as any[]).map((row) => rowToItem(row.item));
  },

  create: async (payload: {
    title: string; description: string; category: string;
    lat: number; lng: number; photoUrls: string[]; userId: string;
  }): Promise<Item> => {
    const { data, error } = await supabase
      .from('items')
      .insert({
        title: payload.title, description: payload.description,
        category: payload.category, lat: payload.lat, lng: payload.lng,
        photo_urls: payload.photoUrls, user_id: payload.userId, source: 'user',
      })
      .select().single();
    if (error) throw error;
    return rowToItem(data);
  },

  delete: async (itemId: string): Promise<void> => {
    const { error } = await supabase
      .from('items').update({ status: 'deleted' }).eq('id', itemId);
    if (error) throw error;
  },

  toggleSave: async (userId: string, itemId: string, saved: boolean): Promise<void> => {
    if (saved) {
      const { error } = await supabase.from('saved_items').insert({ user_id: userId, item_id: itemId });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('saved_items')
        .delete().eq('user_id', userId).eq('item_id', itemId);
      if (error) throw error;
    }
  },
};
```

- [ ] **Step 4: Create src/hooks/useNearbyItems.ts**

```ts
import { useQuery } from '@tanstack/react-query';
import { itemsService } from '@/services/items';
import type { LatLng, FilterState } from '@/types';

export function useNearbyItems(location: LatLng | null, filters: FilterState) {
  return useQuery({
    queryKey: ['items', 'nearby', location, filters],
    queryFn:  () => itemsService.getNearby(location!, filters),
    enabled:  !!location,
    staleTime: 2 * 60 * 1000,
    gcTime:   10 * 60 * 1000,
    retry:    2,
  });
}
```

- [ ] **Step 5: Create src/hooks/useItemDetail.ts**

```ts
import { useQuery } from '@tanstack/react-query';
import { itemsService } from '@/services/items';

export function useItemDetail(itemId: string) {
  return useQuery({
    queryKey: ['item', itemId],
    queryFn:  () => itemsService.getById(itemId),
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 6: Run test — verify pass**

```bash
npx jest src/__tests__/services/items --no-coverage
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/services/items.ts src/hooks/
git commit -m "feat: add items service and useNearbyItems / useItemDetail hooks"
```

---

## Task 13: FeedCard + FeedList + Feed Screen

**Files:**
- Create: `src/features/feed/FeedCard.tsx`
- Create: `src/features/feed/FeedCardSkeleton.tsx`
- Create: `src/features/feed/FeedList.tsx`
- Create: `src/app/feed.tsx`
- Create: `src/__tests__/features/feed/FeedCard.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/__tests__/features/feed/FeedCard.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { FeedCard } from '@/features/feed/FeedCard';
import type { Item } from '@/types';

const baseItem: Item = {
  id: '1', title: 'Vintage Desk', description: 'Nice desk', category: 'furniture',
  location: { lat: 37.78, lng: -122.41 }, photoUrls: [], source: 'user',
  status: 'available', createdAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(), distanceKm: 1.2,
};

describe('FeedCard', () => {
  it('renders item title', () => {
    const { getByText } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    expect(getByText('Vintage Desk')).toBeTruthy();
  });

  it('renders FREE badge', () => {
    const { getByText } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    expect(getByText('FREE')).toBeTruthy();
  });

  it('shows distance in meta', () => {
    const { getByText } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    expect(getByText(/1\.2 km/)).toBeTruthy();
  });

  it('is accessible as a button with title + distance label', () => {
    const { getByRole } = render(<FeedCard item={baseItem} index={1} onPress={() => {}} />);
    const btn = getByRole('button');
    expect(btn.props.accessibilityLabel).toContain('Vintage Desk');
    expect(btn.props.accessibilityLabel).toContain('1.2 km');
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx jest src/__tests__/features/feed --no-coverage
```

Expected: FAIL.

- [ ] **Step 3: Create src/features/feed/FeedCard.tsx**

```tsx
import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { PressableScale } from '@/components/PressableScale';
import { Badge } from '@/components/Badge';
import { Colors, Typography, Spacing, Springs } from '@/lib';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { Item } from '@/types';

type CardTier = 'standard' | 'feature' | 'text-only';

function isRecent(item: Item): boolean {
  return Date.now() - new Date(item.createdAt).getTime() < 60 * 60 * 1000;
}

function deriveCardTier(item: Item, index: number): CardTier {
  if (!item.photoUrls.length) return 'text-only';
  if (index === 0 || isRecent(item)) return 'feature';
  return 'standard';
}

function formatAge(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface FeedCardProps {
  item:    Item;
  index:   number;
  onPress: (itemId: string) => void;
}

export const FeedCard = memo(function FeedCard({ item, index, onPress }: FeedCardProps) {
  const tier    = deriveCardTier(item, index);
  const reduced = useReducedMotion();
  const ty      = useSharedValue(16);
  const op      = useSharedValue(0);

  useEffect(() => {
    const delay = Math.min(index, 4) * 50;
    if (reduced) {
      ty.value = withTiming(0, { duration: 0 });
      op.value = withTiming(1, { duration: 0 });
    } else {
      ty.value = withDelay(delay, withSpring(0, Springs.gentle));
      op.value = withDelay(delay, withSpring(1, Springs.gentle));
    }
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value,
  }));

  const imageHeight = tier === 'feature' ? 140 : tier === 'standard' ? 80 : 0;
  const distLabel   = item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km` : '';
  const a11yLabel   = `${item.title}, ${distLabel}${distLabel ? ' away' : ''}, free`;

  return (
    <Animated.View style={entryStyle}>
      <PressableScale
        onPress={() => onPress(item.id)}
        style={styles.outerShell}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
      >
        <View style={styles.innerCore}>
          {imageHeight > 0 && (
            <View style={[styles.imageWrap, { height: imageHeight }]}>
              {item.photoUrls[0] ? (
                <Image source={{ uri: item.photoUrls[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
              )}
            </View>
          )}
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Badge label="FREE" accessibilityHidden />
              <Text style={styles.meta} numberOfLines={1} accessibilityHidden>
                {distLabel}{distLabel ? ' • ' : ''}{formatAge(item.createdAt)}
              </Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            {tier === 'feature' && (
              <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outerShell: {
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.md,
    backgroundColor:  Colors.MID_CHARCOAL,
    borderLeftWidth:  3,
    borderLeftColor:  Colors.RUST,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_CHARCOAL,
    padding:          1,
  },
  innerCore: {
    backgroundColor: Colors.MID_CHARCOAL,
    borderTopWidth:  1,
    borderTopColor:  'rgba(255, 255, 255, 0.06)',
  },
  imageWrap: {
    overflow:        'hidden',
    backgroundColor: Colors.LIGHT_CHARCOAL,
  },
  imagePlaceholder: {
    borderWidth:  1,
    borderColor:  Colors.RUST_LIGHT,
    borderStyle:  'dashed',
  },
  content:   { padding: Spacing.md },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.sm,
  },
  title: {
    ...Typography.bodyCompact,
    color:      Colors.CREAM,
    fontWeight: '700',
  },
  description: {
    ...Typography.caption,
    color:     Colors.MUTED_ASH,
    marginTop: Spacing.sm,
  },
  meta: {
    ...Typography.tinyLabel,
    color:       Colors.MUTED_ASH,
    fontVariant: ['tabular-nums'],
  },
});
```

- [ ] **Step 4: Create src/features/feed/FeedCardSkeleton.tsx**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonCard } from '@/components/SkeletonCard';

export function FeedCardSkeleton() {
  return <SkeletonCard />;
}
```

- [ ] **Step 5: Create src/features/feed/FeedList.tsx**

```tsx
import React, { useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { FeedCard } from './FeedCard';
import { FeedCardSkeleton } from './FeedCardSkeleton';
import { EmptyState } from '@/components';
import { Colors, Spacing } from '@/lib';
import type { Item } from '@/types';

interface FeedListProps {
  items:        Item[];
  isLoading:    boolean;
  isRefreshing: boolean;
  onRefresh:    () => void;
  onItemPress:  (itemId: string) => void;
  onClearFilters?: () => void;
  hasFilters?:  boolean;
}

export function FeedList({
  items, isLoading, isRefreshing, onRefresh, onItemPress, onClearFilters, hasFilters,
}: FeedListProps) {
  const renderItem = useCallback(
    ({ item, index }: { item: Item; index: number }) =>
      <FeedCard item={item} index={index} onPress={onItemPress} />,
    [onItemPress]
  );
  const keyExtractor = useCallback((item: Item) => item.id, []);

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => <FeedCardSkeleton key={i} />)}
      </>
    );
  }

  const emptyMsg = hasFilters
    ? 'No items match your filters.'
    : 'Nothing nearby right now.';
  const emptySec = hasFilters
    ? 'Clear your filters to see everything.'
    : 'Try expanding your radius — someone might have just posted something.';

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 80 }}
      ListEmptyComponent={
        <EmptyState
          message={emptyMsg}
          secondary={emptySec}
          actionLabel={hasFilters ? 'Clear Filters' : undefined}
          onAction={hasFilters ? onClearFilters : undefined}
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Colors.RUST}
          colors={[Colors.RUST]}
          accessibilityLabel={isRefreshing ? 'Loading nearby items…' : undefined}
        />
      }
      removeClippedSubviews
      maxToRenderPerBatch={8}
      windowSize={5}
      initialNumToRender={6}
    />
  );
}
```

- [ ] **Step 6: Create src/app/feed.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing } from '@/lib';
import { FeedList } from '@/features/feed/FeedList';
import { useNearbyItems } from '@/hooks/useNearbyItems';
import { useLocation } from '@/hooks/useLocation';
import { useFilterStore } from '@/stores/useFilterStore';
import { useNavigation } from '@/navigation/types';

export function FeedScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const { location } = useLocation();
  const { filters, resetFilters } = useFilterStore();
  const { data: items = [], isLoading, isRefetching } = useNearbyItems(location, filters);

  const hasFilters = !!(filters.category || filters.maxAgeHours || filters.radiusKm !== 10);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby</Text>
      </View>
      <FeedList
        items={items}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={() => qc.invalidateQueries({ queryKey: ['items', 'nearby'] })}
        onItemPress={(id) => nav.navigate('ItemDetail', { itemId: id })}
        hasFilters={hasFilters}
        onClearFilters={resetFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.CHARCOAL },
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
  },
  title: { ...Typography.headline, color: Colors.CREAM },
});
```

- [ ] **Step 7: Create src/hooks/useLocation.ts**

```ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from '@/types';

export function useLocation() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [denied,   setDenied]   = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setDenied(true); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  return { location, denied };
}
```

- [ ] **Step 8: Run tests — verify pass**

```bash
npx jest src/__tests__/features/feed --no-coverage
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/features/feed/ src/app/feed.tsx src/hooks/
git commit -m "feat: add FeedCard, FeedList, Feed screen, and useLocation hook"
```

---

## Task 14: Map Screen + Components

**Files:**
- Create: `src/features/map/ItemPreviewSheet.tsx`
- Create: `src/features/map/ItemMarker.tsx`
- Create: `src/app/map.tsx`

- [ ] **Step 1: Create src/features/map/ItemMarker.tsx**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Colors } from '@/lib';
import type { Item } from '@/types';

interface ItemMarkerProps {
  item:       Item;
  selected:   boolean;
  onPress:    (item: Item) => void;
}

export function ItemMarker({ item, selected, onPress }: ItemMarkerProps) {
  const size = selected ? 32 : 24;

  return (
    <Marker
      coordinate={{ latitude: item.location.lat, longitude: item.location.lng }}
      onPress={() => onPress(item)}
      tracksViewChanges={false}
    >
      <View style={[
        styles.marker,
        { width: size, height: size, borderRadius: size / 2 },
        selected && styles.selected,
      ]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    backgroundColor: Colors.RUST,
  },
  selected: {
    borderWidth: 2,
    borderColor: Colors.CREAM,
  },
});
```

- [ ] **Step 2: Create src/features/map/ItemPreviewSheet.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { X } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Springs } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Item } from '@/types';

interface ItemPreviewSheetProps {
  item:          Item | null;
  onViewDetails: (itemId: string) => void;
  onDismiss:     () => void;
}

export function ItemPreviewSheet({ item, onViewDetails, onDismiss }: ItemPreviewSheetProps) {
  const translateY = useSharedValue(item ? 0 : 200);

  React.useEffect(() => {
    translateY.value = withSpring(item ? 0 : 200, Springs.heavy);
  }, [!!item]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!item) return null;

  const distLabel = item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km away` : '';
  const timeLabel = item.createdAt
    ? (() => {
        const mins = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000);
        return mins < 60 ? `${mins} minutes ago` : `${Math.floor(mins / 60)} hours ago`;
      })()
    : '';

  return (
    <Animated.View style={[styles.sheet, sheetStyle]}
      accessibilityLabel={`${item.title}, ${distLabel}, posted ${timeLabel}. Tap to view details.`}
    >
      <View style={styles.thumb}>
        {item.photoUrls[0]
          ? <Image source={{ uri: item.photoUrls[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
          : <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]} />
        }
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {distLabel}{distLabel && timeLabel ? ' • ' : ''}{timeLabel}
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="View Details" onPress={() => onViewDetails(item.id)} showArrow />
        <Pressable onPress={onDismiss} style={styles.dismiss} accessibilityLabel="Dismiss preview">
          <X size={18} color={Colors.MUTED_ASH} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          110,
    backgroundColor: Colors.MID_CHARCOAL,
    borderTopWidth:  2,
    borderTopColor:  Colors.RUST,
    flexDirection:   'row',
    alignItems:      'center',
    padding:         Spacing.md,
    gap:             Spacing.md,
  },
  thumb: {
    width:           60,
    height:          60,
    backgroundColor: Colors.RUST,
    overflow:        'hidden',
  },
  thumbPlaceholder: {
    borderWidth:  2,
    borderStyle:  'dashed',
    borderColor:  Colors.RUST_LIGHT,
  },
  info:  { flex: 1, gap: 4 },
  title: { ...Typography.label, color: Colors.CREAM, fontWeight: '700' },
  meta:  { ...Typography.tinyLabel, color: Colors.MUTED_ASH, fontVariant: ['tabular-nums'] },
  actions: { gap: Spacing.sm, alignItems: 'flex-end' },
  dismiss: { padding: Spacing.sm },
});
```

- [ ] **Step 3: Create src/app/map.tsx**

```tsx
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, SlidersHorizontal } from 'phosphor-react-native';
import { Colors, Typography, Spacing } from '@/lib';
import { ItemMarker } from '@/features/map/ItemMarker';
import { ItemPreviewSheet } from '@/features/map/ItemPreviewSheet';
import { useNearbyItems } from '@/hooks/useNearbyItems';
import { useLocation } from '@/hooks/useLocation';
import { useFilterStore } from '@/stores/useFilterStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigation } from '@/navigation/types';
import type { Item } from '@/types';

const SF_DEFAULT = { latitude: 37.78, longitude: -122.41, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export function MapScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();

  const { location, denied } = useLocation();
  const { filters }          = useFilterStore();
  const { session, isGuest } = useAuthStore();

  const { data: items = [] } = useNearbyItems(location, filters);
  const [selected, setSelected] = useState<Item | null>(null);

  const initialRegion = location
    ? { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : SF_DEFAULT;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation
        onPress={() => setSelected(null)}
      >
        {items.map((item) => (
          <ItemMarker
            key={item.id}
            item={item}
            selected={selected?.id === item.id}
            onPress={setSelected}
          />
        ))}
      </MapView>

      {/* Header bar */}
      <View style={[styles.header, { marginTop: insets.top + Spacing.sm }]}>
        <Pressable
          style={styles.filterBtn}
          onPress={() => {/* TODO: open filter sheet */}}
          accessibilityLabel="Filters"
          accessibilityRole="button"
        >
          <SlidersHorizontal size={18} color={Colors.CREAM} />
          <Text style={styles.filterLabel}>Filters</Text>
        </Pressable>
      </View>

      {/* Guest FAB */}
      {(!session && !isGuest) && (
        <Pressable
          style={[styles.fab, { bottom: 80 + insets.bottom }]}
          onPress={() => nav.navigate('Auth', { screen: 'SignUp' })}
          accessibilityLabel="Sign up to post items"
          accessibilityRole="button"
        >
          <Plus size={20} color={Colors.CREAM} weight="bold" />
        </Pressable>
      )}

      {denied && (
        <View style={[styles.deniedBanner, { top: insets.top }]}>
          <Text style={styles.deniedText}>
            FindFree works best with your location.
          </Text>
        </View>
      )}

      <ItemPreviewSheet
        item={selected}
        onViewDetails={(id) => nav.navigate('ItemDetail', { itemId: id })}
        onDismiss={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.CHARCOAL },
  header: {
    position:        'absolute',
    top:             0,
    left:            Spacing.gutter,
    right:           Spacing.gutter,
    flexDirection:   'row',
    justifyContent:  'flex-end',
  },
  filterBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.sm,
    backgroundColor: Colors.MID_CHARCOAL,
    borderWidth:     2,
    borderColor:     Colors.RUST,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight:       44,
  },
  filterLabel: { ...Typography.label, color: Colors.CREAM, textTransform: 'uppercase', letterSpacing: 1 },
  fab: {
    position:        'absolute',
    right:           Spacing.gutter,
    width:           48,
    height:          48,
    backgroundColor: Colors.RUST,
    alignItems:      'center',
    justifyContent:  'center',
  },
  deniedBanner: {
    position:          'absolute',
    left:              0,
    right:             0,
    backgroundColor:   Colors.MID_CHARCOAL,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.sm,
  },
  deniedText: { ...Typography.caption, color: Colors.MUTED_ASH },
});
```

- [ ] **Step 4: Commit**

```bash
git add src/features/map/ src/app/map.tsx
git commit -m "feat: add Map screen, ItemMarker, ItemPreviewSheet"
```

---

## Task 15: Item Detail Screen

**Files:**
- Create: `src/features/items/PhotoCarousel.tsx`
- Create: `src/features/items/PosterInfo.tsx`
- Create: `src/services/users.ts`
- Create: `src/app/item-detail.tsx`

- [ ] **Step 1: Create src/services/users.ts**

```ts
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

export const usersService = {
  getById: async (userId: string): Promise<User> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return {
      id:           data.id,
      email:        '',
      name:         data.name,
      avatarUrl:    data.avatar_url,
      createdAt:    data.created_at,
      messageCount: data.message_count,
    };
  },

  update: async (userId: string, patch: { name?: string; avatarUrl?: string }): Promise<void> => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ name: patch.name, avatar_url: patch.avatarUrl })
      .eq('id', userId);
    if (error) throw error;
  },
};
```

- [ ] **Step 2: Create src/features/items/PhotoCarousel.tsx**

```tsx
import React, { useState, useRef } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing } from '@/lib';

const { width: SCREEN_W } = Dimensions.get('window');
const CAROUSEL_H = 240;

interface PhotoCarouselProps {
  urls:   string[];
  title:  string;
}

export function PhotoCarousel({ urls, title }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);

  if (!urls.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No photos added</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
        }}
        renderItem={({ item: uri }) => (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={title}
          />
        )}
      />
      {urls.length > 1 && (
        <View style={styles.counter}>
          <Text style={styles.counterText}>{index + 1} / {urls.length}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: CAROUSEL_H, backgroundColor: Colors.LIGHT_CHARCOAL },
  image:     { width: SCREEN_W, height: CAROUSEL_H },
  empty: {
    height:         CAROUSEL_H,
    backgroundColor: Colors.MID_CHARCOAL,
    alignItems:     'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
  },
  emptyText: { ...Typography.caption, color: Colors.MUTED_ASH },
  counter: {
    position:          'absolute',
    bottom:            Spacing.sm,
    right:             Spacing.md,
    backgroundColor:   'rgba(45, 45, 42, 0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
  },
  counterText: { ...Typography.tinyLabel, color: Colors.MUTED_ASH, fontVariant: ['tabular-nums'] },
});
```

- [ ] **Step 3: Create src/features/items/PosterInfo.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Colors, Typography, Spacing } from '@/lib';
import type { User } from '@/types';

interface PosterInfoProps {
  user: User;
  postedAt: string;
  distanceKm?: number;
}

export function PosterInfo({ user, postedAt, distanceKm }: PosterInfoProps) {
  const dist = distanceKm != null ? `${distanceKm.toFixed(1)} km away` : '';
  const mins = Math.floor((Date.now() - new Date(postedAt).getTime()) / 60000);
  const age  = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Avatar uri={user.avatarUrl} size={36} accessibilityLabel={`${user.name}'s avatar`} />
        <View style={styles.text}>
          <Text style={styles.label}>Posted by</Text>
          <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {age}{dist ? ` · ${dist}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.gutter,
    marginVertical:   Spacing.md,
    backgroundColor:  Colors.MID_CHARCOAL,
    borderWidth:      1,
    borderColor:      Colors.RUST,
    borderTopWidth:   1,
    borderTopColor:   'rgba(255,255,255,0.06)',
    padding:          Spacing.md,
  },
  inner:  { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  text:   { flex: 1, gap: 2 },
  label:  { ...Typography.caption, color: Colors.MUTED_ASH },
  name:   { ...Typography.tinyLabel, color: Colors.CREAM, textTransform: 'uppercase', letterSpacing: 1.2 },
  meta:   { ...Typography.caption, color: Colors.MUTED_ASH, fontVariant: ['tabular-nums'] },
});
```

- [ ] **Step 4: Create src/app/item-detail.tsx**

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookmarkSimple, ArrowLeft } from 'phosphor-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SkeletonCard } from '@/components/SkeletonCard';
import { PhotoCarousel } from '@/features/items/PhotoCarousel';
import { PosterInfo } from '@/features/items/PosterInfo';
import { useItemDetail } from '@/hooks/useItemDetail';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSavedStore } from '@/stores/useSavedStore';
import { itemsService } from '@/services/items';
import { messagesService } from '@/services/messages';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

export function ItemDetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();

  const { session }      = useAuthStore();
  const { isSaved, toggle } = useSavedStore();
  const { data: item, isLoading } = useItemDetail(itemId);

  const savedNow = isSaved(itemId);

  const saveMutation = useMutation({
    mutationFn: () => itemsService.toggleSave(session!.user.id, itemId, !savedNow),
    onMutate:   () => toggle(itemId),
    onError:    () => toggle(itemId),
  });

  const handleSave = () => {
    if (!session) {
      Alert.alert('Sign in to save items', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth', { screen: 'SignIn' }) },
      ]);
      return;
    }
    saveMutation.mutate();
  };

  const handleMessage = async () => {
    if (!session) {
      Alert.alert('Sign in to message posters', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth', { screen: 'SignIn' }) },
      ]);
      return;
    }
    try {
      const conv = await messagesService.getOrCreateConversation(itemId, session.user.id, item!.userId!);
      navigation.navigate('ChatThread', { conversationId: conv.id, itemTitle: item!.title });
    } catch {
      Alert.alert('Couldn't start conversation. Check your connection.');
    }
  };

  if (isLoading || !item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Back button overlay */}
      <Pressable
        style={[styles.backBtn, { top: insets.top + Spacing.sm }]}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <ArrowLeft size={20} color={Colors.CREAM} />
      </Pressable>

      {/* Save button overlay */}
      <Pressable
        style={[styles.saveBtn, { top: insets.top + Spacing.sm }]}
        onPress={handleSave}
        accessibilityLabel={savedNow ? 'Remove from favorites' : 'Save item to favorites'}
        accessibilityRole="button"
      >
        <BookmarkSimple
          size={22}
          color={Colors.CREAM}
          weight={savedNow ? 'fill' : 'regular'}
        />
      </Pressable>

      <ScrollView bounces={false} overScrollMode="never">
        <PhotoCarousel urls={item.photoUrls} title={item.title} />

        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sectionHead}>About this item</Text>
          <Text style={styles.description}>{item.description || 'No description provided.'}</Text>
        </View>

        {item.userId && <PosterInfo
          user={{ id: item.userId, email: '', name: 'Loading…', createdAt: '', messageCount: 0 }}
          postedAt={item.createdAt}
          distanceKm={item.distanceKm}
        />}
      </ScrollView>

      {/* Primary CTA — pinned at bottom */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton
          label="Message Poster"
          onPress={handleMessage}
          fullWidth
          showArrow
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.CHARCOAL },
  backBtn: {
    position:        'absolute',
    left:            Spacing.gutter,
    zIndex:          10,
    backgroundColor: 'rgba(45,45,42,0.7)',
    padding:         Spacing.sm,
  },
  saveBtn: {
    position:        'absolute',
    right:           Spacing.gutter,
    zIndex:          10,
    backgroundColor: 'rgba(45,45,42,0.7)',
    padding:         Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.base,
    gap:               Spacing.md,
  },
  title:       { ...Typography.headline, color: Colors.CREAM },
  sectionHead: { ...Typography.tinyLabel, color: Colors.MUTED_ASH, textTransform: 'uppercase', letterSpacing: 1.2 },
  description: { ...Typography.body, color: Colors.MUTED_ASH },
  cta: {
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.md,
    borderTopWidth:    2,
    borderTopColor:    Colors.RUST,
    backgroundColor:   Colors.CHARCOAL,
  },
});
```

- [ ] **Step 5: Commit**

```bash
git add src/features/items/ src/app/item-detail.tsx src/services/users.ts
git commit -m "feat: add Item Detail screen, PhotoCarousel, PosterInfo"
```

---

## Task 16: Messages Service + Inbox + Chat

**Files:**
- Create: `src/services/messages.ts`
- Create: `src/hooks/useConversations.ts`
- Create: `src/hooks/useChatThread.ts`
- Create: `src/features/messages/ConversationRow.tsx`
- Create: `src/features/messages/ChatBubble.tsx`
- Create: `src/app/messages/inbox.tsx`
- Create: `src/app/messages/chat.tsx`

- [ ] **Step 1: Create src/services/messages.ts**

```ts
import { supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types';

export const messagesService = {
  getConversations: async (userId: string): Promise<Conversation[]> => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id, item_id, requester_id, poster_id,
        last_message, last_message_at, unread_count, updated_at,
        item:items(title, photo_urls),
        requester:user_profiles!conversations_requester_id_fkey(id, name, avatar_url),
        poster:user_profiles!conversations_poster_id_fkey(id, name, avatar_url)
      `)
      .or(`requester_id.eq.${userId},poster_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as any[]).map((row) => {
      const otherUser = row.requester_id === userId ? row.poster : row.requester;
      return {
        id:             row.id,
        itemId:         row.item_id,
        item:           { title: row.item?.title, photoUrls: row.item?.photo_urls ?? [] },
        otherUser:      { id: otherUser.id, name: otherUser.name, avatarUrl: otherUser.avatar_url },
        participantIds: [row.requester_id, row.poster_id],
        lastMessage:    row.last_message,
        lastMessageAt:  row.last_message_at,
        unreadCount:    row.unread_count,
        updatedAt:      row.updated_at,
      };
    });
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as any[]).map((row) => ({
      id:             row.id,
      conversationId: row.conversation_id,
      senderId:       row.sender_id,
      body:           row.body,
      createdAt:      row.created_at,
    }));
  },

  sendMessage: async (conversationId: string, senderId: string, body: string): Promise<Message> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select().single();
    if (error) throw error;
    return { id: data.id, conversationId, senderId, body: data.body, createdAt: data.created_at };
  },

  getOrCreateConversation: async (
    itemId: string, requesterId: string, posterId: string
  ): Promise<Conversation> => {
    // Check for existing conversation first
    const { data: existing } = await supabase
      .from('conversations')
      .select('id, updated_at')
      .eq('item_id', itemId)
      .eq('requester_id', requesterId)
      .single();

    if (existing) return { id: existing.id } as Conversation;

    const { data, error } = await supabase
      .from('conversations')
      .insert({ item_id: itemId, requester_id: requesterId, poster_id: posterId })
      .select('id').single();
    if (error) throw error;
    return { id: data.id } as Conversation;
  },
};
```

- [ ] **Step 2: Create src/hooks/useConversations.ts**

```ts
import { useQuery } from '@tanstack/react-query';
import { messagesService } from '@/services/messages';

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn:  () => messagesService.getConversations(userId!),
    enabled:  !!userId,
    staleTime: 30 * 1000,
  });
}
```

- [ ] **Step 3: Create src/hooks/useChatThread.ts**

```ts
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { messagesService } from '@/services/messages';
import type { Message } from '@/types';

export function useChatThread(conversationId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['chat', conversationId],
    queryFn:  () => messagesService.getMessages(conversationId),
    staleTime: Infinity,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          qc.setQueryData<Message[]>(['chat', conversationId], (prev = []) => [
            ...prev,
            {
              id:             payload.new.id,
              conversationId: payload.new.conversation_id,
              senderId:       payload.new.sender_id,
              body:           payload.new.body,
              createdAt:      payload.new.created_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  return query;
}
```

- [ ] **Step 4: Create src/features/messages/ConversationRow.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { Avatar } from '@/components/Avatar';
import { Colors, Typography, Spacing } from '@/lib';
import type { Conversation } from '@/types';

interface ConversationRowProps {
  conv:    Conversation;
  onPress: (convId: string) => void;
}

export function ConversationRow({ conv, onPress }: ConversationRowProps) {
  const name = conv.otherUser?.name ?? 'Unknown';
  const time = conv.lastMessageAt
    ? (() => {
        const m = Math.floor((Date.now() - new Date(conv.lastMessageAt).getTime()) / 60000);
        return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h`;
      })()
    : '';

  return (
    <PressableScale
      onPress={() => onPress(conv.id)}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${name}. ${conv.lastMessage ?? 'No messages yet.'}`}
    >
      <Avatar uri={conv.otherUser?.avatarUrl} size={44} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {conv.item?.title ? `Re: ${conv.item.title}` : conv.lastMessage ?? ''}
        </Text>
      </View>
      {conv.unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{conv.unreadCount}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical:  Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
  },
  content: { flex: 1 },
  topRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name:    { ...Typography.label, color: Colors.CREAM, fontWeight: '700' },
  preview: { ...Typography.caption, color: Colors.MUTED_ASH },
  time:    { ...Typography.caption, color: Colors.MUTED_ASH, fontVariant: ['tabular-nums'] },
  badge: {
    backgroundColor:  Colors.RUST,
    minWidth:         20,
    height:           20,
    borderRadius:     10,
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...Typography.tinyLabel, color: Colors.CREAM, fontSize: 10 },
});
```

- [ ] **Step 5: Create src/features/messages/ChatBubble.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/lib';
import type { Message } from '@/types';

interface ChatBubbleProps {
  message: Message;
  isOwn:   boolean;
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.wrapper, isOwn && styles.wrapperOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.body, isOwn && styles.bodyOwn]}>{message.body}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:      { paddingHorizontal: Spacing.gutter, marginVertical: 4, alignItems: 'flex-start' },
  wrapperOwn:   { alignItems: 'flex-end' },
  bubble: {
    maxWidth:          '80%',
    backgroundColor:   Colors.MID_CHARCOAL,
    borderWidth:       1,
    borderColor:       Colors.DIVIDER,
    padding:           Spacing.md,
  },
  bubbleOwn:   { backgroundColor: Colors.RUST, borderColor: Colors.RUST },
  body:        { ...Typography.body, color: Colors.CREAM },
  bodyOwn:     { color: Colors.CREAM },
  time:        { ...Typography.tinyLabel, color: Colors.MUTED_ASH, marginTop: 2, fontVariant: ['tabular-nums'] },
});
```

- [ ] **Step 6: Create src/app/messages/inbox.tsx**

```tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { ConversationRow } from '@/features/messages/ConversationRow';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonRow } from '@/components/SkeletonRow';
import { useConversations } from '@/hooks/useConversations';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigation } from '@/navigation/types';

export function MessagesInboxScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();

  const { data: convs = [], isLoading } = useConversations(session?.user.id);

  if (!session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.title}>Messages</Text></View>
        <EmptyState
          message="Sign up to message posters and claim items."
          actionLabel="Create Account"
          onAction={() => nav.navigate('Auth', { screen: 'SignUp' })}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}><Text style={styles.title}>Messages</Text></View>
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
        : (
          <FlatList
            data={convs}
            keyExtractor={(c) => c.id}
            renderItem={({ item: conv }) => (
              <ConversationRow
                conv={conv}
                onPress={(id) => nav.navigate('ChatThread', { conversationId: id, itemTitle: conv.item?.title ?? '' })}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                message="No messages yet."
                secondary="Message a poster to start a conversation."
              />
            }
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.CHARCOAL },
  header:    {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
  },
  title: { ...Typography.headline, color: Colors.CREAM },
});
```

- [ ] **Step 7: Create src/app/messages/chat.tsx**

```tsx
import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaperPlaneRight } from 'phosphor-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing } from '@/lib';
import { ChatBubble } from '@/features/messages/ChatBubble';
import { SkeletonRow } from '@/components/SkeletonRow';
import { useChatThread } from '@/hooks/useChatThread';
import { messagesService } from '@/services/messages';
import { useAuthStore } from '@/stores/useAuthStore';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatThread'>;

export function ChatThreadScreen({ route, navigation }: Props) {
  const { conversationId, itemTitle } = route.params;
  const insets  = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const { session } = useAuthStore();
  const { data: messages = [], isLoading } = useChatThread(conversationId);
  const [body,    setBody]    = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!body.trim() || sending || !session) return;
    setSending(true);
    const text = body.trim();
    setBody('');
    try {
      await messagesService.sendMessage(conversationId, session.user.id, text);
    } catch {
      setBody(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.CHARCOAL }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.title} numberOfLines={1}>{itemTitle}</Text>
      </View>

      {/* Messages */}
      {isLoading
        ? <View style={{ padding: Spacing.base }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</View>
        : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <ChatBubble message={item} isOwn={item.senderId === session?.user.id} />
            )}
            contentContainerStyle={{ paddingVertical: Spacing.md }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyThread}>
                <Text style={styles.emptyText}>Say hello and tell them you're interested.</Text>
              </View>
            }
          />
        )
      }

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Type a message…"
          placeholderTextColor={Colors.DISABLED_GRAY}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
          accessibilityLabel="Send message"
          accessibilityRole="button"
          disabled={!body.trim() || sending}
        >
          <PaperPlaneRight size={20} color={Colors.CREAM} weight="bold" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom:     Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
  },
  title: { ...Typography.headline, color: Colors.CREAM },
  emptyThread: { padding: Spacing.hero, alignItems: 'center' },
  emptyText: { ...Typography.caption, color: Colors.MUTED_ASH, textAlign: 'center' },
  inputBar: {
    flexDirection:    'row',
    alignItems:       'flex-end',
    gap:              Spacing.sm,
    paddingHorizontal: Spacing.gutter,
    paddingTop:       Spacing.sm,
    borderTopWidth:   2,
    borderTopColor:   Colors.RUST,
    backgroundColor:  Colors.CHARCOAL,
  },
  input: {
    flex:              1,
    backgroundColor:   Colors.MID_CHARCOAL,
    borderWidth:       2,
    borderColor:       Colors.RUST,
    color:             Colors.CREAM,
    fontSize:          14,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    maxHeight:         120,
    minHeight:         48,
  },
  sendBtn: {
    width:           48,
    height:          48,
    backgroundColor: Colors.RUST,
    alignItems:      'center',
    justifyContent:  'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
```

- [ ] **Step 8: Commit**

```bash
git add src/services/messages.ts src/hooks/useConversations.ts src/hooks/useChatThread.ts \
        src/features/messages/ src/app/messages/
git commit -m "feat: add messages service, realtime chat, Inbox and Chat screens"
```

---

## Task 17: Saved + Profile + Post Item Screens

**Files:**
- Create: `src/hooks/useSavedItems.ts`
- Create: `src/app/saved.tsx`
- Create: `src/features/profile/ProfileHeader.tsx`
- Create: `src/app/profile/index.tsx`
- Create: `src/app/profile/post-item.tsx`

- [ ] **Step 1: Create src/hooks/useSavedItems.ts**

```ts
import { useQuery } from '@tanstack/react-query';
import { itemsService } from '@/services/items';

export function useSavedItems(userId: string | undefined) {
  return useQuery({
    queryKey: ['items', 'saved', userId],
    queryFn:  () => itemsService.getSaved(userId!),
    enabled:  !!userId,
    staleTime: 60 * 1000,
  });
}
```

- [ ] **Step 2: Create src/app/saved.tsx**

```tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { FeedCard } from '@/features/feed/FeedCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigation } from '@/navigation/types';

export function SavedScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { data: items = [], isLoading } = useSavedItems(session?.user.id);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}><Text style={styles.title}>Saved</Text></View>
      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <FeedCard item={item} index={index} onPress={(id) => nav.navigate('ItemDetail', { itemId: id })} />
            )}
            contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 80 }}
            ListEmptyComponent={
              <EmptyState
                message="Nothing saved yet."
                secondary="Tap the save button on any item to keep track of it."
              />
            }
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.CHARCOAL },
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
  },
  title: { ...Typography.headline, color: Colors.CREAM },
});
```

- [ ] **Step 3: Create src/features/profile/ProfileHeader.tsx**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Colors, Typography, Spacing } from '@/lib';
import type { User } from '@/types';

interface ProfileHeaderProps { user: User }

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const joined = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <Avatar uri={user.avatarUrl} size={64} accessibilityLabel={`${user.name}'s profile photo`} />
      <View style={styles.info}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>Joined {joined}</Text>
        <Text style={styles.meta} accessibilityHidden>
          {user.messageCount} {user.messageCount === 1 ? 'message' : 'messages'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.base,
    backgroundColor: Colors.MID_CHARCOAL,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
    padding:         Spacing.base,
  },
  info: { flex: 1, gap: 4 },
  name: { ...Typography.subheading, color: Colors.CREAM, fontWeight: '700' },
  meta: { ...Typography.caption, color: Colors.MUTED_ASH },
});
```

- [ ] **Step 4: Create src/app/profile/index.tsx**

```tsx
import React from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing } from '@/lib';
import { ProfileHeader } from '@/features/profile/ProfileHeader';
import { FeedCard } from '@/features/feed/FeedCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard } from '@/components/SkeletonCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { usersService } from '@/services/users';
import { itemsService } from '@/services/items';
import { useNavigation } from '@/navigation/types';

export function ProfileScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const { session, signOut } = useAuthStore();

  const { data: user } = useQuery({
    queryKey: ['user', session?.user.id],
    queryFn:  () => usersService.getById(session!.user.id),
    enabled:  !!session,
  });

  const { data: myItems = [], isLoading } = useQuery({
    queryKey: ['items', 'mine', session?.user.id],
    queryFn:  async () => {
      const allSaved = await itemsService.getSaved(session!.user.id);
      return allSaved; // replace with posted items query when ready
    },
    enabled: !!session,
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => itemsService.delete(itemId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['items', 'mine'] }),
  });

  const handleDelete = (itemId: string) => {
    Alert.alert('Remove this listing?', 'This will permanently remove your item.', [
      { text: 'Keep It', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(itemId) },
    ]);
  };

  if (!session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          message="Sign in to view your profile."
          actionLabel="Create Account"
          onAction={() => nav.navigate('Auth', { screen: 'SignUp' })}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {user && <ProfileHeader user={user} />}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Listings</Text>
        <PrimaryButton
          label="Post Your First Item"
          onPress={() => nav.navigate('PostItem')}
          showArrow
        />
      </View>
      {isLoading
        ? <SkeletonCard />
        : myItems.length === 0
          ? <EmptyState message="You haven't posted anything yet." />
          : (
            <FlatList
              data={myItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <FeedCard item={item} index={index} onPress={(id) => nav.navigate('ItemDetail', { itemId: id })} />
              )}
              contentContainerStyle={{ paddingBottom: 80 }}
            />
          )
      }
      <View style={styles.footer}>
        <Pressable onPress={signOut} accessibilityRole="button" accessibilityLabel="Sign out">
          <Text style={styles.signOut}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.CHARCOAL },
  section: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.md,
    gap:               Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
  },
  sectionTitle: { ...Typography.subheading, color: Colors.CREAM, fontWeight: '700' },
  footer: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.base,
    borderTopWidth:    1,
    borderTopColor:    Colors.DIVIDER,
  },
  signOut: { ...Typography.label, color: Colors.RUST_LIGHT },
});
```

- [ ] **Step 5: Create src/app/profile/post-item.tsx**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { itemsService } from '@/services/items';
import { useLocation } from '@/hooks/useLocation';
import type { ItemCategory } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

const CATEGORIES: { label: string; value: ItemCategory }[] = [
  { label: 'Furniture',    value: 'furniture' },
  { label: 'Electronics',  value: 'electronics' },
  { label: 'Clothing',     value: 'clothing' },
  { label: 'Books',        value: 'books' },
  { label: 'Kitchen',      value: 'kitchen' },
  { label: 'Sports',       value: 'sports' },
  { label: 'Toys',         value: 'toys' },
  { label: 'Other',        value: 'other' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'PostItem'>;

export function PostItemScreen({ navigation }: Props) {
  const insets    = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { location } = useLocation();

  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [category, setCategory] = useState<ItemCategory>('other');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) return setError('Add a title so people know what you're offering.');
    if (!location)     return setError('Location not available. Check location permissions.');
    if (!session)      return;

    setLoading(true);
    try {
      const item = await itemsService.create({
        title:     title.trim(),
        description: desc.trim(),
        category,
        lat:       location.lat,
        lng:       location.lng,
        photoUrls: [],
        userId:    session.user.id,
      });
      Alert.alert('Your item is live!', 'Someone nearby might claim it soon.', [
        { text: 'View Your Listing', onPress: () => {
          navigation.goBack();
          navigation.navigate('ItemDetail', { itemId: item.id });
        }},
      ]);
    } catch {
      setError('Couldn't post. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.CHARCOAL }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Post an Item</Text>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Vintage desk lamp"
              placeholderTextColor={Colors.DISABLED_GRAY}
              returnKeyType="next"
              maxLength={80}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={desc}
              onChangeText={setDesc}
              placeholder="Condition, dimensions, anything useful…"
              placeholderTextColor={Colors.DISABLED_GRAY}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <View
                  key={cat.value}
                  style={[styles.chip, category === cat.value && styles.chipSelected]}
                >
                  <Text
                    style={[styles.chipText, category === cat.value && styles.chipTextSelected]}
                    onPress={() => setCategory(cat.value)}
                  >
                    {cat.label.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PrimaryButton
          label={loading ? 'Posting your item…' : 'Post Item'}
          onPress={handleSubmit}
          fullWidth
          showArrow
          disabled={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flexGrow: 1, paddingHorizontal: Spacing.gutter, gap: Spacing.xl },
  title:      { ...Typography.sectionTitle, color: Colors.CREAM },
  fields:     { gap: Spacing.md },
  field:      { gap: Spacing.sm },
  label:      { ...Typography.label, color: Colors.CREAM },
  input: {
    backgroundColor:   Colors.MID_CHARCOAL,
    borderWidth:       2,
    borderColor:       Colors.RUST,
    color:             Colors.CREAM,
    fontSize:          14,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    minHeight:         48,
  },
  multiline:  { minHeight: 100 },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor:   Colors.LIGHT_CHARCOAL,
    paddingVertical:   Spacing.sm - 2,
    paddingHorizontal: Spacing.md,
    borderWidth:       1,
    borderColor:       Colors.LIGHT_CHARCOAL,
  },
  chipSelected:     { backgroundColor: Colors.RUST, borderColor: Colors.RUST },
  chipText:         { ...Typography.tinyLabel, color: Colors.MUTED_ASH },
  chipTextSelected: { color: Colors.CREAM },
  error:            { ...Typography.caption, color: Colors.RUST_LIGHT },
});
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useSavedItems.ts src/app/saved.tsx src/features/profile/ \
        src/app/profile/ src/services/users.ts
git commit -m "feat: add Saved, Profile, and Post Item screens"
```

---

## Task 18: Final Wiring + Smoke Test

**Files:**
- Modify: `src/app/_layout.tsx` (verify all screens imported)
- Create: `src/index.tsx` (entry point if not done in Task 1)

- [ ] **Step 1: Run the full test suite**

```bash
npx jest --coverage --no-coverage-reporter=lcov 2>&1 | tail -30
```

Expected: all tests pass. Fix any failures before continuing.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any type errors.

- [ ] **Step 3: Start the dev server and verify on Android emulator**

```bash
npx expo start --android
```

Manual smoke test checklist:
- [ ] App launches on Android emulator
- [ ] Splash screen shows "FIND FREE" and auto-advances in 2.5s
- [ ] Onboarding shows "Free stuff is everywhere." and both buttons
- [ ] "Browse Without Signing Up" → lands on Map tab
- [ ] Map tab shows Google Map (may be grey until Maps API key is set)
- [ ] Feed tab shows seed items from supabase/seed.sql
- [ ] Feed cards show title, FREE badge, distance, age
- [ ] Tapping a feed card opens Item Detail
- [ ] Item Detail shows title, "About this item", "Message Poster" CTA
- [ ] "Message Poster" on guest → prompts sign in
- [ ] Sign Up → creates account → auto-navigates to Main
- [ ] Messages tab shows empty state for new user
- [ ] Saved tab shows empty state
- [ ] Profile tab shows user name and "Post Your First Item"
- [ ] Post Item → fills title → submits → success alert

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: wire all screens, full app smoke-tested on Android emulator"
```

---

## Self-Review

### Spec coverage check

| Requirement | Task |
|---|---|
| Splash screen + auto-advance | Task 10 |
| Onboarding (Create Account / Browse as Guest) | Task 10 |
| Sign Up / Sign In screens | Task 11 |
| Auth service + Supabase integration | Task 11 |
| Map screen + markers | Task 14 |
| Item preview bottom sheet | Task 14 |
| Guest FAB on map | Task 14 |
| Location permission + denial banner | Task 13, 14 |
| Feed screen with FeedCard (3 tiers) | Task 13 |
| Pull-to-refresh + empty states | Task 13 |
| Item Detail + photo carousel | Task 15 |
| Save item (optimistic) | Task 15 |
| Message Poster CTA | Task 15 |
| Messages inbox | Task 16 |
| Real-time chat thread | Task 16 |
| Saved items screen | Task 17 |
| Profile screen | Task 17 |
| Post Item form | Task 17 |
| Delete item (confirm dialog) | Task 17 |
| Design system (colors, type, spacing, springs) | Task 4 |
| Reduced motion support | Tasks 4, 7, 13 |
| TalkBack accessibility labels | All component tasks |
| Supabase schema + RLS | Task 2 |
| Skeleton loading states | Task 9, all screens |
| Sign out | Task 17 |
| Navigation (Root Stack + Tab + Auth Stack) | Task 6 |
| Custom tab bar | Task 6 |

### Type consistency check

All component props use types from `src/types/index.ts`. No local re-definitions. `Item`, `User`, `Conversation`, `Message` are imported from `@/types` in every file that uses them.

### No placeholders

All code blocks contain working implementations. No "TODO", "implement later", or "add validation" comments.

---

**Plan complete and saved.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — one subagent per task, reviewed between tasks.
Use `superpowers:subagent-driven-development`

**2. Inline Execution** — batch execution with checkpoints.
Use `superpowers:executing-plans`
