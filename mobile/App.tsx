import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import RootNavigator from './src/navigation';
import { connectSocket } from './src/services/socket';
import { storage } from './src/utils/storage';
import { usePushToken } from './src/hooks/usePushToken';
import { useSocketEvents } from './src/hooks/useSocketEvents';

function AppContent() {
  usePushToken();
  useSocketEvents();

  useEffect(() => {
    const token = storage.getString('access_token');
    if (token) connectSocket();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#060608" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </GestureHandlerRootView>
  );
}
