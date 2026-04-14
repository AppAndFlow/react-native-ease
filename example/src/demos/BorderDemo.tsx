import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

const states = [
  { borderWidth: 0, borderColor: '#4a90d9', label: 'None' },
  { borderWidth: 4, borderColor: '#e74c3c', label: 'Red' },
  { borderWidth: 4, borderColor: '#4ade80', label: 'Green' },
] as const;

const nextLabel = ['Add Red', 'Go Green', 'Remove'] as const;

export function BorderDemo() {
  const [index, setIndex] = useState(0);
  const state = states[index]!;
  return (
    <Section title="Border">
      <EaseView
        animate={{
          borderWidth: state.borderWidth,
          borderColor: state.borderColor,
        }}
        transition={{
          border: { type: 'spring', damping: 15, stiffness: 120 },
        }}
        style={styles.box}
      >
        <Text style={styles.text}>{state.label}</Text>
      </EaseView>
      <Button
        label={nextLabel[index]!}
        onPress={() => setIndex((i) => (i + 1) % states.length)}
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
