import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Colors, Typography, Spacing } from '@/lib';
import type { User } from '@/types';

interface PosterInfoProps {
  user:       User;
  postedAt:   string;
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
          <Text style={styles.labelText}>Posted by</Text>
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
    padding:          Spacing.md,
  },
  inner:     { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  text:      { flex: 1, gap: 2 },
  labelText: { ...Typography.caption, color: Colors.MUTED_ASH },
  name:      { ...Typography.tinyLabel, color: Colors.CREAM, textTransform: 'uppercase', letterSpacing: 1.2 },
  meta:      { ...Typography.caption, color: Colors.MUTED_ASH, fontVariant: ['tabular-nums'] },
});
