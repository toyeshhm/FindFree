import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { itemsService } from '@/services/items';
import { useLocation } from '@/hooks/useLocation';
import type { ItemCategory } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

const CATEGORIES: { label: string; value: ItemCategory }[] = [
  { label: 'Furniture',   value: 'furniture' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing',    value: 'clothing' },
  { label: 'Books',       value: 'books' },
  { label: 'Kitchen',     value: 'kitchen' },
  { label: 'Sports',      value: 'sports' },
  { label: 'Toys',        value: 'toys' },
  { label: 'Other',       value: 'other' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'PostItem'>;

export function PostItemScreen({ navigation }: Props) {
  const insets      = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { location } = useLocation();

  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [category, setCategory] = useState<ItemCategory>('other');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) return setError("Add a title so people know what you're offering.");
    if (!location)     return setError('Location not available. Check location permissions.');
    if (!session)      return;

    setLoading(true);
    try {
      const item = await itemsService.create({
        title:       title.trim(),
        description: desc.trim(),
        category,
        lat:         location.lat,
        lng:         location.lng,
        photoUrls:   [],
        userId:      session.user.id,
      });
      Alert.alert("Your item is live!", 'Someone nearby might claim it soon.', [
        { text: 'View Your Listing', onPress: () => {
          navigation.goBack();
          navigation.navigate('ItemDetail', { itemId: item.id });
        }},
      ]);
    } catch {
      setError("Couldn't post. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.CHARCOAL }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Post an Item</Text>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Vintage desk lamp"
              placeholderTextColor={Colors.DISABLED_GRAY}
              returnKeyType="next"
              maxLength={80}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={desc}
              onChangeText={setDesc}
              placeholder="Condition, dimensions, anything useful…"
              placeholderTextColor={Colors.DISABLED_GRAY}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[styles.chip, category === cat.value && styles.chipSelected]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={[styles.chipText, category === cat.value && styles.chipTextSelected]}>
                    {cat.label.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PrimaryButton
          label={loading ? 'Posting your item…' : 'Post Item'}
          onPress={handleSubmit}
          fullWidth
          showArrow
          disabled={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flexGrow: 1, paddingHorizontal: Spacing.gutter, gap: Spacing.xl },
  title:            { ...Typography.sectionTitle, color: Colors.CREAM },
  fields:           { gap: Spacing.md },
  field:            { gap: Spacing.sm },
  label:            { ...Typography.label, color: Colors.CREAM },
  input: {
    backgroundColor:   Colors.MID_CHARCOAL,
    borderWidth:       2,
    borderColor:       Colors.RUST,
    color:             Colors.CREAM,
    fontSize:          14,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    minHeight:         48,
  },
  multiline:        { minHeight: 100 },
  chips:            { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor:   Colors.LIGHT_CHARCOAL,
    paddingVertical:   Spacing.sm - 2,
    paddingHorizontal: Spacing.md,
    borderWidth:       1,
    borderColor:       Colors.LIGHT_CHARCOAL,
  },
  chipSelected:     { backgroundColor: Colors.RUST, borderColor: Colors.RUST },
  chipText:         { ...Typography.tinyLabel, color: Colors.MUTED_ASH },
  chipTextSelected: { color: Colors.CREAM },
  error:            { ...Typography.caption, color: Colors.RUST_LIGHT },
});
