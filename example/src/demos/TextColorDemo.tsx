import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { EaseText } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function TextColorDemo() {
  const [focused, setFocused] = useState(false);

  return (
    <Section title="Text Color">
      <EaseText
        interpolateColor={focused ? '#e94560' : '#8892b0'}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.label}
      >
        Smooth color transition (300ms)
      </EaseText>

      <EaseText
        interpolateColor={focused ? '#e94560' : '#8892b0'}
        animate={{ scale: focused ? 1.05 : 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 120 }}
        style={styles.heading}
      >
        Color + Scale
      </EaseText>

      <EaseText
        interpolateColor={focused ? '#e94560' : '#8892b0'}
        animate={{
          opacity: focused ? 1 : 0.5,
          translateX: focused ? 10 : 0,
        }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.subtitle}
      >
        Color + Opacity + TranslateX
      </EaseText>

      <EaseText
        style={[styles.instant, { color: focused ? '#e94560' : '#8892b0' }]}
      >
        Instant color (style.color, zero JS cost)
      </EaseText>

      <Button
        label={focused ? 'Blur' : 'Focus'}
        onPress={() => setFocused((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  instant: {
    fontSize: 14,
    marginBottom: 24,
  },
});
