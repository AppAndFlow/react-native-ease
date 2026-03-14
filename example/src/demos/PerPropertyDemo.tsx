import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function PerPropertyDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Per-Property Transitions">
      <Text style={styles.hint}>
        Opacity fades with timing 150ms, translateX springs independently
      </Text>
      <EaseView
        animate={{
          opacity: active ? 1 : 0.3,
          translateX: active ? 150 : 0,
        }}
        transition={{
          opacity: { type: 'timing', duration: 150, easing: 'easeOut' },
          translateX: { type: 'spring', damping: 12, stiffness: 200 },
        }}
        style={styles.box}
      />
      <Button
        label={active ? 'Reset' : 'Animate'}
        onPress={() => setActive((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 80,
    height: 80,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7ab8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#8888aa',
    marginBottom: 12,
  },
});
