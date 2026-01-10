import { Stack } from 'expo-router';
import '../global.css';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AlertNotificationRoot } from 'react-native-alert-notification';

// KEEP splash visible
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  useEffect(() => {
    // Simulate loading or wait for fonts/auth/etc
    const prepare = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await SplashScreen.hideAsync();
    };

    prepare();
  }, []);

  return (
    <AlertNotificationRoot>
      <Stack screenOptions={{ headerShown: false }} />
    </AlertNotificationRoot>
  );
}
