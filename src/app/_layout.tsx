import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppFonts } from '@/lib/useAppFonts';
import { Colors } from '@/lib/colors';
import type { RootStackParamList, AuthStackParamList, TabParamList } from '@/navigation/types';
import { CustomTabBar } from '@/features/navigation/CustomTabBar';
import { useSavedItems } from '@/hooks/useSavedItems';

import { useThemeStore } from '@/stores/useThemeStore';

function SyncStore() {
  const { session } = useAuthStore();
  useSavedItems(session?.user.id);
  return null;
}

import { SplashScreen }           from './splash';
import { OnboardingScreen }       from './onboarding';
import { SignInScreen }           from './auth/sign-in';
import { SignUpScreen }           from './auth/sign-up';
import { ForgotPasswordScreen }   from './auth/forgot-password';
import { DiscoverScreen }         from './feed';
import { MapScreen }              from './map';
import { CommunityScreen }        from './community';
import { SavedScreen }            from './saved';
import { ProfileScreen }          from './profile/index';
import { AccountSettingsScreen }  from './profile/account-settings';
import { NotificationSettingsScreen } from './profile/notification-settings';
import { ItemDetailScreen }       from './item-detail';
import { PostItemScreen }         from './profile/post-item';
import { ThemeSettingsScreen }    from './profile/theme-settings';
import { registerForPushNotificationsAsync } from '@/services/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 2 * 60 * 1000 },
  },
});

const Root = createNativeStackNavigator<RootStackParamList>();
const Auth = createNativeStackNavigator<AuthStackParamList>();
const Tab  = createBottomTabNavigator<TabParamList>();

function AuthStack() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="SignIn" component={SignInScreen} />
      <Auth.Screen name="SignUp" component={SignUpScreen} />
    </Auth.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="DiscoverTab"  component={DiscoverScreen} />
      <Tab.Screen name="MapTab"       component={MapScreen} />
      <Tab.Screen name="CommunityTab" component={CommunityScreen} />
      <Tab.Screen name="SavedTab"     component={SavedScreen} />
      <Tab.Screen name="ProfileTab"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootLayout() {
  const { session, setSession } = useAuthStore();
  const { themeName, colors } = useThemeStore();
  const fontsLoaded = useAppFonts();

  const NavTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.BACKGROUND, card: colors.BACKGROUND, text: colors.TEXT_PRIMARY, border: colors.BORDER, primary: colors.ACCENT },
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) registerForPushNotificationsAsync(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) registerForPushNotificationsAsync(s.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.BACKGROUND }} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SyncStore />
        <NavigationContainer key={themeName} theme={NavTheme}>
          <Root.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {!session ? (
              <>
                <Root.Screen name="Splash"     component={SplashScreen} />
                <Root.Screen name="Onboarding" component={OnboardingScreen} />
                <Root.Screen name="Auth"       component={AuthStack} />
              </>
            ) : null}
            <Root.Screen name="Main" component={TabNavigator} />
            <Root.Screen name="ItemDetail" component={ItemDetailScreen}
              options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="PostItem" component={PostItemScreen}
              options={{ presentation: 'modal' }} />
            <Root.Screen name="AccountSettings" component={AccountSettingsScreen}
              options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="NotificationSettings" component={NotificationSettingsScreen}
              options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="ThemeSettings" component={ThemeSettingsScreen}
              options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="ForgotPassword" component={ForgotPasswordScreen}
              options={{ animation: 'slide_from_right' }} />
          </Root.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
