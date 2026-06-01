import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation as useNav } from '@react-navigation/native';

export type RootStackParamList = {
  Splash:     undefined;
  Onboarding: undefined;
  Auth:       NavigatorScreenParams<AuthStackParamList>;
  Main:       NavigatorScreenParams<TabParamList>;
  ItemDetail: { itemId: string };
  ChatThread: { conversationId: string; itemTitle: string };
  PostItem:   undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type TabParamList = {
  MapTab:      undefined;
  FeedTab:     undefined;
  MessagesTab: undefined;
  SavedTab:    undefined;
  ProfileTab:  undefined;
};

export const useNavigation = () =>
  useNav<NativeStackNavigationProp<RootStackParamList>>();
