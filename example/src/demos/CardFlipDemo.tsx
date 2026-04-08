import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function CardFlipDemo() {
  const [flipped, setFlipped] = useState(false);
  return (
    <Section title="Card Flip">
      <View style={styles.container} collapsable={false}>
        {/* Front face */}
        <EaseView
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'timing', duration: 600, easing: 'easeInOut' }}
          transformPerspective={800}
          style={[styles.card, styles.front]}
        >
          <Text style={styles.emoji}>{'  '}</Text>
          <Text style={styles.title}>Front</Text>
          <Text style={styles.subtitle}>Tap to flip</Text>
        </EaseView>
        {/* Back face — starts at -180 so backface is hidden, flips to 0 */}
        <EaseView
          animate={{ rotateY: flipped ? 0 : -180 }}
          transition={{ type: 'timing', duration: 600, easing: 'easeInOut' }}
          transformPerspective={800}
          style={[styles.card, styles.back]}
        >
          <Text style={styles.emoji}>{'  '}</Text>
          <Text style={styles.title}>Back</Text>
          <Text style={styles.subtitle}>3D perspective flip</Text>
        </EaseView>
      </View>
      <Button label="Flip" onPress={() => setFlipped((v) => !v)} />
    </Section>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 260,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
  front: {
    backgroundColor: '#4a90d9',
  },
  back: {
    backgroundColor: '#d94a90',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 4,
  },
});
