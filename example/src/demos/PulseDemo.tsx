import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function PulseDemo() {
  const [playing, setPlaying] = useState(false);
  return (
    <Section title="Pulse (Reverse Loop)">
      {playing && (
        <EaseView
          initialAnimate={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.3, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 800,
            easing: 'easeInOut',
            loop: 'reverse',
          }}
          style={styles.pulse}
        />
      )}
      <Button
        label={playing ? 'Stop' : 'Start'}
        onPress={() => setPlaying((p) => !p)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  pulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a90d9',
  },
});
