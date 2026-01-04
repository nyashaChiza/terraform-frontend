import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,   // must be boolean
        gestureEnabled: true, // optional boolean if needed
      }}
    />
  );
}
