import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function RotateDemo() {
  const [rotated, setRotated] = useState(false);
  return (
    <Section title="Rotate">
      <EaseView
        animate={{ rotate: rotated ? 180 : 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
        style={styles.box}
      />
      <Button label="Rotate" onPress={() => setRotated((v) => !v)} />
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
