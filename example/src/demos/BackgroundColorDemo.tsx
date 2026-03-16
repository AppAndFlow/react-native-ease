import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function BackgroundColorDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Background Color">
      <EaseView
        animate={{ backgroundColor: active ? '#4ade80' : '#4a90d9' }}
        transition={{ type: 'timing', duration: 400, easing: 'easeInOut' }}
        style={styles.bgColorBox}
      >
        <Text style={styles.bgColorText}>{active ? 'Green' : 'Blue'}</Text>
      </EaseView>
      <Button
        label={active ? 'Blue' : 'Green'}
        onPress={() => setActive((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  bgColorBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgColorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
