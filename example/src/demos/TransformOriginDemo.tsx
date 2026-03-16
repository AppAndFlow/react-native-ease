import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function TransformOriginDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Transform Origin">
      <View style={styles.originRow}>
        <EaseView
          animate={{ rotate: active ? 45 : 0, scale: active ? 1.15 : 1 }}
          transformOrigin={{ x: 0, y: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
          style={styles.originBox}
        >
          <Text style={styles.originLabel}>top-left</Text>
        </EaseView>
        <EaseView
          animate={{ rotate: active ? 45 : 0, scale: active ? 1.15 : 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
          style={styles.originBox}
        >
          <Text style={styles.originLabel}>center</Text>
        </EaseView>
        <EaseView
          animate={{ rotate: active ? 45 : 0, scale: active ? 1.15 : 1 }}
          transformOrigin={{ x: 1, y: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
          style={styles.originBox}
        >
          <Text style={styles.originLabel}>bottom-right</Text>
        </EaseView>
      </View>
      <Button
        label={active ? 'Reset' : 'Rotate'}
        onPress={() => setActive((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  originRow: {
    flexDirection: 'row',
    gap: 16,
  },
  originBox: {
    width: 70,
    height: 70,
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
