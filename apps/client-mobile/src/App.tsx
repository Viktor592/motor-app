import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import LoginScreen    from './screens/auth/LoginScreen';
import HomeScreen     from './screens/app/HomeScreen';
import OrdersScreen   from './screens/app/OrdersScreen';
import ProfileScreen  from './screens/app/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICON: Record<string, string> = { Главная:'⬡', Заказы:'📋', Профиль:'👤' };

function AppTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor:'#0c0c0f', borderTopColor:'#1e1e25' },
      tabBarActiveTintColor: '#ff6200',
      tabBarInactiveTintColor: '#6a6a80',
      tabBarIcon: () => <Text style={{ fontSize:18 }}>{TAB_ICON[route.name]}</Text>,
    })}>
      <Tab.Screen name="Главная">{() => <HomeScreen onLogout={onLogout} />}</Tab.Screen>
      <Tab.Screen name="Заказы" component={OrdersScreen} />
      <Tab.Screen name="Профиль">{() => <ProfileScreen onLogout={onLogout} />}</Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [authed, setAuthed]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('motor_access').then(t => { setAuthed(!!t); setLoading(false); });
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authed ? (
          <Stack.Screen name="App">
            {() => <AppTabs onLogout={() => setAuthed(false)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={() => setAuthed(true)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
