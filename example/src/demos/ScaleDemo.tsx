import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function ScaleDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Independent Scale">
      <EaseView
        animate={{ scaleX: active ? 1.5 : 1, scaleY: active ? 0.5 : 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
        style={styles.box}
      />
      <Button
        label={active ? 'Reset' : 'Squish'}
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
