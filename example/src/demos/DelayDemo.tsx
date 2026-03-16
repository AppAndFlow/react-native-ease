import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function DelayDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Delay">
      <EaseView
        animate={{ opacity: active ? 1 : 0.3, translateX: active ? 100 : 0 }}
        transition={{
          type: 'timing',
          duration: 400,
          delay: 2000,
          easing: 'easeOut',
        }}
        style={styles.box}
      />
      <Button
        label={active ? 'Reset' : 'Delayed Move'}
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
