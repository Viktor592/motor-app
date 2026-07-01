import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [authed,  setAuthed]  = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('motor_access').then(token => {
      setAuthed(!!token);
      setLoading(false);
    });
  }, []);

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator color="#ff6200" /></View>;
  return authed ? <Redirect href="/(app)/home" /> : <Redirect href="/(auth)/login" />;
}
