import { Stack } from 'expo-router';
import '../global.css';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authStore } from '../store/auth';
import ErrorBoundary from '../components/ErrorBoundary';

// KEEP splash visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  useEffect(() => {
    const prepare = async () => {
      try {
        // Restore persisted auth tokens + user before the app renders any screen
        await authStore.hydrate();
      } catch (e) {
        // Never let a hydrate failure trap the splash screen forever.
        console.warn('authStore.hydrate failed:', e);
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    };

    prepare();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AlertNotificationRoot>
          <Stack screenOptions={{ headerShown: false }} />
        </AlertNotificationRoot>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
