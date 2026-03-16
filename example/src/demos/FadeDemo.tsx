import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function FadeDemo() {
  const [visible, setVisible] = useState(true);
  return (
    <Section title="Fade">
      <EaseView
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ type: 'timing', duration: 300, easing: 'easeOut' }}
        style={styles.box}
      />
      <Button
        label={visible ? 'Hide' : 'Show'}
        onPress={() => setVisible((v) => !v)}
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
