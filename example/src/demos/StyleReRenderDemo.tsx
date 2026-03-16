import { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function StyleReRenderDemo() {
  const [moved, setMoved] = useState(false);
  const [opacity, setOpacity] = useState(0.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity((o) => (o === 0.5 ? 0.8 : 0.5));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Section title="Style Re-render Stress Test">
      <Text style={styles.reRenderHint}>
        Style opacity toggles every 500ms while transform animates
      </Text>
      <EaseView
        animate={{ translateX: moved ? 150 : 0, scale: moved ? 1.2 : 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 120, mass: 1 }}
        style={[styles.box, { opacity }]}
      />
      <Button
        label={moved ? 'Back' : 'Move'}
        onPress={() => setMoved((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  reRenderHint: {
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
});
