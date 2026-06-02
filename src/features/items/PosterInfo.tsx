import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { RopeDivider } from '@/components/motifs';
import { Colors, Typography, Spacing, Radius, Stamp } from '@/lib';
import type { User } from '@/types';
import { createStyleSheet } from "@/lib/theme";

interface PosterInfoProps {
  user:       User;
  postedAt:   string;
  distanceMi?: number;
}

/**
 * A ship's-manifest row: ink-ringed Avatar, an engraved Cinzel name, and an
 * aged-ledger flavor line noting when it was logged and how far the cache lies.
 */
export function PosterInfo({ user, postedAt, distanceMi }: PosterInfoProps) {
  const dist = distanceMi != null ? `${distanceMi.toFixed(1)} mi away` : '';
  const mins = Math.floor((Date.now() - new Date(postedAt).getTime()) / 60000);
  const age  = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;

  return (
    <View style={styles.container}>
      <Text style={styles.manifestLabel}>Logged by</Text>
      <RopeDivider style={styles.rope} />
      <View style={styles.inner}>
        <Avatar uri={user.avatarUrl} size={44} accessibilityLabel={`${user.name}'s avatar`} />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            logged {age}{dist ? ` · ${dist}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  container: {
    marginHorizontal: Spacing.gutter,
    marginVertical:   Spacing.md,
    backgroundColor:  Colors.SURFACE,
    borderRadius:     Radius.md,
    borderWidth:      2,
    borderColor:      Colors.INK,
    padding:          Spacing.base,
    gap:              Spacing.sm,
    ...Stamp.sm,
  },
  manifestLabel: { ...Typography.tinyLabel, color: Colors.TEXT_MUTED },
  rope:          { marginBottom: Spacing.micro },
  inner:         { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  text:          { flex: 1, gap: 2 },
  name:          { ...Typography.subheading, color: Colors.TEXT_PRIMARY },
  meta:          { ...Typography.flavorSmall, color: Colors.TEXT_MUTED, fontVariant: ['tabular-nums'] },
}));
