import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import type { RootStackParamList, AuthStackParamList, TabParamList } from '@/navigation/types';
import { CustomTabBar } from '@/features/navigation/CustomTabBar';

import { SplashScreen }        from './splash';
import { OnboardingScreen }    from './onboarding';
import { SignInScreen }        from './auth/sign-in';
import { SignUpScreen }        from './auth/sign-up';
import { MapScreen }           from './map';
import { FeedScreen }          from './feed';
import { MessagesInboxScreen } from './messages/inbox';
import { SavedScreen }         from './saved';
import { ProfileScreen }       from './profile/index';
import { ItemDetailScreen }    from './item-detail';
import { ChatThreadScreen }    from './messages/chat';
import { PostItemScreen }      from './profile/post-item';

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
      <Tab.Screen name="MapTab"      component={MapScreen} />
      <Tab.Screen name="FeedTab"     component={FeedScreen} />
      <Tab.Screen name="MessagesTab" component={MessagesInboxScreen} />
      <Tab.Screen name="SavedTab"    component={SavedScreen} />
      <Tab.Screen name="ProfileTab"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootLayout() {
  const { session, setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
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
            <Root.Screen name="ChatThread" component={ChatThreadScreen}
              options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="PostItem" component={PostItemScreen}
              options={{ presentation: 'modal' }} />
          </Root.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
