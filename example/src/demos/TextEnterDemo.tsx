import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { EaseText } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function TextEnterDemo() {
  const [key, setKey] = useState(0);

  return (
    <Section title="Text Enter Animation">
      <View key={key} style={styles.textContainer}>
        <EaseText
          initialInterpolateColor="#1a1a2e"
          interpolateColor="#e94560"
          initialAnimate={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 100 }}
          style={styles.title}
        >
          Welcome Back
        </EaseText>

        <EaseText
          initialInterpolateColor="#1a1a2e"
          interpolateColor="#8892b0"
          initialAnimate={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
          style={styles.subtitle}
        >
          Your dashboard is ready
        </EaseText>

        <EaseText
          initialAnimate={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            damping: 10,
            stiffness: 150,
            delay: 300,
          }}
          transformOrigin={{ x: 0.5, y: 0.5 }}
          style={styles.emoji}
        >
          🚀
        </EaseText>
      </View>

      <Button label="Replay" onPress={() => setKey((k) => k + 1)} />
    </Section>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
  },
});
