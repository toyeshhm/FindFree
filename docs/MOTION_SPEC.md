# FindFree Motion Specification
**Phase 6: Gesture Interaction & Haptics**  
**Date:** 2026-06-01  
**Library:** React Native Reanimated 3 + react-native-gesture-handler + expo-haptics

---

## Dependencies

```bash
npx expo install react-native-reanimated react-native-gesture-handler expo-haptics
```

`babel.config.js` must include:
```js
plugins: ['react-native-reanimated/plugin']
```

---

## 1. Spring Presets

Central constants file. Import these everywhere — never define custom spring values inline.

```ts
// lib/springs.ts
export const Springs = {
  // Standard interactive elements — buttons, cards, tabs
  standard: { stiffness: 120, damping: 15, mass: 1 },

  // Heavier — screen transitions, bottom sheet entry/exit
  heavy: { stiffness: 100, damping: 20, mass: 1 },

  // Snappy — tab switch, press feedback, small toggles
  snappy: { stiffness: 200, damping: 22, mass: 1 },

  // Gentle — fade-up list entry animations
  gentle: { stiffness: 100, damping: 18, mass: 1 },
} as const;
```

---

## 2. Reduced Motion

Check once at app launch, respect throughout. All animated components must gate on this.

```ts
// lib/useReducedMotion.ts
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

**Rule:** When `useReducedMotion()` returns true, all `withSpring` / `withTiming` calls are replaced with instant `withTiming(value, { duration: 0 })`. No exceptions.

---

## 3. Button Press Feedback

Applied to ALL tappable elements: primary/secondary buttons, cards, tab items.

```tsx
// components/PressableScale.tsx
import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Springs } from '../lib/springs';
import { useReducedMotion } from '../lib/useReducedMotion';

interface PressableScaleProps {
  onPress: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
}

export function PressableScale({ onPress, style, children }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = reduced
          ? withTiming(1, { duration: 0 })
          : withSpring(0.97, Springs.snappy);
      }}
      onPressOut={() => {
        scale.value = reduced
          ? withTiming(1, { duration: 0 })
          : withSpring(1, Springs.snappy);
      }}
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

---

## 4. Card Press Background Tint

Feed cards darken to Deep Charcoal on press, spring back on release.

```tsx
// In FeedCard.tsx
const bgOpacity = useSharedValue(0);

const overlayStyle = useAnimatedStyle(() => ({
  ...StyleSheet.absoluteFillObject,
  backgroundColor: '#2D2D2A',
  opacity: bgOpacity.value,
}));

<Pressable
  onPressIn={() => { bgOpacity.value = withSpring(1, Springs.snappy); }}
  onPressOut={() => { bgOpacity.value = withSpring(0, Springs.snappy); }}
  onPress={onPress}
>
  <View style={styles.card}>
    <Animated.View style={overlayStyle} pointerEvents="none" />
    {/* card content */}
  </View>
</Pressable>
```

---

## 5. Feed Card Entry Animation (Heavy Fade-Up)

Triggered when a card first renders (list load, pull-to-refresh). Each card gets an index-based stagger delay, capped at index 4.

```tsx
// components/FeedCard.tsx
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Springs } from '../lib/springs';
import { useReducedMotion } from '../lib/useReducedMotion';

export function FeedCard({ item, index }: FeedCardProps) {
  const translateY = useSharedValue(16);
  const opacity = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const delay = Math.min(index, 4) * 50; // cap stagger at 5 items

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

  return (
    <Animated.View style={entryStyle}>
      {/* card content */}
    </Animated.View>
  );
}
```

---

## 6. Bottom Sheet (Item Preview)

Slides up from below the map on marker tap. Springs back down on dismiss.

```tsx
// components/ItemPreviewSheet.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Springs } from '../lib/springs';
import { useReducedMotion } from '../lib/useReducedMotion';

const SHEET_HEIGHT = 110;

export function ItemPreviewSheet({ visible, onDismiss, ...item }: SheetProps) {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (visible) {
      translateY.value = reduced
        ? withTiming(0, { duration: 0 })
        : withSpring(0, Springs.heavy);
    } else {
      translateY.value = reduced
        ? withTiming(SHEET_HEIGHT, { duration: 0 })
        : withSpring(SHEET_HEIGHT, Springs.standard);
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.sheet, sheetStyle]}>
      {/* sheet content */}
    </Animated.View>
  );
}
```

---

## 7. Screen Transitions (React Navigation)

Configure in the Stack navigator. All screens use a consistent push/pop spring.

```tsx
// navigation/transitions.ts
import { TransitionPresets } from '@react-navigation/stack';

export const screenTransition = {
  ...TransitionPresets.SlideFromRightIOS,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: { stiffness: 100, damping: 20, mass: 1, overshootClamping: false },
    },
    close: {
      animation: 'spring',
      config: { stiffness: 120, damping: 18, mass: 1, overshootClamping: false },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.8, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.2],
        }),
      },
    };
  },
};
```

**Tab switch:** Use React Navigation's `tabBarStyle` with a cross-fade via `tabBarAnimationEnabled: true`. No slide animation for tab switches — only cross-fade at 150ms.

---

## 8. Swipe-to-Back Gesture

The back swipe is handled by React Navigation's default gesture recognizer. Enable it:

```tsx
// In Stack.Navigator
<Stack.Navigator
  screenOptions={{
    gestureEnabled: true,
    gestureResponseDistance: 50, // pixels from edge to trigger
    ...screenTransition,
  }}
>
```

No custom implementation needed — the system gesture is always better than a custom one for screen back navigation.

---

## 9. Photo Carousel (Item Detail)

Swipe between item photos. Uses FlatList with paging for momentum physics.

```tsx
// components/PhotoCarousel.tsx
import { FlatList, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export function PhotoCarousel({ photos }: { photos: string[] }) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <>
      <AnimatedFlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <CarouselPhoto uri={item} index={index} scrollX={scrollX} />
        )}
        keyExtractor={(_, i) => String(i)}
      />
      <PageIndicator total={photos.length} scrollX={scrollX} />
    </>
  );
}

// Subtle parallax on each photo as the carousel scrolls
function CarouselPhoto({ uri, index, scrollX }) {
  const imageStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const scale = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], 'clamp');
    return { transform: [{ scale }] };
  });

  return (
    <View style={{ width: SCREEN_WIDTH, height: 180 }}>
      <Animated.Image source={{ uri }} style={[{ width: '100%', height: '100%' }, imageStyle]} />
    </View>
  );
}

// Dot indicator synced to scroll position
function PageIndicator({ total, scrollX }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => {
        const dotStyle = useAnimatedStyle(() => {
          const opacity = interpolate(
            scrollX.value,
            [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
            [0.3, 1, 0.3],
            'clamp'
          );
          return { opacity };
        });
        return <Animated.View key={i} style={[styles.dot, dotStyle]} />;
      })}
    </View>
  );
}
```

---

## 10. Long-Press Context Menu

Long-press on a feed card or map marker triggers a context menu overlay. The card scales down slightly to signal that the long-press was registered.

```tsx
// Gesture handler for long-press
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';

const longPressScale = useSharedValue(1);

const onLongPressEvent = ({ nativeEvent }) => {
  if (nativeEvent.state === State.ACTIVE) {
    // Scale down to 0.95 to signal registered press
    longPressScale.value = withSpring(0.95, Springs.snappy);
    // Trigger haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Show context menu
    showContextMenu();
  }
  if (nativeEvent.state === State.END || nativeEvent.state === State.CANCELLED) {
    longPressScale.value = withSpring(1, Springs.snappy);
  }
};

<LongPressGestureHandler
  onHandlerStateChange={onLongPressEvent}
  minDurationMs={400}
>
  <Animated.View style={[styles.card, useAnimatedStyle(() => ({
    transform: [{ scale: longPressScale.value }]
  }))]}>
    {/* card content */}
  </Animated.View>
</LongPressGestureHandler>
```

---

## 11. Pull-to-Refresh

Use the native `RefreshControl` — do not override it with a custom animation. The platform's pull-to-refresh is always better than a custom one.

```tsx
import { FlatList, RefreshControl } from 'react-native';

<FlatList
  data={items}
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor="#8B6F47"   // RUST — matches the accent color
      colors={['#8B6F47']}  // Android
    />
  }
/>
```

After refresh completes, new cards at the top use the entry animation from Section 5 (only the newly inserted cards animate — existing cards stay in place).

---

## 12. Haptic Feedback

All haptics use `expo-haptics`. Never trigger haptics on passive events (scroll, display).

```ts
// lib/haptics.ts
import * as Haptics from 'expo-haptics';

export const HapticFeedback = {
  // Light tap — primary button press, tab switch
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  // Medium impact — long-press registered, item saved
  impact: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  // Success notification — message sent, item posted
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  // Error notification — network error, validation failure
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
```

**Usage map:**

| Interaction | Haptic |
|---|---|
| Primary button press | `tap` |
| Tab bar press | none (system handles it) |
| Item saved (heart tap) | `impact` |
| Long-press registered | `impact` |
| Message sent | `success` |
| Item posted | `success` |
| Network error | `error` |
| Form validation error | `error` |

**Reduced motion:** Haptics are NOT disabled when `isReduceMotionEnabled` is true. Haptics are independent of visual motion preferences. Only disable haptics if the device has no haptic engine (check with `Haptics.isAvailableAsync()`).

---

## 13. Map Marker Interaction

When a marker is tapped, it scales up to signal selection before the bottom sheet appears.

```tsx
// Marker selected state uses Animated.spring via react-native-maps marker anchor
// (react-native-maps uses its own animation system for markers)

// Pattern: overlay a custom Animated view on top of the marker
const markerScale = useSharedValue(1);

const onMarkerPress = () => {
  HapticFeedback.tap();
  markerScale.value = withSpring(1.2, Springs.snappy, () => {
    markerScale.value = withSpring(1, Springs.snappy);
  });
  showItemPreview(item);
};
```

---

## 14. Message CTA Button-in-Button Animation

The inner icon zone in the "Message Poster" button translates diagonally on press (from high-end-visual-design spec):

```tsx
// components/MessageButton.tsx
const iconTranslate = useSharedValue(0);
const iconTranslateY = useSharedValue(0);

const iconStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: iconTranslate.value },
    { translateY: iconTranslateY.value },
  ],
}));

<PressableScale
  onPressIn={() => {
    iconTranslate.value = withSpring(2, Springs.snappy);
    iconTranslateY.value = withSpring(-1, Springs.snappy);
  }}
  onPressOut={() => {
    iconTranslate.value = withSpring(0, Springs.snappy);
    iconTranslateY.value = withSpring(0, Springs.snappy);
  }}
  onPress={onPress}
>
  <View style={styles.buttonRow}>
    <Text style={styles.label}>MESSAGE POSTER</Text>
    <Animated.View style={[styles.iconZone, iconStyle]}>
      <ArrowRight size={16} color={Colors.CREAM} />
    </Animated.View>
  </View>
</PressableScale>
```

---

## 15. Saved (Heart) Toggle Animation

Tapping the heart icon on item detail animates between empty and filled states.

```tsx
const heartScale = useSharedValue(1);
const [saved, setSaved] = useState(false);

const toggleSaved = () => {
  // Pulse: scale up then spring back
  heartScale.value = withSpring(1.3, Springs.snappy, () => {
    heartScale.value = withSpring(1, Springs.standard);
  });
  HapticFeedback.impact();
  setSaved(prev => !prev);
};

const heartStyle = useAnimatedStyle(() => ({
  transform: [{ scale: heartScale.value }],
}));

<Pressable onPress={toggleSaved}>
  <Animated.View style={heartStyle}>
    <Heart
      size={24}
      color={saved ? Colors.RUST : Colors.MUTED_ASH}
      weight={saved ? 'fill' : 'regular'}
    />
  </Animated.View>
</Pressable>
```

---

## 16. Tab Bar Active Indicator

The active tab indicator (the `rgba(139,111,71,0.1)` tint) should cross-fade smoothly rather than snap.

```tsx
// In custom tab bar component
const tabOpacity = useSharedValue(activeTab === index ? 1 : 0);

useEffect(() => {
  tabOpacity.value = withTiming(activeTab === index ? 1 : 0, { duration: 150 });
}, [activeTab]);

const tabStyle = useAnimatedStyle(() => ({
  backgroundColor: `rgba(139, 111, 71, ${tabOpacity.value * 0.1})`,
}));
```

---

## Checklist

- [ ] All interactive elements use `PressableScale` (Section 3)
- [ ] Feed cards use entry animation with index-based stagger (Section 5)
- [ ] Bottom sheet uses spring translate (Section 6)
- [ ] Screen transitions use custom spring config (Section 7)
- [ ] Photo carousel uses `pagingEnabled` FlatList with parallax (Section 9)
- [ ] Long-press scales card to 0.95 + haptic impact (Section 10)
- [ ] Pull-to-refresh uses native `RefreshControl` with RUST tint (Section 11)
- [ ] All haptics mapped per interaction type (Section 12)
- [ ] Heart toggle uses pulse spring (Section 15)
- [ ] Tab indicator cross-fades (Section 16)
- [ ] `useReducedMotion` imported and checked in every animated component
- [ ] No `layout`-thrashing properties animated (`width`, `height`, `top`, `left`)
- [ ] All animations use only `transform` and `opacity`

---

*FindFree MOTION_SPEC.md — Phase 6 complete 2026-06-01.*
