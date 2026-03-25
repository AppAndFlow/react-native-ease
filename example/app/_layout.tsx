import { Stack } from 'expo-router';

import { MaxWidthContainer } from '../src/components/MaxWidthContainer';

export default function RootLayout() {
  return (
    <MaxWidthContainer>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: '#1a1a2e' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </MaxWidthContainer>
  );
}
