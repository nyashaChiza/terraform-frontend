import { Tabs } from 'expo-router';
import FloatingTabBar from '../../components/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="profile" />
      {/* Hidden from tab bar — navigated to directly */}
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="session-details" options={{ href: null }} />
      <Tabs.Screen name="goal-detail" options={{ href: null }} />
      <Tabs.Screen name="exercise-detail" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
