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
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="session-details" options={{ href: null }} />
      <Tabs.Screen name="goal-detail" options={{ href: null }} />
    </Tabs>
  );
}
