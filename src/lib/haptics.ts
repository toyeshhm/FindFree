import * as ExpoHaptics from 'expo-haptics';

export const HapticFeedback = {
  tap: () =>
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light),
  impact: () =>
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium),
  success: () =>
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success),
  error: () =>
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error),
  selection: () =>
    ExpoHaptics.selectionAsync(),
};
