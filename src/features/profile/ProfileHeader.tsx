import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Colors, Typography, Spacing, Stamp, Radius } from '@/lib';
import type { User } from '@/types';
import { createStyleSheet } from "@/lib/theme";

interface ProfileHeaderProps { user: User }

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const joined = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <Avatar uri={user.avatarUrl} size={64} accessibilityLabel={`${user.name}'s profile photo`} />
        <View style={styles.info}>
          <Text style={styles.eyebrow}>SHIP'S PAPERS</Text>
          <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
          <Text style={styles.flavor}>Aboard since {joined}</Text>
          <Text style={styles.meta}>
            {user.messageCount} {user.messageCount === 1 ? 'hail' : 'hails'} exchanged
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  outer: {
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.base,
    paddingBottom:     Spacing.sm,
  },
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.base,
    backgroundColor: Colors.SURFACE,
    borderWidth:     2,
    borderColor:     Colors.INK,
    borderRadius:    Radius.lg,
    padding:         Spacing.base,
    ...Stamp.md,
  },
  info: { flex: 1, gap: 2 },
  eyebrow: { ...Typography.tinyLabel, color: Colors.TEXT_MUTED, marginBottom: 2 },
  name: { ...Typography.headline, color: Colors.TEXT_PRIMARY },
  flavor: { ...Typography.flavorSmall, color: Colors.SEA },
  meta: { ...Typography.caption, color: Colors.TEXT_SECONDARY, marginTop: 2 },
}));
