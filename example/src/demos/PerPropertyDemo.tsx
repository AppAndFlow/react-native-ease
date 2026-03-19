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
        Opacity fades slowly (1.5s timing), transforms slide with a bouncy
        spring — each category animates independently
      </Text>
      <EaseView
        animate={{
          opacity: active ? 1 : 0.2,
          translateX: active ? 200 : 0,
        }}
        transition={{
          opacity: { type: 'timing', duration: 1500, easing: 'easeInOut' },
          transform: { type: 'spring', damping: 8, stiffness: 120, mass: 1 },
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
