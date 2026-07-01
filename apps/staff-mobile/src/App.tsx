import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import LoginScreen  from './screens/auth/LoginScreen';
import OrdersScreen from './screens/app/OrdersScreen';
import { clearAuth } from './services/api';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICON: Record<string, string> = { Заказы:'📋', Профиль:'👤' };

function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [name, setName] = useState('');
  useEffect(() => { SecureStore.getItemAsync('motor_user_name').then(n => setName(n ?? '')); }, []);
  return (
    <View style={{ flex:1, backgroundColor:'#060608', padding:24, justifyContent:'center' }}>
      <Text style={{ color:'#f0f0f5', fontSize:20, fontWeight:'bold', textAlign:'center', marginBottom:24 }}>{name}</Text>
      <Text onPress={async () => { await clearAuth(); onLogout(); }}
        style={{ color:'#ff3b3b', textAlign:'center', fontSize:16, fontWeight:'bold' }}>
        Выйти
      </Text>
    </View>
  );
}

function AppTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor:'#0c0c0f', borderTopColor:'#1e1e25' },
      tabBarActiveTintColor: '#00e5c4',
      tabBarInactiveTintColor: '#6a6a80',
      tabBarIcon: () => <Text style={{ fontSize:18 }}>{TAB_ICON[route.name]}</Text>,
    })}>
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

  if (loading) return (
    <View style={{ flex:1, backgroundColor:'#060608', justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator color="#00e5c4" />
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown:false }}>
        {authed ? (
          <Stack.Screen name="App">{() => <AppTabs onLogout={() => setAuthed(false)} />}</Stack.Screen>
        ) : (
          <Stack.Screen name="Login">{() => <LoginScreen onLogin={() => setAuthed(true)} />}</Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
