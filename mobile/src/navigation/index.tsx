import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Colors } from '../theme';

// Auth
import OtpScreen        from '../screens/auth/OtpScreen';
import LoginScreen      from '../screens/auth/LoginScreen';
import RegisterScreen   from '../screens/auth/RegisterScreen';
import SetNameScreen    from '../screens/auth/SetNameScreen';

// Client
import HomeScreen         from '../screens/client/HomeScreen';
import BookingScreen      from '../screens/client/BookingScreen';
import ChatScreen         from '../screens/client/ChatScreen';
import OrderDetailScreen  from '../screens/client/OrderDetailScreen';
import OrdersListScreen   from '../screens/client/OrdersListScreen';
import DiagnosticsScreen  from '../screens/client/DiagnosticsScreen';

// Shared
import ProfileScreen from '../screens/shared/ProfileScreen';

// Exec
import ExecDashboardScreen      from '../screens/exec/ExecDashboardScreen';
import MasterAnalyticsScreen   from '../screens/exec/MasterAnalyticsScreen';
import ExecOrderScreen     from '../screens/exec/ExecOrderScreen';

export type RootStackParamList = {
  Auth:        undefined;
  SetName:     undefined;
  ClientTabs:  undefined;
  ExecTabs:    undefined;
  OrderDetail: { orderId: string };
  Chat:        { orderId?: string };
  Booking:     undefined;
  Diagnostics: { orderId: string };
};

const Root      = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const ClientTab = createBottomTabNavigator();
const ExecTab   = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Otp"      component={OtpScreen} />
      <AuthStack.Screen name="Login"    component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function ClientTabNavigator() {
  return (
    <ClientTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.plate, borderTopColor: Colors.wire, borderTopWidth: 1 },
        tabBarActiveTintColor:   Colors.ore,
        tabBarInactiveTintColor: Colors.dust,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <ClientTab.Screen name="Home"    component={HomeScreen}       options={{ tabBarLabel: 'Главная' }} />
      <ClientTab.Screen name="Orders"  component={OrdersListScreen} options={{ tabBarLabel: 'Заказы'  }} />
      <ClientTab.Screen name="Chat"    component={ChatScreen}       options={{ tabBarLabel: 'AI-чат'  }} />
      <ClientTab.Screen name="Profile" component={ProfileScreen}    options={{ tabBarLabel: 'Профиль' }} />
    </ClientTab.Navigator>
  );
}

function ExecTabNavigator() {
  return (
    <ExecTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.plate, borderTopColor: Colors.wire, borderTopWidth: 1 },
        tabBarActiveTintColor:   Colors.ore,
        tabBarInactiveTintColor: Colors.dust,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <ExecTab.Screen name="Analytics" component={MasterAnalyticsScreen} options={{ tabBarLabel: 'Аналитика' }} />
      <ExecTab.Screen name="Dashboard" component={ExecDashboardScreen} options={{ tabBarLabel: 'Заказы'  }} />
      <ExecTab.Screen name="Chat"      component={ChatScreen}          options={{ tabBarLabel: 'AI-чат'  }} />
      <ExecTab.Screen name="Profile"   component={ProfileScreen}       options={{ tabBarLabel: 'Профиль' }} />
    </ExecTab.Navigator>
  );
}

export default function RootNavigator() {
  const { token, role, needsName } = useSelector((s: RootState) => s.auth);

  const isClient = role === 'CLIENT';
  const isStaff  = ['MASTER', 'RECEPTIONIST', 'ADMIN'].includes(role ?? '');

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary:      Colors.ore,
          background:   Colors.void,
          card:         Colors.plate,
          text:         Colors.chalk,
          border:       Colors.wire,
          notification: Colors.ore,
        },
      }}
    >
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!token ? (
          <Root.Screen name="Auth" component={AuthNavigator} />
        ) : needsName ? (
          <Root.Screen name="SetName" component={SetNameScreen} />
        ) : isClient ? (
          <>
            <Root.Screen name="ClientTabs"  component={ClientTabNavigator} />
            <Root.Screen name="OrderDetail" component={OrderDetailScreen}  />
            <Root.Screen name="Chat"        component={ChatScreen}         />
            <Root.Screen name="Booking"     component={BookingScreen}      />
            <Root.Screen name="Diagnostics" component={DiagnosticsScreen}  />
          </>
        ) : isStaff ? (
          <>
            <Root.Screen name="ExecTabs"    component={ExecTabNavigator} />
            <Root.Screen name="OrderDetail" component={ExecOrderScreen}  />
            <Root.Screen name="Chat"        component={ChatScreen}       />
          </>
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
