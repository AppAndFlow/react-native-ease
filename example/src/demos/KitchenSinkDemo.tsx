import { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { EaseView } from 'react-native-ease';

import { Section } from '../components/Section';
import { Button } from '../components/Button';

export function KitchenSinkDemo() {
  const [active, setActive] = useState(false);
  return (
    <Section title="Kitchen Sink">
      <View style={styles.surface}>
        <EaseView
          animate={
            active
              ? {
                  opacity: 0.9,
                  translateX: 40,
                  translateY: -10,
                  scale: 1.15,
                  rotate: 8,
                  borderRadius: 32,
                  backgroundColor: '#6366f1',
                  borderWidth: 3,
                  borderColor: '#fbbf24',
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  shadowOffset: { width: 4, height: 12 },
                  shadowColor: '#6366f1',
                  elevation: 16,
                }
              : {
                  opacity: 1,
                  translateX: 0,
                  translateY: 0,
                  scale: 1,
                  rotate: 0,
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  borderWidth: 0,
                  borderColor: '#fbbf24',
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  shadowOffset: { width: 0, height: 0 },
                  shadowColor: '#000',
                  elevation: 0,
                }
          }
          transition={{ type: 'spring', damping: 14, stiffness: 100 }}
          style={styles.box}
        >
          <Text style={[styles.text, active && styles.textActive]}>
            {active ? 'Wild' : 'Calm'}
          </Text>
          <Text style={[styles.sub, active && styles.textActive]}>
            {Platform.select({
              android: 'all props',
              default: 'every prop',
            })}
          </Text>
        </EaseView>
      </View>
      <Button
        label={active ? 'Reset' : 'Go Wild'}
        onPress={() => setActive((v) => !v)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: '#e8eaf0',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  box: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#333',
    fontSize: 18,
    fontWeight: '800',
  },
  textActive: {
    color: '#fff',
  },
  sub: {
    color: '#999',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
