import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookmarkSimple, ArrowLeft } from 'phosphor-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SkeletonCard } from '@/components/SkeletonCard';
import { PhotoCarousel } from '@/features/items/PhotoCarousel';
import { PosterInfo } from '@/features/items/PosterInfo';
import { useItemDetail } from '@/hooks/useItemDetail';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSavedStore } from '@/stores/useSavedStore';
import { itemsService } from '@/services/items';
import { messagesService } from '@/services/messages';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

export function ItemDetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();

  const { session }            = useAuthStore();
  const { isSaved, toggle }    = useSavedStore();
  const { data: item, isLoading } = useItemDetail(itemId);

  const savedNow = isSaved(itemId);

  const saveMutation = useMutation({
    mutationFn: () => itemsService.toggleSave(session!.user.id, itemId, !savedNow),
    onMutate:   () => toggle(itemId),
    onError:    () => toggle(itemId),
  });

  const handleSave = () => {
    if (!session) {
      Alert.alert('Sign in to save items', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth', { screen: 'SignIn' }) },
      ]);
      return;
    }
    saveMutation.mutate();
  };

  const handleMessage = async () => {
    if (!session) {
      Alert.alert('Sign in to message posters', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth', { screen: 'SignIn' }) },
      ]);
      return;
    }
    try {
      const conv = await messagesService.getOrCreateConversation(itemId, session.user.id, item!.userId!);
      navigation.navigate('ChatThread', { conversationId: conv.id, itemTitle: item!.title });
    } catch {
      Alert.alert("Couldn't start conversation. Check your connection.");
    }
  };

  if (isLoading || !item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Pressable
        style={[styles.backBtn, { top: insets.top + Spacing.sm }]}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <ArrowLeft size={20} color={Colors.CREAM} />
      </Pressable>

      <Pressable
        style={[styles.saveBtn, { top: insets.top + Spacing.sm }]}
        onPress={handleSave}
        accessibilityLabel={savedNow ? 'Remove from favorites' : 'Save item to favorites'}
        accessibilityRole="button"
      >
        <BookmarkSimple size={22} color={Colors.CREAM} weight={savedNow ? 'fill' : 'regular'} />
      </Pressable>

      <ScrollView bounces={false} overScrollMode="never">
        <PhotoCarousel urls={item.photoUrls} title={item.title} />

        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sectionHead}>About this item</Text>
          <Text style={styles.description}>{item.description || 'No description provided.'}</Text>
        </View>

        {item.userId && (
          <PosterInfo
            user={{ id: item.userId, email: '', name: 'Loading…', createdAt: '', messageCount: 0 }}
            postedAt={item.createdAt}
            distanceKm={item.distanceKm}
          />
        )}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton label="Message Poster" onPress={handleMessage} fullWidth showArrow />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.CHARCOAL },
  backBtn: {
    position:        'absolute',
    left:            Spacing.gutter,
    zIndex:          10,
    backgroundColor: 'rgba(45,45,42,0.7)',
    padding:         Spacing.sm,
  },
  saveBtn: {
    position:        'absolute',
    right:           Spacing.gutter,
    zIndex:          10,
    backgroundColor: 'rgba(45,45,42,0.7)',
    padding:         Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical:   Spacing.base,
    gap:               Spacing.md,
  },
  title:       { ...Typography.headline, color: Colors.CREAM },
  sectionHead: { ...Typography.tinyLabel, color: Colors.MUTED_ASH, textTransform: 'uppercase', letterSpacing: 1.2 },
  description: { ...Typography.body, color: Colors.MUTED_ASH },
  cta: {
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.md,
    borderTopWidth:    2,
    borderTopColor:    Colors.RUST,
    backgroundColor:   Colors.CHARCOAL,
  },
});
