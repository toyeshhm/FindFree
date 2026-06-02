import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import {
  Gesture, GestureDetector, GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Springs, Radius } from '@/lib';
import { createStyleSheet } from "@/lib/theme";

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_MAX_H   = SCREEN_HEIGHT * 0.6;
const HIDDEN_TY     = 400;
const DISMISS_THRESHOLD = 80;

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_ALERTS = [
  {
    id:       'a1',
    title:    'Free Coffee at Starbucks',
    subtitle: 'food · 2m ago',
    unread:   true,
  },
  {
    id:       'a2',
    title:    'Buy 1 Get 1 at McDonald\'s',
    subtitle: 'food · 1h ago',
    unread:   true,
  },
  {
    id:       'a3',
    title:    'Grocery clearance near you',
    subtitle: 'grocery · 3h ago',
    unread:   false,
  },
  {
    id:       'a4',
    title:    'Local bookshop giveaway',
    subtitle: 'local · 5h ago',
    unread:   false,
  },
];

interface AlertsSheetProps {
  visible:   boolean;
  onDismiss: () => void;
}

export function AlertsSheet({ visible, onDismiss }: AlertsSheetProps) {
  const insets = useSafeAreaInsets();
  const ty      = useSharedValue(HIDDEN_TY);
  const backdropOp = useSharedValue(0);

  // Animate in/out when visible changes
  useEffect(() => {
    if (visible) {
      ty.value        = withSpring(0, Springs.gentle);
      backdropOp.value = withTiming(1, { duration: 220 });
    } else {
      ty.value        = withSpring(HIDDEN_TY, Springs.snappy);
      backdropOp.value = withTiming(0, { duration: 180 });
    }
  }, [visible]);

  // Swipe-to-dismiss pan gesture
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      // Only allow dragging downward
      const next = startY.value + e.translationY;
      ty.value = next < 0 ? 0 : next;
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 600) {
        ty.value        = withSpring(HIDDEN_TY, Springs.snappy);
        backdropOp.value = withTiming(0, { duration: 180 });
        runOnJS(onDismiss)();
      } else {
        ty.value = withSpring(0, Springs.gentle);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOp.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        {/* Dimmed backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + 16, maxHeight: SHEET_MAX_H },
              sheetStyle,
            ]}
          >
            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Title */}
            <Text style={styles.title}>Notifications</Text>

            {/* Alert rows */}
            {MOCK_ALERTS.length > 0 ? (
              MOCK_ALERTS.map((alert) => (
                <View key={alert.id} style={styles.alertRow}>
                  {/* Thumbnail placeholder */}
                  <View style={styles.thumbnail} />
                  {/* Text column */}
                  <View style={styles.alertText}>
                    <Text style={styles.alertTitle} numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text style={styles.alertSub} numberOfLines={1}>
                      {alert.subtitle}
                    </Text>
                  </View>
                  {/* Unread dot */}
                  {alert.unread && <View style={styles.unreadDot} />}
                </View>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>All caught up.</Text>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = createStyleSheet((Colors) => ({
  root: {
    flex:           1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor:       Colors.SURFACE,
    borderTopLeftRadius:   Radius.lg,
    borderTopRightRadius:  Radius.lg,
    borderTopWidth:        2,
    borderTopColor:        Colors.INK,
    paddingHorizontal:     Spacing.gutter,
    paddingTop:            12,
  },
  handle: {
    alignSelf:       'center',
    width:           40,
    height:          4,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.ROPE,
    marginBottom:    16,
  },
  title: {
    ...Typography.headline,
    color:        Colors.TEXT_PRIMARY,
    marginBottom: Spacing.md,
  },
  alertRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 10,
    gap:             12,
  },
  thumbnail: {
    width:        60,
    height:       60,
    borderRadius: 8,
    backgroundColor: Colors.SURFACE_DEEP,
    flexShrink:   0,
  },
  alertText: {
    flex: 1,
    gap:  2,
  },
  alertTitle: {
    ...Typography.label,
    color: Colors.TEXT_PRIMARY,
  },
  alertSub: {
    ...Typography.caption,
    color: Colors.TEXT_MUTED,
  },
  unreadDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.SEA,
    flexShrink:      0,
  },
  emptyWrap: {
    alignItems:   'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.flavor,
    color: Colors.TEXT_MUTED,
  },
}));
