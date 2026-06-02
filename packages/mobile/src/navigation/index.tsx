// ═══════════════════════════════════════════════════
// МОТОР — Mobile Navigation
// React Navigation 6, no Expo
// ═══════════════════════════════════════════════════
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Colors, Spacing } from '../theme';
import type {
  RootStackParamList,
  MainTabParamList,
} from '@motor/shared';

// ── Screen imports ───────────────────────────────
import { SplashScreen }      from '../screens/auth/SplashScreen';
import { AuthScreen }        from '../screens/auth/AuthScreen';
import { HomeScreen }        from '../screens/home/HomeScreen';
import { BookingNavigator }  from '../screens/booking/BookingNavigator';
import { MyOrdersScreen }    from '../screens/orders/MyOrdersScreen';
import { ProfileScreen }     from '../screens/profile/ProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab   = createBottomTabNavigator<MainTabParamList>();

// ── Tab bar icon ─────────────────────────────────
function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

// ── Main tabs ────────────────────────────────────
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⬡" label="Главная" focused={focused} />
          ),
        }}
      />
      <MainTab.Screen
        name="Booking"
        component={BookingNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📅" label="Запись" focused={focused} />
          ),
        }}
      />
      <MainTab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label="Заказы" focused={focused} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Профиль" focused={focused} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

// ── Root navigator ───────────────────────────────
export function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Auth"   component={AuthScreen} />
        <RootStack.Screen name="Main"   component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ── Styles ───────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.void2,
    borderTopWidth: 2,
    borderTopColor: Colors.ore,
    height: 64,
    paddingBottom: 0,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.sm,
    gap: 2,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.dust,
  },
  tabLabelActive: {
    color: Colors.ore,
  },
});
