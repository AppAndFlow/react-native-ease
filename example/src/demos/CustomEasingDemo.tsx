import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function CustomEasingDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Custom Easing (Overshoot)">
      <EaseView
        animate={{ scale: active ? 1.3 : 1 }}
        transition={{
          type: 'timing',
          duration: 600,
          easing: [0.68, -0.55, 0.265, 1.55],
        }}
        style={styles.box}
      />
      <Button
        label={active ? 'Reset' : 'Overshoot'}
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
});
