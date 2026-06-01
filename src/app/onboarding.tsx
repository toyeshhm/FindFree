import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { useNavigation } from '@/navigation/types';
import { useAuthStore } from '@/stores/useAuthStore';

export function OnboardingScreen() {
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const { setGuest } = useAuthStore();

  const handleSignUp = () => nav.navigate('Auth', { screen: 'SignUp' });

  const handleGuest = () => {
    setGuest(true);
    nav.replace('Main');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.hero, paddingBottom: insets.bottom + Spacing.xl }]}>
      <View style={styles.top}>
        <Text style={styles.headline}>Free stuff is{'\n'}everywhere.</Text>
        <Text style={styles.subheadline}>Now you'll find it.</Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.guestNote}>
          You can browse and view items. Sign up to message posters or save finds.
        </Text>
        <PrimaryButton
          label="Create Account"
          onPress={handleSignUp}
          fullWidth
          showArrow
        />
        <SecondaryButton
          label="Browse Without Signing Up"
          onPress={handleGuest}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.CHARCOAL,
    paddingHorizontal: Spacing.gutter,
    justifyContent:  'space-between',
  },
  top: { gap: Spacing.md },
  headline: {
    ...Typography.sectionTitle,
    color: Colors.CREAM,
  },
  subheadline: {
    ...Typography.subheading,
    color: Colors.MUTED_ASH,
  },
  guestNote: {
    ...Typography.caption,
    color:     Colors.MUTED_ASH,
    textAlign: 'center',
  },
  actions: { gap: Spacing.md },
});
