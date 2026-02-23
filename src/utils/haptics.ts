import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utility that safely wraps Expo Haptics for cross-platform support.
 * Only executes on native platforms (iOS/Android).
 */
export const haptics = {
  /**
   * Light impact, suitable for minor interactions like navigating or pressing small buttons.
   */
  light: () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * Medium impact, suitable for primary actions like standard buttons or tab switches.
   */
  medium: () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Heavy impact, suitable for destructive actions or significant state changes.
   */
  heavy: () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /**
   * Selection feedback, suitable for scroll ticks, pickers, or list reordering.
   */
  selection: () => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
  },

  /**
   * Success notification feedback.
   */
  success: () => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * Warning notification feedback.
   */
  warning: () => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /**
   * Error notification feedback.
   */
  error: () => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};
