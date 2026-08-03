import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

const SPRING = { damping: 14, stiffness: 120, mass: 1 } as const;

const ROWS = [
  { label: 'velocity: -600', velocity: -600 },
  { label: 'velocity: 0', velocity: 0 },
  { label: 'velocity: 600', velocity: 600 },
];

export function SpringVelocityDemo() {
  const [moved, setMoved] = useState(false);
  return (
    <Section title="Spring Velocity">
      <Text style={styles.caption}>
        Same spring, different initial velocity. Positive launches the box in
        the direction it is already travelling, negative pulls it back first.
      </Text>
      {ROWS.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <View style={styles.track}>
            <EaseView
              animate={{ translateX: moved ? 180 : 0 }}
              transition={{ type: 'spring', ...SPRING, velocity: row.velocity }}
              style={styles.box}
            />
          </View>
        </View>
      ))}
      <Button
        label={moved ? 'Back' : 'Go'}
        onPress={() => setMoved((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  caption: {
    color: '#8a939e',
    fontSize: 13,
    marginBottom: 16,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    color: '#8a939e',
    fontSize: 12,
    marginBottom: 4,
  },
  track: {
    height: 40,
    justifyContent: 'center',
  },
  box: {
    width: 40,
    height: 40,
    backgroundColor: '#4a90d9',
    borderRadius: 8,
  },
});
