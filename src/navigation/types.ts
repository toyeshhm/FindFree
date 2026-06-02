import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation as useNav } from '@react-navigation/native';

export type RootStackParamList = {
  Splash:          undefined;
  Onboarding:      undefined;
  Auth:            NavigatorScreenParams<AuthStackParamList>;
  Main:            NavigatorScreenParams<TabParamList>;
  ItemDetail:      { itemId: string };
  PostItem:        undefined;
  AccountSettings: undefined;
  NotificationSettings: undefined;
  ThemeSettings:   undefined;
  ForgotPassword:  undefined;
  ChatThread:      { conversationId: string; itemTitle: string };
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type TabParamList = {
  DiscoverTab:  undefined;
  MapTab:       { focusLat: number; focusLng: number } | undefined;
  CommunityTab: undefined;
  SavedTab:     undefined;
  ProfileTab:   undefined;
};

export const useNavigation = () =>
  useNav<NativeStackNavigationProp<RootStackParamList>>();
