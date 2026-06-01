# FindFree React Native Architecture
**Phase 7: Component Primitives, Navigation, State, Performance**  
**Date:** 2026-06-01  
**Stack:** React Native 0.74+, Expo SDK 51+, TypeScript, Reanimated 3

---

## 1. Project Structure

Feature-based organization. Shared utilities at the root, feature-specific code colocated.

```
src/
├── app/                    # Screen components (one file per screen)
│   ├── splash.tsx
│   ├── onboarding.tsx
│   ├── auth/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── map.tsx
│   ├── feed.tsx
│   ├── item-detail.tsx     # Modal screen, accessible from any tab
│   ├── messages/
│   │   ├── inbox.tsx
│   │   └── chat.tsx
│   ├── saved.tsx
│   ├── profile/
│   │   ├── index.tsx
│   │   └── post-item.tsx
│   └── _layout.tsx         # Root navigation
│
├── components/             # Shared, design-system primitives
│   ├── PressableScale.tsx
│   ├── PrimaryButton.tsx
│   ├── SecondaryButton.tsx
│   ├── SearchBar.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── SkeletonCard.tsx
│   ├── SkeletonRow.tsx
│   └── EmptyState.tsx
│
├── features/               # Feature-specific components (colocated with their screen)
│   ├── feed/
│   │   ├── FeedCard.tsx        # 3-tier card system
│   │   ├── FeedCardSkeleton.tsx
│   │   └── FeedList.tsx
│   ├── map/
│   │   ├── MapView.tsx
│   │   ├── ItemMarker.tsx
│   │   └── ItemPreviewSheet.tsx
│   ├── items/
│   │   ├── PhotoCarousel.tsx
│   │   └── PosterInfo.tsx
│   ├── messages/
│   │   ├── ConversationRow.tsx
│   │   └── ChatBubble.tsx
│   └── profile/
│       └── ProfileHeader.tsx
│
├── hooks/                  # Shared hooks (data fetching, device)
│   ├── useNearbyItems.ts
│   ├── useItemDetail.ts
│   ├── useConversations.ts
│   ├── useChatThread.ts
│   ├── useLocation.ts
│   └── useSavedItems.ts
│
├── lib/                    # Utilities and constants
│   ├── springs.ts          # Reanimated spring presets
│   ├── haptics.ts          # Haptic feedback map
│   ├── colors.ts           # Design system colors
│   ├── typography.ts       # Type scale constants
│   ├── spacing.ts          # Spacing constants
│   └── useReducedMotion.ts
│
├── navigation/
│   └── types.ts            # All typed navigation params
│
├── services/               # Supabase query functions (no state, pure async)
│   ├── items.ts
│   ├── messages.ts
│   ├── auth.ts
│   └── users.ts
│
├── stores/                 # Zustand stores (client-only state)
│   ├── useAuthStore.ts
│   ├── useFilterStore.ts
│   └── useSavedStore.ts
│
└── types/                  # Shared TypeScript types
    ├── index.ts
    └── supabase.ts         # Auto-generated Supabase types
```

---

## 2. TypeScript Types

```ts
// types/index.ts

export type ItemCategory =
  | 'furniture'
  | 'electronics'
  | 'clothing'
  | 'books'
  | 'kitchen'
  | 'sports'
  | 'toys'
  | 'other';

export type ItemSource = 'user' | 'facebook' | 'craigslist' | 'buynot';
export type ItemStatus = 'available' | 'claimed' | 'deleted';

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
  distanceKm?: number; // computed client-side from user location
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  location?: LatLng;
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
  radiusKm: number;       // default: 10
  category?: ItemCategory;
  maxAgeHours?: number;   // undefined = no limit
}
```

---

## 3. Navigation Architecture

Root Stack wraps the Tab navigator. Item Detail, Chat Thread, and Post Item are modal-level screens pushed on the Root Stack — this lets them be accessed from any tab without duplicating screen components.

```ts
// navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  ItemDetail: { itemId: string };
  ChatThread: { conversationId: string; itemTitle: string };
  PostItem: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type TabParamList = {
  MapTab: undefined;
  FeedTab: undefined;
  MessagesTab: undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
};

// Typed navigation hook — use everywhere instead of untyped useNavigation()
import { useNavigation as useNav } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
export const useNavigation = () => useNav<NativeStackNavigationProp<RootStackParamList>>();
```

```tsx
// app/_layout.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { screenTransition } from '../navigation/transitions'; // from MOTION_SPEC.md

const Root = createNativeStackNavigator<RootStackParamList>();

export default function RootLayout() {
  const { session } = useAuthStore();

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Root.Screen name="Splash" component={SplashScreen} />
            <Root.Screen name="Onboarding" component={OnboardingScreen} />
            <Root.Screen name="Auth" component={AuthStack} />
          </>
        ) : null}
        <Root.Screen name="Main" component={TabNavigator} />
        {/* Modal screens — accessible from any tab */}
        <Root.Screen
          name="ItemDetail"
          component={ItemDetailScreen}
          options={{ presentation: 'card', ...screenTransition }}
        />
        <Root.Screen
          name="ChatThread"
          component={ChatThreadScreen}
          options={{ presentation: 'card', ...screenTransition }}
        />
        <Root.Screen
          name="PostItem"
          component={PostItemScreen}
          options={{ presentation: 'modal' }}
        />
      </Root.Navigator>
    </NavigationContainer>
  );
}
```

```tsx
// Tab Navigator with custom tab bar
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="MapTab" component={MapScreen} />
      <Tab.Screen name="FeedTab" component={FeedScreen} />
      <Tab.Screen name="MessagesTab" component={MessagesInboxScreen} />
      <Tab.Screen name="SavedTab" component={SavedScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

---

## 4. State Management

Three Zustand stores. No Redux. React Query handles all server state.

```ts
// stores/useAuthStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthStore {
  user: User | null;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  setGuest: (guest: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isGuest: false,
  setUser: (user) => set({ user }),
  setGuest: (isGuest) => set({ isGuest }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isGuest: false });
  },
}));
```

```ts
// stores/useFilterStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storage } from '../lib/storage'; // MMKV adapter

interface FilterStore {
  filters: FilterState;
  setRadius: (km: number) => void;
  setCategory: (category?: ItemCategory) => void;
  setMaxAge: (hours?: number) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: FilterState = { radiusKm: 10 };

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      setRadius: (radiusKm) => set((s) => ({ filters: { ...s.filters, radiusKm } })),
      setCategory: (category) => set((s) => ({ filters: { ...s.filters, category } })),
      setMaxAge: (maxAgeHours) => set((s) => ({ filters: { ...s.filters, maxAgeHours } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    { name: 'filters', storage }
  )
);
```

```ts
// stores/useSavedStore.ts — optimistic saves (sync with server via React Query mutations)
import { create } from 'zustand';

interface SavedStore {
  savedIds: Set<string>;
  setSavedIds: (ids: string[]) => void;
  toggle: (itemId: string) => void;
  isSaved: (itemId: string) => boolean;
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

---

## 5. Data Fetching (React Query + Supabase)

All server reads go through React Query. All mutations invalidate relevant queries.

```ts
// services/items.ts
import { supabase } from '../lib/supabase';

export const itemsService = {
  getNearby: async (location: LatLng, filters: FilterState): Promise<Item[]> => {
    const { data, error } = await supabase.rpc('get_nearby_items', {
      user_lat: location.lat,
      user_lng: location.lng,
      radius_km: filters.radiusKm,
      category: filters.category ?? null,
      max_age_hours: filters.maxAgeHours ?? null,
    });
    if (error) throw error;
    return data as Item[];
  },

  getById: async (itemId: string): Promise<Item> => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();
    if (error) throw error;
    return data as Item;
  },

  getSaved: async (userId: string): Promise<Item[]> => {
    const { data, error } = await supabase
      .from('saved_items')
      .select('item:items(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data.map((row: any) => row.item) as Item[];
  },
};
```

```ts
// hooks/useNearbyItems.ts
import { useQuery } from '@tanstack/react-query';
import { itemsService } from '../services/items';

export function useNearbyItems(location: LatLng | null, filters: FilterState) {
  return useQuery({
    queryKey: ['items', 'nearby', location, filters],
    queryFn: () => itemsService.getNearby(location!, filters),
    enabled: !!location,
    staleTime: 2 * 60 * 1000,     // 2 minutes before refetch
    gcTime: 10 * 60 * 1000,       // 10 minutes in cache
    retry: 2,
  });
}
```

```ts
// hooks/useChatThread.ts — real-time Supabase subscription
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { messagesService } from '../services/messages';

export function useChatThread(conversationId: string) {
  const qc = useQueryClient();

  // Initial fetch
  const query = useQuery({
    queryKey: ['chat', conversationId],
    queryFn: () => messagesService.getMessages(conversationId),
    staleTime: Infinity, // real-time subscription handles freshness
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          qc.setQueryData<Message[]>(['chat', conversationId], (prev = []) => [
            ...prev,
            payload.new as Message,
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  return query;
}
```

---

## 6. Core Component Primitives

### Design System Constants

```ts
// lib/colors.ts
export const Colors = {
  CHARCOAL:         '#3D3D39',
  MID_CHARCOAL:     '#4A4844',
  DEEPER_CHARCOAL:  '#2D2D2A',
  LIGHT_CHARCOAL:   '#5A5450',
  CREAM:            '#F5F1E8',
  RUST:             '#8B6F47',
  RUST_LIGHT:       '#D4A574',
  MUTED_ASH:        '#B8B0A0',
  DISABLED_GRAY:    '#999999',
  DIVIDER:          'rgba(139, 111, 71, 0.3)',
} as const;

// lib/typography.ts
export const Typography = {
  displayHero:  { fontSize: 56, fontWeight: '900', lineHeight: 56,  letterSpacing: 0 },
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

// lib/spacing.ts
export const Spacing = {
  micro: 4,  sm: 8,  md: 12,  base: 16,  lg: 20,
  xl: 24,    xxl: 32, hero: 40,
  gutter: 16,
  safeTop: 28,
  safeBottom: 34,
} as const;
```

### PrimaryButton

```tsx
// components/PrimaryButton.tsx
import React from 'react';
import { Text, StyleSheet, View, ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { Colors, Typography, Spacing } from '../lib';
import { HapticFeedback } from '../lib/haptics';
import { ArrowRight } from 'phosphor-react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  fullWidth?: boolean;
  showArrow?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string; // override when label alone is not descriptive
}

export const PrimaryButton = React.memo(function PrimaryButton({
  label,
  onPress,
  fullWidth,
  showArrow,
  disabled,
  style,
  accessibilityLabel,
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
        {label}
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
    alignItems: 'center',
    backgroundColor: Colors.RUST,
    borderWidth: 2,
    borderColor: Colors.RUST,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 4,
    minHeight: 48,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  label: {
    ...Typography.label,
    color: Colors.CREAM,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  iconZone: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(61, 61, 57, 0.3)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(61, 61, 57, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
```

### FeedCard (3-tier system)

```tsx
// features/feed/FeedCard.tsx
import React, { memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import { PressableScale } from '../../components/PressableScale';
import { Badge } from '../../components/Badge';
import { Colors, Typography, Spacing } from '../../lib';
import { Springs } from '../../lib/springs';
import { useReducedMotion } from '../../lib/useReducedMotion';

type CardTier = 'standard' | 'feature' | 'text-only';

function deriveCardTier(item: Item, index: number): CardTier {
  if (!item.photoUrls.length) return 'text-only';
  // First card or items posted within the last hour become feature cards
  if (index === 0 || isRecentItem(item)) return 'feature';
  return 'standard';
}

interface FeedCardProps {
  item: Item;
  index: number;
  onPress: (itemId: string) => void;
}

export const FeedCard = memo(function FeedCard({ item, index, onPress }: FeedCardProps) {
  const tier = deriveCardTier(item, index);
  const reduced = useReducedMotion();

  // Entry animation (heavy fade-up)
  const translateY = useSharedValue(16);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const delay = Math.min(index, 4) * 50;
    if (reduced) {
      translateY.value = withTiming(0, { duration: 0 });
      opacity.value = withTiming(1, { duration: 0 });
    } else {
      translateY.value = withDelay(delay, withSpring(0, Springs.gentle));
      opacity.value = withDelay(delay, withSpring(1, Springs.gentle));
    }
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const imageHeight = tier === 'feature' ? 140 : tier === 'standard' ? 80 : 0;

  return (
    <Animated.View style={entryStyle}>
      <PressableScale
        onPress={() => onPress(item.id)}
        style={styles.outerShell}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km away` : ''}, free`}
      >
        <View style={styles.innerCore}>
          {imageHeight > 0 && (
            <View style={[styles.imagePlaceholder, { height: imageHeight }]}>
              {item.photoUrls[0] ? (
                <Image source={{ uri: item.photoUrls[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[styles.imagePlaceholder, { height: imageHeight, borderWidth: 1, borderColor: Colors.RUST_LIGHT, borderStyle: 'dashed' }]} />
              )}
            </View>
          )}
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Badge label="FREE" accessibilityHidden />
              <Text style={styles.meta} numberOfLines={1} accessibilityHidden>
                {item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km` : ''} • {formatAge(item.createdAt)}
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
    marginBottom: Spacing.md,
    backgroundColor: Colors.MID_CHARCOAL,
    borderLeftWidth: 3,
    borderLeftColor: Colors.RUST,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_CHARCOAL,
    padding: 1,
  },
  innerCore: {
    backgroundColor: Colors.MID_CHARCOAL,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  imagePlaceholder: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: Colors.LIGHT_CHARCOAL,
  },
  content: { padding: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.bodyCompact,
    color: Colors.CREAM,
    fontWeight: '700',
  },
  description: {
    ...Typography.caption,
    color: Colors.MUTED_ASH,
    marginTop: Spacing.sm,
  },
  meta: {
    ...Typography.tinyLabel,
    color: Colors.MUTED_ASH,
    fontVariant: ['tabular-nums'],
  },
});
```

### Optimized FeedList

```tsx
// features/feed/FeedList.tsx
import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { FeedCard } from './FeedCard';
import { FeedCardSkeleton } from './FeedCardSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { Colors } from '../../lib';

interface FeedListProps {
  items: Item[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onItemPress: (itemId: string) => void;
}

export function FeedList({ items, isLoading, isRefreshing, onRefresh, onItemPress }: FeedListProps) {
  const renderItem = useCallback(
    ({ item, index }: { item: Item; index: number }) => (
      <FeedCard item={item} index={index} onPress={onItemPress} />
    ),
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

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <EmptyState
          message="No items nearby yet — try expanding your radius!"
          actionLabel="Adjust Radius"
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Colors.RUST}
          colors={[Colors.RUST]}
          accessibilityLabel={isRefreshing ? 'Loading items…' : 'Pull to refresh'}
        />
      }
      removeClippedSubviews
      maxToRenderPerBatch={8}
      windowSize={5}
      initialNumToRender={6}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 8, paddingBottom: 80 }, // 80 = tab bar clearance
});
```

---

## 7. FlatList Performance Rules

| Rule | Implementation |
|---|---|
| Always memo list items | `React.memo(FeedCard)` |
| Stable renderItem | `useCallback` with no inline closures |
| Stable keyExtractor | `useCallback((item) => item.id)` |
| Remove clipped subviews | `removeClippedSubviews` on Android |
| Limit batch size | `maxToRenderPerBatch={8}`, `windowSize={5}` |
| Cache images | `expo-image` with `contentFit="cover"` |
| No ScrollView for lists | `FlatList` or `SectionList` always |
| List padding for tab bar | `paddingBottom: 80` in contentContainerStyle |

---

## 8. SafeAreaView & Platform Handling

```tsx
// Wrap every root screen in SafeAreaProvider + useSafeAreaInsets
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function MapScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* content */}
    </View>
  );
}
```

The tab bar must account for `insets.bottom`:

```tsx
// features/navigation/CustomTabBar.tsx
function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {/* tabs */}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 50 + insets.bottom, // 50dp tab bar + safe area
    backgroundColor: Colors.CHARCOAL,
    borderTopWidth: 2,
    borderTopColor: Colors.RUST,
    flexDirection: 'row',
  },
});
```

---

## 9. Auth Flow & Session Persistence

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const mmkvStorageAdapter = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: mmkvStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

Auth state listener in root `_layout.tsx`:

```tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
    if (session?.user) {
      // Fetch user profile and hydrate store
      usersService.getProfile(session.user.id).then(useAuthStore.getState().setUser);
    } else {
      useAuthStore.getState().setUser(null);
    }
  });
  return () => subscription.unsubscribe();
}, []);
```

---

## 10. Location Handling

```ts
// hooks/useLocation.ts
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') { setDenied(true); return; }
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
    });
  }, []);

  return { location, denied };
}
```

If denied: show a friendly in-screen prompt (not an alert) explaining why location is useful, with a "Open Settings" button. The map still renders centered on a default location.

---

## 11. Image Handling

Use `expo-image` for all remote images — built-in disk + memory caching, progressive loading.

```tsx
import { Image } from 'expo-image';

// In FeedCard, PhotoCarousel:
<Image
  source={{ uri: photoUrl }}
  style={{ width: '100%', height: imageHeight }}
  contentFit="cover"
  transition={200}
  placeholder={{ uri: 'blurhash_string' }}
/>
```

All images must have a `placeholder` blurhash from the backend. Add `blurhash` to the `items.photo_urls` field or generate at upload time with `thumbhash` / `blurhash` on the Node.js backend.

---

## 12. Environment Setup

```bash
# .env.local (never commit)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
```

```json
// app.json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": { "apiKey": "$(EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)" }
      }
    }
  }
}
```

---

## 13. Dependency List

```bash
npx expo install \
  react-native-reanimated \
  react-native-gesture-handler \
  expo-haptics \
  expo-location \
  expo-image \
  react-native-maps \
  react-native-safe-area-context \
  react-native-screens \
  @react-navigation/native \
  @react-navigation/native-stack \
  @react-navigation/bottom-tabs \
  @supabase/supabase-js \
  @tanstack/react-query \
  zustand \
  react-native-mmkv \
  phosphor-react-native \
  react-native-svg

npm install react-native-gesture-handler \
  @react-navigation/native \
  @react-navigation/native-stack \
  @react-navigation/bottom-tabs
```

---

---

## 14. Accessibility Patterns

Every interactive element must satisfy these requirements. Apply at implementation time.

### Tab Bar Items
```tsx
<TouchableOpacity
  accessibilityRole="tab"
  accessibilityLabel={tab.label}           // "Map", "Feed", "Messages", "Saved", "Profile"
  accessibilityState={{ selected: isActive }}
>
```

### Icon-Only Buttons (back, close, heart, share)
```tsx
// Any button with only an icon and no visible text label
<PressableScale
  accessibilityRole="button"
  accessibilityLabel="Save item"           // describes the action, not the icon
>
  <Heart size={24} color={...} accessible={false} />
</PressableScale>
```

### Form Inputs — Required Props
```tsx
// Email field
<TextInput
  accessibilityLabel="Email address"
  keyboardType="email-address"
  autoComplete="email"
  autoCapitalize="none"
  autoCorrect={false}
  spellCheck={false}
  returnKeyType="next"
  onSubmitEditing={() => passwordRef.current?.focus()}
/>

// Password field
<TextInput
  accessibilityLabel="Password"
  autoComplete="password"
  secureTextEntry
  returnKeyType="done"
/>

// Search bar
<TextInput
  accessibilityLabel="Search nearby items"
  autoCapitalize="none"
  autoCorrect={false}
  returnKeyType="search"
  clearButtonMode="while-editing"
/>
```

### Destructive Action Confirmation
```tsx
// Before deleting a posted item or account action
const confirmDelete = (itemId: string) => {
  Alert.alert(
    'Delete item?',
    'This will permanently remove your listing.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteItem(itemId),
      },
    ]
  );
};
```

### Modal / Bottom Sheet Overscroll
```tsx
// Prevent scroll from leaking out of sheets and modals on Android
<ScrollView overScrollMode="never" bounces={false}>
```

### Image Accessibility
```tsx
// Decorative images (item photos the user has already seen described in title)
<Image accessible={false} />

// Meaningful images (avatar, app logo)
<Image accessibilityLabel="Profile photo for Sarah Chen" />
```

---

## 15. Loading & Copy Standards

| Context | Correct | Wrong |
|---|---|---|
| Data loading | "Loading items…" | "Loading..." |
| Saving | "Saving…" | "Saving" / "Please wait" |
| Sending message | "Sending…" | "Sending..." |
| Error with action | "Couldn't load map. Check your connection and try again." | "Error loading map." |
| Empty state | "No items nearby yet — try expanding your radius!" | "Nothing here." |
| Destructive button | "Delete listing" | "Delete" / "OK" |

**Ellipsis rule:** Use the single `…` character (U+2026), never three periods `...`, in all user-facing copy.

**Button label rule:** Specific labels that describe the outcome. "Post Item" not "Submit". "Send Message" not "OK". "Save to Favorites" not "Save".

---

*FindFree ARCHITECTURE.md — Phase 7 + UX audit complete 2026-06-01.*
