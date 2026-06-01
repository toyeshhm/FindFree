import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const useSharedValue = (init: any) => ({ value: init });
  const useAnimatedStyle = (fn: () => any) => fn();
  const withSpring = (val: any) => val;
  const withTiming = (val: any) => val;
  const withRepeat = (val: any) => val;

  const Animated = {
    View,
    createAnimatedComponent: (comp: any) => comp,
  };

  return {
    __esModule: true,
    default: Animated,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withRepeat,
    runOnJS: (fn: any) => fn,
    runOnUI: (fn: any) => fn,
    makeMutable: (init: any) => ({ value: init }),
    Easing: { linear: (t: any) => t },
  };
});

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const MapView = ({ children }: any) => React.createElement('View', null, children);
  const Marker = ({ children }: any) => React.createElement('View', null, children);
  return { default: MapView, Marker };
});
