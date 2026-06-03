import React, { useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius, Springs } from '@/lib';
import { createStyleSheet } from "@/lib/theme";

interface TimeframeSheetProps {
  visible: boolean;
  value?: number; // maxAgeHours (undefined means 'any')
  onChange: (hours?: number) => void;
  onDismiss: () => void;
}

const HIDDEN = 600;

const TIMEFRAME_OPTIONS = [
  { label: 'Past 12 hours', value: 12 },
  { label: 'Past 24 hours', value: 24 },
  { label: 'Past 3 days', value: 72 },
  { label: 'Past 7 days', value: 168 },
  { label: 'Past 14 days', value: 336 },
  { label: 'Past 30 days', value: 720 },
  { label: 'All time', value: undefined },
];

export function TimeframeSheet({ visible, value, onChange, onDismiss }: TimeframeSheetProps) {
  const insets = useSafeAreaInsets();
  const ty = useSharedValue(HIDDEN);

  useEffect(() => {
    if (visible) {
      ty.value = withSpring(0, Springs.sheet);
    } else {
      ty.value = withTiming(HIDDEN, { duration: 300 });
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  if (!visible && ty.value === HIDDEN) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: ty.value === HIDDEN ? 0 : 1 }]} pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      <Animated.View style={[s.sheet, style, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={s.header}>
          <Text style={s.title}>Timeframe Settings</Text>
          <Pressable onPress={onDismiss} hitSlop={12} style={s.closeBtn}>
            <X size={20} color={Colors.TEXT_MUTED} />
          </Pressable>
        </View>

        <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
          {TIMEFRAME_OPTIONS.map((opt) => {
            const isActive = value === opt.value;
            return (
              <Pressable
                key={opt.label}
                style={[s.row, isActive && s.rowActive]}
                onPress={() => {
                  onChange(opt.value);
                  onDismiss();
                }}
              >
                <Text style={[s.rowText, isActive && s.rowTextActive]}>{opt.label}</Text>
                {isActive && <Check size={20} color={Colors.ACCENT} weight="bold" />}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const s = createStyleSheet((themeColors) => ({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.SURFACE,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  title: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
  },
  closeBtn: {
    padding: Spacing.xs,
    backgroundColor: Colors.SURFACE_LIGHT,
    borderRadius: Radius.round,
  },
  body: {
    padding: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.BORDER,
  },
  rowActive: {
    backgroundColor: Colors.SURFACE_LIGHT,
    borderRadius: Radius.sm,
    borderBottomWidth: 0,
  },
  rowText: {
    ...Typography.body,
    color: Colors.TEXT_PRIMARY,
  },
  rowTextActive: {
    color: Colors.ACCENT,
    fontWeight: '600',
  },
}));
