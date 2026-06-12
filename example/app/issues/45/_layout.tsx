import { Stack } from 'expo-router';

export default function Issue45Layout() {
  return (
    <>
      <Stack.Screen
        options={{ title: 'Issue #45 — Android modal background' }}
      />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#1a1a2e' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Tab One' }} />
        <Stack.Screen
          name="modal"
          options={{
            animation: 'slide_from_right',
            presentation: 'card',
            title: 'Modal',
          }}
        />
      </Stack>
    </>
  );
}
