import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Issue45Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.heading}>Issue #45 Android modal background</Text>
      <Text style={styles.body}>
        Open the modal, then dismiss it with the back gesture or header back
        button. The red animated card and green style card should keep their
        backgrounds throughout the screen transition.
      </Text>
      <Text style={styles.link}>
        https://github.com/AppAndFlow/react-native-ease/issues
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonDown]}
        onPress={() => router.push('/issues/45/modal')}
      >
        <Text style={styles.buttonText}>Open Modal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: '#aaaacc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  link: {
    color: '#6666aa',
    fontSize: 12,
    marginBottom: 28,
  },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#4a90d9',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonDown: {
    backgroundColor: '#3978b8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
