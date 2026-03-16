import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function InterruptDemo() {
  const [moved, setMoved] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <Section title="Interrupt Detection">
      <Text style={styles.interruptHint}>
        Tap quickly to interrupt the animation
      </Text>
      <EaseView
        animate={{ translateX: moved ? 200 : 0 }}
        transition={{ type: 'timing', duration: 1000, easing: 'easeInOut' }}
        onTransitionEnd={({ finished }) => {
          setStatus(finished ? 'Finished' : 'Interrupted!');
        }}
        style={styles.box}
      />
      <View style={styles.interruptRow}>
        <Button label="Toggle" compact onPress={() => setMoved((v) => !v)} />
        <Text
          style={[
            styles.statusText,
            status === 'Interrupted!'
              ? styles.statusInterrupted
              : styles.statusFinished,
          ]}
        >
          {status ?? ' '}
        </Text>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  interruptHint: {
    color: '#8888aa',
    fontSize: 13,
    marginBottom: 12,
  },
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
  interruptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusFinished: {
    color: '#4ade80',
  },
  statusInterrupted: {
    color: '#f87171',
  },
});
