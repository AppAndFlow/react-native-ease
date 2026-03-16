import { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';

export function ButtonDemo() {
  const [pressed, setPressed] = useState(false);

  return (
    <Section title="Animated Button">
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <EaseView
          animate={{ scale: pressed ? 0.95 : 1 }}
          transition={
            pressed
              ? { type: 'timing', duration: 100, easing: 'easeInOut' }
              : { type: 'spring', damping: 15, stiffness: 300, mass: 0.8 }
          }
          style={styles.animatedButton}
        >
          <Text style={styles.animatedButtonText}>Press Me</Text>
        </EaseView>
      </Pressable>
    </Section>
  );
}

const styles = StyleSheet.create({
  animatedButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    alignItems: 'center',
  },
  animatedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
