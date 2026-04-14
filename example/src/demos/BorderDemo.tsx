import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function BorderDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Border">
      <EaseView
        animate={{
          borderWidth: active ? 4 : 0,
          borderColor: active ? '#e74c3c' : '#4a90d9',
        }}
        transition={{
          border: { type: 'spring', damping: 15, stiffness: 120 },
        }}
        style={styles.box}
      >
        <Text style={styles.text}>{active ? 'Red' : 'None'}</Text>
      </EaseView>
      <Button
        label={active ? 'Remove' : 'Add Border'}
        onPress={() => setActive((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
  },
});
