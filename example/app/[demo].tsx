import { useLocalSearchParams, Stack } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { demos } from '../src/demos';

export default function DemoScreen() {
  const { demo } = useLocalSearchParams<{ demo: string }>();
  const entry = demos[demo!];

  if (!entry) {
    return null;
  }

  const Component = entry.component;

  return (
    <>
      <Stack.Screen options={{ title: entry.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Component />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
});
