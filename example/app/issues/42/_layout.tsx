import { Tabs, Stack } from 'expo-router';

export default function Issue42Layout() {
  return (
    <>
      <Stack.Screen options={{ title: 'Issue #42 — Tabs loop' }} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#8888aa',
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: '#16213e',
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Loop' }} />
        <Tabs.Screen name="other" options={{ title: 'Other' }} />
      </Tabs>
    </>
  );
}
