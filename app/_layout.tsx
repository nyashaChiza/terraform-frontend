import { Stack } from 'expo-router';
import '../global.css';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authStore } from '../store/auth';

// KEEP splash visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  useEffect(() => {
    const prepare = async () => {
      // Restore persisted auth tokens before the app renders any screen
      await authStore.hydrate();
      await SplashScreen.hideAsync();
    };

    prepare();
  }, []);

  return (
    <SafeAreaProvider>
      <AlertNotificationRoot>
        <Stack screenOptions={{ headerShown: false }} />
      </AlertNotificationRoot>
    </SafeAreaProvider>
  );
}
