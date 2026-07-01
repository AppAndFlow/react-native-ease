import { Tabs, Stack } from 'expo-router';

export default function LoopCancelLayout() {
  return (
    <>
      <Stack.Screen options={{ title: 'Loop cancel resurrect' }} />
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
