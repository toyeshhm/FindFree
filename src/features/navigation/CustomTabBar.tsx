import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { List, MapPin, Users, Star, User } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Stamp, Radius, Springs, HapticFeedback, useReducedMotion } from '@/lib';
import { createStyleSheet } from "@/lib/theme";

const TAB_ICONS: Record<string, (active: boolean) => React.ReactElement> = {
  DiscoverTab:  (a) => <List           size={19} color={a ? Colors.ACCENT : Colors.TEXT_SECONDARY} weight={a ? 'bold' : 'regular'} />,
  MapTab:       (a) => <MapPin         size={19} color={a ? Colors.ACCENT : Colors.TEXT_SECONDARY} weight={a ? 'fill' : 'regular'} />,
  CommunityTab: (a) => <Users          size={19} color={a ? Colors.ACCENT : Colors.TEXT_SECONDARY} weight={a ? 'fill' : 'regular'} />,
  SavedTab:     (a) => <Star           size={19} color={a ? Colors.ACCENT : Colors.TEXT_SECONDARY} weight={a ? 'fill' : 'regular'} />,
  ProfileTab:   (a) => <User           size={19} color={a ? Colors.ACCENT : Colors.TEXT_SECONDARY} weight={a ? 'fill' : 'regular'} />,
};

const TAB_LABELS: Record<string, string> = {
  DiscoverTab: 'FIND', MapTab: 'MAP', CommunityTab: 'CREW',
  SavedTab: 'SAVED', ProfileTab: 'PROFILE',
};

const TAB_A11Y: Record<string, string> = {
  DiscoverTab: 'Discover', MapTab: 'Map', CommunityTab: 'Community',
  SavedTab: 'Saved', ProfileTab: 'Profile',
};

function TabButton({
  routeName, active, onPress,
}: {
  routeName: string; active: boolean; onPress: () => void;
}) {
  const press   = useSharedValue(0);
  const reduced = useReducedMotion();
  const label   = TAB_LABELS[routeName] ?? routeName;

  // settle back to rest whenever the active tab changes
  useEffect(() => {
    press.value = withSpring(0, Springs.snappy);
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.08 }],
  }));

  const handlePress = () => { HapticFeedback.selection(); onPress(); };
  const handleIn  = () => { if (!reduced) press.value = withSpring(1, Springs.snappy); };
  const handleOut = () => { if (!reduced) press.value = withSpring(0, Springs.snappy); };

  return (
    <Pressable
      style={styles.tab}
      onPress={handlePress}
      onPressIn={handleIn}
      onPressOut={handleOut}
      accessibilityRole="tab"
      accessibilityLabel={TAB_A11Y[routeName] ?? routeName}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[styles.tabInner, animStyle]} pointerEvents="none">
        {TAB_ICONS[routeName]?.(active)}
        <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.indicator, active && styles.indicatorActive]} />
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom || Spacing.base }]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => (
          <TabButton
            key={route.key}
            routeName={route.name}
            active={state.index === index}
            onPress={() => navigation.navigate(route.name)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection:   'row',
    backgroundColor: Colors.SURFACE,        // Parchment instrument plate
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.INK,            // Ink border
    width:           '90%',
    maxWidth:        420,
    height:          66,
    paddingHorizontal: Spacing.xs,
    ...Stamp.md,                            // signature stamped-paper shadow
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      44,
  },
  tabInner: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            3,
    paddingTop:     2,
  },
  label: {
    ...Typography.navLabel,
    color: Colors.TEXT_SECONDARY,
  },
  labelActive: {
    color: Colors.ACCENT,
  },
  // a small ink underline that "stamps" in under the active tab
  indicator: {
    height: 2,
    width: 16,
    marginTop: 1,
    borderRadius: 1,
    backgroundColor: Colors.TRANSPARENT,
  },
  indicatorActive: {
    backgroundColor: Colors.ACCENT,
  },
}));
