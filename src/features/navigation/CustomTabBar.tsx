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
