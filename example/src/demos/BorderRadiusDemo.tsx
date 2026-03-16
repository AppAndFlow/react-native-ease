import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function BorderRadiusDemo() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Section title="Border Radius">
      <EaseView
        animate={{ borderRadius: expanded ? 0 : 40 }}
        transition={{ type: 'spring', damping: 15, stiffness: 120, mass: 1 }}
        style={styles.borderRadiusBox}
      >
        <Text style={styles.borderRadiusText}>
          {expanded ? 'Square' : 'Round'}
        </Text>
      </EaseView>
      <Button
        label={expanded ? 'Round' : 'Square'}
        onPress={() => setExpanded((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  borderRadiusBox: {
    width: 80,
    height: 80,
    backgroundColor: '#4a90d9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  borderRadiusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
