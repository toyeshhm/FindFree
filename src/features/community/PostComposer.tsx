import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Camera } from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import { storageService } from '@/services/storage';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, Typography, Spacing, Springs, Radius } from '@/lib';
import { useAuthStore } from '@/stores/useAuthStore';
import type { CommunityPost, CommunityPostType } from '@/types';
import { createStyleSheet } from "@/lib/theme";

interface PostComposerProps {
  visible:   boolean;
  initialPost?: CommunityPost | null;
  onDismiss: () => void;
  onPost:    (post: Partial<CommunityPost>) => void;
}

type PostTypeOption = { value: CommunityPostType; label: string };
const POST_TYPES: PostTypeOption[] = [
  { value: 'coupon',     label: 'Coupon' },
  { value: 'free-stuff', label: 'Free Stuff' },
  { value: 'find',       label: 'Find' },
];

export function PostComposer({ visible, initialPost, onDismiss, onPost }: PostComposerProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();

  const [type, setType]           = useState<CommunityPostType>('find');
  const [body, setBody]           = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [photoUris, setPhotoUris]   = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);

  const translateY = useSharedValue(500);

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : 500, Springs.heavy);
    if (visible && initialPost) {
      setType(initialPost.type);
      setBody(initialPost.body);
      setCouponCode(initialPost.couponCode || '');
      setPhotoUris(initialPost.photoUrls || []);
    } else if (visible && !initialPost) {
      setType('find');
      setBody('');
      setCouponCode('');
      setPhotoUris([]);
    }
  }, [visible, initialPost]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  async function handlePost() {
    if (!body.trim()) return;
    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const uri of photoUris) {
        if (uri.startsWith('http')) {
          uploadedUrls.push(uri);
        } else {
          const url = await storageService.uploadImage(uri, session?.user?.id ?? 'anonymous');
          uploadedUrls.push(url);
        }
      }

      onPost({
        type,
        body: body.trim(),
        couponCode: type === 'coupon' ? couponCode.trim() || undefined : undefined,
        photoUrls: uploadedUrls,
        couponClaimed: false,
      });
      setBody('');
      setCouponCode('');
      setPhotoUris([]);
      setType('find');
      onDismiss();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to upload photo and post.');
    } finally {
      setLoading(false);
    }
  }

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

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onDismiss} />

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : undefined}
        style={styles.kavWrapper}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 100 },
            sheetStyle,
          ]}
        >
          {/* ── Drag handle + title row ── */}
          <View style={styles.handleRow}>
            <View style={styles.dragHandle} />
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{initialPost ? 'Edit Post' : 'New Post'}</Text>
            <Pressable
              onPress={onDismiss}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Dismiss composer"
            >
              <X size={20} color={Colors.TEXT_PRIMARY} />
            </Pressable>
          </View>

          {/* ── Type selector ── */}
          <View style={styles.typeRow}>
            {POST_TYPES.map((opt) => {
              const isActive = type === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setType(opt.value)}
                  style={[
                    styles.typeBtn,
                    isActive ? styles.typeBtnActive : styles.typeBtnInactive,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      isActive ? styles.typeBtnTextActive : styles.typeBtnTextInactive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Body input ── */}
          <TextInput
            style={styles.bodyInput}
            multiline
            placeholder="What did you find? Share the details..."
            placeholderTextColor={Colors.TEXT_MUTED}
            value={body}
            onChangeText={setBody}
            maxLength={500}
            returnKeyType="default"
            accessibilityLabel="Post body"
          />

          {/* ── Coupon code field ── */}
          {type === 'coupon' && (
            <View style={styles.codeFieldWrap}>
              <Text style={styles.codeLabel}>Coupon Code</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="e.g. FRYFRI25"
                placeholderTextColor={Colors.TEXT_MUTED}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
                maxLength={32}
                accessibilityLabel="Coupon code"
              />
            </View>
          )}

          {/* ── Photo attachment ── */}
          <View style={styles.photoRow}>
            <Pressable
              style={styles.cameraBtn}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              onPress={handleAddPhoto}
            >
              <Camera size={22} color={Colors.ACCENT} />
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {photoUris.map((uri, idx) => (
                <View key={idx} style={styles.photoPreviewWrap}>
                  <Image source={{ uri }} style={styles.photoPreview} />
                  <Pressable style={styles.removePhotoBtn} onPress={() => setPhotoUris(p => p.filter((_, i) => i !== idx))}>
                    <X size={12} color={Colors.SURFACE} weight="bold" />
                  </Pressable>
                </View>
              ))}
              {photoUris.length === 0 && (
                <Text style={styles.photoCaption}>Add up to 4 photos</Text>
              )}
            </ScrollView>
          </View>

          {/* ── Post button ── */}
          {loading ? (
            <ActivityIndicator size="large" color={Colors.ACCENT} style={{ marginVertical: 12 }} />
          ) : (
            <PrimaryButton
              label="POST"
              onPress={handlePost}
              fullWidth
              disabled={!body.trim()}
            />
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = createStyleSheet((Colors) => ({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  kavWrapper: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
  },
  sheet: {
    backgroundColor:        Colors.SURFACE,
    borderTopLeftRadius:    Radius.lg,
    borderTopRightRadius:   Radius.lg,
    borderTopWidth:         2,
    borderTopColor:         Colors.INK,
    padding:                16,
  },
  handleRow: {
    alignItems:   'center',
    marginBottom: 8,
  },
  dragHandle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.SURFACE_DEEP,
  },
  titleRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    16,
  },
  titleText: {
    ...Typography.sectionTitle,
    color: Colors.TEXT_PRIMARY,
  },
  closeBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  12,
  },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      20,
    borderWidth:       1.5,
  },
  typeBtnActive: {
    backgroundColor: Colors.ACCENT,
    borderColor:     Colors.ACCENT,
  },
  typeBtnInactive: {
    backgroundColor: Colors.SURFACE_DEEP,
    borderColor:     Colors.BORDER,
  },
  typeBtnText: {
    ...Typography.caption,
  },
  typeBtnTextActive: {
    color: Colors.SURFACE_LIGHT,
  },
  typeBtnTextInactive: {
    color: Colors.TEXT_MUTED,
  },
  bodyInput: {
    ...Typography.body,
    color:            Colors.TEXT_PRIMARY,
    backgroundColor:  Colors.SURFACE_DEEP,
    borderWidth:      2,
    borderColor:      Colors.INK,
    borderRadius:     Radius.md,
    padding:          12,
    minHeight:        80,
    maxHeight:        150,
    textAlignVertical: 'top',
    marginBottom:     12,
  },
  codeFieldWrap: {
    marginBottom: 12,
  },
  codeLabel: {
    ...Typography.tinyLabel,
    color:        Colors.TEXT_MUTED,
    marginBottom: 4,
  },
  codeInput: {
    ...Typography.body,
    fontFamily:      'monospace',
    color:           Colors.TEXT_PRIMARY,
    backgroundColor: Colors.SURFACE_DEEP,
    borderWidth:     2,
    borderColor:     Colors.INK,
    borderRadius:    Radius.md,
    padding:         12,
    height:          48,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginBottom:  16,
  },
  cameraBtn: {
    width:           48,
    height:          48,
    borderRadius:    Radius.md,
    backgroundColor: Colors.SURFACE_DEEP,
    borderWidth:     1.5,
    borderColor:     Colors.ACCENT,
    alignItems:      'center',
    justifyContent:  'center',
  },
  photoPreviewWrap: {
    position: 'relative',
  },
  photoPreview: {
    width:        64,
    height:       48,
    borderRadius: Radius.sm,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.SEALING_WAX,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.SURFACE,
  },
  photoCaption: {
    ...Typography.caption,
    color: Colors.TEXT_MUTED,
  },
}));
