import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Colors, Typography, Spacing } from '@/lib';
import type { User } from '@/types';

interface ProfileHeaderProps { user: User }

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const joined = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <Avatar uri={user.avatarUrl} size={64} accessibilityLabel={`${user.name}'s profile photo`} />
      <View style={styles.info}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>Joined {joined}</Text>
        <Text style={styles.meta}>
          {user.messageCount} {user.messageCount === 1 ? 'message' : 'messages'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.base,
    backgroundColor: Colors.MID_CHARCOAL,
    borderBottomWidth: 2,
    borderBottomColor: Colors.RUST,
    padding:         Spacing.base,
  },
  info: { flex: 1, gap: 4 },
  name: { ...Typography.subheading, color: Colors.CREAM, fontWeight: '700' },
  meta: { ...Typography.caption, color: Colors.MUTED_ASH },
});
