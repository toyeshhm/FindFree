import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MapPin, Camera, X } from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius } from '@/lib';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RopeDivider } from '@/components/motifs/RopeDivider';
import { useAuthStore } from '@/stores/useAuthStore';
import { itemsService } from '@/services/items';
import { storageService } from '@/services/storage';
import { useLocation } from '@/hooks/useLocation';
import type { ItemCategory } from '@/types';
import type { RootStackParamList } from '@/navigation/types';
import { createStyleSheet } from "@/lib/theme";

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
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission needed', 'Please grant photo library access to upload images.');
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4 - photoUris.length,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setPhotoUris(prev => [...prev, ...newUris].slice(0, 4));
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) return setError("Give the cache a name so the crew knows what you're offering.");
    if (!location)     return setError('No bearings yet. Check your location permissions.');
    if (!session)      return;

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const uri of photoUris) {
        const url = await storageService.uploadImage(uri, session.user.id);
        uploadedUrls.push(url);
      }

      const item = await itemsService.create({
        title:       title.trim(),
        description: desc.trim(),
        category,
        lat:         location.lat,
        lng:         location.lng,
        photoUrls:   uploadedUrls,
        userId:      session.user.id,
      });
      Alert.alert('Cache logged on the chart!', 'A finder nearby may claim it soon.', [
        { text: 'View Your Listing', onPress: () => {
          navigation.goBack();
          navigation.navigate('ItemDetail', { itemId: item.id });
        }},
      ]);
    } catch {
      setError("Couldn't log it. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.BACKGROUND }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>X MARKS THE SPOT</Text>
          <Text style={styles.title}>Log a Cache</Text>
          <RopeDivider style={styles.rope} />
        </View>

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.label}>NAME OF THE FIND</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Vintage desk lamp"
              placeholderTextColor={Colors.TEXT_MUTED}
              returnKeyType="next"
              maxLength={80}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>THE LOG ENTRY</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={desc}
              onChangeText={setDesc}
              placeholder="Condition, dimensions, anything useful…"
              placeholderTextColor={Colors.TEXT_MUTED}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PHOTOS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
              {photoUris.map((uri, idx) => (
                <View key={idx} style={styles.photoPreviewWrapper}>
                  <Image source={{ uri }} style={styles.photoPreview} contentFit="cover" />
                  <Pressable style={styles.removePhotoBtn} onPress={() => removePhoto(idx)}>
                    <X size={14} color={Colors.WHITE} weight="bold" />
                  </Pressable>
                </View>
              ))}
              {photoUris.length < 4 && (
                <Pressable style={styles.addPhotoBtn} onPress={handleAddPhoto}>
                  <Camera size={24} color={Colors.TEXT_MUTED} />
                  <Text style={styles.addPhotoText}>Add</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>MARK ITS KIND</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => {
                const selected = category === cat.value;
                return (
                  <Pressable
                    key={cat.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setCategory(cat.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={cat.label}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {cat.label.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.bearings}>
            <MapPin size={15} color={Colors.SEA} weight="fill" />
            <Text style={styles.bearingsText}>
              {location ? 'Bearings locked — charting at your spot.' : 'Awaiting your bearings…'}
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <PrimaryButton
          label={loading ? 'Logging the cache…' : 'Log This Cache'}
          onPress={handleSubmit}
          fullWidth
          showArrow
          loading={loading}
          disabled={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = createStyleSheet((Colors) => ({
  container:        { flexGrow: 1, paddingHorizontal: Spacing.gutter, gap: Spacing.xl },
  heading:          { gap: Spacing.micro },
  eyebrow:          { ...Typography.tinyLabel, color: Colors.TEXT_MUTED },
  title:            { ...Typography.displayHead, color: Colors.TEXT_PRIMARY },
  rope:             { marginTop: Spacing.sm },
  fields:           { gap: Spacing.lg },
  field:            { gap: Spacing.sm },
  label:            { ...Typography.label, color: Colors.TEXT_PRIMARY },
  input: {
    backgroundColor:   Colors.SURFACE_DEEP,   // sunken parchment well
    borderWidth:       2,
    borderColor:       Colors.INK,
    borderRadius:      Radius.sm,
    color:             Colors.TEXT_PRIMARY,
    ...Typography.body,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.md,
    minHeight:         48,
  },
  multiline:        { minHeight: 110, paddingTop: Spacing.md },
  chips:            { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor:   Colors.SURFACE_LIGHT,
    paddingVertical:   Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight:         44,
    justifyContent:    'center',
    borderWidth:       2,
    borderColor:       Colors.INK,
    borderRadius:      Radius.sm,
  },
  chipSelected:     { backgroundColor: Colors.ACCENT },
  chipText:         { ...Typography.tinyLabel, color: Colors.TEXT_SECONDARY },
  chipTextSelected: { color: Colors.SURFACE_LIGHT },
  bearings:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  bearingsText:     { ...Typography.flavorSmall, color: Colors.SEA },
  error:            { ...Typography.caption, color: Colors.SEALING_WAX },
  photoScroll:      { gap: Spacing.sm },
  photoPreviewWrapper: {
    width: 80, height: 80, borderRadius: Radius.sm, overflow: 'hidden', position: 'relative'
  },
  photoPreview:     { width: '100%', height: '100%' },
  removePhotoBtn: {
    position: 'absolute', top: 4, right: 4, backgroundColor: Colors.VIGNETTE,
    padding: 4, borderRadius: 12
  },
  addPhotoBtn: {
    width: 80, height: 80, borderRadius: Radius.sm, backgroundColor: Colors.SURFACE_DEEP,
    borderWidth: 2, borderColor: Colors.INK, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4
  },
  addPhotoText:     { ...Typography.tinyLabel, color: Colors.TEXT_MUTED }
}));
