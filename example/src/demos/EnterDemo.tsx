import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function EnterDemo() {
  const [key, setKey] = useState(0);
  return (
    <Section title="Enter Animation">
      <EaseView
        key={key}
        initialAnimate={{ opacity: 0, translateY: 30, scale: 0.8 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 120, mass: 1 }}
        style={styles.box}
      />
      <Button label="Replay" onPress={() => setKey((k) => k + 1)} />
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
