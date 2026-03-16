import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function StyledCardDemo() {
  const [moved, setMoved] = useState(false);
  return (
    <Section title="Style + Animate">
      <EaseView
        animate={{ translateY: moved ? -10 : 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
        style={styles.styledCard}
      >
        <View style={styles.styledCardHeader}>
          <Text style={styles.styledCardIcon}>🔔</Text>
          <Text style={styles.styledCardTitle}>New notification</Text>
        </View>
        <Text style={styles.styledCardBody}>
          Opacity comes from style (not animated). Only translateY is animated.
        </Text>
      </EaseView>
      <Button
        label={moved ? 'Reset' : 'Nudge'}
        onPress={() => setMoved((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  styledCard: {
    opacity: 0.6,
    backgroundColor: '#2a2a4a',
    borderRadius: 16,
    padding: 16,
    alignSelf: 'stretch',
  },
  styledCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  styledCardIcon: {
    fontSize: 18,
  },
  styledCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  styledCardBody: {
    color: '#8888aa',
    fontSize: 13,
    lineHeight: 18,
  },
});
