import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius, Springs } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { createStyleSheet } from "@/lib/theme";

export interface MapFilters {
  category:    string;    // 'all' | any DealCategory
  radius:      number;    // miles: 0.5 | 1 | 2 | 5 | 10
  dealTypes:   string[];  // 'free' | 'coupon' | 'discount'
  claimTypes:  string[];  // 'code' | 'in-store' | 'app-required' | 'no-action'
  postedWithin: string;  // 'hour' | 'today' | 'week' | 'any'
  sources:     string[];  // 'reddit' | 'slickdeals' | '9to5toys' | 'dealnews' | 'flipp' | 'hip2save' | 'user'
}

export const DEFAULT_FILTERS: MapFilters = {
  category:    'all',
  radius:      5,
  dealTypes:   [],
  claimTypes:  [],
  postedWithin: 'any',
  sources:     [],
};

interface MapFilterSheetProps {
  visible:  boolean;
  filters:  MapFilters;
  onChange: (f: MapFilters) => void;
  onDismiss: () => void;
}

const HIDDEN = 600;

function countActive(f: MapFilters): number {
  let n = 0;
  if (f.category !== 'all') n++;
  if (f.radius !== 5) n++;
  if (f.dealTypes.length) n++;
  if (f.claimTypes.length) n++;
  if (f.postedWithin !== 'any') n++;
  if (f.sources.length) n++;
  return n;
}

function PillRow({
  label, options, active, onToggle, multi = false,
}: {
  label: string;
  options: { label: string; value: string }[];
  active: string | string[];
  onToggle: (v: string) => void;
  multi?: boolean;
}) {
  const isActive = (v: string) =>
    multi ? (active as string[]).includes(v) : active === v;

  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.pillRow}>
        {options.map((opt) => {
          const on = isActive(opt.value);
          return (
            <Pressable
              key={opt.value}
              style={[s.pill, on ? s.pillOn : s.pillOff]}
              onPress={() => onToggle(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[s.pillText, on ? s.pillTextOn : s.pillTextOff]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MapFilterSheet({ visible, filters, onChange, onDismiss }: MapFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<MapFilters>(filters);

  React.useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible]);

  const ty = useSharedValue(HIDDEN);
  const op = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      ty.value = withSpring(0, Springs.heavy);
      op.value = withTiming(1, { duration: 200 });
    } else {
      ty.value = withSpring(HIDDEN, Springs.heavy);
      op.value = withTiming(0, { duration: 180 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: op.value }));

  const toggle = (key: 'dealTypes' | 'claimTypes' | 'sources', val: string) => {
    setDraft((d) => {
      const arr = d[key];
      return {
        ...d,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  };

  const apply = () => { onChange(draft); onDismiss(); };
  const clear = () => { setDraft(DEFAULT_FILTERS); onChange(DEFAULT_FILTERS); };

  if (!visible && ty.value === HIDDEN) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[StyleSheet.absoluteFill, s.backdrop, backdropStyle]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      <Animated.View style={[s.sheet, sheetStyle]}>
        {/* Handle + header */}
        <View style={s.handle} />
        <View style={s.header}>
          <Text style={s.title}>Filters</Text>
          <Pressable onPress={onDismiss} style={s.closeBtn} accessibilityLabel="Close filters">
            <X size={20} color={Colors.TEXT_PRIMARY} weight="bold" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content} style={s.scroll}>
          <PillRow
            label="CATEGORY"
            options={[
              { label: 'All', value: 'all' },
              { label: 'Food', value: 'food' },
              { label: 'Drinks', value: 'drinks' },
              { label: 'Grocery', value: 'grocery' },
              { label: 'Electronics', value: 'electronics' },
              { label: 'Clothing', value: 'clothing' },
              { label: 'Furniture', value: 'furniture' },
              { label: 'Kitchen', value: 'kitchen' },
              { label: 'Books', value: 'books' },
              { label: 'Sports', value: 'sports' },
              { label: 'Toys', value: 'toys' },
              { label: 'Retail', value: 'retail' },
              { label: 'Local', value: 'local' },
              { label: 'Other', value: 'other' },
            ]}
            active={draft.category}
            onToggle={(v) => setDraft((d) => ({ ...d, category: v }))}
          />

          <PillRow
            label="RADIUS"
            options={[
              { label: '0.5 mi', value: '0.5' },
              { label: '1 mi', value: '1' },
              { label: '2 mi', value: '2' },
              { label: '5 mi', value: '5' },
              { label: '10 mi', value: '10' },
            ]}
            active={String(draft.radius)}
            onToggle={(v) => setDraft((d) => ({ ...d, radius: parseFloat(v) }))}
          />

          <PillRow
            label="DEAL TYPE"
            options={[
              { label: 'Free Item', value: 'free' },
              { label: 'Coupon Code', value: 'coupon' },
              { label: 'Discount', value: 'discount' },
            ]}
            active={draft.dealTypes}
            onToggle={(v) => toggle('dealTypes', v)}
            multi
          />

          <PillRow
            label="HOW TO CLAIM"
            options={[
              { label: 'Code', value: 'code' },
              { label: 'In-Store', value: 'in-store' },
              { label: 'App Required', value: 'app-required' },
              { label: 'No Action', value: 'no-action' },
            ]}
            active={draft.claimTypes}
            onToggle={(v) => toggle('claimTypes', v)}
            multi
          />

          <PillRow
            label="POSTED WITHIN"
            options={[
              { label: 'Last hour', value: 'hour' },
              { label: 'Today', value: 'today' },
              { label: 'This week', value: 'week' },
              { label: 'Any time', value: 'any' },
            ]}
            active={draft.postedWithin}
            onToggle={(v) => setDraft((d) => ({ ...d, postedWithin: v }))}
          />

          <PillRow
            label="SOURCE"
            options={[
              { label: 'Reddit', value: 'reddit' },
              { label: 'Slickdeals', value: 'slickdeals' },
              { label: '9to5Toys', value: '9to5toys' },
              { label: 'DealNews', value: 'dealnews' },
              { label: 'Flipp', value: 'flipp' },
              { label: 'Hip2Save', value: 'hip2save' },
              { label: 'Community', value: 'user' },
            ]}
            active={draft.sources}
            onToggle={(v) => toggle('sources', v)}
            multi
          />
          </ScrollView>

        <View style={[s.actions, { paddingBottom: insets.bottom + 90 }]}>
          <SecondaryButton label="CLEAR ALL" onPress={clear} style={s.actionBtn} />
          <PrimaryButton
            label={`APPLY${countActive(draft) ? ` (${countActive(draft)})` : ''}`}
            onPress={apply}
            style={s.actionBtn}
            showArrow
          />
        </View>
      </Animated.View>
    </View>
  );
}

const s = createStyleSheet((Colors) => ({
  backdrop: {
    backgroundColor: 'rgba(33,31,24,0.45)',
  },
  sheet: {
    position:             'absolute',
    bottom:               0,
    left:                 0,
    right:                0,
    maxHeight:            '85%',
    backgroundColor:      Colors.SURFACE,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth:       2,
    borderTopColor:       Colors.INK,
    flexDirection:        'column',
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.ROPE,
    opacity:         0.5,
    alignSelf:       'center',
    marginTop:       10,
    marginBottom:    4,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  title: { ...Typography.headline, color: Colors.TEXT_PRIMARY },
  closeBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop:        Spacing.sm,
    paddingBottom:     Spacing.md,
    gap:               Spacing.md,
  },
  section:      { gap: Spacing.xs },
  sectionLabel: { ...Typography.tinyLabel, color: Colors.TEXT_MUTED },
  pillRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical:   7,
    borderRadius:      20,
    borderWidth:       1.5,
  },
  pillOn:  { backgroundColor: Colors.ACCENT,      borderColor: Colors.ACCENT },
  pillOff: { backgroundColor: Colors.SURFACE_DEEP, borderColor: Colors.INK },
  pillText:    { ...Typography.caption },
  pillTextOn:  { color: Colors.SURFACE_LIGHT },
  pillTextOff: { color: Colors.TEXT_MUTED },
  scroll: {
    flex: 1,
  },
  actions: {
    flexDirection:     'row',
    gap:               Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingTop:        Spacing.md,
    borderTopWidth:    1,
    borderTopColor:    Colors.BORDER,
    backgroundColor:   Colors.SURFACE,
  },
  actionBtn: { flex: 1 },
}));

export { countActive };
