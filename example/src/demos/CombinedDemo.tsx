import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function CombinedDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Combined">
      <EaseView
        animate={{
          opacity: active ? 1 : 0.3,
          scale: active ? 1.2 : 1,
          translateY: active ? -20 : 0,
          rotate: active ? 15 : 0,
        }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
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
});
